var db = SQLZINIT>
	// path to configuration file
	(config)
			(development)
					(dialect="sqlite")
					(storage="./db.development.sqlite")
			(test(dialect="sqlite", storage=":memory:"))
						(logging=false)
	// execution environment
	(environment=process.env.NODE_ENV || "development")
