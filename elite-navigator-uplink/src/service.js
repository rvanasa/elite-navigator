'use strict';

const fs = require('fs');
const chokidar = require('chokidar');
const {Tail} = require('tail');
const debounce = require('debounce');
const stringHash = require('string-hash');
const path = require('path');

const directory = `${process.env.USERPROFILE}/Saved Games/Frontier Developments/Elite Dangerous`;

module.exports = {
    watchJournalDirectory(callback) {
        let logQueue = [];
        
        let collectLogEntries = debounce(() => {
            console.log(logQueue.length);/////
            callback(null, {addLogEntries: logQueue});
            logQueue.length = 0;
        }, 100);
        
        function onLogEntry(err, entry) {
            if(err) return callback(err);
            logQueue.push(entry);
            collectLogEntries();
        }
        
        let tails = [];
        
        let currentFiles = fs.readdirSync(directory).filter(f => f.endsWith('.log'));
        currentFiles.slice(-1)
            .forEach(f => tails.push(module.exports.watchLogFile(f, onLogEntry)));
        
        let stream = chokidar.watch(directory + '/*.log')
            .on('add', (filePath) => {
                let filename = path.basename(filePath);
                if(currentFiles.includes(filename)) {
                    return;
                }
                console.log('New log file:', filename);
                try {
                    cleanupStreams.push(module.exports.watchLogFile(filename, onLogEntry));
                }
                catch(e) {
                    callback(e);
                }
            });
        
        return async () => {
            tails.forEach(tail => tail.unwatch());
            await stream.close();
        };
    },
    watchLogFile(filename, callback) {
        let tail = new Tail(directory + '/' + filename, {fromBeginning: true});
        
        tail.on('line', line => {
            try {
                let entry = JSON.parse(line);
                entry.uid = stringHash(line);
                callback(null, entry);
            }
            catch(e) {
                callback(e);
            }
        });
        
        tail.on('error', err => {
            callback(err);
        });
        
        return tail;
    },
};
