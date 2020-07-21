import io from 'socket.io-client';

const defaultHost = '127.0.0.1';
const defaultPort = 4777;

let currentConnection = null;
let pendingAddress = null;
let pendingPromise = null;

// export function getCurrentConnection() {
//     return currentConnection;
// }

export async function tryConnect(address) {
    address = address.replace('ws://', '');
    if (!address) {
        address = defaultHost;
    }
    if (!address.includes(':')) {
        address += ':' + defaultPort;
    }
    address = 'ws://' + address;
    if (address === pendingAddress && pendingPromise) {
        return pendingPromise;
    }
    if (currentConnection) {
        currentConnection.close();
    }
    currentConnection = null;
    pendingAddress = address;
    pendingPromise = new Promise((resolve, reject) => {
        let connection = io.connect(address);
        currentConnection = connection;

        connection.on('connect', () => {
            console.log('Connected');

            let visibilityListener = () => {
                if (connection !== currentConnection) {
                    document.removeEventListener('visibilitychange', visibilityListener);
                    return;
                }
                if (document.visibilityState === 'visible' && !connection.connected) {
                    connection.connect();
                }
            };
            document.addEventListener('visibilitychange', visibilityListener);

            pendingAddress = pendingPromise = null;
            resolve(connection);
        });

        connection.on('error', err => {
            pendingAddress = pendingPromise = null;
            reject(err);
        });

        connection.on('disconnect', () => {
            console.log('Disconnected');
        });
    });
    return pendingPromise;
}