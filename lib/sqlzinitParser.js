"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.parseCallSQLZINIT = parseCallSQLZINIT;
exports.parseSQLZINIT = parseSQLZINIT;

var _babelTypes = require("babel-types");

var t = _interopRequireWildcard(_babelTypes);

var _firstPassParser = require("./firstPassParser");

var _secondPassParser = require("./secondPassParser");

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

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
	var calls = (0, _firstPassParser.parseCalls)(path.node.right, path.hub.file),
	    orderedBlocks = (0, _firstPassParser.orderBlocks)(calls, path.hub.file),
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
				(0, _secondPassParser.childrenToOptions)(tbl, configObj, optionalConfig, false, [], path);
			} else throw path.hub.file.buildCodeFrameError(tbl.block.path, "invalid init block type " + tbl.block.type);
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

	if (!environment) throw path.hub.file.buildCodeFrameError(path, "no environment specified");

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
	} else throw path.hub.file.buildCodeFrameError(path, "no config specified");

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