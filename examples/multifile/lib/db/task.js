"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

exports.default = function (sequelize, DataTypes) {
	var Task = sequelize.define("Task", {
		title: {
			type: DataTypes.STRING(255)
		}
	});
};