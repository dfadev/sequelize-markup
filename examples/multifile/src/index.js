var path = require('path');
var db = require(path.join(__dirname, 'db'));

db.sequelize.sync({ force: true }).then(() => {
	db.User.findOrCreate({ 
		where: { name: 'testuser' }, 
		defaults: { other: 'ok' } } )
		.spread( (user, wasCreated) => {
			console.log(user.get( { plain: true } ));
		});
});
