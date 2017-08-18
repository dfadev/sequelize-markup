//import template from "babel-template";
import * as t from "babel-types";
import generate from "babel-generator";
import { parseSQLZINIT, parseCallSQLZINIT } from "./sqlzinitParser";
import { parseSQLZ } from "./sqlzParser";

var SQLZ = "SQLZ";
var SQLZINIT = "SQLZINIT";

export default function({ types: t }) {
	return {
		visitor: {
			BinaryExpression(path) {
				if (path.node.operator != ">") return;

				if (
					(t.isIdentifier(path.node.left) && path.node.left.name == SQLZ)
					||
					(t.isMemberExpression(path.node.left) && generate(path.node.left).code == SQLZ)) 
					parseSQLZ(path);
				else if (
					(t.isIdentifier(path.node.left) && path.node.left.name == SQLZINIT)
					||
					(t.isMemberExpression(path.node.left) && generate(path.node.left).code == SQLZINIT)) 
					parseSQLZINIT(path);
			},

			CallExpression(path) {
				if (t.isIdentifier(path.node.callee) && path.node.callee.name == SQLZINIT)
					parseCallSQLZINIT(path);
			}
		}
	};
};
