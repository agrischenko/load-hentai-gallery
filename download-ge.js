const got = require('got');
const fs = require('fs');
const path = require('path');

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

function zero_number (num) {
    const tmp = `000${num}`;
    return tmp.substr(tmp.length - 3);
}

const load_gallery_slide = async (idx, link, gallery_dir_path) => {
    const res = await got(link);
    const {body} = res;
    const main_file_uri = get_main(body);
    const next_link_uri = get_next_link(body);
    let file_size = 0;
    if (main_file_uri) {
        let fname = main_file_uri.substr(main_file_uri.lastIndexOf('/')+1);
        fname = `${zero_number(idx)}_${fname}`;
        const image = await got(main_file_uri);
        const file_path = `${gallery_dir_path}/${fname}`;
        file_size = image.rawBody.length;
        process.stdout.write(`Write ${fname} (${format_file_size(file_size)}) on disk.. `);
        fs.writeFileSync(file_path, image.rawBody);
        console.log('ok');
    }
//    console.log({main_file_uri, next_link_uri});
    return {next_link_uri, file_size};
}

function format_file_size(fileSizeInBytes) {
    let i = -1;
    let byteUnits = [' kB', ' MB', ' GB', ' TB', 'PB', 'EB', 'ZB', 'YB'];
    do {
        fileSizeInBytes = fileSizeInBytes / 1000;
        i++;
    } while (fileSizeInBytes > 1000);

    return Math.max(fileSizeInBytes, 0.1).toFixed(1) + byteUnits[i];
};

const load_gallery_slides = async (first_slide_uri, total_pages, gallery_dir_path) => {

    let idx = 1;
    let old_next_uri = '';
    let next_slide_uri = first_slide_uri;
    let total_size = 0;
    while(!!next_slide_uri && old_next_uri !== next_slide_uri) {
        old_next_uri = next_slide_uri;
        const worker = () => new Promise(ok => setTimeout(async () => {
            process.stdout.write(`Loading slide ${idx}/${total_pages} (${next_slide_uri})... `);
            const result = await load_gallery_slide(idx, next_slide_uri, gallery_dir_path);
            idx++;
            next_slide_uri = result.next_link_uri;
            total_size += result.file_size;
            ok();
        }, 300));

        await Promise.resolve().then(worker);
    }

    console.log(`Gallery loaded. Total size: ${format_file_size(total_size)}`);
};

const load_gallery = async (link, base_dir) => {

    console.log('Preload gallery ', link);

    const res = await got(link);
    const {body} = res;
    const gallery_name = get_gallery_name(body);
    const total_pages = parseInt(get_total_pages(body));

    if (!gallery_name && !total_pages)
        return console.error('Cannot load metadata');

    if (!fs.existsSync('./galleries'))
        fs.mkdirSync('./galleries');

    console.log({gallery_name, total_pages});

    if (gallery_name) {
        if (base_dir) {
            base_dir = path.join('./galleries', base_dir);
            if (!fs.existsSync(base_dir))
                fs.mkdirSync(base_dir);
        } else {
            base_dir = './galleries';
        }
        const gallery_path = path.join(base_dir, gallery_name.replace(/[\/\?\!\*\|]/g, '-'));
        console.log(`Create gallery dir: ${gallery_path}`);

        if (!fs.existsSync(gallery_path))
            fs.mkdirSync(gallery_path);

        const first_slide_link = get_first_slide_link(body);
        await load_gallery_slides(first_slide_link, total_pages, gallery_path);
    }
}

(async () => {
    const args = process.argv.slice(2);
    if (!args.length)
        return console.log('Usage: node gallery_loader <gallery_uri> <base_dir>');
    await load_gallery(args[0], args[1]);
})();
