SQLZ>
  (User)
    (...columns)
      (name.unique(type=DataTypes.STRING(60)))
        (get=() => { return this.getDataValue('name'); })
        (set=(val) => { this.setDataValue('name', val); })
        (validate.isAlphanumeric)
          (notNull(msg='name can\'t be null'))
          (isEven=(val) => { throw new Error('Bad validation'); })
          (isNotNull=true)