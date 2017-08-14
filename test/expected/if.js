const Table = sequelize.define('Table', {
	column1: {
		type: DataTypes.STRING
	}
});

Table.associate = sequelize => {
	if (yo) {
		Table.hasMany(sequelize.models.OtherThings, {});
		Table.hasOne(sequelize.models.Stuff, {});

		if (secondyo) {
			Table.Steps = Table.hasOne(sequelize.models.Step, {});
		}
	} else if (yoelse) {
		Table.hasMany(sequelize.models.Yo, {});
	} else {
		Table.hasOne(sequelize.models.Yos, {});
	}

	Table.Things = Table.hasMany(sequelize.models.Things, Object.assign({}, insideThings ? {
		as: 'conditionalAs'
	} : undefined));
	Table.hasMany(sequelize.models.OtherThings, Object.assign({
		attrib: '1234'
	}, insideOtherThings ? {
		as: 'conditionalAs'
	} : undefined));

	if (true) {
		Table.hasMany(sequelize.models.OtherThings, {});
	}
};
