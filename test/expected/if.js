const Table = sequelize.define('Table', Object.assign({
	column1: {
		type: DataTypes.STRING
	},
	column3: {
		type: DataTypes.STRING
	}
}, false ? {
	column2: {
		type: DataTypes.STRING
	}
} : undefined, 100 == 100 ? {
	column4: Object.assign({
		type: DataTypes.STRING
	}, true ? {
		unique: true
	} : undefined)
} : undefined), Object.assign({}, true ? {
	someTableOption: Object.assign({
		key: val
	}, false ? {
		someOtherOption: true
	} : undefined)
} : undefined));

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
