'use strict'

var stripe = require('stripe')(process.env.STRIPE_SK)
const { Restaurant, User, Transaction } = require('./schemas')
const auth = require('./auth')

exports.loginRestaurant = (req, res) => {
	req.session.authenticated = true
	req.session._id = res.locals.restaurant._id

	return res.status(200).end()
}

exports.loginUser = (req, res) => {
	req.session.authenticated = true
	req.session._id = res.locals.user._id

	return res.status(200).end()
}

exports.logout = (req, res) => {
	req.session.destroy(err => {
		if (err) res.status(500).end()
		else res.status(200).end()
	})
}

const createStripeRestaurant = external_account => {
	return new Promise((resolve, reject) => {
		stripe.accounts.create(
			{
				type: 'custom',
				external_account
			},
			(err, account) => {
				if (err) reject(err)
				else resolve(account)
			}
		)
	})
}

const createStripeCustomer = token => {
	return new Promise((resolve, reject) => {
		stripe.customers.create(
			{
				source: token
			},
			(err, customer) => {
				if (err) reject(err)
				else resolve(customer)
			}
		)
	})
}

const createStripeCharge = (restaurant, customer, amount) => {
	new Promise((resolve, reject) => {
		stripe.charges.create(
			{
				amount: amount * 100, //convert to cents
				currency: 'usd',
				source: customer.stripeToken,
				destination: {
					account: restaurant.stripeId
				}
			},
			charge => {
				resolve(charge)
			}
		)
	})
}

exports.registerRestaurant = async (req, res) => {
	const { name, email, location, password, accountToken } = req.body

	const stripeAccount = await createStripeRestaurant(accountToken)

	const passHashed = await auth.hash(password)

	// TODO: find nearby users right here

	const restaurant = new Restaurant({
		name,
		email,
		location,
		passHashed,
		stripeId: stripeAccount.id,
		stripeToken: accountToken,
		transactionHistory: [],
		nearbyUsers: []
	})

	req.session.authenticated = true
	req.session._id = (await restaurant.save())._id

	return res.status(200).end()
}

exports.registerUser = async (req, res) => {
	const { name, email, password, cardToken } = req.body

	const stripeCustomer = await createStripeCustomer(cardToken)

	const passHashed = await auth.hash(password)

	const user = new User({
		name,
		email,
		passHashed,
		stripeId: stripeCustomer.id,
		stripeToken: cardToken,
		transactionHistory: []
	})

	req.session.authenticated = true
	req.session._id = (await user.save())._id

	return res.status(200).end()
}

exports.updateLocation = async (req, res) => {
	const { lat, lon } = req.body
	const user = res.locals.user

	await User.updateOne(
		{ _id: user._id },
		{ $set: { location: { lat, lon } } }
	).exec()

	// TODO: socket to nearby users

	return res.status(200).end()
}

exports.checkInUser = async (req, res) => {
	const userId = req.body.userId
	const restaurant = res.locals.restaurant

	// TODO: check that the user is actually in range

	// TODO: check user isn't checked into another restaurant already

	await Restaurant.updateOne(
		{ _id: restaurant._id },
		{ $push: { checkedInUsers: userId } }
	)

	return res.status(200).end()
}

exports.checkOutUser = async (req, res) => {
	const userId = req.body.userId
	const restaurant = res.locals.restaurant

	await Restaurant.updateOne(
		{ _id: restaurant._id },
		{ $pull: { checkedInUsers: userId } }
	)

	return res.status(200).end()
}

exports.billUser = async (req, res) => {
	const { userId, amount, description } = req.body // amount is in USD
	const restaurant = res.locals.restaurant
	const user = await User.findOne({ _id: userId }).exec()

	if (!user) return res.status(404).end()

	await createStripeCharge(restaurant, user, amount)

	const today = new Date()
	const transaction = new Transaction({
		description,
		restaurant: restaurant._id,
		amount,
		customer: user._id,
		date: {
			day: today.getDate(),
			month: today.getMonth(),
			year: today.getFullYear()
		}
	})

	const transactionId = await transaction.save()._id

	await User.updateOne(
		{ _id: user._id },
		{ $push: { transactionHistory: transactionId } }
	)

	await Restaurant.updateOne(
		{ _id: restaurant._id },
		{ $push: { transactionHistory: transactionId } }
	)

	return res.status(200).end()
}

exports.getUserTransactionHistory = async (req, res) => {
	const userId = res.locals.user._id

	const populatedUser = await User.findOne({ _id: userId })
		.populate('transactionHistory')
		.exec()

	return res
		.status(200)
		.json(populatedUser.transactionHistory)
		.end()
}

exports.getRestaurantTransactionHistory = async (req, res) => {
	const restaurantId = res.locals.restaurant._id

	const populatedRestaurant = await Restaurant.findOne({ _id: restaurantId })
		.populate('transactionHistory')
		.exec()

	return res
		.status(200)
		.json(populatedRestaurant.transactionHistory)
		.end()
}
