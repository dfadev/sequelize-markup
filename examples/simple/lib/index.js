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
const User = sequelize.define("User", {
	name: {
		type: DataTypes.STRING(60)
	}
});

User.associate = sequelize => {
	User.Tasks = User.hasMany(sequelize.models.Task, {});
};

const Task = sequelize.define("Task", {
	title: {
		type: DataTypes.STRING(255)
	}
});

for (let mdl in sequelize.models) {
	let model = sequelize.models[mdl];
	db[mdl] = model;
	if (model.associate) model.associate(sequelize);
}

db.sequelize.sync({ force: true }).then(() => {
	db.User.findOrCreate({
		where: { name: 'testuser' },
		defaults: { other: 'ok' } }).spread((user, wasCreated) => {
		console.log(user.get({ plain: true }));
	});
});