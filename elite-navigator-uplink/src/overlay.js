const {EventEmitter} = require('events');
const path = require('path');
const {app, screen, BrowserWindow} = require('electron');

let currentPromise = null;
let active = false;

const overlayEvents = new EventEmitter();

overlayEvents.on('open', () => openOverlay().catch(err => overlayEvents.emit('error', err)));
overlayEvents.on('close', () => closeOverlay().catch(err => overlayEvents.emit('error', err)));

exports.overlayEvents = overlayEvents;

exports.openOverlay = async () => {
    overlayEvents.emit('opening');
    active = true;
    if(currentPromise) {
        let win = await currentPromise;
        win.show();
        return win;
    }
    currentPromise = Promise.resolve().then(async () => {
        await app.whenReady();

        let {width, height} = screen.getPrimaryDisplay().workAreaSize;

        let [appWidth, appHeight] = [300, 450];

        let win = new BrowserWindow({
            icon: path.join(__dirname, '../icon.png'),
            width: appWidth,
            height: appHeight,
            opacity: .6,
            x: width - appWidth,
            y: 240,
            frame: false,
            transparent: true,
            webPreferences: {
                preload: path.join(__dirname, '../www/overlay/preload.js'),
            },
        });
        win.setAlwaysOnTop(true, 'floating', 5);
        win.setVisibleOnAllWorkspaces(true);
        win.setFullScreenable(false);

        win.setIgnoreMouseEvents(true);

        win.setFocusable(false);

        win.on('closed', () => active = false);

        await win.loadFile(path.join(__dirname, '../www/overlay/index.html'));

        // win.webContents.openDevTools({
        //     mode: 'detach',
        // });
        overlayEvents.emit('opened');
        return win;
    });
};

exports.closeOverlay = async () => {
    overlayEvents.emit('closing');
    active = false;
    if(currentPromise) {
        let p = currentPromise;
        currentPromise = null;
        let win = await p;
        // win.close();
        win.hide();
        overlayEvents.emit('closed');
    }
};

exports.isOverlayActive = () => {
    return active;
};
