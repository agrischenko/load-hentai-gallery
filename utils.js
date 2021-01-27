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

module.exports = {
    zero_number,
    format_file_size
};