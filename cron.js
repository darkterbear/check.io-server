'use strict'

const schemas = require('./schemas')
const CronJob = require('cron').CronJob;

exports.startCron = () => {
  // cron runs every minute
  new CronJob('1 * * * * *', function() {
    
  }, null, true, 'America/Los_Angeles');
}