"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.parseSQLZ = parseSQLZ;

var _babelTypes = require("babel-types");

var t = _interopRequireWildcard(_babelTypes);

var _firstPassParser = require("./firstPassParser");

var _secondPassParser = require("./secondPassParser");

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function parseSQLZ(path) {
	var calls = (0, _firstPassParser.parseCalls)(path.node.right, path.hub.file),
	    orderedBlocks = (0, _firstPassParser.orderBlocks)(calls, path.hub.file),
	    declarations = [];

	var _iteratorNormalCompletion = true;
	var _didIteratorError = false;
	var _iteratorError = undefined;

	try {
		for (var _iterator = orderedBlocks[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
			var tbl = _step.value;

			if (!['ElementBlock', 'CustomElement'].includes(tbl.block.type)) {
				throw path.hub.file.buildCodeFrameError(tbl.block.path, "invalid table block type " + tbl.block.type);
			}

			var varName = tbl.block.selector.tag,
			    tableName = t.stringLiteral(varName),
			    tableOptions = t.objectExpression([]),
			    optionalTableOptions = [],
			    columns = t.objectExpression([]),
			    optionalColumns = [],
			    associations = [],
			    optionalAssociations = [];

			(0, _secondPassParser.classesToOptions)(tbl, tableOptions);
			(0, _secondPassParser.attributesToOptions)(tbl, tableOptions);

			(0, _secondPassParser.childrenToOptions)(tbl, columns, optionalColumns, true, ['SpreadElement'], path);

			// (...items)
			var _iteratorNormalCompletion2 = true;
			var _didIteratorError2 = false;
			var _iteratorError2 = undefined;

			try {
				for (var _iterator2 = tbl.children[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
					var child = _step2.value;

					if (child.block.type == "ElementBlock" || child.block.type == "CustomElement") {} else if (child.block.type == "If") {} else if (child.block.type == "ElseIf" || child.block.type == "Else") {} else if (child.block.type == "SpreadElement") {

						var argName = child.block.path.argument.name;

						switch (argName) {
							case "options":
								(0, _secondPassParser.childrenToOptions)(child, tableOptions, optionalTableOptions, true, [], path);
								break;

							case "columns":
								(0, _secondPassParser.childrenToOptions)(child, columns, optionalColumns, true, [], path);
								break;

							case "name":
							case "getters":
							case "setters":
							case "validate":
							case "indexes":
							case "scopes":
								(0, _secondPassParser.childrenToNamedOptions)(child, tableOptions, optionalTableOptions, argName, true, path);
								break;

							case "associations":
								parseAssociations(varName, child, associations, path);
								break;

							case "hooks":
								(0, _secondPassParser.childrenToNamedOptions)(child, tableOptions, optionalTableOptions, argName, false, path);
								break;

							default:
								throw path.hub.file.buildCodeFrameError(child.block.path, "unrecognized table category: " + argName);
								break;

						}
					} else {
						throw path.hub.file.buildCodeFrameError(child.block.path, "invalid table child element type " + child.block.type);
					}
				}
			} catch (err) {
				_didIteratorError2 = true;
				_iteratorError2 = err;
			} finally {
				try {
					if (!_iteratorNormalCompletion2 && _iterator2.return) {
						_iterator2.return();
					}
				} finally {
					if (_didIteratorError2) {
						throw _iteratorError2;
					}
				}
			}

			columns = (0, _secondPassParser.objOrAssign)(columns, optionalColumns);
			var tableOpts = (0, _secondPassParser.objOrAssign)(tableOptions, optionalTableOptions);

			var callee = t.memberExpression(t.identifier('sequelize'), t.identifier('define')),
			    params = tableOpts.type == "CallExpression" || tableOpts.properties.length > 0 ? [tableName, columns, tableOpts] : [tableName, columns],
			    callExpr = t.callExpression(callee, params),
			    tableDecl = t.variableDeclaration("const", [t.variableDeclarator(t.identifier(varName), callExpr)]);

			declarations.push(tableDecl);

			if (associations.length > 0) {
				var assocFunc = t.expressionStatement(t.assignmentExpression("=", t.memberExpression(t.identifier(varName), t.identifier('associate')), t.arrowFunctionExpression([t.identifier('sequelize')], t.blockStatement(associations))));
				declarations.push(assocFunc);
			}
		}
	} catch (err) {
		_didIteratorError = true;
		_iteratorError = err;
	} finally {
		try {
			if (!_iteratorNormalCompletion && _iterator.return) {
				_iterator.return();
			}
		} finally {
			if (_didIteratorError) {
				throw _iteratorError;
			}
		}
	}

	path.replaceWithMultiple(declarations);
}

function parseAssociation(varName, assoc, topPath) {
	var type = t.identifier(assoc.block.selector.tag),
	    target = t.memberExpression(t.memberExpression(t.identifier("sequelize"), t.identifier('models')), t.identifier(assoc.block.selector.classes[0])),
	    options = t.objectExpression([]),
	    optionalOptions = [];

	(0, _secondPassParser.attributesToOptions)(assoc, options);
	(0, _secondPassParser.childrenToOptions)(assoc, options, optionalOptions, false, [], topPath);
	var assocOpts = (0, _secondPassParser.objOrAssign)(options, optionalOptions);

	var rslt = t.callExpression(t.memberExpression(t.identifier(varName), type), [target, assocOpts]);
	return rslt;
}

function parseAssociations(varName, child, associations, topPath) {

	for (var i = 0; i < child.children.length; i++) {
		var assoc = child.children[i];
		var conditions = [];

		if (assoc.block.type == "ElementBlock") {

			associations.push(t.expressionStatement(parseAssociation(varName, assoc, topPath)));
		} else if (assoc.block.type == "AssignmentExpression") {
			var assocElement = (0, _firstPassParser.orderBlocks)([(0, _firstPassParser.chainElement)(assoc.block.path.right, topPath.hub.file)], topPath.hub.file)[0];
			assocElement.children = assoc.children;

			associations.push(t.expressionStatement(t.assignmentExpression("=", t.memberExpression(t.identifier(varName), t.identifier(assoc.block.selector.tag)), parseAssociation(varName, assocElement, topPath))));
		} else if (assoc.block.type == "If") {
			var ifAssociations = [];
			parseAssociations(varName, assoc, ifAssociations, topPath);
			conditions.push({ cond: assoc.block.condition, child: t.blockStatement(ifAssociations) });

			if (child.children.length > i + 1) {

				for (var y = i + 1; y < child.children.length; y++) {
					var next = child.children[y];
					if (next.block.type == "Else") {
						if (next.indent == assoc.indent) {
							var elseAssociations = [];
							parseAssociations(varName, next, elseAssociations, topPath);
							conditions.push({ cond: null, child: t.blockStatement(elseAssociations) });
							break;
						}
					} else if (next.block.type == "ElseIf") {

						if (next.indent == assoc.indent) {
							var elseIfAssociations = [];
							parseAssociations(varName, next, elseIfAssociations, topPath);
							conditions.push({ cond: next.block.condition, child: t.blockStatement(elseIfAssociations) });
						} else break;
					} else if (next.indent == assoc.indent) break;
				}
			}
		} else if (assoc.block.type == "ElseIf" || assoc.block.type == "Else") {} else {

			throw topPath.hub.file.buildCodeFrameError(assoc.block.path, "invalid association element type " + assoc.block.type);
		}

		if (conditions.length > 0) associations.push((0, _secondPassParser.generateIfChain)(conditions, false));
	}
}