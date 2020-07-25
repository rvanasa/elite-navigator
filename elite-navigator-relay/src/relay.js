'use strict';

const http = require('http');
const {Room} = require('./room');

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
    let room, role;

    console.log(display(socket.id), 'connected:');

    socket.on('join', (name, newRole) => {
        name = name || 'default';
        role = newRole || 'default';

        if(room) {
            room.delete(socket);
        }
        room = joinRoom(socket, name, role);

        console.log('[join]', display(socket.id), '=>', room.name);

        for(let r of room.getRoles()) {
            for(let s of room.getAllByRole(r)) {
                if(s.id !== socket.id) {
                    s.emit('join', socket.id, role);
                    socket.emit('join', s.id, r);
                }
            }
        }
    });

    socket.on('msg', (msg, target) => {
        if(room) {
            console.log('[msg]', display(socket.id), role, '::', typeof msg, msg && Object.keys(msg), target);

            for(let s of room.getAllByRole(target)) {
                if(s.id !== socket.id) {
                    console.log('[msg] >', display(s.id));

                    s.emit('msg', msg, socket.id, role);
                }
            }
        }
    });

    socket.on('to', (id, msg) => {
        if(room) {
            console.log('[to]', display(socket.id), '->', display(id), '::', typeof msg, msg && Object.keys(msg));

            for(let s of room.getAll()) {
                if(s.id === id) {
                    console.log('[to] >', display(s.id));

                    s.emit('msg', msg, socket.id, role);
                }
            }
        }
    });

    socket.on('disconnect', () => {
        if(room) {
            console.log('[leave]', display(socket.id));

            room.remove(socket);
            for(let s of room.getAll()) {
                if(s.id !== socket.id) {
                    s.emit('leave', socket.id, role);
                }
            }
        }
    });
});

function joinRoom(socket, name, role) {
    let room = getRoom(socket, name);
    room.add(socket, role);
    return room;
}

function getRoom(socket, name) {

    let parts = socket.request.headers['x-forwarded-for'].split(',');
    let ip = parts[parts.length - 1];

    name = ip + '/' + name;

    return rooms.hasOwnProperty(name) ? rooms[name] : (rooms[name] = new Room(name));
}

app.listen(process.env.PORT || 8080);
