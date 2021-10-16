const cron = require('node-cron');
const {bookYMCALane} = require('./app')

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
console.log('Cron scheduler running')
cron.schedule('0 13 * * *', () => {
  console.log('Trying to book Swim Lane');
  bookYMCALane();
});