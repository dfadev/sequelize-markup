//import template from "babel-template";
import * as t from "babel-types";
import generate from "babel-generator";
import SequelizeParser from "./SequelizeParser";
import SequelizeInitParser from "./SequelizeInitParser";

const SQLZ = "SQLZ";
const SQLZINIT = "SQLZINIT";

export default function({ types: t }) {
	return {
		visitor: {
			BinaryExpression(path) {
				if (path.node.operator != ">") return;

				if (
					(t.isIdentifier(path.node.left) && path.node.left.name == SQLZ)
					||
					(t.isMemberExpression(path.node.left) && generate(path.node.left).code == SQLZ)) {

					let sequelizeParser = new SequelizeParser(path);
					sequelizeParser.parse();

				}
				else if (
					(t.isIdentifier(path.node.left) && path.node.left.name == SQLZINIT)
					||
					(t.isMemberExpression(path.node.left) && generate(path.node.left).code == SQLZINIT)) {

					let sequelizeInitParser = new SequelizeInitParser(path);
					sequelizeInitParser.parse();

				}

			},

			CallExpression(path) {
				if (t.isIdentifier(path.node.callee) && path.node.callee.name == SQLZINIT) {
					let sequelizeInitParser = new SequelizeInitParser(path);
					sequelizeInitParser.parseCall(path);
				}
			}
		}
	};
};
