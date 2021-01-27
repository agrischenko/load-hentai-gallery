const got = require('got');
const fs = require('fs');
const path = require('path');
const Values = require('./find-values');
const Utils = require('./utils');

const NEXT_ITEM_TIMEOUT_MS = 300;

function Loader (base_dir, gallery_uri) {

    let _total_pages = 0;
    let gallery_dir_path;
    let total_size = 0;

    const load_gallery_slide = async (idx, link) => {
        
        const res = await got(link);
        const {body} = res;
        const main_file_uri = Values.get_main(body);
        const next_link_uri = Values.get_next_link(body);
        if (main_file_uri) {

            let fname = main_file_uri.substr(main_file_uri.lastIndexOf('/')+1);
            fname = `${Utils.zero_number(idx)}_${fname}`;

            const image = await got(main_file_uri)
                .on('downloadProgress', progress => {
                    process.stdout.write(`Loading ${idx}/${_total_pages} `
                    + `(${link}) to ${fname} (${Utils.format_file_size(progress.total)}) `
                    + `${Utils.print_progress(progress.percent)}\r`);
                });
            const file_size = image.rawBody.length;

            const file_path = `${gallery_dir_path}/${fname}`;
            fs.writeFileSync(file_path, image.rawBody);

            total_size += file_size;
            console.log();
        }
        return next_link_uri;
    }
    
    
    const load_gallery_slides = async (first_slide_uri) => {

        let idx = 1;
        let old_next_uri = '';
        let next_slide_uri = first_slide_uri;
        total_size = 0;
        while(!!next_slide_uri && old_next_uri !== next_slide_uri && idx <= _total_pages) {
            old_next_uri = next_slide_uri;

            const worker = () => new Promise(ok => setTimeout(async () => {
                next_slide_uri = await load_gallery_slide(idx, next_slide_uri);
                idx++;
                ok();
            }, NEXT_ITEM_TIMEOUT_MS));
    
            await worker();
        }
    
        console.log(`Gallery loaded. Total size: ${Utils.format_file_size(total_size)}`);
    };
    
    const load_gallery = async (link, base_dir) => {
    
        console.log('Initialize gallery ', link);
    
        const res = await got(link);
        const {body} = res;
        const gallery_name = Values.get_gallery_name(body);
        _total_pages = parseInt(Values.get_total_pages(body));
    
        if (!gallery_name && !_total_pages)
            return console.error('Cannot load metadata');
    
        // create main galleries dir
        if (!fs.existsSync('./galleries'))
            fs.mkdirSync('./galleries');
    
        console.log({gallery_name, _total_pages});
    
        if (gallery_name) {
            // create base dir if need
            if (base_dir) {
                base_dir = path.join('./galleries', base_dir);
                if (!fs.existsSync(base_dir))
                    fs.mkdirSync(base_dir);
            } else {
                base_dir = './galleries';
            }

            // create gallery dir (base_dir/gallery_name)
            gallery_dir_path = path.join(base_dir, gallery_name.replace(/[\/\?\!\*\|]/g, '-'));
            console.log(`Create gallery dir: ${gallery_dir_path}`);
            if (!fs.existsSync(gallery_dir_path))
                fs.mkdirSync(gallery_dir_path);

            // load slides
            const first_slide_link = Values.get_first_slide_link(body);
            await load_gallery_slides(first_slide_link);
        }
    }

    return {
        load: load_gallery
    }
}


/**
 * Main entry point
 */
(async () => {
    const args = process.argv.slice(2);
    if (!args.length)
        return console.log('Usage: node gallery_loader [<base_dir>] <gallery_uri>');
    let [base_dir, gallery_uri] = args;
    if (!gallery_uri) {
        gallery_uri = base_dir;
        base_dir = null;
    }

    await new Loader().load(gallery_uri, base_dir);
})();
