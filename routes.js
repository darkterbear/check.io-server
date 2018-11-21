module.exports = app => {
	const controllers = require('./controllers')
	const middleware = require('./middleware')

	app.get('/ping', (_, res) => res.json('pong'))

	app
		.route('/user/reauth')
		.get(middleware.verifyUserSession)
		.get((_, res) => res.status(200).end())

	app
		.route('/restaurant/reauth')
		.get(middleware.verifyRestaurantSession)
		.get((_, res) => res.status(200).end())

	app
		.route('/restaurant/login')
		.post(middleware.authenticateRestaurant)
		.post(controllers.loginRestaurant)

	app
		.route('/user/login')
		.post(middleware.authenticateUser)
		.post(controllers.loginUser)

	app.route('/logout').post(controllers.logout)

	app.route('/restaurant/register').post(controllers.registerRestaurant)
	app.route('/user/register').post(controllers.registerUser)

	app
		.route('/user/update-location')
		.post(middleware.verifyUserSession)
		.post(controllers.updateLocation)

	app
		.route('/restaurant/check-in-user')
		.post(middleware.verifyRestaurantSession)
		.post(controllers.checkInUser)

	app
		.route('/restaurant/check-out-user')
		.post(middleware.verifyRestaurantSession)
		.post(controllers.checkOutUser)

	app
		.route('/restaurant/bill-user')
		.post(middleware.verifyRestaurantSession)
		.post(controllers.billUser)

	app
		.route('/user/get-transaction-history')
		.get(middleware.verifyUserSession)
		.get(controllers.getUserTransactionHistory)

	app
		.route('/restaurant/get')
		.get(middleware.verifyRestaurantSession)
		.get(controllers.getRestaurant)
}
