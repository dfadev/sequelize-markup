const User = sequelize.define('User', {
  column1: {
    unique: true,
    type: DataTypes.BOOLEAN,
    onUpdate: 'CASCADE'
  }
}, {
  timestamps: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  comment: 'The user table',
  defaultScope: {
    where: {
      active: true
    }
  },
  omitNull: false,
  paranoid: false,
  underscored: false,
  underscoredAll: false,
  freezeTableName: false,
  tableName: 'users',
  schema: 'public',
  engine: 'MYISAM',
  initialAutoIncrement: '1'
});