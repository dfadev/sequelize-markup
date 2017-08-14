import template from "babel-template";
import * as t from "babel-types";
import generate from "babel-generator";
import * as babylon from "babylon";
import traverse from "babel-traverse";

var SQLZ = "SQLZ";
var SQLZINIT = "SQLZINIT";
var curFile;

export default function({ types: t }) {
	return {
		visitor: {
			BinaryExpression(path) {
				curFile = path.hub.file;

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
				curFile = path.hub.file;
				if (t.isIdentifier(path.node.callee) && path.node.callee.name == SQLZINIT)
					parseCallSQLZINIT(path);
			}
		}
	};
};

function parseCallSQLZINIT(path) {
	var varname = path.node.arguments[0].name;
	path.parentPath.replaceWith(
		//for (var mdl in sequelize.models) {
		t.forInStatement(
			t.variableDeclaration("let", [ 
				t.variableDeclarator(t.identifier("mdl")) 
			]), 
			t.memberExpression(t.identifier("sequelize"), t.identifier("models")),
			t.blockStatement( [
				//var model = sequelize.models[mdl];
				t.variableDeclaration("let", [
					t.variableDeclarator(
						t.identifier("model"),
						t.memberExpression(
							t.memberExpression(
								t.identifier("sequelize"),
								t.identifier("models")),
							t.identifier("mdl"),
							true))
				]),
				//db[mdl] = model;
				t.expressionStatement(
					t.assignmentExpression(
						"=",
						t.memberExpression(
							t.identifier(varname),
							t.identifier("mdl"),
							true),
						t.identifier("model"))),
				//if (model.associate) model.associate(sequelize);
				t.ifStatement(
					t.memberExpression(
						t.identifier("model"),
						t.identifier("associate")),
					t.expressionStatement(
						t.callExpression(
							t.memberExpression(
								t.identifier("model"),
								t.identifier("associate")),
							[
								t.identifier("sequelize")
							]))
				)])));
}

