function zero_number (num) {
    const tmp = `000${num}`;
    return tmp.substr(tmp.length - 3);
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

const percent_format = Intl.NumberFormat('en-US', {style: 'percent', minimumFractionDigits: 2})

function print_progress (percent) {
    let dots = parseInt((100 * percent) / 10);
    return `[${dots ? '='.repeat(dots) : ''}>] ${percent_format.format(percent)}`;
}
module.exports = {
    zero_number,
    format_file_size,
    print_progress
};