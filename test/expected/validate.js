const User = sequelize.define("User", {
  name: {
    type: DataTypes.STRING(60)
  }
}, {
  validate: {
    function namesAreOk() {
      if (this.name == "Sam") throw new Error("Invalid name");
    }

  }
});