function parseSQLZINIT(path) {
	let calls = parseCalls(path.node.right),
		orderedBlocks = orderBlocks(calls),
		declarations = [];

	let config, configObj, environment, uri, models;

	for (let tbl of orderedBlocks) {

		if (tbl.block.type == "AssignmentExpression") {

			switch (tbl.block.selector.tag) {
				case "config":
					config = tbl.block.path.right;
					break;
				case "environment":
					environment = tbl.block.path.right;
					break;
				case "uri":
				case "url":
					uri = tbl.block.path.right;
					break;
				case "models":
					models = tbl.block.path.right;
					break;
			}

		} else if (tbl.block.type == "ElementBlock" && tbl.block.selector.tag == "config") {
			configObj = t.objectExpression([]);
			childrenToOptions(tbl, configObj, false);
		} else throw path.buildCodeFrameError("invalid init block type " + tbl.block.type);
	}

	var kind = path.parentPath.parent.kind;
	var varname = path.parent.id.name;

	// var db = { };
	declarations.push(t.variableDeclaration(kind, [ t.variableDeclarator(t.identifier(varname), t.objectExpression([])) ] ));

	if (!environment) throw curFile.buildCodeFrameError(path, "no environment specified");

	var vars = [ 
		//var Sequelize = require("sequelize");
		t.variableDeclarator(t.identifier("Sequelize"), t.callExpression(t.identifier("require"), [ t.stringLiteral("sequelize") ])),

		// var DataTypes = Sequelize.DataTypes;
		t.variableDeclarator(t.identifier("DataTypes"), t.memberExpression(t.identifier("Sequelize"), t.identifier("DataTypes"))),

		//var env = process.env.NODE_ENV || "development";
		t.variableDeclarator(t.identifier("env"), environment),

	];

	if (uri) {
		vars.push(
			//var dbUrl = process.env.DATABASE_URL;
			t.variableDeclarator(t.identifier("dbUrl"), uri),
		);
	}

	if (config) {
			vars = vars.concat([
				//var cfgFile = path.join(__dirname, '..', '..', 'config', 'config.json');
				t.variableDeclarator(t.identifier("cfgFile"), config),

				//var cfg = require(cfgFile)[env];
				t.variableDeclarator(t.identifier("cfg"), 
					t.memberExpression(
						t.callExpression(
							t.identifier("require"), [ t.identifier("cfgFile") ]), t.identifier("env"), true)),
			]);
	} else if (configObj) {
		vars.push( t.variableDeclarator(t.identifier("cfg"), t.memberExpression(configObj, t.identifier("env"), true)) );
	} else
		throw curFile.buildCodeFrameError(path, "no config specified");

	if (uri) {
		vars.push(
			//var sequelize = dbUrl ? new Sequelize(dbUrl, cfg) : new Sequelize(cfg);
			t.variableDeclarator(
				t.identifier("sequelize"), 
				t.conditionalExpression(
					t.identifier("dbUrl"), 
					t.newExpression(
						t.identifier("Sequelize"), [ t.identifier("dbUrl"), t.identifier("cfg") ]), 
					t.newExpression(t.identifier("Sequelize"), [ t.identifier("cfg") ]))),
		);
	} else {
		vars.push(
			// var sequelize = new Sequelize(cfg)
			t.variableDeclarator(
				t.identifier("sequelize"),
				t.newExpression(t.identifier("Sequelize"), [ t.identifier("cfg") ])));
	}

	if (models) {
		vars = vars.concat([
			//var glob = require("glob");
			t.variableDeclarator(t.identifier("glob"), t.callExpression(t.identifier("require"), [ t.stringLiteral("glob") ])),

			//var modelGlob = path.join(__dirname, "/**/!(index).js");
			t.variableDeclarator(t.identifier("modelGlob"), models),

			//var files = glob.sync(modelGlob);
			t.variableDeclarator(t.identifier("files"), 
				t.callExpression(
					t.memberExpression(
						t.identifier("glob"), t.identifier("sync")), [ t.identifier("modelGlob") ])),

		]);
	}

	declarations.push(t.variableDeclaration("var", vars));

	if (models) {
		declarations.push(
			//for (var i = 0; i < files.length; i++) {
			t.forStatement(
				t.variableDeclaration("let", [
					t.variableDeclarator(
						t.identifier("i"),
						t.numericLiteral(0)
					)
				]),
				t.binaryExpression("<",
					t.identifier("i"),
					t.memberExpression(
						t.identifier("files"),
						t.identifier("length")
					)),
				t.updateExpression("++", t.identifier("i")),
				//sequelize.import(files[i]);
				t.expressionStatement(
					t.callExpression(
						t.memberExpression(
							t.identifier("sequelize"),
							t.identifier("import")
						),
						[
							t.memberExpression(
								t.identifier("files"),
								t.identifier("i"),
								true)
						]
					)
				)
			));
	}

	//db.sequelize = sequelize;
	declarations.push(t.expressionStatement(t.assignmentExpression("=", t.memberExpression(t.identifier(varname), t.identifier("sequelize")), t.identifier("sequelize"))));

	//db.Sequelize = Sequelize;
	declarations.push(t.expressionStatement(t.assignmentExpression("=", t.memberExpression(t.identifier(varname), t.identifier("Sequelize")), t.identifier("Sequelize"))));

	path.parentPath.parentPath.replaceWithMultiple(declarations);
}

function parseSQLZ(path) {
	let calls = parseCalls(path.node.right),
		orderedBlocks = orderBlocks(calls),
		declarations = [];

	for (let tbl of orderedBlocks) {
		if (!['ElementBlock', 'CustomElement'].includes(tbl.block.type)) 
			throw curFile.buildCodeFrameError(tbl.block.path, "invalid table block type " + tbl.block.type);

		let varName = tbl.block.selector.tag,
			tableName = t.stringLiteral(varName),
			tableOptions = t.objectExpression([]),
			columns = t.objectExpression([]),
			associations = [];

		classesToOptions(tbl, tableOptions);
		attributesToOptions(tbl, tableOptions);

		// (...items)
		for (let child of tbl.children) {
			if (child.block.type != "SpreadElement") {
				childrenToNamedOptions(child, columns, child.block.selector.tag, true);
				continue;
			}

			let argName = child.block.path.argument.name;

			switch (argName) {
				case "options":
					childrenToOptions(child, tableOptions, true);
					break;

				case "columns":
					childrenToOptions(child, columns, true);
					break;

				case "name":
				case "getters":
				case "setters":
				case "validate":
				case "indexes":
				case "scopes":
					childrenToNamedOptions(child, tableOptions, argName, true);
					break;

				case "associations":
					for (let assoc of child.children) {
						let type = t.identifier(assoc.block.selector.tag),
							target = t.memberExpression(t.memberExpression(t.identifier("sequelize"), t.identifier('models')), t.identifier(assoc.block.selector.classes[0])),
							options = t.objectExpression([]);

						attributesToOptions(assoc, options);
						childrenToOptions(assoc, options);

						associations.push(t.expressionStatement(t.callExpression(t.memberExpression(t.identifier(varName), type), [ target, options ]))); 
					}
					break;

				case "hooks":
					childrenToNamedOptions(child, tableOptions, argName, false);
					break;

					default:
						throw curFile.buildCodeFrameError(child.block.path, "unrecognized table category: " + argName);
						break;

				}
			} else {
				throw curFile.buildCodeFrameError(child.block.path, "invalid table child element type " + child.block.type);
			}

		}

		let callee = t.memberExpression(t.identifier('sequelize'), t.identifier('define')),
			params = tableOptions.properties.length > 0 ? [ tableName, columns, tableOptions ] : [ tableName, columns ],
			callExpr = t.callExpression(callee, params),
			tableDecl = t.variableDeclaration("const", [ t.variableDeclarator(t.identifier(varName), callExpr) ]); 

		declarations.push(tableDecl);

		if (associations.length > 0) {
			let assocFunc = t.expressionStatement(t.assignmentExpression("=", t.memberExpression(t.identifier(varName), t.identifier('associate')), t.arrowFunctionExpression([ t.identifier('sequelize') ], t.blockStatement(associations))));
			declarations.push(assocFunc);
		}

	}

	path.replaceWithMultiple(declarations);
}

