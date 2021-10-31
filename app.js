//const fetch = require('isomorphic-fetch');
//const endpoint = 'https://ymcametroatlanta.skedda.com/booking?spaceviewid=40275&viewdate=2021-10-12&viewend=2021-10-12'
/*
Prefer lanes 1,2, or 5 (get your own lane)
- Need to get chloes cookie for authentication
*/

require('dotenv').config();
const puppeteer = require('puppeteer');
const moment = require('moment');
const log = require('simple-node-logger').createSimpleLogger('run.log');

const tomorrow = moment().add(1,'days').format('YYYY-MM-DD')
const endpoint = `https://ymcametroatlanta.skedda.com/booking?spaceviewid=40275&viewdate=${tomorrow}&viewend=${tomorrow}`

//const url = process.argv[2];

/*INPUTS*/
const email = process.env.EMAIL
const password = process.env.PASSWORD

const startTimeRegex = /8:00 AM/gi
//const idealLanesRegex = /Buckhead Y - Lap Lane 1|Buckhead Y - Lap Lane 2|Buckhead Y - Lap Lane 5/gi
/****************************************/

async function bookYMCALane () {

    log.info('Running Lane Booker...')
    const browser = await puppeteer.launch({headless:true});
    const page = await browser.newPage();
    await page.goto(endpoint);

    var addButtonElement = await page.waitForSelector("button[title='Make a new booking']")
    addButtonElement.click({delay:10})

    var modalBody = await page.waitForSelector('.modal-body');
    const emailInput = await page.$('input[type="email"]');
    log.info('Logging In...')
    if(emailInput){
        await emailInput.type(email)
        page.waitForTimeout(3000)
        await modalBody.$eval('button',el => el.click())

        const passwordInput = await page.waitForSelector('input[type="password"]');
        
        await passwordInput.type(password)
        await page.$eval('#remember-me-checkbox',el => el.click()); //check remember me button
        await page.$eval('button[type="submit"]',el => el.click());
        log.info('Logged In, waiting for confirmation...')
        //update with new addButtonElement reference
        addButtonElement = await page.waitForSelector("button[title='Make a new booking']")
        addButtonElement.click({delay:10})
    }

    //You're now logged in, time to book a lane
    log.info('Looking for available Lanes...')
    var modalBody = await page.waitForSelector('.modal-body');
    const allDropdowns = await modalBody.$$('.dropdown') //only need 1 (start time),3 (lap lane)
    
    //Select your start time
    log.info('Selecting start time...')
    const startTimeDropdown = allDropdowns[1]
    await startTimeDropdown.click()
    const startTimeMenu = await page.waitForSelector('div.dropdown.show');
    const inScopeTimeEls = await startTimeMenu.$$('.dropdown-item');
    const inScopeTimes = await inScopeTimeEls.map(el => el.evaluate(e => e.textContent))
    const timeElementIndexes = await Promise.allSettled(inScopeTimes).then(res => {
      return res.map((startTime,i) => startTimeRegex.test(startTime.value) ? i:null ).filter(a => a) //filter out null values
    })
    
    await inScopeTimeEls[timeElementIndexes[0]].click()
    
    //Select your lane
    log.info('Selecting Lane...')
    const lapLaneDropdown = allDropdowns[3];
    await lapLaneDropdown.click()
    const lapLaneMenu = await page.waitForSelector('div.dropdown.show');
    const inScopeLapLaneEls = await lapLaneMenu.$$('.dropdown-item');
    const inScopeLanes = await inScopeLapLaneEls.map(el => el.evaluate(e => e.textContent))
    const laneElementIndexes = [7,8,13];
    /*
    await Promise.allSettled(inScopeLanes).then(res => {
      return res.map((lane,i) => idealLanesRegex.test(lane.value) ? i:null ).filter(a => a) //filter out null values
    })
    */
    
    //try each lane in order to see if we can book it. Exit if we are succesful.  
    for(let i=0; i<laneElementIndexes.length;i++){
        log.info(` > Trying Lane option ${i+1}...`)
        if(i > 0){
          //unclick the previous selection
          await page.evaluate(e => e.click(),inScopeLapLaneEls[laneElementIndexes[i-1]])
        }
        await page.evaluate(e => e.click(),inScopeLapLaneEls[laneElementIndexes[i]])
        await page.evaluate(e => document.querySelector('#ember-root-element > div.app-wrapper.embedded-false > div.modal.booking-create-modal.show > div > div > div.modal-body > div > div.row.pt-5 > div > button.btn.btn-success').click())
        const success = await page.waitForSelector('.alert-danger',{timeout:3000})
        .then(errorOnRequest => {
          if (!errorOnRequest){
            inScopeLanes[laneElementIndexes[i]].then(lane => log.info(' > > Succesfully Booked ' + lane.trim()))
            return true
          }
          inScopeLanes[laneElementIndexes[i]].then(lane => log.info(' > > Failed to Book ' + lane.trim()))
          return false
        })
        .catch(err => null);

        if(success){
          break;
        } 
    }
    log.info('*************** END RUN LOG ***************')
    browser.close()
}   
bookYMCALane();

module.exports = {
  bookYMCALane
}
