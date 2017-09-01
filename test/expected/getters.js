const User = sequelize.define('User', {
  name: {
    type: DataTypes.STRING(60)
  }
}, {
  getterMethods: {
    getTwoName() {
      return this.getDataValue('name') + " " + this.getDataValue('name');
    }

  }
});
