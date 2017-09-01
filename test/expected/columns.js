const User = sequelize.define('User', {
  name: {
    unique: true,
    type: DataTypes.STRING(60),

    get() {
      return this.getDataValue('name');
    },

    set(val) {
      this.setDataValue('name', val);
    },

    validate: {
      isAlphanumeric: true,
      notNull: {
        msg: 'name can\'t be null'
      },

      isEven(val) {
        throw new Error('Bad validation');
      },

      isNotNull: true
    }
  }
});
