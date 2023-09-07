const set_listener = (page, callback, options) => {
    // set up a response event listener
    let base_url = options.base_url ?? null;
    let content_type = options.content_type ?? null;
    let status = options.status ?? null;
    let url_match = options.url_match ?? null;
    page.on('requestfinished', async (request) => {
        let response = await request.response();
        // if the content type is not what we want, skip
        if (content_type) 
            if (!response.headers()['content-type']?.includes(content_type)) return;
        // if the response type is not what we want, skip
        if (status) 
            if (response.response().status() !== status) return;
        // if the base url is not what we want, skip
        if (base_url) 
            if (!request.url()?.includes(base_url)) return;
        // if the url matches the regex 
        if( url_match )
            if( !request.url().match(url_match) ) return;
        // else
        await callback(request, response, page);
    });
}

export default set_listener;
