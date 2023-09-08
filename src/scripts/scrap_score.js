import wait from 'waiting-for-js'
import set_listener from '../listeners/set_listener.js';
import Checklist from 'checklist-js';
import { KeyValueStore } from 'crawlee';

let images = await KeyValueStore.open('images');

const scrap_score = async (page, score) => {
    // make a checklist of the score pages
    let numPages = Number(score.pageCount.split(' ')[0]);
    let pageArray = Array(numPages).fill(0).map((e, i) => i);
    // shuffle the array`
    //pageArray = pageArray.sort(() => Math.random() - 0.5);
    let page_checklist = new Checklist(pageArray, { recalc_on_check: true } );

    // set the listener
    set_listener(page, async (request, response) => {
        // get type of content
        let url = request.url();
        let page_num = url.split('/score_')[1].split('.svg')[0];
        // make string into intere
        page_num = Number(page_num);
        if(page_checklist._checklist === null) return
        if(page_checklist.isChecked(page_num)) return;
        console.log('intercepted recived page ', page_num);
        // get the buffer from the response
        let buffer = await response.body();
        // save the buffer
        await images.setValue(
            `${score.id}_${page_num}.svg`,
            buffer,
            { contentType: 'buffer' }
        );
        // check the page
        page_checklist.check(page_num);
        page_checklist.print();
    }, {
        content_type: 'image/svg+xml', 
        // regex which matches a string which contains the word 'score_' followed by some numbers and then '.svg'
        url_match: /score_\d+.svg/
    })

    //get the url
    let url = score.url;
    // go to unofficial scores
    await page.goto(url, { timeout: 1000000 });
    // wait for the page to load
    await wait.for.longTime();
    // scroll down smoothly
    // wait for selector to load 
    await page.waitForSelector('#jmuse-scroller-component > div');
    // get the div with the id of jmuse-scroller-component
    let divs = await page.$$('#jmuse-scroller-component > div');
    let next_page = page_checklist.next();
    while(page_checklist.isNotDone()) {
        if(next_page === null){
            return false;
        }
        try {
            // scroll to the div
            console.log('score: ', score.author);
            console.log('clicking on page:', next_page);
            await divs[next_page].click();
            await wait.for.shortTime();
        } catch (error) {
            console.log('error: ', error);
            console.log('error: ', error.message);
        }
        // get the div
        page_checklist._calcMissing();
        next_page = page_checklist.next();
    }
    // remove listener
    page_checklist.delete();
    // return the score
    return score;
}




export default scrap_score;
