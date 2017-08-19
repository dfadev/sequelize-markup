const User = sequelize.define('User', {
	name: {
		type: DataTypes.STRING(50)
	}
});

User.associate = sequelize => {
	User.getAllNames = () => {
		return User.findAll({
			attributes: ['name']
		});
	};

	User.getNames = nm => {
		return User.findAll({
			where: Object.assign({
				name: 'ok'
			}, true ? {
				name: {
					$ne: nm
				}
			} : {
				$and: {
					a: b,
					$or: {
						c: d
					},
					e: f
				}
			})
		});
	};
};
