const User = sequelize.define('User', {
  name: {
    type: DataTypes.STRING(60)
  }
});

User.associate = sequelize => {
  User.belongsTo(sequelize.models.Organization, {});
  User.belongsToMany(sequelize.models.Project, {
    through: 'UserProject',
    constraints: false
  });
};