import * as t from "babel-types";
import generate from "babel-generator";
import traverse from "babel-traverse";
import * as babylon from "babylon";

export function parseCalls(path, curFile) {
	switch(path.type) {
		case "CallExpression":
			if ( (path.callee.extra && path.callee.extra.parenthesized) ||
				 (path.callee.type == "CallExpression") ) {
				let b1 = parseCalls(path.callee, curFile);
				let b2 = chainElement(path.arguments[0], curFile);
				return [b2].concat(b1);
			} else {
				let b = chainElement(path, curFile);
				return [b];
			}
			break;

		case "MemberExpression":
			if (path.object.extra && path.object.extra.parenthesized && path.property.type != "SequenceExpression") {
				let b1 = parseCalls(path.object, curFile);
				let b2 = chainElement(path.property, curFile);
				return [b2].concat(b1);
			} else {
				let b = chainElement(path, curFile);
				return [b];
			}
			break;

		case "AssignmentExpression":
		case "Identifier":
			let b = chainElement(path, curFile);
			return [b];
			break;

		default:
			throw curFile.buildCodeFrameError(path, 'parseCalls unknown node type: ' + path.type);

	}
}

export function chainElement(path, curFile) {
	let element = {
			path: path,
			type: 'ElementBlock',
			selector: {
				tag: '',
				classes: [],
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
				element = chainElement(path.callee, curFile);
				let attr = t.objectExpression([]);

				for (let entry of path.arguments) {
					if (entry.type == "AssignmentExpression") {
						attr.properties.push(t.objectProperty(entry.left, entry.right));
					} else throw "bad attribute " + entry;
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

export function orderBlocks(blocks) {
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

		if (addTo != null)
		{
			if (addTo.children == null)
				addTo.children = [positionedBlock];
			else
				addTo.children.push(positionedBlock);
		}
		else
			list.push(positionedBlock);
	}
	return list;
}

function parseEndBlock(e, element) {
	let clean = generate(e, {
		retainFunctionParens: true,
		comments: false,
	});
	let cleanAST = babylon.parse(clean.code);
	traverse(cleanAST, removeAttr);
	clean = generate(cleanAST);

	let code = clean.code.replace(/\s/g, '').slice(0, -1);
	element.selector = parseSelector(code);
}

const removeAttr = {
	CallExpression(path) {
		path.replaceWith(path.node.callee);
	},
};

function parseSelector(selector) {
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

