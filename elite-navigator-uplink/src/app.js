'use strict';

const {watchJournalDirectory, findAllDiscoveries} = require('./service');

let socket = require('socket.io-client').connect('https://elite-navigator.herokuapp.com');

let defaultRoom = 'elite-navigator';

socket.on('connect', () => {
    console.log('Joining:', defaultRoom);

    let s = 'Access granted to local network devices.';
    console.log('-'.repeat(s.length));
    console.log(s);
    console.log('-'.repeat(s.length));
    console.log();

    socket.emit('join', defaultRoom);
});

socket.on('join', id => {
    // console.log('Joined:', id);
    console.log('Device connected');

    function sendMessage(message) {
        console.log('Message:', Object.keys(message));
        socket.emit('msg', message);
    }

    let cleanup = watchJournalDirectory((err, entries) => {
        if(err) return console.error(err.toString());

        console.log(entries.length, 'recent');

        sendMessage({
            journalEntries: entries,
        });
    });

    findAllDiscoveries()
        .then(entries => {
            console.log(entries.length, 'discoveries');
            sendMessage({
                journalEntries: entries,
            });
        })
        .catch(err => console.error(err));


    socket.on('leave', _id => {
        console.log('Device disconnected');
        if(_id === id) {
            cleanup();
        }
    });
});

socket.on('disconnect', () => {
    console.log('Socket disconnected');
});