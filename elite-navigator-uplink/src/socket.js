'use strict';

const {openOverlay, closeOverlay, isOverlayActive} = require('./overlay');
const {watchJournalDirectory, findAllDiscoveries} = require('./service');

let socket = require('socket.io-client').connect('https://elite-navigator.herokuapp.com');

let defaultRoom = 'elite-navigator';

let cache = [];

socket.on('connect', () => {
    console.log('Joining:', defaultRoom);

    let s = 'Available to local network devices.';
    console.log('-'.repeat(s.length));
    console.log(s);
    console.log('-'.repeat(s.length));
    console.log();

    socket.emit('join', defaultRoom, 'uplink');
});

socket.on('join', (id, role) => {
    // console.log('Joined:', id);
    console.log('Device connected:', role);

    if(role === 'webapp') {
        function sendMessage(msg) {
            console.log('Message:', Object.keys(msg), role);
            socket.emit('to', id, msg);
        }

        let cleanup = watchJournalDirectory((err, entries) => {
            if(err) return console.error(err.toString());

            console.log(entries.length, 'recent');

            sendMessage({
                journalEntries: entries,
            });
        });

        // findAllDiscoveries()
        //     .then(entries => {
        //         console.log(entries.length, 'discoveries');
        //         sendMessage({
        //             journalEntries: entries,
        //         });
        //     })
        //     .catch(err => console.error(err));

        socket.on('leave', _id => {
            console.log('Device disconnected:', role);
            if(_id === id) {
                cleanup();
            }
        });
    }
});

socket.on('msg', (msg, id) => {
    console.log(`Received (${id}):`, Object.keys(msg));

    if(msg.hasOwnProperty('overlay')) {
        (msg.overlay ? openOverlay() : closeOverlay())
            .catch(err => console.error(err));
    }
});

socket.on('disconnect', () => {
    console.log('Socket disconnected');
});

module.exports = {socket};