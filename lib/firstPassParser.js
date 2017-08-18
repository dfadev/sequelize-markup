"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.parseCalls = parseCalls;
exports.chainElement = chainElement;
exports.orderBlocks = orderBlocks;

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

function parseCalls(path, curFile) {
	switch (path.type) {
		case "CallExpression":
			if (path.callee.extra && path.callee.extra.parenthesized || path.callee.type == "CallExpression") {
				var b1 = parseCalls(path.callee, curFile);
				var b2 = chainElement(path.arguments[0], curFile);
				return [b2].concat(b1);
			} else {
				var _b = chainElement(path, curFile);
				return [_b];
			}
			break;

		case "MemberExpression":
			if (path.object.extra && path.object.extra.parenthesized && path.property.type != "SequenceExpression") {
				var _b2 = parseCalls(path.object, curFile);
				var _b3 = chainElement(path.property, curFile);
				return [_b3].concat(_b2);
			} else {
				var _b4 = chainElement(path, curFile);
				return [_b4];
			}
			break;

		case "AssignmentExpression":
		case "Identifier":
			var b = chainElement(path, curFile);
			return [b];
			break;

		default:
			throw curFile.buildCodeFrameError(path, 'parseCalls unknown node type: ' + path.type);

	}
}

function chainElement(path, curFile) {
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
				element = chainElement(path.callee, curFile);
				var attr = t.objectExpression([]);

				var _iteratorNormalCompletion = true;
				var _didIteratorError = false;
				var _iteratorError = undefined;

				try {
					for (var _iterator = path.arguments[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
						var entry = _step.value;

						if (entry.type == "AssignmentExpression") {
							attr.properties.push(t.objectProperty(entry.left, entry.right));
						} else throw "bad attribute " + entry;
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
	var _iteratorNormalCompletion2 = true;
	var _didIteratorError2 = false;
	var _iteratorError2 = undefined;

	try {
		for (var _iterator2 = blocks[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
			var block = _step2.value;

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

	var _iteratorNormalCompletion3 = true;
	var _didIteratorError3 = false;
	var _iteratorError3 = undefined;

	try {
		for (var _iterator3 = parts[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
			var part = _step3.value;

			var value = part.substr(1);
			if (part[0] == ".") {
				rslt.classes.push(value);
			} else {
				rslt.tag = part;
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

	return rslt;
}