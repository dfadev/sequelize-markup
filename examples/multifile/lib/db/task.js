"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

exports.default = function (sequelize, DataTypes) {
	const Task = sequelize.define("Task", {
		title: {
			type: DataTypes.STRING(255)
		}
	});
};