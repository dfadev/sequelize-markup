const User = sequelize.define('User', {
  name: {
    unique: true,
    type: DataTypes.STRING(60),

    function get() {
      return this.getDataValue('name');
    },

    function set(val) {
      this.setDataValue('name', val);
    },

    validate: {
      isAlphanumeric: true,
      notNull: {
        msg: 'name can\'t be null'
      },

      function isEven(val) {
        throw new Error('Bad validation');
      },

      isNotNull: true
    }
  }
});