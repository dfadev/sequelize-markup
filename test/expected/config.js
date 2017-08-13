var db = {};

var Sequelize = require("sequelize"),
    DataTypes = Sequelize.DataTypes,
    env = process.env.NODE_ENV || "development",
    cfg = {
		development: {
				dialect: "sqlite",
				storage: "./db.development.sqlite"
		},
		test: {
				dialect: "sqlite",
				storage: ":memory:",
				logging: false
		}
}[env],
    sequelize = new Sequelize(cfg);

db.sequelize = sequelize;
db.Sequelize = Sequelize;
