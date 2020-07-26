const path = require('path');
const {overlayEvents, isOverlayActive, openOverlay, closeOverlay} = require('./overlay');
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

    let toggleOverlayItem;

    tray = new Tray(path.join(__dirname, '../icon.png'));
    let menu = Menu.buildFromTemplate([{
        label: 'Open in browser',
        click() {
            shell.openExternal('https://rvanasa.github.io/elite-navigator');
        },
    }, toggleOverlayItem = {
        type: 'checkbox',
        label: 'Toggle overlay',
        checked: isOverlayActive(),
        click() {
            (isOverlayActive() ? closeOverlay() : openOverlay()).catch(console.error);
        },
    }, {
        label: 'Exit',
        click() {
            app.quit();
        },
    }]);
    tray.setContextMenu(menu);
    tray.setTitle('Elite Navigator');
    tray.setToolTip('Elite Navigator');

    tray.on('click', () => {
        tray.popUpContextMenu(menu);
    });

    function onOverlayChanging(active) {
        toggleOverlayItem.checked = active;
        tray.setContextMenu(menu);
    }

    overlayEvents.on('opening', () => onOverlayChanging(true));
    overlayEvents.on('closing', () => onOverlayChanging(false));

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