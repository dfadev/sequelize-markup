SQLZ>
	(Project.timestamps.paranoid(createdAt=false))
		(firstName(type=DataTypes.INTEGER(2).UNSIGNED.ZEROFILL))
		(lastName.unique(type=DataTypes.STRING(1234), field='last_name'))
