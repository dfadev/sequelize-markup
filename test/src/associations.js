SQLZ>
  (User)
    (name(type=DataTypes.STRING(60)))
    (...associations)
      (belongsTo.Organization)
      (belongsToMany.Project(through='UserProject'))
        (constraints=false)
