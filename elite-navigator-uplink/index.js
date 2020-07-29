let {app} = require('electron');
let {startMainWindow} = require('./src/main');

if(app.requestSingleInstanceLock()) {

    require('./src/socket');

    startMainWindow()
        .catch(err => console.error(err) & process.exit(1));
}
else {
    app.quit();
}
