'use strict'

const { Restaurant, User } = require('./schemas')
const CronJob = require('cron').CronJob

const purgeOldLocations = async () => {
	console.log('cron run')
	const threshold = Date.now() - 1000 * 60 * 10 // can't be older than 10 minutes
	const usersWithOldLocations = await User.find({
		locationTimestamp: { $lt: threshold, $gt: 0 }
	}).exec()

	const bulk = Restaurant.collection.initializeUnorderedBulkOp()

	usersWithOldLocations.forEach(u => {
		bulk.find({ nearbyUsers: u._id }).update({ $pull: { nearbyUsers: u._id } })
	})

	if (usersWithOldLocations.length >= 1) bulk.execute()
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
