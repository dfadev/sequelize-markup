"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _babelTypes = require("babel-types");

var t = _interopRequireWildcard(_babelTypes);

var _babelGenerator = require("babel-generator");

var _babelGenerator2 = _interopRequireDefault(_babelGenerator);

var _IndentParser = require("./IndentParser");

var _IndentParser2 = _interopRequireDefault(_IndentParser);

var _ObjectPropertiesParser = require("./ObjectPropertiesParser");

var _ObjectPropertiesParser2 = _interopRequireDefault(_ObjectPropertiesParser);

var _babelTemplate = require("babel-template");

var _babelTemplate2 = _interopRequireDefault(_babelTemplate);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

class SequelizeParser {

	constructor(path) {
		this.file = path.hub.file;
		this.indentParser = new _IndentParser2.default(this.file);
		this.objPropParser = new _ObjectPropertiesParser2.default(this.file);
		this.path = path;
		this.indexTemplate = (0, _babelTemplate2.default)(`
(function () {
	var data = INDEX;
	return Object.keys(data).map((key) => { data[key]['name'] = key; return data[key]; });
})()
`);
	}

	parse() {
		let calls = this.indentParser.parseCalls(this.path.node.right),
		    orderedBlocks = this.indentParser.orderBlocks(calls),
		    declarations = [];

		for (let tbl of orderedBlocks) {
			if (!['ElementBlock', 'CustomElement'].includes(tbl.block.type)) {
				throw this.file.buildCodeFrameError(tbl.block.path, "invalid table block type " + tbl.block.type);
			}

			let varName = tbl.block.selector.tag,
			    tableName = t.stringLiteral(varName),
			    tableOptions = t.objectExpression([]),
			    optionalTableOptions = [],
			    columns = t.objectExpression([]),
			    optionalColumns = [],
			    associations = [],
			    optionalAssociations = [],
			    queries = [];

			// table options
			this.objPropParser.classesToOptions(tbl, tableOptions);
			this.objPropParser.attributesToOptions(tbl, tableOptions);

			// columns
			this.objPropParser.childrenToOptions(tbl, columns, optionalColumns, true, ['SpreadElement']);

			// (...items)
			for (let child of tbl.children) {
				if (child.block.type == "ElementBlock" || child.block.type == "CustomElement") {} else if (child.block.type == "If") {} else if (child.block.type == "ElseIf" || child.block.type == "Else") {} else if (child.block.type == "SpreadElement") {

					let argName = child.block.path.argument.name;

					switch (argName) {
						case "options":
							this.objPropParser.childrenToOptions(child, tableOptions, optionalTableOptions, true, []);
							break;

						case "columns":
							this.objPropParser.childrenToOptions(child, columns, optionalColumns, true, []);
							break;

						case "indexes":
							let indexOptions = t.objectExpression([]);
							let optionalIndexOptions = [];

							this.objPropParser.childrenToNamedOptions(child, indexOptions, optionalIndexOptions, argName, false);

							var rslt = this.indexTemplate({ INDEX: indexOptions.properties[0].value });
							indexOptions.properties[0].value = rslt.expression;
							tableOptions.properties.push(indexOptions.properties[0]);
							break;

						case "getters":
							this.objPropParser.childrenToNamedOptions(child, tableOptions, optionalTableOptions, "getterMethods", true);
							break;

						case "setters":
							this.objPropParser.childrenToNamedOptions(child, tableOptions, optionalTableOptions, "setterMethods", true);
							break;

						case "name":
						case "validate":
						case "scopes":
							this.objPropParser.childrenToNamedOptions(child, tableOptions, optionalTableOptions, argName, true);
							break;

						case "associations":
							this.parseAssociations(varName, child, associations);
							break;

						case "hooks":
							this.objPropParser.childrenToNamedOptions(child, tableOptions, optionalTableOptions, argName, false);
							break;

						case "queries":
							this.parseQueries(varName, child, queries);
							break;

						default:
							throw this.file.buildCodeFrameError(child.block.path, "unrecognized table category: " + argName);
							break;

					}
				} else {
					throw this.file.buildCodeFrameError(child.block.path, "invalid table child element type " + child.block.type);
				}
			}

			columns = this.objPropParser.objOrAssign(columns, optionalColumns);
			let tableOpts = this.objPropParser.objOrAssign(tableOptions, optionalTableOptions);

			let callee = t.memberExpression(t.identifier('sequelize'), t.identifier('define')),
			    params = tableOpts.type == "CallExpression" || tableOpts.properties.length > 0 ? [tableName, columns, tableOpts] : [tableName, columns],
			    callExpr = t.callExpression(callee, params),
			    tableDecl = t.variableDeclaration("const", [t.variableDeclarator(t.identifier(varName), callExpr)]);

			declarations.push(tableDecl);

			if (associations.length > 0 || queries.length > 0) {
				let assocFunc = t.expressionStatement(t.assignmentExpression("=", t.memberExpression(t.identifier(varName), t.identifier('associate')), t.arrowFunctionExpression([t.identifier('sequelize')], t.blockStatement(associations.concat(queries)))));
				declarations.push(assocFunc);
			}
		}

		this.path.replaceWithMultiple(declarations);
	}

