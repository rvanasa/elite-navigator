'use strict';

const fs = require('fs');
const binarySearch = require('binary-search');

const {requestConnection} = require('./src/eddn-stream');

let dataDir = '../elite-navigator-galaxy/data';

let populatedSystems = JSON.parse(fs.readFileSync(`${dataDir}/eddb_systems_populated.json`).toString('utf8'))
    .map(system => system.name.toLowerCase())
    .sort();

function isPopulated(system) {
    if(!system) {
        return;
    }
    return !!binarySearch(populatedSystems, system.toLowerCase(), (a, b) => a - b);
}

let ringPath = `${dataDir}/eddn_stream.json`;
let data = fs.existsSync(ringPath) ? JSON.parse(fs.readFileSync(ringPath).toString('utf8')) : {
    rings: {},
};

setInterval(() => {
    fs.writeFileSync(ringPath, JSON.stringify(data));
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

            (data.rings[entry.StarSystem] || (data.rings[entry.StarSystem] = {}))[bodyName] = {
                distance: Math.round(entry.DistanceFromArrivalLS),
                rings: rings,
            };
        }
    });
}

run().catch(err => console.error(err));
