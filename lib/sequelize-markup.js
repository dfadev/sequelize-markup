"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

exports.default = function (_ref) {
	var t = _ref.types;

	return {
		visitor: {
			BinaryExpression: function BinaryExpression(path) {
				curFile = path.hub.file;

				if (path.node.operator != ">") return;

				if (t.isIdentifier(path.node.left) && path.node.left.name == SQLZ || t.isMemberExpression(path.node.left) && (0, _babelGenerator2.default)(path.node.left).code == SQLZ) parseSQLZ(path);else if (t.isIdentifier(path.node.left) && path.node.left.name == SQLZINIT || t.isMemberExpression(path.node.left) && (0, _babelGenerator2.default)(path.node.left).code == SQLZINIT) parseSQLZINIT(path);
			},
			CallExpression: function CallExpression(path) {
				curFile = path.hub.file;
				if (t.isIdentifier(path.node.callee) && path.node.callee.name == SQLZINIT) parseCallSQLZINIT(path);
			}
		}
	};
};

var _babelTemplate = require("babel-template");

var _babelTemplate2 = _interopRequireDefault(_babelTemplate);

var _babelTypes = require("babel-types");

var t = _interopRequireWildcard(_babelTypes);

var _babelGenerator = require("babel-generator");

var _babelGenerator2 = _interopRequireDefault(_babelGenerator);

var _babylon = require("babylon");

var babylon = _interopRequireWildcard(_babylon);

var _babelTraverse = require("babel-traverse");

var _babelTraverse2 = _interopRequireDefault(_babelTraverse);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var SQLZ = "SQLZ";
var SQLZINIT = "SQLZINIT";
var curFile;

;

function parseCallSQLZINIT(path) {
	var varname = path.node.arguments[0].name;
	path.parentPath.replaceWith(
	//for (var mdl in sequelize.models) {
	t.forInStatement(t.variableDeclaration("let", [t.variableDeclarator(t.identifier("mdl"))]), t.memberExpression(t.identifier("sequelize"), t.identifier("models")), t.blockStatement([
	//var model = sequelize.models[mdl];
	t.variableDeclaration("let", [t.variableDeclarator(t.identifier("model"), t.memberExpression(t.memberExpression(t.identifier("sequelize"), t.identifier("models")), t.identifier("mdl"), true))]),
	//db[mdl] = model;
	t.expressionStatement(t.assignmentExpression("=", t.memberExpression(t.identifier(varname), t.identifier("mdl"), true), t.identifier("model"))),
	//if (model.associate) model.associate(sequelize);
	t.ifStatement(t.memberExpression(t.identifier("model"), t.identifier("associate")), t.expressionStatement(t.callExpression(t.memberExpression(t.identifier("model"), t.identifier("associate")), [t.identifier("sequelize")])))])));
}

