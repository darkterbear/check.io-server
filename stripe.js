const request = require('request')
const stripe = require('stripe')(process.env.STRIPE_SK)

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

const createCard = (number, month, year, cvc) => {
	return new Promise((resolve, reject) => {
		var dataString =
			'card[number]=' +
			number +
			'&card[exp_month]=' +
			month +
			'&card[exp_year]=' +
			year +
			'&card[cvc]=' +
			cvc +
			'&card[currency]=usd'

		var options = {
			url: 'https://api.stripe.com/v1/tokens',
			method: 'POST',
			body: dataString,
			auth: {
				user: process.env.STRIPE_SK,
				pass: ''
			}
		}

		request(options, (error, response, body) => {
			if (error) reject(error)
			else resolve(JSON.parse(body))
		})
	})
}

module.exports = {
	createCard,
	createStripeCharge,
	createStripeCustomer,
	createStripeRestaurant
}
