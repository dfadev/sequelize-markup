SQLZ>
  (User)
    (name(type=DataTypes.STRING(60)))
    (...getters)
      (getTwoName=() => { 
        return this.getDataValue('name') + " " + this.getDataValue('name'); 
      })
