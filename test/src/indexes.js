SQLZ>
	(User)
		(name(type=DataTypes.STRING(60)))
		(status(type=DataType.STRING(60)))
		(...options)
			(defaultScope)
				(where(active=true))
			(paranoid=true)
		(...indexes)
			(user.unique(fields=['name']))
			($if (false))
				(user2.unique(fields=['name']))
			($if(false))
				(user_status)
					(unique=false)
					(fields=['status'])
					(where)
						(status='public')
