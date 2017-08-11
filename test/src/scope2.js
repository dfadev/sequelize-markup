SQLZ>
	(Project(defaultScope={ where: { active: true } },
		scopes={
			deleted: { where: { deleted: true } },
			activeUsers: { include: [ { model: User, where: { active: true } } ] },
			random: function () { return { where: { someNumber: Math.random() } } }
		},
		))
		(name(type=DataTypes.STRING))
		(otherField(type=DataTypes.BOOLEAN))


	(Project2.timestamps)
		// table options
		(paranoid=false)
		(defaultScope={ where: { active: true } })
		(~scopes)
			(deleted={ where: { deleted: true } })
			(activeUsers={ include: [ { model: User, where: { active: true } } ] })
			(random=function () { return { where: { someNumber: Math.random() } } })
		// table columns
		(name(type=DataTypes.STRING))
		(otherField(type=DataTypes.BOOLEAN))

	(Project2.timestamps)
		// table options
		(...options)
			(paranoid=false)
			(defaultScope={ where: { active: true } })
		(...scopes)
			(deleted={ where: { deleted: true } })
			(activeUsers={ include: [ { model: User, where: { active: true } } ] })
			(random=function () { return { where: { someNumber: Math.random() } } })
		// table columns
		(...columns)
			(name(type=DataTypes.STRING))
			(otherField(type=DataTypes.BOOLEAN))
		(...associations)
			(belongsTo.Team)
			(belongsTo.Role(as='role', foreignKey='fk_role', targetKey='role'))
			(hasOne.User)
		(...hooks)

	(...Global)
		(...hooks)
