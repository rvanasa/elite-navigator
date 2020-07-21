'use strict';

const {watchJournalDirectory, findAllDiscoveries} = require('./service');
const {v4} = require('internal-ip');

let port = 4777;

let app = require('express')();
let server = require('http').createServer(app);
let io = require('socket.io')(server);

server.listen(port, () => {
    console.log('Listening on port', port);
    console.log('Connect via localhost or IP address:', v4.sync());
});

io.on('connection', conn => {
    console.log('Connected');

    function sendMessage(message) {
        console.log('Message:', Object.keys(message));
        conn.emit('message', message);
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

    // let discoveryPromise = null;

    // conn.on('request_discoveries', () => {
    //     console.log('Requesting discoveries');
    //
    //     if(!discoveryPromise) {
    //         discoveryPromise = findAllDiscoveries();
    //     }
    //
    //     discoveryPromise
    //         .then(entries => {
    //             console.log(entries.length, 'discoveries');
    //             sendMessage({
    //                 addDiscoveries: entries,
    //             });
    //         })
    //         .catch(err => console.error(err));
    //
    // });

    conn.on('disconnect', () => {
        cleanup();
        console.log('Disconnected');
    });
});
