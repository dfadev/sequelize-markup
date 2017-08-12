const Table1 = sequelize.define('Table1', {
  Column1: {
    type: DataTypes.STRING
  },
  Column2: {
    type: DataTypes.STRING
  },
  AnotherColumn1: {
    type: DataTypes.STRING
  }
}, {
  name: {
    singular: 'tableone',
    plural: 'tableones'
  }
});
const Table2 = sequelize.define('Table2', {
  test: {
    type: DataTypes.STRING
  }
});