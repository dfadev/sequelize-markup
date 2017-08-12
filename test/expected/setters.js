const User = sequelize.define('User', {
  name: {
    type: DataTypes.STRING(60)
  }
}, {
  setters: {
    function setFunName(val) {
      this.setDataValue('name', 'Fun' + val);
    }

  }
});