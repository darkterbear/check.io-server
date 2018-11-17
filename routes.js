module.exports = app => {
	const controllers = require('./controllers')
	const middleware = require('./middleware')

	app.get('/ping', (_, res) => {
		res.json('pong')
	})

	app
		.route('/restaurant/login')
		.post(middleware.authenticateRestaurant)
		.post(controllers.loginRestaurant)

	app
		.route('/user/login')
		.post(middleware.authenticateUser)
		.post(controllers.loginUser)

	app.route('/restaurant/register').post(controllers.registerRestaurant)
	app.route('/user/register').post(controllers.registerUser)
}
