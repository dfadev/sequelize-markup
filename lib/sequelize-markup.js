"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

exports.default = function (_ref) {
	var t = _ref.types;

	return {
		visitor: {
			BinaryExpression: function BinaryExpression(path) {

				if (path.node.operator != ">") return;

				if (t.isIdentifier(path.node.left) && path.node.left.name == SQLZ || t.isMemberExpression(path.node.left) && (0, _babelGenerator2.default)(path.node.left).code == SQLZ) parseSQLZ(path);else if (t.isIdentifier(path.node.left) && path.node.left.name == SQLZINIT || t.isMemberExpression(path.node.left) && (0, _babelGenerator2.default)(path.node.left).code == SQLZINIT) parseSQLZINIT(path);
			},
			CallExpression: function CallExpression(path) {
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

var SQLZ = "SQLZ";
var SQLZINIT = "SQLZINIT";

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
				childrenToOptions(tbl, configObj, false);
			} else throw path.buildCodeFrameError("invalid init block type " + tbl.block.type);
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

	if (!environment) throw path.buildCodeFrameError("no environment specified");

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
		vars.push(t.variableDeclarator(t.identifier("cfg"), t.memberExpression(configObj, t.identifier("env"), true)));
	} else throw path.buildCodeFrameError("no config specified");

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

			if (!['ElementBlock', 'CustomElement'].includes(tbl.block.type)) throw path.buildCodeFrameError("invalid table block type " + tbl.block.type);

			var varName = tbl.block.selector.tag,

			//tableName = t.stringLiteral(varName[0].toLowerCase() + varName.slice(1)),
			tableName = t.stringLiteral(varName),
			    tableOptions = t.objectExpression([]),
			    columns = t.objectExpression([]),
			    associations = [];

			classesToOptions(tbl, tableOptions);
			attributesToOptions(tbl, tableOptions);

			// (...items)
			var _iteratorNormalCompletion3 = true;
			var _didIteratorError3 = false;
			var _iteratorError3 = undefined;

			try {
				for (var _iterator3 = tbl.children[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
					var child = _step3.value;

					if (child.block.type != "SpreadElement") {
						childrenToNamedOptions(child, columns, child.block.selector.tag, true);
						continue;
					}

					var argName = child.block.path.argument.name;

					switch (argName) {
						case "options":
							childrenToOptions(child, tableOptions, true);
							break;

						case "columns":
							childrenToOptions(child, columns, true);
							break;

						case "name":
						case "getters":
						case "setters":
						case "validate":
						case "indexes":
						case "scopes":
							childrenToNamedOptions(child, tableOptions, argName, true);
							break;

						case "associations":
							var _iteratorNormalCompletion4 = true;
							var _didIteratorError4 = false;
							var _iteratorError4 = undefined;

							try {
								for (var _iterator4 = child.children[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
									var assoc = _step4.value;

									var type = t.identifier(assoc.block.selector.tag),
									    target = t.memberExpression(t.memberExpression(t.identifier("sequelize"), t.identifier('models')), t.identifier(assoc.block.selector.classes[0])),
									    options = t.objectExpression([]);

									attributesToOptions(assoc, options);
									childrenToOptions(assoc, options);

									associations.push(t.expressionStatement(t.callExpression(t.memberExpression(t.identifier(varName), type), [target, options])));
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

							break;

						case "hooks":
							childrenToNamedOptions(child, tableOptions, argName, false);
							break;

						default:
							throw path.buildCodeFrameError("unrecognized table category: " + argName);
							break;

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

			var callee = t.memberExpression(t.identifier('sequelize'), t.identifier('define')),
			    params = tableOptions.properties.length > 0 ? [tableName, columns, tableOptions] : [tableName, columns],
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

function attributesToOptions(item, opts) {
	if (item.block.attributes != null) {
		var _iteratorNormalCompletion5 = true;
		var _didIteratorError5 = false;
		var _iteratorError5 = undefined;

		try {
			for (var _iterator5 = item.block.attributes.properties[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
				var prop = _step5.value;

				opts.properties.push(prop);
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
}

function classesToOptions(item, opts) {
	var _iteratorNormalCompletion6 = true;
	var _didIteratorError6 = false;
	var _iteratorError6 = undefined;

	try {
		for (var _iterator6 = item.block.selector.classes[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
			var cls = _step6.value;

			opts.properties.push(t.objectProperty(t.identifier(cls), t.identifier("true")));
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
}

function childrenToOptions(item, opts) {
	var noKeyFunc = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
	var _iteratorNormalCompletion7 = true;
	var _didIteratorError7 = false;
	var _iteratorError7 = undefined;

	try {
		for (var _iterator7 = item.children[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
			var child = _step7.value;

			childToOption(child, opts, noKeyFunc);
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
}

function childrenToNamedOptions(item, opts, name) {
	var noKeyFunc = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : true;

	var options = t.objectExpression([]);
	classesToOptions(item, options);
	attributesToOptions(item, options);
	childrenToOptions(item, options, noKeyFunc);
	opts.properties.push(t.objectProperty(t.identifier(name), options));
}

function childToOption(child, opts) {
	var noKeyFunc = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;

	if (child.block.type == 'AssignmentExpression') {
		if (noKeyFunc && child.block.path.right.type == 'ArrowFunctionExpression') {
			opts.properties.push(t.functionDeclaration(t.identifier(child.block.selector.tag), child.block.path.right.params, child.block.path.right.body));
		} else {
			opts.properties.push(t.objectProperty(child.block.path.left, child.block.path.right));
		}
	} else if (child.block.type == 'ElementBlock' || child.block.type == 'CustomElement') {
		childrenToNamedOptions(child, opts, child.block.selector.tag, noKeyFunc);
	} else throw path.buildCodeFrameError("childToOption: bad child " + child.block.type);
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
			throw path.buildCodeFrameError('parseCalls unknown node type: ' + path.type);

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
			element.selector.tag = path.name;
			if (path.name[0] === path.name[0].toUpperCase()) {
				element.type = 'CustomElement';
				element.arguments = [];
			} else {
				element.type = 'ElementBlock';
			}
			break;

		case "MemberExpression":
			parseEndBlock(path, element);
			break;

		case "CallExpression":
			element = chainElement(path.callee);
			var attr = t.objectExpression([]);

			var _iteratorNormalCompletion8 = true;
			var _didIteratorError8 = false;
			var _iteratorError8 = undefined;

			try {
				for (var _iterator8 = path.arguments[Symbol.iterator](), _step8; !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {
					var entry = _step8.value;

					if (entry.type == "AssignmentExpression") {
						attr.properties.push(t.objectProperty(entry.left, entry.right));
					} else throw "bad attribute " + entry;
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

			element.attributes = attr;
			break;

		case "AssignmentExpression":
			element.type = "AssignmentExpression";
			parseEndBlock(path.left, element);
			break;

		case "SpreadElement":
			element.type = "SpreadElement";
			break;

		default:
			throw path.buildCodeFrameError("chainElement unknown node type: " + path.type);
	}

	return element;
}

function orderBlocks(blocks) {
	blocks.reverse();
	var list = [];
	var current = null;
	var lines = new Map();
	var _iteratorNormalCompletion9 = true;
	var _didIteratorError9 = false;
	var _iteratorError9 = undefined;

	try {
		for (var _iterator9 = blocks[Symbol.iterator](), _step9; !(_iteratorNormalCompletion9 = (_step9 = _iterator9.next()).done); _iteratorNormalCompletion9 = true) {
			var block = _step9.value;

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
		_didIteratorError9 = true;
		_iteratorError9 = err;
	} finally {
		try {
			if (!_iteratorNormalCompletion9 && _iterator9.return) {
				_iterator9.return();
			}
		} finally {
			if (_didIteratorError9) {
				throw _iteratorError9;
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
	if (element.selector.tag[0] === element.selector.tag[0].toUpperCase()) element.type = "CustomElement";
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

	var _iteratorNormalCompletion10 = true;
	var _didIteratorError10 = false;
	var _iteratorError10 = undefined;

	try {
		for (var _iterator10 = parts[Symbol.iterator](), _step10; !(_iteratorNormalCompletion10 = (_step10 = _iterator10.next()).done); _iteratorNormalCompletion10 = true) {
			var part = _step10.value;

			var value = part.substr(1);
			if (part[0] == ".") {
				rslt.classes.push(value);
			} else {
				rslt.tag = part;
			}
		}
	} catch (err) {
		_didIteratorError10 = true;
		_iteratorError10 = err;
	} finally {
		try {
			if (!_iteratorNormalCompletion10 && _iterator10.return) {
				_iterator10.return();
			}
		} finally {
			if (_didIteratorError10) {
				throw _iteratorError10;
			}
		}
	}

	return rslt;
}