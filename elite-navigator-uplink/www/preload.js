const {shell} = require('electron');

window.OVERLAY_URL = process.env.OVERLAY_URL;

window.openExternal = async (url) => {
    return shell.openExternal(url);
};
