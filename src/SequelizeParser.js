import * as t from "babel-types";
import generate from "babel-generator";
import IndentParser from "./IndentParser";
import ObjectPropertiesParser from "./ObjectPropertiesParser";
import QueryParser from "./QueryParser";

export default class SequelizeParser {

	constructor(path) {
		this.file = path.hub.file;
		this.indentParser = new IndentParser(this.file);
		this.objPropParser = new ObjectPropertiesParser(this.file);
		this.path = path;
	}

	parse() {
		let calls = this.indentParser.parseCalls(this.path.node.right),
			orderedBlocks = this.indentParser.orderBlocks(calls),
			declarations = [];

		for (let tbl of orderedBlocks) {
			if (!['ElementBlock', 'CustomElement'].includes(tbl.block.type))  {
				throw this.file.buildCodeFrameError(tbl.block.path, "invalid table block type " + tbl.block.type);
			}

			let varName = tbl.block.selector.tag,
				tableName = t.stringLiteral(varName),
				tableOptions = t.objectExpression([]),
				optionalTableOptions = [],
				columns = t.objectExpression([]),
				optionalColumns = [],
				associations = [],
				optionalAssociations = [],
				queries = [];

			this.objPropParser.classesToOptions(tbl, tableOptions);
			this.objPropParser.attributesToOptions(tbl, tableOptions);

			this.objPropParser.childrenToOptions(tbl, columns, optionalColumns, true, [ 'SpreadElement' ]);

			// (...items)
			for (let child of tbl.children) {
				if (child.block.type == "ElementBlock" || child.block.type == "CustomElement") {
				} else if (child.block.type == "If") {
				} else if (child.block.type == "ElseIf" || child.block.type == "Else") {
				} else if (child.block.type == "SpreadElement") {

					let argName = child.block.path.argument.name;

					switch (argName) {
						case "options":
							this.objPropParser.childrenToOptions(child, tableOptions, optionalTableOptions, true, []);
							break;

						case "columns":
							this.objPropParser.childrenToOptions(child, columns, optionalColumns, true, []);
							break;

						case "name":
						case "getters":
						case "setters":
						case "validate":
						case "indexes":
						case "scopes":
							this.objPropParser.childrenToNamedOptions(child, tableOptions, optionalTableOptions, argName, true);
							break;

						case "associations":
							this.parseAssociations(varName, child, associations);
							break;

						case "hooks":
							this.objPropParser.childrenToNamedOptions(child, tableOptions, optionalTableOptions, argName, false);
							break;

						default:
							throw this.file.buildCodeFrameError(child.block.path, "unrecognized table category: " + argName);
							break;

					}
				} else {
					throw this.file.buildCodeFrameError(child.block.path, "invalid table child element type " + child.block.type);
				}

			}

			columns = this.objPropParser.objOrAssign(columns, optionalColumns);
			let tableOpts = this.objPropParser.objOrAssign(tableOptions, optionalTableOptions);

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

		this.path.replaceWithMultiple(declarations);
	}

	parseAssociation(varName, assoc) {
		let type = t.identifier(assoc.block.selector.tag),
			target = t.memberExpression(
				t.memberExpression(t.identifier("sequelize"), t.identifier('models')), 
				t.identifier(assoc.block.selector.classes[0])),
			options = t.objectExpression([]),
			optionalOptions = [];

		this.objPropParser.attributesToOptions(assoc, options);
		this.objPropParser.childrenToOptions(assoc, options, optionalOptions, false, []);
		let assocOpts = this.objPropParser.objOrAssign(options, optionalOptions);

		let rslt = 
			t.callExpression(
				t.memberExpression(t.identifier(varName), type),
				[ target, assocOpts ]);
		return rslt;	
	}

	parseAssociations(varName, child, associations) {

		for (let i = 0; i < child.children.length; i++) {
			let assoc = child.children[i];
			let conditions = [];

			if (assoc.block.type == "ElementBlock") {

				associations.push(t.expressionStatement(this.parseAssociation(varName, assoc)));

			} else if (assoc.block.type == "AssignmentExpression") {
				let assocElement = this.indentParser.orderBlocks([this.indentParser.chainElement(assoc.block.path.right)])[0];
				assocElement.children = assoc.children;

				associations.push(t.expressionStatement(
					t.assignmentExpression(
						"=",
						t.memberExpression(
							t.identifier(varName),
							t.identifier(assoc.block.selector.tag)),
						this.parseAssociation(varName, assocElement))));

			} else if (assoc.block.type == "If") {
				let ifAssociations = [];
				this.parseAssociations(varName, assoc, ifAssociations);
				conditions.push({ cond: assoc.block.condition, child: t.blockStatement(ifAssociations) });

				if (child.children.length > i+1) {

					for (let y = i+1; y < child.children.length; y++) {
						let next = child.children[y];
						if (next.block.type == "Else") {
							if (next.indent == assoc.indent) {
								let elseAssociations = [];
								this.parseAssociations(varName, next, elseAssociations);
								conditions.push({ cond: null, child: t.blockStatement(elseAssociations) });
								break;

							}
						} else if (next.block.type == "ElseIf") {

							if (next.indent == assoc.indent) {
								let elseIfAssociations = [];
								this.parseAssociations(varName, next, elseIfAssociations);
								conditions.push({ cond: next.block.condition, child: t.blockStatement(elseIfAssociations) });
							}
							else
								break;

						} else if (next.indent == assoc.indent) break;
					}

				}

			} else if (assoc.block.type == "ElseIf" || assoc.block.type == "Else") {
			} else {

				throw this.file.buildCodeFrameError(assoc.block.path, "invalid association element type " + assoc.block.type);

			}

			if (conditions.length > 0)
				associations.push(this.objPropParser.generateIfChain(conditions, false));
		}

	}

}
