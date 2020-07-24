const {shell, ipcRenderer} = require('electron');

window.openExternal = async (url) => {
    return shell.openExternal(url);
};

