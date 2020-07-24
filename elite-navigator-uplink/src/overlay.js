const path = require('path');
const {app, screen, BrowserWindow} = require('electron');

let currentPromise = null;

exports.openOverlay = async () => {
    if(!currentPromise) {
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
                    preload: path.join(__dirname, '../www/preload.js'),
                },
            });

            win.setAlwaysOnTop(true, 'floating', 5);
            win.setVisibleOnAllWorkspaces(true);
            win.setFullScreenable(false);
            win.setIgnoreMouseEvents(true);

            win.setFocusable(false);

            await win.loadFile(path.join(__dirname, '../www/overlay/index.html'));

            // win.webContents.openDevTools({
            //     mode: 'detach',
            // });

            return win;
        });
    }
};

exports.closeOverlay = async () => {
    if(currentPromise) {
        let win = await currentPromise;
        win.close();
        currentPromise = null;
    }
};