	// try to support:
	//
	// calls with opts only:
	//
	// count(opts)
	// destroy(opts)
	// drop(opts)
	// findAll(opts)
	// findAndCount(opts)
	// findCreateFind(opts)
	// findOne(opts)
	// findOrBuild(opts) / findOrInitialize(opts)
	// findOrCreate(opts)
	// restore(opts)
	// sync(opts)
	// truncate(opts)
	//
	// calls with obj, opts:
	//
	// create(vals, opts)
	// update(vals, opts)
	// upsert(vals, opts)
	//
	// calls with field(s), opts:
	//
	// increment(fields, opts)
	// max(field, opts)
	// min(field, opts)
	// sum(field, opts)
	//
	// others:
	//
	// aggregate(field, func, opts)
	// describe(schema, opts)
	// findById(id, opts)
	//
	// raw
	//
	// options structure:
	//
	// options.
	// 	where
	// 	attributes
	// 		include
	// 		exclude
	// 	paranoid
	// 	include[]
	// 		model
	// 		as
	// 		association
	// 		where
	// 		or
	// 		on
	// 		attributes[]
	//		required
	//		separate
	//		limit
	//		through
	//			where
	//			attributes
	//		include[]
	//	order
	//	limit
	//	offset
	//	transaction
	//	lock
	//	raw
	//	logging
	//	benchmark
	//	having
	//	searchPath
	//	rejectOnEmpty
	//
	parseQuery(varName, query) {
		if (query.children.length != 1) throw this.file.buildCodeFrameError(query.block.path, "query can have only one query method");

		let queryMethodNode = query.children[0];
		if (queryMethodNode.block.type != "ElementBlock") throw this.file.buildCodeFrameError(queryMethodNode.block.path, "invalid query method type " + queryMethodNode.block.type);

		let methodName = query.block.selector.tag,
		    methodParameters = query.block.parameters,
		    queryMethodName = queryMethodNode.block.selector.tag,
		    opts = t.objectExpression([]),
		    optional = [];

		this.objPropParser.childrenToOptions(queryMethodNode, opts, optional, false, []);
		let queryOpts = this.objPropParser.objOrAssign(opts, optional);

		let ret = t.returnStatement(t.callExpression(t.memberExpression(t.identifier(varName), t.identifier(queryMethodName)), [queryOpts]));

		let func = t.expressionStatement(t.assignmentExpression("=", t.memberExpression(t.identifier(varName), t.identifier(methodName)), t.arrowFunctionExpression(methodParameters, t.blockStatement([ret]))));

		return func;
	}

