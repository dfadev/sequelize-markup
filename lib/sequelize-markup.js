"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

exports.default = function ({ types: t }) {
	return {
		visitor: {
			BinaryExpression(path) {
				if (path.node.operator != ">") return;

				if (t.isIdentifier(path.node.left) && path.node.left.name == SQLZ || t.isMemberExpression(path.node.left) && (0, _babelGenerator2.default)(path.node.left).code == SQLZ) {

					let sequelizeParser = new _SequelizeParser2.default(path);
					sequelizeParser.parse();
				} else if (t.isIdentifier(path.node.left) && path.node.left.name == SQLZINIT || t.isMemberExpression(path.node.left) && (0, _babelGenerator2.default)(path.node.left).code == SQLZINIT) {

					let sequelizeInitParser = new _SequelizeInitParser2.default(path);
					sequelizeInitParser.parse();
				}
			},

			CallExpression(path) {
				if (t.isIdentifier(path.node.callee) && path.node.callee.name == SQLZINIT) {
					let sequelizeInitParser = new _SequelizeInitParser2.default(path);
					sequelizeInitParser.parseCall(path);
				}
			}
		}
	};
};

var _babelTypes = require("babel-types");

var t = _interopRequireWildcard(_babelTypes);

var _babelGenerator = require("babel-generator");

var _babelGenerator2 = _interopRequireDefault(_babelGenerator);

var _SequelizeParser = require("./SequelizeParser");

var _SequelizeParser2 = _interopRequireDefault(_SequelizeParser);

var _SequelizeInitParser = require("./SequelizeInitParser");

var _SequelizeInitParser2 = _interopRequireDefault(_SequelizeInitParser);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

//import template from "babel-template";
const SQLZ = "SQLZ";
const SQLZINIT = "SQLZINIT";

;