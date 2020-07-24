const path = require('path');
const {BrowserWindow, app, ipcMain} = require('electron');
const {autoUpdater} = require('electron-updater');

exports.startMainWindow = async () => {
    await app.whenReady();

    let win = new BrowserWindow({
        icon: path.join(__dirname, '../icon.png'),
        width: 256,
        height: 256,
        resizable: false,
        autoHideMenuBar: true,
        // opacity: .9,
        webPreferences: {
            preload: path.join(__dirname, '../www/main/preload.js'),
        },
    });

    win.on('closed', () => app.quit());

    await win.loadFile(path.join(__dirname, '../www/main/index.html'));

    win.once('ready-to-show', () => {
        autoUpdater.checkForUpdatesAndNotify();
    });

    autoUpdater.on('update-downloaded', () => {
        autoUpdater.quitAndInstall({
            isSilent: true,
            isForceRunAfter: true,
        });
    });

    // win.webContents.openDevTools({
    //     mode: 'detach',
    // });

    return win;
};