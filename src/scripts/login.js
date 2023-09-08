import wait from 'waiting-for-js'
import dotenv from 'dotenv';
import ProxyRotator from 'proxy-rotator-js'
import fs from 'fs';
dotenv.config();

let username = process.env.MUSESCORE_USERNAME;
let password = process.env.MUSESCORE_PASSWORD;

let login_url = 'https://musescore.com/user/login';
let domain = 'https://musescore.com/';

// proxy rotator
let proxy_rotator = new ProxyRotator('./storage/proxies/proxyscrape_premium_http_proxies.txt')

const login_script = async page => {
    // go to login page
    await page.goto(login_url);
    // wait for login page to load
    await page.waitForSelector('input#username');
    await page.waitForSelector('input#password');
    await page.waitForSelector('button[type="submit"]');

    // fill username
    await page.fill('input#username', username);
    await page.fill('input#password', password);

    // await for some time
    await wait.for.shortTime()

    // click login button
    const submitButtons = await page.$$(`button[type="submit"]`);
    await submitButtons[1].click();

    // return true
    return true;    
}

const login = async browser => {
    /* check if there is a cookies.json file in the storage folder
     * if cookies.json exists, go to homepage
     * else try to login
     * if login success, save the cookies to cookies.json
     */
    // context
    let context = await browser.newContext({
        proxy: { server: proxy_rotator.next() },
    });
    // if cookies.json does not exist
    let page;
    if(!fs.existsSync('cookies.json')) {
        // open a new page
        page = await context.newPage();
        let isLogged = false;
        // try to login 
        try {
            isLogged = await login_script(page);
        } catch (e) {
            console.log(e);
            console.log('TimeoutError while login in');
            console.log('changing proxy');
            await page.close();
            // recreate the content with new proxy
            context = await browser.newContext({
                proxy: { server: proxy_rotator.next() },
            });
            // make new page
            page = await context.newPage();
            // try to login in again with new proxy
            isLogged = await login_script(page);
        }
        if(isLogged) {
            // go to the domain
            console.log('login success');
            // Capture the browser's storage state (including cookies)
            const storageState = await context.storageState();
            // Save the storage state to a file
            fs.writeFileSync('storage/cookies.json', JSON.stringify(storageState));
        } else {
            throw new Error('login failed');
        }
    } else {
        let cookies = JSON.parse(fs.readFileSync('storage/cookies.json').toString())['cookies'];
        // add cookies to the context
        await context.addCookies(cookies);
        // open a new page
        page = await context.newPage();
        // go to the domain
        await page.goto(domain, { timeout: 1000000 });
    }
    return [page, context];
}



export default login;
