"use strict";

var path = require("path");

var db = {};

var Sequelize = require("sequelize"),
    DataTypes = Sequelize.DataTypes,
    env = process.env.NODE_ENV || "development",
    dbUrl = process.env.DATABASE_URL,
    cfgFile = path.join(__dirname, "..", "..", "config", "config.json"),
    cfg = require(cfgFile)[env],
    sequelize = dbUrl ? new Sequelize(dbUrl, cfg) : new Sequelize(cfg),
    glob = require("glob"),
    modelGlob = path.join(__dirname, "**/!(index).js"),
    files = glob.sync(modelGlob);

for (var i = 0; i < files.length; i++) {
	sequelize.import(files[i]);
}

db.sequelize = sequelize;
db.Sequelize = Sequelize;

for (var mdl in sequelize.models) {
	var model = sequelize.models[mdl];
	db[mdl] = model;
	if (model.associate) model.associate(sequelize);
}

module.exports = db;