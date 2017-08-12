for (let mdl in sequelize.models) {
  let model = sequelize.models[mdl];
  db[mdl] = model;
  if (model.associate) model.associate(sequelize);
}