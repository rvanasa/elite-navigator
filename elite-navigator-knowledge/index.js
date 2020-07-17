'use strict';

const fs = require('fs');
const binarySearch = require('binary-search');

const {requestConnection} = require('./src/eddn-stream');

let populatedSystems = JSON.parse(fs.readFileSync('../elite-navigator/public/__data/systems_populated.json').toString('utf8'))
    .map(system => system.name.toLowerCase())
    .sort();

function isPopulated(system) {
    if(!system) {
        return;
    }
    return !!binarySearch(populatedSystems, system.toLowerCase(), (a, b) => a - b);
}

let ringPath = '../elite-navigator-util/data/system_body_rings.json';
let ringMap = fs.existsSync(ringPath) ? JSON.parse(fs.readFileSync(ringPath).toString('utf8')) : {};

setInterval(() => {
    fs.writeFileSync(ringPath, JSON.stringify(ringMap));
    console.log('Exported JSON');
}, 1000 * 60);

async function run() {
    let eddn = requestConnection();
    eddn.on('error', err => console.error(err));
    eddn.on('entry', entry => {
        
        if(entry.event === 'Scan' && entry.Rings) {
            let systemName = entry.StarSystem;
            if(!isPopulated(systemName)) {
                return;
            }
            
            let bodyName = entry.BodyName.replace(systemName, '').trim();
            let rings = entry.Rings.map(ring => ({
                name: ring.Name.replace(entry.BodyName, '').trim(),
                type: ring.RingClass
                    .replace('eRingClass_', '')
                    .replace('MetalRich', 'Metal Rich')
                    .replace('Metal' + 'ic', 'Metallic'),
            }));
            
            console.log(systemName, bodyName, rings);
            
            (ringMap[entry.StarSystem] || (ringMap[entry.StarSystem] = {}))[bodyName] = {
                distance: Math.round(entry.Periapsis),
                rings: rings,
            };
        }
    });
}

run().catch(err => console.error(err));
