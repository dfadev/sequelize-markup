import * as t from "babel-types";

export function generateIfChain(conditions, shortHand = true) {
	// get the next condition
	var condition = conditions.shift();

	// check for no more conditions, or final else
	if (condition == null) return null;
	if (condition.cond == null) return condition.child;

	// recurse deeper to generate the next if
	var nextIf = generateIfChain(conditions, shortHand);
	if (nextIf == null) 
		return shortHand ?
			t.conditionalExpression(
				condition.cond, 
				condition.child, 
				t.identifier("undefined"))
			:
			t.ifStatement(
				condition.cond,
				condition.child,
				null);
	else {
		return shortHand ?
			t.conditionalExpression(
				condition.cond, 
				condition.child, 
				nextIf) :
			t.ifStatement(
				condition.cond,
				condition.child,
				nextIf);
	}
}

export function attributesToOptions(item, opts) {
	if (item.block.attributes != null)
		for (let prop of item.block.attributes.properties)
			opts.properties.push(prop);
}

export function classesToOptions(item, opts) {
	for (let cls of item.block.selector.classes)
		opts.properties.push(t.objectProperty(t.identifier(cls), t.identifier("true")));
}

export function objOrAssign(objExpr, condObjs) {
	if (condObjs.length == 0) {
		return objExpr;
	} else {
		let rslt =
				t.callExpression(
					t.memberExpression(
						t.identifier("Object"),
						t.identifier("assign")
					),
					[ objExpr, ...condObjs ]);
		return rslt;
	}
}

export function childrenToOptions(item, opts, optionalOpts, noKeyFunc = true, ignore = [], topPath) {
	for (let i = 0; i < item.children.length; i++) {
		let child = item.children[i];

		if (child.block.type == 'AssignmentExpression') {

			if (noKeyFunc && child.block.path.right.type == 'ArrowFunctionExpression') {
					opts.properties.push(t.functionDeclaration(t.identifier(child.block.selector.tag), child.block.path.right.params, child.block.path.right.body));
			} else {
				opts.properties.push(t.objectProperty(child.block.path.left, child.block.path.right));
			}

		} else if (child.block.type == 'ElementBlock' || child.block.type == 'CustomElement') {

			childrenToNamedOptions(child, opts, optionalOpts, child.block.selector.tag, noKeyFunc, topPath);

		} else if (child.block.type == 'If') {
			let conditions = [];
			let condObj = t.objectExpression([]);
			let condOptionalObj = [];

			childrenToOptions(child, condObj, condOptionalObj, noKeyFunc, ignore, topPath);

			let condChild = objOrAssign(condObj, condOptionalObj);

			conditions.push({ cond: child.block.condition, child: condChild });

			if (item.children.length > i+1) {
				for (let y = i+1; y < item.children.length; y++) {
					let next = item.children[y];
					if (next.block.type == "Else") {
						if (next.indent == child.indent) {
							let elseCondObj = t.objectExpression([]);
							let elseCondOptionalObj = [];
							childrenToOptions(next, elseCondObj, elseCondOptionalObj, noKeyFunc, ignore, topPath);
							let condChild = objOrAssign(elseCondObj, elseCondOptionalObj);

							conditions.push({ cond: null, child: condChild });
							break;
						}
					} else if (next.block.type == "ElseIf") {
						if (next.indent == child.indent) {
							let elseIfCondObj = t.objectExpression([]);
							let elseIfCondOptionalObj = [];
							childrenToOptions(next, elseIfCondObj, elseIfCondOptionalObj, noKeyFunc, ignore, topPath);
							let condChild = objOrAssign(elseIfCondObj, elseIfCondOptionalObj);

							conditions.push({ cond: next.block.condition, child: condChild });
						}
						else
							break;
					} else if (next.indent == child.indent) break;
				}
			}

			let rslt = generateIfChain(conditions);
			optionalOpts.push(rslt);

		} else if (child.block.type == 'ElseIf' || child.block.type == 'Else') {
		} else if (ignore.includes(child.block.type)) {
		} else 
		throw topPath.hub.file.buildCodeFrameError(child.block.path, "childToOption: bad child " + child.block.type);
	}
}

export function childrenToNamedOptions(item, opts, optionalOpts, name, noKeyFunc = true, topPath) {
	let options = t.objectExpression([]);
	classesToOptions(item, options);
	attributesToOptions(item, options);
	childrenToOptions(item, options, optionalOpts, noKeyFunc, [], topPath);
	opts.properties.push(t.objectProperty(t.identifier(name), options));
}

