const User = sequelize.define('User', {
  name: {
    type: DataTypes.STRING(60)
  },
  status: {
    type: DataType.STRING(60)
  }
}, {
  indexes: {
    user: {
      unique: true,
      fields: ['name']
    },
    user_status: {
      unique: false,
      fields: ['status'],
      where: {
        status: 'public'
      }
    }
  }
});