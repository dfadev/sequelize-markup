const User = sequelize.define('User', {
  name: {
    type: DataTypes.STRING
  }
}, {
  name: {
    singular: 'loginuser',
    plural: 'loginusers'
  }
});