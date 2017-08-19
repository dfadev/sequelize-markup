"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _babelTypes = require("babel-types");

var t = _interopRequireWildcard(_babelTypes);

var _IndentParser = require("./IndentParser");

var _IndentParser2 = _interopRequireDefault(_IndentParser);

var _ObjectPropertiesParser = require("./ObjectPropertiesParser");

var _ObjectPropertiesParser2 = _interopRequireDefault(_ObjectPropertiesParser);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

class SequelizeInitParser {

	constructor(path) {
		this.file = path.hub.file;
		this.indentParser = new _IndentParser2.default(this.file);
		this.objPropParser = new _ObjectPropertiesParser2.default(this.file);
		this.path = path;
	}

	parseCall() {
		var varname = this.path.node.arguments[0].name;
		this.path.parentPath.replaceWith(
		//for (var mdl in sequelize.models) {
		t.forInStatement(t.variableDeclaration("let", [t.variableDeclarator(t.identifier("mdl"))]), t.memberExpression(t.identifier("sequelize"), t.identifier("models")), t.blockStatement([
		//var model = sequelize.models[mdl];
		t.variableDeclaration("let", [t.variableDeclarator(t.identifier("model"), t.memberExpression(t.memberExpression(t.identifier("sequelize"), t.identifier("models")), t.identifier("mdl"), true))]),
		//db[mdl] = model;
		t.expressionStatement(t.assignmentExpression("=", t.memberExpression(t.identifier(varname), t.identifier("mdl"), true), t.identifier("model"))),
		//if (model.associate) model.associate(sequelize);
		t.ifStatement(t.memberExpression(t.identifier("model"), t.identifier("associate")), t.expressionStatement(t.callExpression(t.memberExpression(t.identifier("model"), t.identifier("associate")), [t.identifier("sequelize")])))])));
	}

	parse() {
		let calls = this.indentParser.parseCalls(this.path.node.right),
		    orderedBlocks = this.indentParser.orderBlocks(calls),
		    declarations = [];

		let config,
		    configObj,
		    optionalConfig = [],
		    environment,
		    uri,
		    models;

		for (let tbl of orderedBlocks) {

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
				this.objPropParser.childrenToOptions(tbl, configObj, optionalConfig, false, []);
			} else throw this.file.buildCodeFrameError(tbl.block.path, "invalid init block type " + tbl.block.type);
		}

		var kind = this.path.parentPath.parent.kind;
		var varname = this.path.parent.id.name;

		// var db = { };
		declarations.push(t.variableDeclaration(kind, [t.variableDeclarator(t.identifier(varname), t.objectExpression([]))]));

		if (!environment) throw this.file.buildCodeFrameError(this.path, "no environment specified");

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
				vars.push(t.variableDeclarator(t.identifier("cfg"), t.memberExpression(t.callExpression(t.memberExpression(t.identifier("Object"), t.identifier("assign")), [configObj, ...optionalConfig]), t.identifier("env"), true)));
			}
		} else throw this.file.buildCodeFrameError(this.path, "no config specified");

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

		this.path.parentPath.parentPath.replaceWithMultiple(declarations);
	}

}
exports.default = SequelizeInitParser;