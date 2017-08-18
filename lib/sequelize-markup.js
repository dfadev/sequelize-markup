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

				if (t.isIdentifier(path.node.left) && path.node.left.name == SQLZ || t.isMemberExpression(path.node.left) && (0, _babelGenerator2.default)(path.node.left).code == SQLZ) (0, _sqlzParser.parseSQLZ)(path);else if (t.isIdentifier(path.node.left) && path.node.left.name == SQLZINIT || t.isMemberExpression(path.node.left) && (0, _babelGenerator2.default)(path.node.left).code == SQLZINIT) (0, _sqlzinitParser.parseSQLZINIT)(path);
			},
			CallExpression: function CallExpression(path) {
				if (t.isIdentifier(path.node.callee) && path.node.callee.name == SQLZINIT) (0, _sqlzinitParser.parseCallSQLZINIT)(path);
			}
		}
	};
};

var _babelTypes = require("babel-types");

var t = _interopRequireWildcard(_babelTypes);

var _babelGenerator = require("babel-generator");

var _babelGenerator2 = _interopRequireDefault(_babelGenerator);

var _sqlzinitParser = require("./sqlzinitParser");

var _sqlzParser = require("./sqlzParser");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

//import template from "babel-template";
var SQLZ = "SQLZ";
var SQLZINIT = "SQLZINIT";

;