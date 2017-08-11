const Project = sequelize.define('project', {
	firstName: {
		type: DataTypes.INTEGER(2).UNSIGNED.ZEROFILL
	},
	lastName: {
		unique: true,
		type: DataTypes.STRING(1234),
		field: 'last_name'
	}
}, {
	timestamps: true,
	paranoid: true,
	createdAt: false
});
