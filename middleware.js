'use strict'

const { Restaurant, User, Transaction } = require('./schemas')
const auth = require('./auth')

exports.authenticateRestaurant = async (req, res, next) => {
	const { email, password } = req.body

	const restaurant = await Restaurant.findOne({ email }).exec()

	if (!restaurant) return res.status(400).end()
	if (!(await auth.check(password, restaurant.passHashed)))
		return res.status(401).end()

	res.locals.restaurant = restaurant

	next()
}

exports.authenticateUser = async (req, res, next) => {
	const { email, password } = req.body

	const user = await User.findOne({ email }).exec()

	if (!user) return res.status(400).end()
	if (!(await auth.check(password, user.passHashed)))
		return res.status(401).end()

	res.locals.user = user

	next()
}

exports.verifyRestaurantSession = async (req, res, next) => {
	const _id = req.session._id

	if (!_id || !req.session.authenticated) return res.status(401).end()

	const restaurant = await Restaurant.findOne({ _id })

	if (!restaurant) return res.status(401).end()

	res.locals.restaurant = restaurant

	next()
}

exports.verifyUserSession = async (req, res, next) => {
	const _id = req.session._id

	if (!_id || !req.session.authenticated) return res.status(401).end()

	const user = await User.findOne({ _id })

	if (!user) return res.status(401).end()

	res.locals.user = user

	next()
}
