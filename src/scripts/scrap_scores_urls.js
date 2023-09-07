import wait from 'waiting-for-js'

async function getTextContent(element) {
  try {
    const textContent = await element.evaluate((el) => el.textContent);
    return textContent;
  } catch (error) {
    console.error('Error while getting text content:', error.message);
    return null;
  }
}

const parse_article = async article => {
    // get url a
    let as = await article.$$('a');
    // get url
    let urlHandle = await as[0].getProperty('href');
    let url = await urlHandle.jsonValue();
    // get id from url's last part
    let id = url.split('/').pop();
    // get the title
    let title = await getTextContent(as[1]);
    let author = await getTextContent(as[2]);
    let author_url = await as[2].getProperty('href');
    author_url = await author_url.jsonValue();
    // get the rest of the text
    let text_el = await article.$('div > div:nth-child(2) div:nth-child(3)');
    //let get text content
    let text = await getTextContent(text_el);
    const parts = text.split('•');
    // Extract individual values into separate variables
    const partNumber = parts[0].trim();
    const pageCount = parts[1].trim();
    const duration = parts[2].trim();
    const date = parts[3].trim();
    const views = parts[4].trim();
    const favorites = parts[5].trim();

    return { id, url, title, author_url, author,
        partNumber, pageCount, duration, date, 
        views, favorites }
}


const scrap_scores_urls = async (page, checklist, url) => {
    // go to unofficial scores
    await page.goto(url, { timeout: 1000000 });
    // wait for the page to load
    // select the next button
    let next_button = await page.locator("//span[contains(text(), 'Next')]/parent::*")
    let is_next_button_disabled = await next_button.getAttribute('disabled')
    while(!is_next_button_disabled) {
        // get all atricle elements
        let articles_el = await page.$$('article')
        // prse all articles
        let articles = await Promise.all(articles_el.map(async (article) => {
            return await parse_article(article)
        }))
        // for each article add to checklist
        checklist.add(articles);
        // click the next button
        console.log('clicking next button')
        await next_button.click()
        // wait
        await wait.for.longTime();
        // select the next button
        next_button = await page.locator("//span[contains(text(), 'Next')]/parent::*");
        is_next_button_disabled = await next_button.getAttribute('disabled');
        console.log('scores on checklist', checklist.missingLeft());
    }
    
    console.log(articles)
}




export default scrap_scores_urls;
