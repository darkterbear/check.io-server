'use strict'

const { Restaurant, User } = require('./schemas')
const CronJob = require('cron').CronJob
const sockets = require('./sockets')
const locationExpireDuration = require('./server').locationExpireDuration

const purgeOldLocations = async () => {
	const threshold = Date.now() - locationExpireDuration // can't be older than 10 minutes
	const usersWithOldLocations = await User.find({
		locationTimestamp: { $lt: threshold, $gt: 0 }
	}).exec()

	const bulk = Restaurant.collection.initializeUnorderedBulkOp()
	var execute = false

	for (const u of usersWithOldLocations) {
		const restaurants = await Restaurant.find({ nearbyUsers: u._id }).exec()

		if (!restaurants || restaurants.length === 0) return
		execute = true

		sockets.onNotNearby(u, restaurants.map(r => r._id.toString()))

		bulk.find({ nearbyUsers: u._id }).update({ $pull: { nearbyUsers: u._id } })
	}

	if (execute) bulk.execute()
}

exports.startCron = () => {
	// cron runs every minute
	new CronJob(
		'1 * * * * *',
		purgeOldLocations,
		null,
		true,
		'America/Los_Angeles'
	)
}
