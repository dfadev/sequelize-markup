const Project = sequelize.define("project", {}, {
	defaultScope: { where: { active: true } }
});
