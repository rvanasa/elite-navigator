'use strict';

const {watchJournalDirectory} = require('./service');
const {v4} = require('internal-ip');

let port = 4777;

let app = require('express')();
let server = require('http').createServer(app);
let io = require('socket.io')(server);

console.log('Local IP address:', v4.sync());

server.listen(port, () => {
    console.log('Listening on port', port);
});

io.on('connection', conn => {
    console.log('Connected');
    
    function sendMessage(message) {
        conn.emit('message', message, () => {
            console.log('Acknowledged');
        });
    }
    
    let cleanup = watchJournalDirectory((err, message) => {
        if(err) return console.error(err.toString());
        console.log('Message:', Object.keys(message));
        
        sendMessage(message);
    });
    
    conn.on('connect_timeout', () => {
        console.log('Timeout');
    });
    
    conn.on('reconnect_attempt', () => {
        console.log('Reconnecting');
    });
    
    conn.on('disconnect', () => {
        cleanup();
        console.log('Disconnected');
    });
});