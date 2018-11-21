'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const RestaurantSchema = new Schema(
	{
		name: String,
		location: {
			type: {
				type: String
			},
			coordinates: [Number]
		},
		email: String,
		stripeId: String,
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
		],
		checkedInUsers: [
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
			type: {
				type: String,
				default: 'Point'
			},
			coordinates: {
				type: [Number],
				default: [0, 0]
			}
		},
		checkedInRestaurant: {
			type: Schema.Types.ObjectId,
			ref: 'Restaurant'
		},
		locationTimestamp: Number,
		stripeId: String,
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
		amount: Number, // in dollars
		customer: {
			type: Schema.Types.ObjectId,
			ref: 'User'
		},
		date: {
			day: Number,
			month: Number,
			year: Number
		}
	},
	{
		collection: 'transactions'
	}
)

RestaurantSchema.index({ location: '2dsphere' })
UserSchema.index({ location: '2dsphere' })

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
