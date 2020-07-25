const path = require('path');
const {BrowserWindow, Tray, Menu, app, ipcMain, shell} = require('electron');
const {autoUpdater} = require('electron-updater');

let win, tray;

exports.startMainWindow = async () => {
    await app.whenReady();

    // win = new BrowserWindow({
    //     icon: path.join(__dirname, '../icon.png'),
    //     width: 256,
    //     height: 256,
    //     resizable: false,
    //     autoHideMenuBar: true,
    //     // opacity: .9,
    //     webPreferences: {
    //         preload: path.join(__dirname, '../www/main/preload.js'),
    //     },
    // });
    //
    // win.once('ready-to-show', () => {
    //     autoUpdater.checkForUpdatesAndNotify();
    // });

    // await autoUpdater.checkForUpdatesAndNotify();

    // autoUpdater.down

    autoUpdater.on('update-downloaded', () => {
        autoUpdater.quitAndInstall(true, true);
    });

    // win.on('closed', () => app.quit());

    // function openTray() {
    //
    // }

    tray = new Tray(path.join(__dirname, '../icon.png'));
    let contextMenu = Menu.buildFromTemplate([{
        label: 'Open in browser',
        click() {
            shell.openExternal('https://rvanasa.github.io/elite-navigator');
        },
    }, {
        label: 'Exit',
        click() {
            app.quit();
        },
    }]);
    tray.setContextMenu(contextMenu);
    tray.setTitle('Elite Navigator');
    tray.setToolTip('Elite Navigator');

    tray.on('click', () => {
        tray.popUpContextMenu(contextMenu);
    });

    // ipcMain.on('minimize-to-tray', () => {
    //     win.hide();
    // });

    // await win.loadFile(path.join(__dirname, '../www/main/index.html'));

    tray.focus();

    // win.webContents.openDevTools({
    //     mode: 'detach',
    // });

    return win;
};