'use strict'

var stripe = require('stripe')('sk_test_K2UOZ9A6kKiPBQzEgPfmKuWG')
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

const createStripeRestaurant = external_account => {
	return new Promise((resolve, reject) => {
		stripe.accounts.create(
			{
				type: 'custom',
				external_account
			},
			(err, account) => {
				if (err) reject('Error creating Custom Stripe Account for restaurant')
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
			(err, account) => {
				if (err) reject('Error creating Stripe Customer')
				else resolve(customer)
			}
		)
	})
}

exports.registerRestaurant = async (req, res) => {
	const { name, email, location, password, accountToken } = req.body

	const stripeAccount = await createStripeRestaurant(accountToken)

	const passHashed = await auth.hash(password)

	const restaurant = new Restaurant({
		name,
		email,
		location,
		passHashed,
		stripeId: stripeAccount.id,
		transactionHistory: [],
		nearbyUsers: []
	})

	restaurant.save()

	return res.status(200).end()
}

exports.registerUser = async (req, res) => {
	const { name, email, password, cardToken } = req.body

	const stripeCustomer = await createStripeCustomer(cardToken)

	const passHashed = await auth.hash(password)

	const user = new Restaurant({
		name,
		email,
		passHashed,
		stripeId: stripeCustomer.id,
		transactionHistory: []
	})

	user.save()

	return res.status(200).end()
}

exports.populateRestaurantStripeTokens = async (req, res) => {}
