SQLZ>

	(User.timestamps.createdAt.updatedAt.deletedAt(comment='The user table'))

		(column1.unique(type=DataTypes.BOOLEAN))
			(onUpdate='CASCADE')

		(...options)
			(defaultScope={ where: { active: true } })
			(omitNull=false)
			(paranoid=false)
			(underscored=false)
			(underscoredAll=false)
			(freezeTableName=false)
			(tableName='users')
			(schema='public')
			(engine='InnoDB')
			(charset='UTF-8')
			(collate='ABC')
			(initialAutoIncrement='1')

		(...name)
			(singular='user')
			(plural='users')

		(...columns)

			(id.primaryKey.autoIncrement(type=DataTypes.INTEGER))
				(comment='The primary key')
				(references(model='modelref', key='modelkey'))
					(model2='ya')
					(key2='yakey2')
				(onUpdate='CASCADE')
				(onDelete='CASCADE')
				(get=() => { return this.getDataValue('id'); })
				(set=(val) => { this.setDataValue('id', val); })
				(validate.isEmail.isUrl.isIP.isIPv4.isIPv6.isAlpha.isAlphanumeric.isInt)
					(notNull(msg='id can\'t be null'))
					(isEven=(val) => { throw new Error('Bad validation'); })
					(isNotNull=true)

			(firstName.allowNull.unique(type=DataTypes.STRING))

			(lastName(type=DataTypes.STRING(1234)))

		(...getters)
			(fullname=() => { 
				return this.getDataValue('firstName') + " " + this.getDataValue('lastName'); 
			})

		(...setters)
			(fullname=(val) => { 
				var names = val.split(" "); 
				this.setDataValue('firstName', names[0]); 
				this.setDataValue('lastName', names[1]); 
			})

		(...validate)
			(namesAreOk=() => { 
				if (this.firstName == null || this.lastName == null) 
					throw new Error("Invalid name"); 
			})

		(...indexes)
			(user_poem.unique(fields=['poem']))
			(user_other)
				(unique=false)
				(fields=['poem', 'lastName'])
				(method='BTREE')
				(where(active=true))
					(status='public')

		(...associations)
			(belongsTo.Organization)
			(belongsTo.Group(foreignKey="fkey", targetKey="tkey"))
			(belongsTo.Someone)
				(foreignKey="fkey")
				(targetKey="tkey")
			(hasOne.Parent)
			(hasMany.Friend(as='Friends', constraints=false))
				(scope(commentable='image'))
					(otherfield='value')
			(belongsToMany.Project(through='UserProject'))
				(constraints=false)

		(...scopes)
			(deleted)
				(where(deleted=true))
			(deleted2(where={ deleted: true }))
			(activeUsers(include=[ { model: User, where: { active: true } } ]))
			(activeUsers2)
				(include(model=User, where={ active: true }))
			(activeUsers3)
				(include)
					(model=User)
					(where(active=true))

		(...hooks)
			(beforeValidate=(instance, options) => { })
			(afterValidate=(instance, options) => { })

