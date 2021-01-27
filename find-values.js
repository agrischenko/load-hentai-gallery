const get_main = (html) => {
    const regexp = /(id="img").*?src="(.+?)"/;
    return (html.match(regexp) || [])[2];
};

const get_next_link = (html) => {
    const regexp = /(id="next").*?href="(.+?)"/;
    return (html.match(regexp) || [])[2];
};

const get_gallery_name = (html) => {
    const regexp = /\n?<title>(.+?)<\/title>\n?/;
    return (html.match(regexp) || [])[1];
};

const get_total_pages = (html) => {
    const regexp = /class="gdt2">(\d+) pages</;
    return (html.match(regexp) || [])[1];
};

const get_first_slide_link = (html) => {
    const regexp = /class="gdtm".*?href="(.+?)"/;
    return (html.match(regexp) || [])[1];
};

module.exports = {
    get_main,
    get_next_link,
    get_gallery_name,
    get_total_pages,
    get_first_slide_link
};