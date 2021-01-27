const find_value = (html, regexp, group) => {
    return (html.match(regexp) || [])[group];
};

const get_main = (html) => {
    return find_value(html, /(id="img").*?src="(.+?)"/, 2);
};

const get_next_link = (html) => {
    return find_value(html, /(id="next").*?href="(.+?)"/, 2);
};

const get_gallery_name = (html) => {
    return find_value(html, /\n?<title>(.+?)<\/title>\n?/, 1);
};

const get_total_pages = (html) => {
    return find_value(html, /class="gdt2">(\d+) pages</, 1);
};

const get_first_slide_link = (html) => {
    return find_value(html, /class="gdtm".*?href="(.+?)"/, 1);
};

module.exports = {
    get_main,
    get_next_link,
    get_gallery_name,
    get_total_pages,
    get_first_slide_link
};