const User = sequelize.define("user", {
	firstName: {
		type: DataTypes.STRING
	},
	lastName: {
		type: DataTypes.STRING(1234)
	}
});
