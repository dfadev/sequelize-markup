"use strict";

var db = {};

var Sequelize = require("sequelize"),
    DataTypes = Sequelize.DataTypes,
    env = "development",
    cfg = {
	development: {
		dialect: "sqlite",
		storage: "./db.development.sqlite"
	}
}[env],
    sequelize = new Sequelize(cfg);

db.sequelize = sequelize;
db.Sequelize = Sequelize;
var User = sequelize.define("User", {
	name: {
		type: DataTypes.STRING(60)
	}
});

User.associate = function (sequelize) {
	User.hasMany(sequelize.models.Task, {});
};

var Task = sequelize.define("Task", {
	title: {
		type: DataTypes.STRING(255)
	}
});

for (var mdl in sequelize.models) {
	var model = sequelize.models[mdl];
	db[mdl] = model;
	if (model.associate) model.associate(sequelize);
}

db.sequelize.sync({ force: true }).then(function () {
	db.User.findOrCreate({
		where: { name: 'testuser' },
		defaults: { other: 'ok' } }).spread(function (user, wasCreated) {
		console.log(user.get({ plain: true }));
	});
});