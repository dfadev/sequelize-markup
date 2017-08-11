var path = require("path");

var db = SQLZINIT>
	// path to configuration file
	(config=path.join(__dirname, "..", "..", "config", "config.json"))
	// execution environment
	(environment=process.env.NODE_ENV || "development")
	// optional database URL
	(url=process.env.DATABASE_URL)
	// model files glob
	(models=path.join(__dirname, "**/!(index).js"))

SQLZINIT(db);

module.exports = db;
