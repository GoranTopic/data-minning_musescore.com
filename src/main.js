import wait from 'waiting-for-js'
import Checklist from 'checklist-js';
import { chromium } from 'playwright';
import login from './scripts/login.js';
import scrap_scores_urls from './scripts/scrap_scores_urls.js';
import scrap_score from './scripts/scrap_score.js';
import { KeyValueStore } from 'crawlee';


// domain of the official scores
let official_scores = 'https://musescore.com/sheetmusic/official'

// launch playwrigth
const browser = await chromium.launch({
	headless: true,
});


// make checklist of all of the music scores
let scores_name = 'official_scores';
let scores_checklist = new Checklist([], { name: scores_name, path: './storage/checklists/' } );

// make key value store
const dataset = await KeyValueStore.open(scores_name);

// login and get the page
let [ page, context ] = await login(browser);

// await for some time
await wait.for.shortTime()

// scrap the urls of the scores
//await scrap_scores_urls(page, scores_checklist, official_scores);

// now that we have some score urtl, int he chekclist, we can start to scrap the scores
let score = scores_checklist.next();
while(score) {
    // scrap the score
    score = await scrap_score(page, score);
    // check the score
    if(score !== false){
        scores_checklist.check(score);
        console.log('checked: ', score);
        // save the score
        await dataset.setValue(score.id, score);
    }
    // get a new score
    score = scores_checklist.next();
    // make new page
    // close tab
    await page.close();
    page = await context.newPage();
}

// close the browser
//await browser.close();
