'use strict';

const http = require('http');
const fs = require('fs');

const app = http.createServer((req, res) => {
    res.writeHead(404, {'Content-Type': 'text/html'});
    res.end();
});

const io = require('socket.io')(app, {cookie: false});

const rooms = {};

function display(id) {
    return id && id.substring(0, 4);
}

io.on('connection', socket => {
    let room;

    console.log(display(socket.id), 'connected', '(' + socket.request.connection.remoteAddress + ')');

    socket.on('join', name => {
        name = (name || 'default').toLowerCase();

        if(room) {
            room.delete(socket);
        }
        room = joinRoom(socket, name);
        for(let s of room) {
            if(s.id !== socket.id) {
                s.emit('join', socket.id);
                socket.emit('join', s.id);
            }
        }
        console.log('[join]', display(socket.id), '=>', name);
    });

    socket.on('msg', data => {
        if(room) {
            console.log('[msg]', display(socket.id), '::', typeof data, data && Object.keys(data));

            for(let s of room) {
                if(s.id !== socket.id) {
                    console.log('[msg] >', display(s.id));

                    s.emit('msg', data, socket.id);
                }
            }
        }
    });

    socket.on('to', (id, data) => {
        if(room) {
            console.log('[to]', display(socket.id), '->', display(id), '::', typeof data, data && Object.keys(data));

            for(let s of room) {
                if(s.id === id) {
                    console.log('[to] >');

                    s.emit('msg', data, socket.id);
                }
            }
        }
    });

    socket.on('disconnect', () => {
        if(room) {
            room.delete(socket);
            for(let s of room) {
                if(s.id !== socket.id) {
                    s.emit('leave', socket.id);
                }
            }
        }
        console.log('[leave]', display(socket.id));
    });
});

function joinRoom(socket, id) {
    let room = getRoom(socket, id);
    room.add(socket);
    return room;
}

function getRoom(socket, name) {
    // id = socket.handshake.address + ':' + id;

    let parts = socket.request.headers['x-forwarded-for'].split(',');
    let ip = parts[parts.length - 1];

    console.log('~~~', display(socket.id), '/', ip, '/', name);////////

    name = ip + '/' + name;

    return rooms[name] || (rooms[name] = new Set());
}

app.listen(process.env.PORT || 8080);
