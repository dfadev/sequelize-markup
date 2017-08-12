const User = sequelize.define('User', {
  name: {
    type: DataTypes.STRING(60)
  }
}, {
  getters: {
    function getTwoName() {
      return this.getDataValue('name') + " " + this.getDataValue('name');
    }

  }
});