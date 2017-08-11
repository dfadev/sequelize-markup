var db = SQLZINIT>
	(config)
		(development(dialect="sqlite"))
			(storage="./db.development.sqlite")
	(environment="development")

SQLZ>
	(User)
			(name(type=DataTypes.STRING(60)))
			(...associations)
				(hasMany.Task)

	(Task)
			(title(type=DataTypes.STRING(255)))

SQLZINIT(db)


db.sequelize.sync({ force: true }).then(() => {
	db.User.findOrCreate({ 
		where: { name: 'testuser' }, 
		defaults: { other: 'ok' } } )
		.spread( (user, wasCreated) => {
			console.log(user.get( { plain: true } ));
		});
});
