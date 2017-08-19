export default function(sequelize, DataTypes) {
	SQLZ>
		(User)
			(name(type=DataTypes.STRING(60)))
			(...associations)
				(Tasks=hasMany.Task)
}
