const User = sequelize.define('User', {
  name: {
    type: DataTypes.STRING(60)
  }
}, {
  setterMethods: {
    setFunName(val) {
      this.setDataValue('name', 'Fun' + val);
    }

  }
});
