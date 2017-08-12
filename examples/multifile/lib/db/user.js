"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

exports.default = function (sequelize, DataTypes) {
	var User = sequelize.define("User", {
		name: {
			type: DataTypes.STRING(60)
		}
	});

	User.associate = function (sequelize) {
		User.hasMany(sequelize.models.Task, {});
	};
};