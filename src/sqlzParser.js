import * as t from "babel-types";
import { parseCalls, orderBlocks, chainElement } from "./firstPassParser";
import { classesToOptions, attributesToOptions, childrenToOptions, objOrAssign, childrenToNamedOptions, generateIfChain } from "./secondPassParser";

function parseAssociation(varName, assoc, topPath) {
	let type = t.identifier(assoc.block.selector.tag),
		target = t.memberExpression(
			t.memberExpression(t.identifier("sequelize"), t.identifier('models')), 
			t.identifier(assoc.block.selector.classes[0])),
		options = t.objectExpression([]),
		optionalOptions = [];

	attributesToOptions(assoc, options);
	childrenToOptions(assoc, options, optionalOptions, false, [], topPath);
	let assocOpts = objOrAssign(options, optionalOptions);

	let rslt = 
		t.callExpression(
			t.memberExpression(t.identifier(varName), type),
			[ target, assocOpts ]);
	return rslt;	
}

function parseAssociations(varName, child, associations, topPath) {

	for (let i = 0; i < child.children.length; i++) {
		let assoc = child.children[i];
		let conditions = [];

		if (assoc.block.type == "ElementBlock") {

			associations.push(t.expressionStatement(parseAssociation(varName, assoc, topPath)));

		} else if (assoc.block.type == "AssignmentExpression") {
			let assocElement = orderBlocks([chainElement(assoc.block.path.right, topPath.hub.file)], topPath.hub.file)[0];
			assocElement.children = assoc.children;

			associations.push(t.expressionStatement(
				t.assignmentExpression(
					"=",
					t.memberExpression(
						t.identifier(varName),
						t.identifier(assoc.block.selector.tag)),
					parseAssociation(varName, assocElement, topPath))));

		} else if (assoc.block.type == "If") {
			let ifAssociations = [];
			parseAssociations(varName, assoc, ifAssociations, topPath);
			conditions.push({ cond: assoc.block.condition, child: t.blockStatement(ifAssociations) });

			if (child.children.length > i+1) {

				for (let y = i+1; y < child.children.length; y++) {
					let next = child.children[y];
					if (next.block.type == "Else") {
						if (next.indent == assoc.indent) {
							let elseAssociations = [];
							parseAssociations(varName, next, elseAssociations, topPath);
							conditions.push({ cond: null, child: t.blockStatement(elseAssociations) });
							break;

						}
					} else if (next.block.type == "ElseIf") {

						if (next.indent == assoc.indent) {
							let elseIfAssociations = [];
							parseAssociations(varName, next, elseIfAssociations, topPath);
							conditions.push({ cond: next.block.condition, child: t.blockStatement(elseIfAssociations) });
						}
						else
							break;

					} else if (next.indent == assoc.indent) break;
				}

			}

		} else if (assoc.block.type == "ElseIf" || assoc.block.type == "Else") {
		} else {

			throw topPath.hub.file.buildCodeFrameError(assoc.block.path, "invalid association element type " + assoc.block.type);

		}

		if (conditions.length > 0)
			associations.push(generateIfChain(conditions, false));
	}

}

export function parseSQLZ(path) {
	let calls = parseCalls(path.node.right, path.hub.file),
		orderedBlocks = orderBlocks(calls, path.hub.file),
		declarations = [];

	for (let tbl of orderedBlocks) {
		if (!['ElementBlock', 'CustomElement'].includes(tbl.block.type))  {
			throw path.hub.file.buildCodeFrameError(tbl.block.path, "invalid table block type " + tbl.block.type);
		}

		let varName = tbl.block.selector.tag,
			tableName = t.stringLiteral(varName),
			tableOptions = t.objectExpression([]),
			optionalTableOptions = [],
			columns = t.objectExpression([]),
			optionalColumns = [],
			associations = [],
			optionalAssociations = [];

		classesToOptions(tbl, tableOptions);
		attributesToOptions(tbl, tableOptions);

		childrenToOptions(tbl, columns, optionalColumns, true, [ 'SpreadElement' ], path);

		// (...items)
		for (let child of tbl.children) {
			if (child.block.type == "ElementBlock" || child.block.type == "CustomElement") {
			} else if (child.block.type == "If") {
			} else if (child.block.type == "ElseIf" || child.block.type == "Else") {
			} else if (child.block.type == "SpreadElement") {

				let argName = child.block.path.argument.name;

				switch (argName) {
					case "options":
						childrenToOptions(child, tableOptions, optionalTableOptions, true, [], path);
						break;

					case "columns":
						childrenToOptions(child, columns, optionalColumns, true, [], path);
						break;

					case "name":
					case "getters":
					case "setters":
					case "validate":
					case "indexes":
					case "scopes":
						childrenToNamedOptions(child, tableOptions, optionalTableOptions, argName, true, path);
						break;

					case "associations":
						parseAssociations(varName, child, associations, path);
						break;

					case "hooks":
						childrenToNamedOptions(child, tableOptions, optionalTableOptions, argName, false, path);
						break;

					default:
						throw path.hub.file.buildCodeFrameError(child.block.path, "unrecognized table category: " + argName);
						break;

				}
			} else {
				throw path.hub.file.buildCodeFrameError(child.block.path, "invalid table child element type " + child.block.type);
			}

		}

		columns = objOrAssign(columns, optionalColumns);
		let tableOpts = objOrAssign(tableOptions, optionalTableOptions);

		let callee = t.memberExpression(t.identifier('sequelize'), t.identifier('define')),
			params = tableOpts.type == "CallExpression" || tableOpts.properties.length > 0 ? [ tableName, columns, tableOpts ] : [ tableName, columns ],
			callExpr = t.callExpression(callee, params),
			tableDecl = t.variableDeclaration("const", [ t.variableDeclarator(t.identifier(varName), callExpr) ]); 

		declarations.push(tableDecl);

		if (associations.length > 0) {
			let assocFunc = t.expressionStatement(
				t.assignmentExpression(
					"=", 
					t.memberExpression(
						t.identifier(varName), 
						t.identifier('associate')), 
					t.arrowFunctionExpression(
						[ t.identifier('sequelize') ], 
						t.blockStatement(associations))));
			declarations.push(assocFunc);
		}

	}

	path.replaceWithMultiple(declarations);
}