function parseSQLZINIT(path) {
	var calls = parseCalls(path.node.right),
	    orderedBlocks = orderBlocks(calls),
	    declarations = [];

	var config = void 0,
	    configObj = void 0,
	    optionalConfig = [],
	    environment = void 0,
	    uri = void 0,
	    models = void 0;

	var _iteratorNormalCompletion = true;
	var _didIteratorError = false;
	var _iteratorError = undefined;

	try {
		for (var _iterator = orderedBlocks[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
			var tbl = _step.value;


			if (tbl.block.type == "AssignmentExpression") {

				switch (tbl.block.selector.tag) {
					case "config":
						config = tbl.block.path.right;
						break;
					case "environment":
						environment = tbl.block.path.right;
						break;
					case "uri":
					case "url":
						uri = tbl.block.path.right;
						break;
					case "models":
						models = tbl.block.path.right;
						break;
				}
			} else if (tbl.block.type == "ElementBlock" && tbl.block.selector.tag == "config") {
				configObj = t.objectExpression([]);
				childrenToOptions(tbl, configObj, optionalConfig, false);
			} else throw curFile.buildCodeFrameError(tbl.block.path, "invalid init block type " + tbl.block.type);
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

	var kind = path.parentPath.parent.kind;
	var varname = path.parent.id.name;

	// var db = { };
	declarations.push(t.variableDeclaration(kind, [t.variableDeclarator(t.identifier(varname), t.objectExpression([]))]));

	if (!environment) throw curFile.buildCodeFrameError(path, "no environment specified");

	var vars = [
	//var Sequelize = require("sequelize");
	t.variableDeclarator(t.identifier("Sequelize"), t.callExpression(t.identifier("require"), [t.stringLiteral("sequelize")])),

	// var DataTypes = Sequelize.DataTypes;
	t.variableDeclarator(t.identifier("DataTypes"), t.memberExpression(t.identifier("Sequelize"), t.identifier("DataTypes"))),

	//var env = process.env.NODE_ENV || "development";
	t.variableDeclarator(t.identifier("env"), environment)];

	if (uri) {
		vars.push(
		//var dbUrl = process.env.DATABASE_URL;
		t.variableDeclarator(t.identifier("dbUrl"), uri));
	}

	if (config) {
		vars = vars.concat([
		//var cfgFile = path.join(__dirname, '..', '..', 'config', 'config.json');
		t.variableDeclarator(t.identifier("cfgFile"), config),

		//var cfg = require(cfgFile)[env];
		t.variableDeclarator(t.identifier("cfg"), t.memberExpression(t.callExpression(t.identifier("require"), [t.identifier("cfgFile")]), t.identifier("env"), true))]);
	} else if (configObj) {
		if (optionalConfig.length == 0) vars.push(t.variableDeclarator(t.identifier("cfg"), t.memberExpression(configObj, t.identifier("env"), true)));else {
			vars.push(t.variableDeclarator(t.identifier("cfg"), t.memberExpression(t.callExpression(t.memberExpression(t.identifier("Object"), t.identifier("assign")), [configObj].concat(optionalConfig)), t.identifier("env"), true)));
		}
	} else throw curFile.buildCodeFrameError(path, "no config specified");

	if (uri) {
		vars.push(
		//var sequelize = dbUrl ? new Sequelize(dbUrl, cfg) : new Sequelize(cfg);
		t.variableDeclarator(t.identifier("sequelize"), t.conditionalExpression(t.identifier("dbUrl"), t.newExpression(t.identifier("Sequelize"), [t.identifier("dbUrl"), t.identifier("cfg")]), t.newExpression(t.identifier("Sequelize"), [t.identifier("cfg")]))));
	} else {
		vars.push(
		// var sequelize = new Sequelize(cfg)
		t.variableDeclarator(t.identifier("sequelize"), t.newExpression(t.identifier("Sequelize"), [t.identifier("cfg")])));
	}

	if (models) {
		vars = vars.concat([
		//var glob = require("glob");
		t.variableDeclarator(t.identifier("glob"), t.callExpression(t.identifier("require"), [t.stringLiteral("glob")])),

		//var modelGlob = path.join(__dirname, "/**/!(index).js");
		t.variableDeclarator(t.identifier("modelGlob"), models),

		//var files = glob.sync(modelGlob);
		t.variableDeclarator(t.identifier("files"), t.callExpression(t.memberExpression(t.identifier("glob"), t.identifier("sync")), [t.identifier("modelGlob")]))]);
	}

	declarations.push(t.variableDeclaration("var", vars));

	if (models) {
		declarations.push(
		//for (var i = 0; i < files.length; i++) {
		t.forStatement(t.variableDeclaration("let", [t.variableDeclarator(t.identifier("i"), t.numericLiteral(0))]), t.binaryExpression("<", t.identifier("i"), t.memberExpression(t.identifier("files"), t.identifier("length"))), t.updateExpression("++", t.identifier("i")),
		//sequelize.import(files[i]);
		t.expressionStatement(t.callExpression(t.memberExpression(t.identifier("sequelize"), t.identifier("import")), [t.memberExpression(t.identifier("files"), t.identifier("i"), true)]))));
	}

	//db.sequelize = sequelize;
	declarations.push(t.expressionStatement(t.assignmentExpression("=", t.memberExpression(t.identifier(varname), t.identifier("sequelize")), t.identifier("sequelize"))));

	//db.Sequelize = Sequelize;
	declarations.push(t.expressionStatement(t.assignmentExpression("=", t.memberExpression(t.identifier(varname), t.identifier("Sequelize")), t.identifier("Sequelize"))));

	path.parentPath.parentPath.replaceWithMultiple(declarations);
}

function parseAssociation(varName, assoc) {
	var type = t.identifier(assoc.block.selector.tag),
	    target = t.memberExpression(t.memberExpression(t.identifier("sequelize"), t.identifier('models')), t.identifier(assoc.block.selector.classes[0])),
	    options = t.objectExpression([]),
	    optionalOptions = [];

	attributesToOptions(assoc, options);
	childrenToOptions(assoc, options, optionalOptions, false);
	var assocOpts = objOrAssign(options, optionalOptions);

	var rslt = t.callExpression(t.memberExpression(t.identifier(varName), type), [target, assocOpts]);
	return rslt;
}

function parseAssociations(varName, child, associations) {

	for (var i = 0; i < child.children.length; i++) {
		var assoc = child.children[i];
		var conditions = [];

		if (assoc.block.type == "ElementBlock") {

			associations.push(t.expressionStatement(parseAssociation(varName, assoc)));
		} else if (assoc.block.type == "AssignmentExpression") {
			var assocElement = orderBlocks([chainElement(assoc.block.path.right)])[0];
			assocElement.children = assoc.children;

			associations.push(t.expressionStatement(t.assignmentExpression("=", t.memberExpression(t.identifier(varName), t.identifier(assoc.block.selector.tag)), parseAssociation(varName, assocElement))));
		} else if (assoc.block.type == "If") {
			var ifAssociations = [];
			parseAssociations(varName, assoc, ifAssociations);
			conditions.push({ cond: assoc.block.condition, child: t.blockStatement(ifAssociations) });

			if (child.children.length > i + 1) {

				for (var y = i + 1; y < child.children.length; y++) {
					var next = child.children[y];
					if (next.block.type == "Else") {
						if (next.indent == assoc.indent) {
							var elseAssociations = [];
							parseAssociations(varName, next, elseAssociations);
							conditions.push({ cond: null, child: t.blockStatement(elseAssociations) });
							break;
						}
					} else if (next.block.type == "ElseIf") {

						if (next.indent == assoc.indent) {
							var elseIfAssociations = [];
							parseAssociations(varName, next, elseIfAssociations);
							conditions.push({ cond: next.block.condition, child: t.blockStatement(elseIfAssociations) });
						} else break;
					} else if (next.indent == assoc.indent) break;
				}
			}
		} else if (assoc.block.type == "ElseIf" || assoc.block.type == "Else") {} else {

			throw curFile.buildCodeFrameError(assoc.block.path, "invalid association element type " + assoc.block.type);
		}

		if (conditions.length > 0) associations.push(generateIfChain(conditions, false));
	}
}

function parseSQLZ(path) {
	var calls = parseCalls(path.node.right),
	    orderedBlocks = orderBlocks(calls),
	    declarations = [];

	var _iteratorNormalCompletion2 = true;
	var _didIteratorError2 = false;
	var _iteratorError2 = undefined;

	try {
		for (var _iterator2 = orderedBlocks[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
			var tbl = _step2.value;

			if (!['ElementBlock', 'CustomElement'].includes(tbl.block.type)) throw curFile.buildCodeFrameError(tbl.block.path, "invalid table block type " + tbl.block.type);

			var varName = tbl.block.selector.tag,
			    tableName = t.stringLiteral(varName),
			    tableOptions = t.objectExpression([]),
			    optionalTableOptions = [],
			    columns = t.objectExpression([]),
			    optionalColumns = [],
			    associations = [],
			    optionalAssociations = [];

			classesToOptions(tbl, tableOptions);
			attributesToOptions(tbl, tableOptions);

			// (...items)
			var _iteratorNormalCompletion3 = true;
			var _didIteratorError3 = false;
			var _iteratorError3 = undefined;

			try {
				for (var _iterator3 = tbl.children[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
					var child = _step3.value;

					if (child.block.type == "ElementBlock" || child.block.type == "CustomElement") {
						childrenToNamedOptions(child, columns, optionalColumns, child.block.selector.tag, true);
						continue;
					} else if (child.block.type == "SpreadElement") {

						var argName = child.block.path.argument.name;

						switch (argName) {
							case "options":
								childrenToOptions(child, tableOptions, optionalTableOptions, true);
								break;

							case "columns":
								childrenToOptions(child, columns, optionalColumns, true);
								break;

							case "name":
							case "getters":
							case "setters":
							case "validate":
							case "indexes":
							case "scopes":
								childrenToNamedOptions(child, tableOptions, optionalTableOptions, argName, true);
								break;

							case "associations":
								parseAssociations(varName, child, associations);
								break;

							case "hooks":
								childrenToNamedOptions(child, tableOptions, optionalTableOptions, argName, false);
								break;

							default:
								throw curFile.buildCodeFrameError(child.block.path, "unrecognized table category: " + argName);
								break;

						}
					} else {
						throw curFile.buildCodeFrameError(child.block.path, "invalid table child element type " + child.block.type);
					}
				}
			} catch (err) {
				_didIteratorError3 = true;
				_iteratorError3 = err;
			} finally {
				try {
					if (!_iteratorNormalCompletion3 && _iterator3.return) {
						_iterator3.return();
					}
				} finally {
					if (_didIteratorError3) {
						throw _iteratorError3;
					}
				}
			}

			columns = objOrAssign(columns, optionalColumns);
			var tableOpts = objOrAssign(tableOptions, optionalTableOptions);

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

	path.replaceWithMultiple(declarations);
}

function generateIfChain(conditions) {
	var shortHand = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

	// get the next condition
	var condition = conditions.shift();

	// check for no more conditions, or final else
	if (condition == null) return null;
	if (condition.cond == null) return condition.child;

	// recurse deeper to generate the next if
	var nextIf = generateIfChain(conditions, shortHand);
	if (nextIf == null) return shortHand ? t.conditionalExpression(condition.cond, condition.child, t.identifier("undefined")) : t.ifStatement(condition.cond, condition.child, null);else {
		return shortHand ? t.conditionalExpression(condition.cond, condition.child, nextIf) : t.ifStatement(condition.cond, condition.child, nextIf);
	}
}

function attributesToOptions(item, opts) {
	if (item.block.attributes != null) {
		var _iteratorNormalCompletion4 = true;
		var _didIteratorError4 = false;
		var _iteratorError4 = undefined;

		try {
			for (var _iterator4 = item.block.attributes.properties[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
				var prop = _step4.value;

				opts.properties.push(prop);
			}
		} catch (err) {
			_didIteratorError4 = true;
			_iteratorError4 = err;
		} finally {
			try {
				if (!_iteratorNormalCompletion4 && _iterator4.return) {
					_iterator4.return();
				}
			} finally {
				if (_didIteratorError4) {
					throw _iteratorError4;
				}
			}
		}
	}
}

function classesToOptions(item, opts) {
	var _iteratorNormalCompletion5 = true;
	var _didIteratorError5 = false;
	var _iteratorError5 = undefined;

	try {
		for (var _iterator5 = item.block.selector.classes[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
			var cls = _step5.value;

			opts.properties.push(t.objectProperty(t.identifier(cls), t.identifier("true")));
		}
	} catch (err) {
		_didIteratorError5 = true;
		_iteratorError5 = err;
	} finally {
		try {
			if (!_iteratorNormalCompletion5 && _iterator5.return) {
				_iterator5.return();
			}
		} finally {
			if (_didIteratorError5) {
				throw _iteratorError5;
			}
		}
	}
}

function objOrAssign(objExpr, condObjs) {
	if (condObjs.length == 0) {
		return objExpr;
	} else {
		var rslt = t.callExpression(t.memberExpression(t.identifier("Object"), t.identifier("assign")), [objExpr].concat(_toConsumableArray(condObjs)));
		return rslt;
	}
}

function childrenToOptions(item, opts, optionalOpts) {
	var noKeyFunc = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : true;

	for (var i = 0; i < item.children.length; i++) {
		var child = item.children[i];

		if (child.block.type == 'AssignmentExpression') {

			if (noKeyFunc && child.block.path.right.type == 'ArrowFunctionExpression') {
				opts.properties.push(t.functionDeclaration(t.identifier(child.block.selector.tag), child.block.path.right.params, child.block.path.right.body));
			} else {
				opts.properties.push(t.objectProperty(child.block.path.left, child.block.path.right));
			}
		} else if (child.block.type == 'ElementBlock' || child.block.type == 'CustomElement') {

			childrenToNamedOptions(child, opts, optionalOpts, child.block.selector.tag, noKeyFunc);
		} else if (child.block.type == 'If') {
			var conditions = [];
			var condObj = t.objectExpression([]);
			var condOptionalObj = [];

			childrenToOptions(child, condObj, condOptionalObj, noKeyFunc);

			var condChild = objOrAssign(condObj, condOptionalObj);

			conditions.push({ cond: child.block.condition, child: condChild });

			if (item.children.length > i + 1) {
				for (var y = i + 1; y < item.children.length; y++) {
					var next = item.children[y];
					if (next.block.type == "Else") {
						if (next.indent == child.indent) {
							var elseCondObj = t.objectExpression([]);
							var elseCondOptionalObj = [];
							childrenToOptions(next, elseCondObj, elseCondOptionalObj, noKeyFunc);
							var _condChild = objOrAssign(elseCondObj, elseCondOptionalObj);

							conditions.push({ cond: null, child: _condChild });
							break;
						}
					} else if (next.block.type == "ElseIf") {
						if (next.indent == child.indent) {
							var elseIfCondObj = t.objectExpression([]);
							var elseIfCondOptionalObj = [];
							childrenToOptions(next, elseIfCondObj, elseIfCondOptionalObj, noKeyFunc);
							var _condChild2 = objOrAssign(elseIfCondObj, elseIfCondOptionalObj);

							conditions.push({ cond: next.block.condition, child: _condChild2 });
						} else break;
					} else if (next.indent == child.indent) break;
				}
			}

			var rslt = generateIfChain(conditions);
			optionalOpts.push(rslt);
		} else if (child.block.type == 'ElseIf' || child.block.type == 'Else') {} else throw curFile.buildCodeFrameError(child.block.path, "childToOption: bad child " + child.block.type);
	}
}

function childrenToNamedOptions(item, opts, optionalOpts, name) {
	var noKeyFunc = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : true;

	var options = t.objectExpression([]);
	classesToOptions(item, options);
	attributesToOptions(item, options);
	childrenToOptions(item, options, optionalOpts, noKeyFunc);
	opts.properties.push(t.objectProperty(t.identifier(name), options));
}

function parseCalls(path) {
	switch (path.type) {
		case "CallExpression":
			if (path.callee.extra && path.callee.extra.parenthesized || path.callee.type == "CallExpression") {
				var b1 = parseCalls(path.callee);
				var b2 = chainElement(path.arguments[0]);
				return [b2].concat(b1);
			} else {
				var _b = chainElement(path);
				return [_b];
			}
			break;

		case "MemberExpression":
			if (path.object.extra && path.object.extra.parenthesized && path.property.type != "SequenceExpression") {
				var _b2 = parseCalls(path.object);
				var _b3 = chainElement(path.property);
				return [_b3].concat(_b2);
			} else {
				var _b4 = chainElement(path);
				return [_b4];
			}
			break;

		case "AssignmentExpression":
		case "Identifier":
			var b = chainElement(path);
			return [b];
			break;

		default:
			throw curFile.buildCodeFrameError(path, 'parseCalls unknown node type: ' + path.type);

	}
}

function chainElement(path) {
	var element = {
		path: path,
		type: 'ElementBlock',
		selector: {
			tag: '',
			classes: []
		},
		attributes: null,
		content: null
	};

	switch (path.type) {
		case "Identifier":
			if (path.name == "$else") {
				element.type = "Else";
			} else {
				element.selector.tag = path.name;
				if (path.name[0] === path.name[0].toUpperCase()) {
					element.type = 'CustomElement';
					element.arguments = [];
				} else {
					element.type = 'ElementBlock';
				}
			}
			break;
		//element.selector.tag = path.name;
		//if (path.name[0] === path.name[0].toUpperCase()) {
		//element.type = 'CustomElement';
		//element.arguments = [];
		//} else {
		//element.type = 'ElementBlock';
		//}
		//break;

		case "MemberExpression":
			parseEndBlock(path, element);
			break;

		case "CallExpression":
			var foundDirective = false;
			if (path.callee.type == "Identifier") {
				switch (path.callee.name) {
					case "$if":
						element.type = "If";
						element.condition = path.arguments[0];
						foundDirective = true;
						break;
					case "$elseif":
						element.type = "ElseIf";
						element.condition = path.arguments[0];
						foundDirective = true;
						break;
				}
			}
			if (!foundDirective) {
				element = chainElement(path.callee);
				var attr = t.objectExpression([]);

				var _iteratorNormalCompletion6 = true;
				var _didIteratorError6 = false;
				var _iteratorError6 = undefined;

				try {
					for (var _iterator6 = path.arguments[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
						var entry = _step6.value;

						if (entry.type == "AssignmentExpression") {
							attr.properties.push(t.objectProperty(entry.left, entry.right));
						} else throw "bad attribute " + entry;
					}
				} catch (err) {
					_didIteratorError6 = true;
					_iteratorError6 = err;
				} finally {
					try {
						if (!_iteratorNormalCompletion6 && _iterator6.return) {
							_iterator6.return();
						}
					} finally {
						if (_didIteratorError6) {
							throw _iteratorError6;
						}
					}
				}

				element.attributes = attr;
			}
			break;

		case "AssignmentExpression":
			element.type = "AssignmentExpression";
			parseEndBlock(path.left, element);
			break;

		case "SpreadElement":
			element.type = "SpreadElement";
			break;

		default:
			throw curFile.buildCodeFrameError(path, "chainElement unknown node type: " + path.type);
	}

	return element;
}

function orderBlocks(blocks) {
	blocks.reverse();
	var list = [];
	var current = null;
	var lines = new Map();
	var _iteratorNormalCompletion7 = true;
	var _didIteratorError7 = false;
	var _iteratorError7 = undefined;

	try {
		for (var _iterator7 = blocks[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
			var block = _step7.value;

			var line = block.path.loc.start.line;
			if (!lines.has(line)) lines.set(line, block.path.loc.start.column);

			var indent = lines.get(line);
			var addTo = current;

			if (addTo != null) {
				if (indent == current.indent) {
					addTo = current.parent;
				} else if (indent < current.indent) {
					var parent = current.parent;
					while (parent != null && indent <= parent.indent) {
						parent = parent.parent;
					}
					addTo = parent;
				}
			}

			var positionedBlock = {
				block: block,
				children: [],
				indent: indent,
				line: line,
				parent: addTo
			};

			current = positionedBlock;

			if (addTo != null) {
				if (addTo.children == null) addTo.children = [positionedBlock];else addTo.children.push(positionedBlock);
			} else list.push(positionedBlock);
		}
	} catch (err) {
		_didIteratorError7 = true;
		_iteratorError7 = err;
	} finally {
		try {
			if (!_iteratorNormalCompletion7 && _iterator7.return) {
				_iterator7.return();
			}
		} finally {
			if (_didIteratorError7) {
				throw _iteratorError7;
			}
		}
	}

	return list;
}

function parseEndBlock(e, element) {
	var clean = (0, _babelGenerator2.default)(e, {
		retainFunctionParens: true,
		comments: false
	});
	var cleanAST = babylon.parse(clean.code);
	(0, _babelTraverse2.default)(cleanAST, removeAttr);
	clean = (0, _babelGenerator2.default)(cleanAST);

	var code = clean.code.replace(/\s/g, '').slice(0, -1);
	element.selector = parseSelector(code);
	//if (element.selector.tag[0] === element.selector.tag[0].toUpperCase()) element.type = "CustomElement";
}

var removeAttr = {
	CallExpression: function CallExpression(path) {
		path.replaceWith(path.node.callee);
	}
};

function parseSelector(selector) {
	selector = selector.replace(/\./g, ',.');
	var parts = selector.split(',');
	var rslt = {
		tag: '',
		classes: []
	};

	var _iteratorNormalCompletion8 = true;
	var _didIteratorError8 = false;
	var _iteratorError8 = undefined;

	try {
		for (var _iterator8 = parts[Symbol.iterator](), _step8; !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {
			var part = _step8.value;

			var value = part.substr(1);
			if (part[0] == ".") {
				rslt.classes.push(value);
			} else {
				rslt.tag = part;
			}
		}
	} catch (err) {
		_didIteratorError8 = true;
		_iteratorError8 = err;
	} finally {
		try {
			if (!_iteratorNormalCompletion8 && _iterator8.return) {
				_iterator8.return();
			}
		} finally {
			if (_didIteratorError8) {
				throw _iteratorError8;
			}
		}
	}

	return rslt;
}