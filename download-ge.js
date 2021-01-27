const got = require('got');
const fs = require('fs');
const path = require('path');
const Values = require('./find-values');
const Utils = require('./utils');

const ROOT_PATH = './galleries';

function Loader (base_dir, max_slides) {

    let _base_dir = base_dir;
    let _max_slides = max_slides;
    let _total_pages = 0;
    let gallery_dir_path;
    let total_size = 0;

    const init = () => {
        // create main galleries dir
        if (!fs.existsSync(ROOT_PATH))
            fs.mkdirSync('./galleries');

        // create base dir if need
        if (_base_dir) {
            _base_dir = path.join('./galleries', _base_dir);
            if (!fs.existsSync(_base_dir))
                fs.mkdirSync(_base_dir);
        } else {
            _base_dir = './galleries';
        }
    }

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
                    process.stdout.write(`Loading ${idx}/${_max_slides} `
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
        while(!!next_slide_uri && old_next_uri !== next_slide_uri && idx <= _max_slides) {
            old_next_uri = next_slide_uri;
            next_slide_uri = await load_gallery_slide(idx, next_slide_uri);
            idx++;
        }
    
        console.log(`Gallery loaded. Total size: ${Utils.format_file_size(total_size)}`);
    };
    
    const load_gallery = async (link) => {
    
        console.log('Initialize gallery ', link);
    
        const res = await got(link);
        const {body} = res;
        const gallery_name = Values.get_gallery_name(body);
        _total_pages = parseInt(Values.get_total_pages(body));
        if (!_max_slides || _max_slides > _total_pages)
            _max_slides = _total_pages;

    
        if (!gallery_name && !_total_pages)
            return console.error('Cannot load metadata');
    
    
        console.log({gallery_name, _total_pages});
    
        if (gallery_name) {
            // create gallery dir (base_dir/gallery_name)
            gallery_dir_path = path.join(_base_dir, gallery_name.replace(/[\/\?\!\*\|]/g, '-'));
            console.log(`Create gallery dir: ${gallery_dir_path}`);
            if (!fs.existsSync(gallery_dir_path))
                fs.mkdirSync(gallery_dir_path);

            // load slides
            const first_slide_link = Values.get_first_slide_link(body);
            await load_gallery_slides(first_slide_link);
        }
    }

    init();

    return {
        load: async (link) => {
            try {
                await load_gallery(link)
            } catch (e) {
                console.error('\nError:', e.message);
            }
        }
    }
}


/**
 * Main entry point
 */
(async () => {
    const Usage = '\
    Usage: node gallery_loader [options] <gallery_uri>\n\
    Options:\n\
        -d<base_dir> - Additional directory for category\n\
        -nN          - Download first N slides only.\n\
                       0 means all slides (by default)\n\
    '
    const args = process.argv.slice(2);
    if (!args.length) {
        return console.log(Usage);
    }
    
    let [base_dir, max_slides] = [];
    let gallery_uri = args[args.length-1];
    if (!gallery_uri || gallery_uri.substr(0,1) === '-') {
        return console.log(Usage);
    }

    if (args.find(arg => arg === '--help')) {
        return console.log(Usage);
    }

    args.forEach(arg => {
        const key = arg.substr(0,2);
        const value = arg.substr(2);
        switch(key) {
            case '-d':
                base_dir = value;
                break;
            case '-n':
                max_slides = parseInt(value) || 0;
                break;
        }
    });

    await new Loader(base_dir, max_slides).load(gallery_uri);
})();
