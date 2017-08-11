'use strict';

var path = require('path');
var db = require(path.join(__dirname, 'db'));

db.sequelize.sync({ force: true }).then(function () {
	db.User.findOrCreate({
		where: { name: 'testuser' },
		defaults: { other: 'ok' } }).spread(function (user, wasCreated) {
		console.log(user.get({ plain: true }));
	});
});