	parseQueries(varName, child, queries) {
		for (let i = 0; i < child.children.length; i++) {
			let query = child.children[i];
			let conditions = [];

			if (query.block.type == "ElementBlock") {
				queries.push(this.parseQuery(varName, query));
			} else if (query.block.type == "If") {
				let ifQueries = [];
				this.parseQueries(varName, query, ifQueries);
				conditions.push({ cond: query.block.condition, child: t.blockStatement(ifQueries) });

				if (child.children.length > i + 1) {

					for (let y = i + 1; y < child.children.length; y++) {
						let next = child.children[y];
						if (next.block.type == "Else") {
							if (next.indent == query.indent) {
								let elseQueries = [];
								this.parseQueries(varName, next, elseQueries);
								conditions.push({ cond: null, child: t.blockStatement(elseQueries) });
								break;
							}
						} else if (next.block.type == "ElseIf") {

							if (next.indent == query.indent) {
								let elseIfQueries = [];
								this.parseQueries(varName, next, elseIfQueries);
								conditions.push({ cond: next.block.condition, child: t.blockStatement(elseIfQueries) });
							} else break;
						} else if (next.indent == query.indent) break;
					}
				}
			} else if (query.block.type == "ElseIf" || query.block.type == "Else") {} else {
				throw this.file.buildCodeFrameError(query.block.path, "invalid query element type " + query.block.type);
			}

			if (conditions.length > 0) queries.push(this.objPropParser.generateIfChain(conditions, false));
		}
	}

	parseAssociation(varName, assoc) {
		let type = t.identifier(assoc.block.selector.tag),
		    target = t.memberExpression(t.memberExpression(t.identifier("sequelize"), t.identifier('models')), t.identifier(assoc.block.selector.classes[0])),
		    options = t.objectExpression([]),
		    optionalOptions = [];

		this.objPropParser.attributesToOptions(assoc, options);
		this.objPropParser.childrenToOptions(assoc, options, optionalOptions, false, []);
		let assocOpts = this.objPropParser.objOrAssign(options, optionalOptions);

		let rslt = t.callExpression(t.memberExpression(t.identifier(varName), type), [target, assocOpts]);
		return rslt;
	}

	parseAssociations(varName, child, associations) {

		for (let i = 0; i < child.children.length; i++) {
			let assoc = child.children[i];
			let conditions = [];

			if (assoc.block.type == "ElementBlock") {

				associations.push(t.expressionStatement(this.parseAssociation(varName, assoc)));
			} else if (assoc.block.type == "AssignmentExpression") {
				let assocElement = this.indentParser.orderBlocks([this.indentParser.chainElement(assoc.block.path.right)])[0];
				assocElement.children = assoc.children;

				associations.push(t.expressionStatement(t.assignmentExpression("=", t.memberExpression(t.identifier(varName), t.identifier(assoc.block.selector.tag)), this.parseAssociation(varName, assocElement))));
			} else if (assoc.block.type == "If") {
				let ifAssociations = [];
				this.parseAssociations(varName, assoc, ifAssociations);
				conditions.push({ cond: assoc.block.condition, child: t.blockStatement(ifAssociations) });

				if (child.children.length > i + 1) {

					for (let y = i + 1; y < child.children.length; y++) {
						let next = child.children[y];
						if (next.block.type == "Else") {
							if (next.indent == assoc.indent) {
								let elseAssociations = [];
								this.parseAssociations(varName, next, elseAssociations);
								conditions.push({ cond: null, child: t.blockStatement(elseAssociations) });
								break;
							}
						} else if (next.block.type == "ElseIf") {

							if (next.indent == assoc.indent) {
								let elseIfAssociations = [];
								this.parseAssociations(varName, next, elseIfAssociations);
								conditions.push({ cond: next.block.condition, child: t.blockStatement(elseIfAssociations) });
							} else break;
						} else if (next.indent == assoc.indent) break;
					}
				}
			} else if (assoc.block.type == "ElseIf" || assoc.block.type == "Else") {} else {

				throw this.file.buildCodeFrameError(assoc.block.path, "invalid association element type " + assoc.block.type);
			}

			if (conditions.length > 0) associations.push(this.objPropParser.generateIfChain(conditions, false));
		}
	}

}
exports.default = SequelizeParser;