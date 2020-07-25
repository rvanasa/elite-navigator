import io from 'socket.io-client';
import {EventEmitter} from 'events';

const relayAddress = 'https://elite-navigator.herokuapp.com';

let currentConnection = null;
let pendingPromise = null;

// export function getCurrentConnection() {
//     return currentConnection;
// }

export async function tryConnect(roomName) {
    roomName = roomName || 'elite-navigator';///

    if(currentConnection) {
        currentConnection.close();
    }

    currentConnection = null;
    pendingPromise = new Promise((resolve, reject) => {

        let events = new EventEmitter();

        let socket = io.connect(relayAddress);
        currentConnection = socket;

        let sources = new Set();

        socket.on('connect', () => {
            console.log('Connected');

            socket.emit('join', roomName, 'webapp');

            let visibilityListener = () => {
                if(socket !== currentConnection) {
                    document.removeEventListener('visibilitychange', visibilityListener);
                    return;
                }
                if(document.visibilityState === 'visible' && !socket.connected) {
                    socket.connect();
                }
            };
            document.addEventListener('visibilitychange', visibilityListener);

            // pendingAddress = pendingPromise = null;
            resolve(events);
        });

        socket.on('join', (id, role) => {
            console.log('Joined:', id, ':', role);

            if(role === 'uplink') {
                sources.add(id);
            }
        });

        socket.on('leave', id => {
            console.log('Left:', id);

            if(sources.has(id)) {
                sources.delete(id);

                if(!sources.size) {
                    events.emit('data', {resetPlayer: true});
                }
            }
        });

        socket.on('msg', (msg, id, role) => {
            console.log('>', id, msg, role);

            events.emit('msg', msg, id, role);
        });

        socket.on('error', err => {
            console.error(err);

            // pendingAddress = pendingPromise = null;
            reject(err);
        });

        socket.on('disconnect', () => {
            console.log('Disconnected');

            events.emit('data', {resetPlayer: true});
        });

        events.on('msg', (...args) => {
            socket.emit('msg', ...args);
        });
    });
    return pendingPromise;
}