"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.generateIfChain = generateIfChain;
exports.attributesToOptions = attributesToOptions;
exports.classesToOptions = classesToOptions;
exports.objOrAssign = objOrAssign;
exports.childrenToOptions = childrenToOptions;
exports.childrenToNamedOptions = childrenToNamedOptions;

var _babelTypes = require("babel-types");

var t = _interopRequireWildcard(_babelTypes);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function generateIfChain(conditions) {
	var shortHand = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

	// get the next condition
	var condition = conditions.shift();

	// check for no more conditions, or final else
	if (condition == null) return null;
	if (condition.cond == null) return condition.child;

	// recurse deeper to generate the next if
	var nextIf = generateIfChain(conditions, shortHand);
	if (nextIf == null) return shortHand ? t.conditionalExpression(condition.cond, condition.child, t.identifier("undefined")) : t.ifStatement(condition.cond, condition.child, null);else {
		return shortHand ? t.conditionalExpression(condition.cond, condition.child, nextIf) : t.ifStatement(condition.cond, condition.child, nextIf);
	}
}

function attributesToOptions(item, opts) {
	if (item.block.attributes != null) {
		var _iteratorNormalCompletion = true;
		var _didIteratorError = false;
		var _iteratorError = undefined;

		try {
			for (var _iterator = item.block.attributes.properties[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
				var prop = _step.value;

				opts.properties.push(prop);
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
	}
}

function classesToOptions(item, opts) {
	var _iteratorNormalCompletion2 = true;
	var _didIteratorError2 = false;
	var _iteratorError2 = undefined;

	try {
		for (var _iterator2 = item.block.selector.classes[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
			var cls = _step2.value;

			opts.properties.push(t.objectProperty(t.identifier(cls), t.identifier("true")));
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
}

function objOrAssign(objExpr, condObjs) {
	if (condObjs.length == 0) {
		return objExpr;
	} else {
		var rslt = t.callExpression(t.memberExpression(t.identifier("Object"), t.identifier("assign")), [objExpr].concat(_toConsumableArray(condObjs)));
		return rslt;
	}
}

function childrenToOptions(item, opts, optionalOpts) {
	var noKeyFunc = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : true;
	var ignore = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : [];
	var topPath = arguments[5];

	for (var i = 0; i < item.children.length; i++) {
		var child = item.children[i];

		if (child.block.type == 'AssignmentExpression') {

			if (noKeyFunc && child.block.path.right.type == 'ArrowFunctionExpression') {
				opts.properties.push(t.functionDeclaration(t.identifier(child.block.selector.tag), child.block.path.right.params, child.block.path.right.body));
			} else {
				opts.properties.push(t.objectProperty(child.block.path.left, child.block.path.right));
			}
		} else if (child.block.type == 'ElementBlock' || child.block.type == 'CustomElement') {

			childrenToNamedOptions(child, opts, optionalOpts, child.block.selector.tag, noKeyFunc, topPath);
		} else if (child.block.type == 'If') {
			var conditions = [];
			var condObj = t.objectExpression([]);
			var condOptionalObj = [];

			childrenToOptions(child, condObj, condOptionalObj, noKeyFunc, ignore, topPath);

			var condChild = objOrAssign(condObj, condOptionalObj);

			conditions.push({ cond: child.block.condition, child: condChild });

			if (item.children.length > i + 1) {
				for (var y = i + 1; y < item.children.length; y++) {
					var next = item.children[y];
					if (next.block.type == "Else") {
						if (next.indent == child.indent) {
							var elseCondObj = t.objectExpression([]);
							var elseCondOptionalObj = [];
							childrenToOptions(next, elseCondObj, elseCondOptionalObj, noKeyFunc, ignore, topPath);
							var _condChild = objOrAssign(elseCondObj, elseCondOptionalObj);

							conditions.push({ cond: null, child: _condChild });
							break;
						}
					} else if (next.block.type == "ElseIf") {
						if (next.indent == child.indent) {
							var elseIfCondObj = t.objectExpression([]);
							var elseIfCondOptionalObj = [];
							childrenToOptions(next, elseIfCondObj, elseIfCondOptionalObj, noKeyFunc, ignore, topPath);
							var _condChild2 = objOrAssign(elseIfCondObj, elseIfCondOptionalObj);

							conditions.push({ cond: next.block.condition, child: _condChild2 });
						} else break;
					} else if (next.indent == child.indent) break;
				}
			}

			var rslt = generateIfChain(conditions);
			optionalOpts.push(rslt);
		} else if (child.block.type == 'ElseIf' || child.block.type == 'Else') {} else if (ignore.includes(child.block.type)) {} else throw topPath.hub.file.buildCodeFrameError(child.block.path, "childToOption: bad child " + child.block.type);
	}
}

function childrenToNamedOptions(item, opts, optionalOpts, name) {
	var noKeyFunc = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : true;
	var topPath = arguments[5];

	var options = t.objectExpression([]);
	classesToOptions(item, options);
	attributesToOptions(item, options);
	childrenToOptions(item, options, optionalOpts, noKeyFunc, [], topPath);
	opts.properties.push(t.objectProperty(t.identifier(name), options));
}