let {app} = require('electron');
let {startMainWindow} = require('./src/main');

let {socket} = require('./src/socket');

startMainWindow()
    .catch(err => console.error(err) & process.exit(1));
