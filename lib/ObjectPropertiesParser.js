"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _babelTypes = require("babel-types");

var t = _interopRequireWildcard(_babelTypes);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

class ObjectPropertiesParser {

	constructor(file) {
		this.file = file;
	}

	generateIfChain(conditions, shortHand = true) {
		// get the next condition
		var condition = conditions.shift();

		// check for no more conditions, or final else
		if (condition == null) return null;
		if (condition.cond == null) return condition.child;

		// recurse deeper to generate the next if
		var nextIf = this.generateIfChain(conditions, shortHand);
		if (nextIf == null) return shortHand ? t.conditionalExpression(condition.cond, condition.child, t.identifier("undefined")) : t.ifStatement(condition.cond, condition.child, null);else {
			return shortHand ? t.conditionalExpression(condition.cond, condition.child, nextIf) : t.ifStatement(condition.cond, condition.child, nextIf);
		}
	}

	attributesToOptions(item, opts) {
		if (item.block.attributes != null) for (let prop of item.block.attributes.properties) opts.properties.push(prop);
	}

	classesToOptions(item, opts) {
		for (let cls of item.block.selector.classes) opts.properties.push(t.objectProperty(t.identifier(cls), t.identifier("true")));
	}

	objOrAssign(objExpr, condObjs) {
		if (condObjs.length == 0) {
			return objExpr;
		} else {
			let rslt = t.callExpression(t.memberExpression(t.identifier("Object"), t.identifier("assign")), [objExpr, ...condObjs]);
			return rslt;
		}
	}

	childrenToOptions(item, opts, optionalOpts, noKeyFunc = true, ignore = []) {
		for (let i = 0; i < item.children.length; i++) {
			let child = item.children[i];

			if (child.block.type == 'AssignmentExpression') {

				if (noKeyFunc && child.block.path.right.type == 'ArrowFunctionExpression') {
					opts.properties.push(t.functionDeclaration(t.identifier(child.block.selector.tag), child.block.path.right.params, child.block.path.right.body));
				} else {
					opts.properties.push(t.objectProperty(child.block.path.left, child.block.path.right));
				}
			} else if (child.block.type == 'ElementBlock' || child.block.type == 'CustomElement') {

				this.childrenToNamedOptions(child, opts, optionalOpts, child.block.selector.tag, noKeyFunc);
			} else if (child.block.type == 'If') {
				let conditions = [];
				let condObj = t.objectExpression([]);
				let condOptionalObj = [];

				this.childrenToOptions(child, condObj, condOptionalObj, noKeyFunc, ignore);

				let condChild = this.objOrAssign(condObj, condOptionalObj);

				conditions.push({ cond: child.block.condition, child: condChild });

				if (item.children.length > i + 1) {
					for (let y = i + 1; y < item.children.length; y++) {
						let next = item.children[y];
						if (next.block.type == "Else") {
							if (next.indent == child.indent) {
								let elseCondObj = t.objectExpression([]);
								let elseCondOptionalObj = [];
								this.childrenToOptions(next, elseCondObj, elseCondOptionalObj, noKeyFunc, ignore);
								let condChild = this.objOrAssign(elseCondObj, elseCondOptionalObj);

								conditions.push({ cond: null, child: condChild });
								break;
							}
						} else if (next.block.type == "ElseIf") {
							if (next.indent == child.indent) {
								let elseIfCondObj = t.objectExpression([]);
								let elseIfCondOptionalObj = [];
								this.childrenToOptions(next, elseIfCondObj, elseIfCondOptionalObj, noKeyFunc, ignore);
								let condChild = this.objOrAssign(elseIfCondObj, elseIfCondOptionalObj);

								conditions.push({ cond: next.block.condition, child: condChild });
							} else break;
						} else if (next.indent == child.indent) break;
					}
				}

				let rslt = this.generateIfChain(conditions);
				optionalOpts.push(rslt);
			} else if (child.block.type == 'ElseIf' || child.block.type == 'Else') {} else if (ignore.includes(child.block.type)) {} else throw this.file.buildCodeFrameError(child.block.path, "childToOption: bad child type " + child.block.type);
		}
	}

	childrenToNamedOptions(item, opts, optionalOpts, name, noKeyFunc = true) {
		let options = t.objectExpression([]);
		let optionalOptions = [];
		this.classesToOptions(item, options);
		this.attributesToOptions(item, options);
		this.childrenToOptions(item, options, optionalOptions, noKeyFunc, []);
		let finalOpts = this.objOrAssign(options, optionalOptions);
		opts.properties.push(t.objectProperty(t.identifier(name), finalOpts));
	}

}
exports.default = ObjectPropertiesParser;