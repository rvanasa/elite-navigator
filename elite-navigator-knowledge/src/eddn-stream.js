'use strict'

const {EventEmitter} = require('events');
const zlib = require('zlib');
const zmq = require('zeromq');

const eddn = new EventEmitter();

let currentSock = null;
let currentInterval = null;

exports.requestConnection = function() {
    if(currentSock) {
        return eddn;
    }
    
    let sock = zmq.socket('sub');
    
    sock.connect('tcp://eddn.edcd.io:9500');
    console.log('EDDN connected');
    
    sock.subscribe('');
    
    sock.on('message', topic => {
        let info = JSON.parse(zlib.inflateSync(topic));
        eddn.emit('entry', info.message);
    });
    sock.on('error', err => eddn.emit('error', err));
    
    currentSock = sock;
    
    clearInterval(currentInterval);
    currentInterval = setInterval(() => {
        console.log('Refreshing connection:');
        module.exports.disconnect();
        exports.requestConnection();
    }, 1000 * 60 * 10);
    
    return eddn;
};

exports.disconnect = function() {
    if(currentSock) {
        currentSock.close();
        currentSock = null;
        console.log('EDDN disconnected');
    }
};