function attributesToOptions(item, opts) {
	if (item.block.attributes != null)
		for (let prop of item.block.attributes.properties)
			opts.properties.push(prop);
}

function classesToOptions(item, opts) {
	for (let cls of item.block.selector.classes)
		opts.properties.push(t.objectProperty(t.identifier(cls), t.identifier("true")));
}

function childrenToOptions(item, opts, noKeyFunc = true) {
	for (let child of item.children)
		childToOption(child, opts, noKeyFunc);
}

function childrenToNamedOptions(item, opts, name, noKeyFunc = true) {
	let options = t.objectExpression([]);
	classesToOptions(item, options);
	attributesToOptions(item, options);
	childrenToOptions(item, options, noKeyFunc);
	opts.properties.push(t.objectProperty(t.identifier(name), options));
}

function childToOption(child, opts, noKeyFunc = true) {
	if (child.block.type == 'AssignmentExpression') {
		if (noKeyFunc && child.block.path.right.type == 'ArrowFunctionExpression') {
				opts.properties.push(t.functionDeclaration(t.identifier(child.block.selector.tag), child.block.path.right.params, child.block.path.right.body));
		} else {
			opts.properties.push(t.objectProperty(child.block.path.left, child.block.path.right));
		}
	} else if (child.block.type == 'ElementBlock' || child.block.type == 'CustomElement') {
		childrenToNamedOptions(child, opts, child.block.selector.tag, noKeyFunc);
		throw curFile.buildCodeFrameError(child.block.path, "childToOption: bad child " + child.block.type);
}

function parseCalls(path) {
	switch(path.type) {
		case "CallExpression":
			if ( (path.callee.extra && path.callee.extra.parenthesized) ||
				 (path.callee.type == "CallExpression") ) {
				let b1 = parseCalls(path.callee);
				let b2 = chainElement(path.arguments[0]);
				return [b2].concat(b1);
			} else {
				let b = chainElement(path);
				return [b];
			}
			break;

		case "MemberExpression":
			if (path.object.extra && path.object.extra.parenthesized && path.property.type != "SequenceExpression") {
				let b1 = parseCalls(path.object);
				let b2 = chainElement(path.property);
				return [b2].concat(b1);
			} else {
				let b = chainElement(path);
				return [b];
			}
			break;

		case "AssignmentExpression":
		case "Identifier":
			let b = chainElement(path);
			return [b];
			break;

		default:
			throw curFile.buildCodeFrameError(path, 'parseCalls unknown node type: ' + path.type);

	}
}

function chainElement(path) {
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
			element.selector.tag = path.name;
			if (path.name[0] === path.name[0].toUpperCase()) {
				element.type = 'CustomElement';
				element.arguments = [];
			} else {
				element.type = 'ElementBlock';
			}
			break;
		
		case "MemberExpression":
			parseEndBlock(path, element);
			break;

		case "CallExpression":
			element = chainElement(path.callee);
			let attr = t.objectExpression([]);

			for (let entry of path.arguments) {
				if (entry.type == "AssignmentExpression") {
					attr.properties.push(t.objectProperty(entry.left, entry.right));
				} else throw "bad attribute " + entry;
			}
			element.attributes = attr;
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
	if (element.selector.tag[0] === element.selector.tag[0].toUpperCase()) element.type = "CustomElement";
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
