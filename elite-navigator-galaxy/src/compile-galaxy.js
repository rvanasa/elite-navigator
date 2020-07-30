'use strict';

const fs = require('fs').promises;
const download = require('download');
const mkdirp = require('mkdirp');
const {gunzipSync} = require('zlib');

function getMaterialTraderType(station) {
    let [primary, secondary] = station.economies;
    if(primary === 'High Tech' || primary === 'Military') return 'Encoded';
    if(primary === 'Extraction' || primary === 'Refinery') return 'Raw';
    if(primary === 'Industrial') return 'Manufactured';
    if(secondary === 'High Tech' || secondary === 'Military') return 'Encoded';
    if(secondary === 'Extraction' || secondary === 'Refinery') return 'Raw';
    if(secondary === 'Industrial') return 'Manufactured';
    return null;
}

function getTechnologyBrokerType(station) {
    let [primary, secondary] = station.economies;
    if(primary === 'High Tech' || secondary === 'High Tech') return 'Guardian';
    if(primary === 'Industrial') return 'Human';
    if(primary === 'High Tech' || secondary === 'High Tech') return 'Guardian';
    // if(secondary && secondary !== 'High Tech') return 'Human';
    return null;
}

(async () => {
    mkdirp.sync('./data');

    console.log('Retrieve data');
    await Promise.all([
        ['https://eddb.io/archive/v6/modules.json', 'data/eddb_modules.json'],
        ['https://eddb.io/archive/v6/systems_populated.json', 'data/eddb_systems_populated.json'],
        ['https://eddb.io/archive/v6/stations.json', 'data/eddb_stations.json'],
        ['https://www.edsm.net/dump/stations.json.gz', 'data/edsm_stations.json.gz'],
    ].map(async ([url, path]) => {
        console.log(url);
        let result = await download(url);
        console.log('->', path);
        await fs.writeFile(path, result);
    }));

    console.log('Unpack data');
    await fs.writeFile('data/edsm_stations.json', gunzipSync(await fs.readFile('data/edsm_stations.json.gz')));

    console.log('Load data');
    let modules = await require('../data/eddb_modules.json');
    let systems = await require('../data/eddb_systems_populated.json');
    let stations = await require('../data/eddb_stations.json');
    let edsmStations = await require('../data/edsm_stations.json');
    let streamData = await require('../data/eddn_stream.json');

    let galaxy = {
        ships: {},
        modules: {},
        systems: {},
        stations: {},
        bodies: {},
    };

    let systemNameMap = {};

    console.log('Modules');
    for(let module of modules) {
        module = {
            $resolve: {
                ship: 'ships',
            },
            id: module.id,
            name: module.name || module.group.name,
            ship: module.ship,
            class: module.class,
            rating: module.rating,
            category: module.category,
            mode: module.weapon_mode,
        };

        galaxy.modules[module.id] = module;

        if(module.ship) {
            let ship = galaxy.ships[module.ship.toLowerCase()];
            if(!ship) {
                ship = {
                    $resolve: {},
                    name: module.ship,
                };
                galaxy.ships[ship.name.toLowerCase()] = ship;
            }
        }
    }

    console.log('Systems');
    for(let system of systems) {
        system = {
            $resolve: {
                stations: 'stations',
                bodies: 'bodies',
            },
            id: system.id,
            x: system.x,
            y: system.y,
            z: system.z,
            name: system.name,
            allegiance: system.allegiance,
            power: system.power,
            faction: system.controlling_minor_faction,
            powerState: system.power_state,
            states: system.states.map(state => state.name),
            reserveType: system.reserve_type,
            population: system.population,
            permitRequired: system.needs_permit,
            stations: [],
            bodies: [],
        };

        galaxy.systems[system.id] = system;
        systemNameMap[system.name.toLowerCase()] = system;

        // galaxy.systems[system.name.toLowerCase()] = system;
        // galaxy._sortedSystems.push(system);

        // system.children = [];////
    }

    console.log('Stations (EDDB)');
    for(let station of stations) {
        station = {
            $resolve: {
                system: 'systems',
                ships: 'ships',
                modules: 'modules',
            },
            id: station.id,
            name: station.name,
            type: station.type,
            system: station.system_id,
            ships: station.selling_ships.map(s => s.toLowerCase()),
            modules: station.selling_modules,
            padSize: station.max_landing_pad_size,
            starDistance: station.distance_to_star,
            planetary: station.is_planetary,
            // economies: station.economies,
            economies: [],
            services: [
                station.has_refuel && 'Refuel',
                station.has_repair && 'Repair',
                station.has_rearm && 'Rearm',
                station.has_outfitting && 'Outfitting',
                station.has_shipyard && 'Shipyard',
                station.has_market && 'Market',
                station.has_blackmarket && 'Black Market',
            ].filter(s => s),
        };

        if(!station.type || station.type === 'Fleet Carrier') {
            continue;
        }

        let system = galaxy.systems[station.system];
        if(!system) {
            throw new Error('Unknown system: ' + station.system + ' (' + station.name + ')');
        }
        system.stations.push(station.id);

        galaxy.stations[station.id] = station;

        // station._distanceModifier = station.starDistance * starDistanceFactor;
    }

    console.log('Stations (EDSM)');
    for(let edsmStation of edsmStations) {

        if(!edsmStation.type || edsmStation.type === 'Fleet Carrier' || edsmStation.type === 'Mega ship') {
            continue;
        }

        let system = systemNameMap[edsmStation.systemName.toLowerCase()];
        if(!system) {
            console.error('>> Unknown star system: ' + edsmStation.systemName + ' (' + edsmStation.name + ')');
            continue;
        }
        let station = galaxy.stations[system.stations.filter(station => galaxy.stations[station].name === edsmStation.name)[0]];
        if(!station) {
            console.error('>> Unknown station:', edsmStation.name, ':', edsmStation.type);
            continue;
        }

        station.economies = [edsmStation.economy];
        if(edsmStation.secondEconomy) {
            station.economies.push(edsmStation.secondEconomy);
        }

        let edsmServices = edsmStation.otherServices;
        station.services.push(...[
            edsmServices.includes('Interstellar Factors Contact') && 'Interstellar Factors',
            edsmServices.includes('Technology Broker') && ((getTechnologyBrokerType(station) || '') + ' Technology Broker').trim(),
            edsmServices.includes('Material Trader') && ((getMaterialTraderType(station) || '') + ' Material Trader').trim(),
        ].filter(s => s));
    }

    console.log('Rings');
    for(let [systemName, bodyMap] of Object.entries(streamData.rings)) {
        let system = systemNameMap[systemName.toLowerCase()];
        if(system) {
            for(let [bodyName, body] of Object.entries(bodyMap)) {
                body = {
                    $resolve: {
                        system: 'systems',
                    },
                    name: `${systemName} ${bodyName}`.trim(),
                    system: system.id,
                    starDistance: body.distance,
                    rings: body.rings,
                };
                let id = body.name.toLowerCase();
                galaxy.bodies[id] = body;
                system.bodies.push(id);
            }
        }
    }

    console.log('Export');
    let data = JSON.stringify(galaxy, function(key, value) {
        if(value && value.$resolve && !Object.values(galaxy).includes(this)) {
            throw new Error(`Reference required for object with key '${key}' in (${Object.keys(this).join(', ')})`);
        }
        return value;
    });
    await fs.writeFile('../elite-navigator-web/public/data/galaxy.json', data);

})().catch(err => console.error(err) & process.exit(1));
