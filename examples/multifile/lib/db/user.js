"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

exports.default = function (sequelize, DataTypes) {
	const User = sequelize.define("User", {
		name: {
			type: DataTypes.STRING(60)
		}
	});

	User.associate = sequelize => {
		User.Tasks = User.hasMany(sequelize.models.Task, {});
	};
};