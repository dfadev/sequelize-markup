SQLZ>
	(User)
		(name(type=DataTypes.STRING(60)))
		(...hooks)
			(beforeValidate=(instance, options) => { })
			(afterValidate=(instance, options) => { })

const User = sequelize.define("User", {
	name: {
		type: DataTypes.STRING(60)
	}
}, {
	hooks: {
		beforeValidate: (instance, options) => {},
		afterValidate: (instance, options) => {}
	}
});
