"use strict"
var transformFileSync = require('babel-core').transformFileSync;
var path = require('path');
var fs = require('fs');
var assert = require('assert');

var plugin = require('../lib/sequelize-markup').default;

var tests = [
	{ file: 'associations' },
	{ file: 'callsqlzinit' },
	{ file: 'columns' },
	{ file: 'config' },
	{ file: 'getters' },
	{ file: 'hooks' },
	{ file: 'indexes' },
	{ file: 'name' },
	{ file: 'options' },
	{ file: 'scopes' },
	{ file: 'setters' },
	{ file: 'sqlz' },
	{ file: 'sqlzinit' },
	{ file: 'validate' },
	{ file: 'if' },
	{ file: 'queries' },
]

describe('transform code', function (){
	tests.forEach(function(test) {
		it('src/' + test.file + '.js', function (done) {
			var transformed = transformFileSync(path.join(__dirname, `src/${test.file}.js`), {
				plugins: [[plugin, test.options]],
				babelrc: false,
				comments: false,
			}).code;
			var expected = fs.readFileSync(path.join(__dirname, `expected/${test.file}.js`)).toString();
			if (expected[expected.length - 1] === '\n') expected = expected.slice(0, -1);
			assert.equal(transformed, expected);
			done();
		});
	});
});
