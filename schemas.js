'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const RestaurantSchema = new Schema(
	{
		name: String,
		location: {
			lat: Number,
			lon: Number
		},
		email: String,
		stripeToken: String,
		passHashed: String,
		transactionHistory: [
			{
				type: Schema.Types.ObjectId,
				ref: 'Transaction'
			}
		],
		nearbyUsers: [
			{
				type: Schema.Types.ObjectId,
				ref: 'User'
			}
		]
	},
	{
		collection: 'restaurants'
	}
)

const UserSchema = new Schema(
	{
		name: String,
		email: {
			type: String,
			unique: true,
			trim: true
		},
		location: {
			lat: Number,
			lon: Number
		},
		stripeToken: String,
		passHashed: String,
		transactionHistory: [
			{
				type: Schema.Types.ObjectId,
				ref: 'Transaction'
			}
		]
	},
	{
		collection: 'users'
	}
)

const TransactionSchema = new Schema(
	{
		description: String,
		restaurant: {
			type: Schema.Types.ObjectId,
			ref: 'Restaurant'
		},
		total: Number,
		payers: [
			{
				user: {
					type: Schema.Types.ObjectId,
					ref: 'User'
				},
				amount: Number
			}
		]
	},
	{
		collection: 'transactions'
	}
)

var Restaurant = mongoose.model('Restaurant', RestaurantSchema, 'restaurants')
var User = mongoose.model('User', UserSchema, 'users')
var Transaction = mongoose.model(
	'Transaction',
	TransactionSchema,
	'transactions'
)

module.exports = {
	Restaurant,
	User,
	Transaction
}
