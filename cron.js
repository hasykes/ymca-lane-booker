const cron = require('node-cron');
const {bookYMCALane} = require('./app')
const log = require('simple-node-logger').createSimpleLogger('run.log');

/*
 # ┌────────────── second (optional)
 # │ ┌──────────── minute
 # │ │ ┌────────── hour
 # │ │ │ ┌──────── day of month
 # │ │ │ │ ┌────── month
 # │ │ │ │ │ ┌──── day of week
 # │ │ │ │ │ │
 # │ │ │ │ │ │
 # * * * * * *
*/
log.info('Cron scheduler running')
cron.schedule('0 8 * * *', () => {
  bookYMCALane();
});