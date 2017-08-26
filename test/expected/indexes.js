const User = sequelize.define('User', {
	name: {
		type: DataTypes.STRING(60)
	},
	status: {
		type: DataType.STRING(60)
	}
}, {
	defaultScope: {
		where: {
			active: true
		}
	},
	paranoid: true,
	indexes: function () {
		var data = Object.assign({
			user: {
				unique: true,
				fields: ['name']
			}
		}, false ? {
			user2: {
				unique: true,
				fields: ['name']
			}
		} : undefined, false ? {
			user_status: {
				unique: false,
				fields: ['status'],
				where: {
					status: 'public'
				}
			}
		} : undefined);
		return Object.keys(data).map(key => {
			data[key]['name'] = key;
			return data[key];
		});
	}()
});
