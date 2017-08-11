const Table1 = sequelize.define("table1", {
	column1: {
		type: DataTypes.INTEGER
	}
});
const Table2 = sequelize.define("table2", {
	column1: {
		type: DataTypes.INTEGER
	},
	column2: {
		type: DataTypes.STRING
	}
});
const Table3 = sequelize.define("table3", {
	column1: {
		type: DataTypes.INTEGER
	},
	column2: {
		type: DataTypes.STRING
	},
	column3: {
		type: DataTypes.BOOLEAN
	}
});
const Table4 = sequelize.define("table4", {
	column1: {
		type: DataTypes.INTEGER
	},
	column2: {
		type: DataTypes.STRING
	},
	column3: {
		type: DataTypes.BOOLEAN
	},
	column4: {
		type: DataTypes.DATE
	}
});
