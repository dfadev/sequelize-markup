"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _babelTypes = require("babel-types");

var t = _interopRequireWildcard(_babelTypes);

var _babelGenerator = require("babel-generator");

var _babelGenerator2 = _interopRequireDefault(_babelGenerator);

var _babelTraverse = require("babel-traverse");

var _babelTraverse2 = _interopRequireDefault(_babelTraverse);

var _babylon = require("babylon");

var babylon = _interopRequireWildcard(_babylon);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

class IndentParser {

	constructor(file) {
		this.file = file;
	}

	parseCalls(path) {
		switch (path.type) {
			case "CallExpression":
				if (path.callee.extra && path.callee.extra.parenthesized || path.callee.type == "CallExpression") {
					let b1 = this.parseCalls(path.callee);
					let b2 = this.chainElement(path.arguments[0]);
					return [b2].concat(b1);
				} else {
					let b = this.chainElement(path);
					return [b];
				}
				break;

			case "MemberExpression":
				if (path.object.extra && path.object.extra.parenthesized && path.property.type != "SequenceExpression") {
					let b1 = this.parseCalls(path.object);
					let b2 = this.chainElement(path.property, this.file);
					return [b2].concat(b1);
				} else {
					let b = this.chainElement(path);
					return [b];
				}
				break;

			case "AssignmentExpression":
			case "Identifier":
				let b = this.chainElement(path);
				return [b];
				break;

			default:
				throw this.file.buildCodeFrameError(path, 'parseCalls unknown node type: ' + path.type);

		}
	}

	chainElement(path) {
		let element = {
			path: path,
			type: 'ElementBlock',
			selector: {
				tag: '',
				classes: []
			},
			attributes: null,
			parameters: [],
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

			case "MemberExpression":
				this.parseEndBlock(path, element);
				break;

			case "CallExpression":
				let foundDirective = false;
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
					element = this.chainElement(path.callee);
					let attr = t.objectExpression([]);

					for (let entry of path.arguments) {
						if (entry.type == "AssignmentExpression") {
							attr.properties.push(t.objectProperty(entry.left, entry.right));
						} else if (entry.type == "Identifier" || entry.type == "BinaryExpression") {
							element.parameters.push(entry);
						} else {
							throw this.file.buildCodeFrameError(entry, "bad attribute type " + entry.type);
						}
					}
					element.attributes = attr;
				}
				break;

			case "AssignmentExpression":
				element.type = "AssignmentExpression";
				this.parseEndBlock(path.left, element);
				break;

			case "SpreadElement":
				element.type = "SpreadElement";
				break;

			case "BinaryExpression":
				element.type = "BinaryExpression";
				break;

			default:
				throw this.file.buildCodeFrameError(path, "chainElement unknown node type: " + path.type);
		}

		return element;
	}

	orderBlocks(blocks) {
		blocks.reverse();
		let list = [];
		let current = null;
		let lines = new Map();
		for (let block of blocks) {
			let line = block.path.loc.start.line;
			if (!lines.has(line)) lines.set(line, block.path.loc.start.column);

			let indent = lines.get(line);
			let addTo = current;

			if (addTo != null) {
				if (indent == current.indent) {
					addTo = current.parent;
				} else if (indent < current.indent) {
					let parent = current.parent;
					while (parent != null && indent <= parent.indent) {
						parent = parent.parent;
					}
					addTo = parent;
				}
			}

			let positionedBlock = {
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
		return list;
	}

	parseEndBlock(e, element) {
		let clean = (0, _babelGenerator2.default)(e, {
			retainFunctionParens: true,
			comments: false
		});
		let cleanAST = babylon.parse(clean.code);
		(0, _babelTraverse2.default)(cleanAST, {
			CallExpression(path) {
				path.replaceWith(path.node.callee);
			} });
		clean = (0, _babelGenerator2.default)(cleanAST);

		let code = clean.code.replace(/\s/g, '').slice(0, -1);
		element.selector = this.parseSelector(code);
	}

	parseSelector(selector) {
		selector = selector.replace(/\./g, ',.');
		let parts = selector.split(',');
		let rslt = {
			tag: '',
			classes: []
		};

		for (let part of parts) {
			let value = part.substr(1);
			if (part[0] == ".") {
				rslt.classes.push(value);
			} else {
				rslt.tag = part;
			}
		}

		return rslt;
	}

}
exports.default = IndentParser;