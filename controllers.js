'use strict'

const { Restaurant, User, Transaction } = require('./schemas')
const auth = require('./auth')
const stripe = require('./stripe')
const Socket = require('./sockets')
const locationExpireDuration = require('./server').locationExpireDuration

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

exports.registerRestaurant = async (req, res) => {
	const {
		name,
		email,
		location,
		password,
		cardNumber,
		month,
		year,
		cvc
	} = req.body

	const data = await stripe.createCard(cardNumber, month, year, cvc)

	const stripeAccount = await stripe.createStripeRestaurant(data.id) // stripe token

	const passHashed = await auth.hash(password)

	const nearbyUsers = await User.find({
		location: {
			$near: {
				$maxDistance: 100,
				$geometry: {
					type: 'Point',
					coordinates: [location.lon, location.lat]
				}
			}
		},
		locationTimestamp: { $gt: Date.now() - locationExpireDuration } // location must not be older than 10 min
	}).exec()
	console.log(nearbyUsers)

	const restaurant = new Restaurant({
		name,
		email,
		location: {
			type: 'Point',
			coordinates: [location.lon, location.lat]
		},
		passHashed,
		stripeId: stripeAccount.id,
		stripeToken: data.id,
		transactionHistory: [],
		nearbyUsers: nearbyUsers.map(u => u._id)
	})

	await restaurant.save()

	req.session.authenticated = true
	req.session._id = (await restaurant.save())._id

	return res.status(200).end()
}

exports.registerUser = async (req, res) => {
	const { name, email, password, cardToken } = req.body

	const stripeCustomer = await stripe.createStripeCustomer(cardToken)

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
		{
			$set: {
				location: {
					type: 'Point',
					coordinates: [lon, lat]
				},
				locationTimestamp: Date.now()
			}
		}
	).exec()

	const newNear = await Restaurant.find({
		location: {
			$near: {
				$maxDistance: 100,
				$geometry: {
					type: 'Point',
					coordinates: [lon, lat]
				}
			}
		},
		nearbyUsers: { $ne: user._id }
	}).exec()

	const newFar = await Restaurant.find({
		location: {
			$near: {
				$minDistance: 100,
				$maxDistance: Number.MAX_SAFE_INTEGER,
				$geometry: {
					type: 'Point',
					coordinates: [lon, lat]
				}
			}
		},
		nearbyUsers: user._id
	}).exec()

	await Restaurant.updateMany(
		{ _id: { $in: newNear.map(r => r._id) } },
		{ $push: { nearbyUsers: user._id } }
	)

	await Restaurant.updateMany(
		{ _id: { $in: newFar.map(r => r._id) } },
		{ $pull: { nearbyUsers: user._id } }
	)

	Socket.onNearby(user, newNear.map(r => r._id))
	Socket.onNotNearby(user, newFar.map(r => r._id))

	return res.status(200).end()
}

exports.checkInUser = async (req, res) => {
	const userId = req.body.userId
	const restaurant = res.locals.restaurant

	// check that the user is actually in range
	const customers = await User.find({
		location: {
			$near: {
				$maxDistance: 100,
				$geometry: {
					type: 'Point',
					coordinates: restaurant.location
				}
			}
		}
	}).exec()

	if (
		customers.filter(c => c._id.toString() === userId.toString()).length !== 1
	) {
		return res.status(400).end()
	}

	// check user isn't checked into another restaurant already
	if ((await User.findOne({ _id: userId }).exec()).checkedInRestaurant)
		return res.status(400).end()

	// check the customer in
	await Restaurant.updateOne(
		{ _id: restaurant._id },
		{ $push: { checkedInUsers: userId } }
	).exec()

	await User.updateOne(
		{ _id: userId },
		{ $set: { checkedInRestaurant: restaurant._id } }
	).exec()

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

	await stripe.createStripeCharge(restaurant, user, amount)

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

exports.getRestaurant = async (req, res) => {
	const restaurantId = res.locals.restaurant._id

	const populatedRestaurant = await Restaurant.findOne({ _id: restaurantId })
		.populate('transactionHistory')
		.populate('nearbyUsers')
		.populate('checkedInUsers')
		.exec()

	return res
		.status(200)
		.json(populatedRestaurant)
		.end()
}
