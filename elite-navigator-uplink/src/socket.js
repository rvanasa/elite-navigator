'use strict';

const {overlayEvents, openOverlay, closeOverlay, isOverlayActive} = require('./overlay');
const {watchJournalDirectory, findAllDiscoveries} = require('./service');

let socket = require('socket.io-client').connect('https://elite-navigator.herokuapp.com');

let defaultRoom = 'elite-navigator';

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
            socket.emit('to', id, msg);
            console.log('Sent:', Object.keys(msg), role);
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

        function notifyOverlay() {
            let overlay = isOverlayActive();
            sendMessage({overlay}, 'webapp');
        }

        notifyOverlay();
        overlayEvents.on('opened', notifyOverlay);
        overlayEvents.on('closed', notifyOverlay);

        socket.on('leave', _id => {
            console.log('Device disconnected:', role);
            if(_id === id) {
                overlayEvents.off('opened', notifyOverlay);
                overlayEvents.off('closed', notifyOverlay);
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