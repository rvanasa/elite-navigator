'use strict';

const fs = require('fs');
const axios = require('axios');
const msgpack = require('msgpack-lite');

console.log('Import data');
let modules = require('../data/eddb_modules.json');
let systems = require('../data/eddb_systems_populated.json');
let stations = require('../data/eddb_stations.json');
let edsmStations = require('../data/edsm_stations.json');
let rings = require('../data/eddn_system_body_rings.json');

let galaxy = {
    ships: {},
    modules: {},
    systems: {},
    stations: {},
    ringTypes: ['Rocky', 'Icy', 'Metallic', 'Metal Rich'],
    ringBodies: [],
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
        // let ship = galaxy.getShip(module.ship);
        let ship = galaxy.ships[module.ship.toLowerCase()];
        if(!ship) {
            ship = {
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
        ships: station.selling_ships,
        modules: station.selling_modules,
        starDistance: station.distance_to_star,
        planetary: station.is_planetary,
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
    
    let system = galaxy.systems[station.system_id];
    if(system) {
        system.stations.push(station.id);
        
        // system.stations.sort((a, b) => galaxy.stations[a].starDistance - galaxy.stations[b].starDistance);
    }
    else {
        break;
    }
    
    galaxy.stations[station.id] = station;
    
    // station._distanceModifier = station.starDistance * starDistanceFactor;
}

console.log('Stations (EDSM)');
for(let edsmStation of edsmStations) {
    let system = systemNameMap[edsmStation.system];
    if(!system) {
        // throw new Error('Unknown system: ' + edsmStation.system);
        break;
    }
    let station = system.stations.filter(station => station.name === edsmStation.name)[0];
    if(!station) {
        throw new Error('Unknown station: ' + system.name + ' : ' + edsmStation.name);
    }
    
    // let materialType =
    
    station.economies = [edsmStation.economy];
    if(edsmStation.secondEconomy) {
        station.economies.push(edsmStation.secondEconomy);
    }
    
    let edsmServices = edsmStation.otherServices;
    station.services.push(...[
        edsmServices.includes('Interstellar Factors Contact') && 'Interstellar Factors',
        edsmServices.includes('Technology Broker') && 'Technology Broker',
        edsmServices.includes('Material Trader') && (
            station.economies.includes('High Tech') ? 'Encoded'
                : ['Refinery', 'Extraction'].includes(station.economies[0]) ? 'Raw' : 'Manufactured' //TODO disambiguate
        ) + ' Material Trader',
    ].filter(s => s));
}

console.log('Rings');
for(let [systemName, bodyMap] of Object.entries(rings)) {
    let system = systemNameMap[systemName];
    if(system) {
        for(let [bodyName, body] of Object.entries(bodyMap)) {
            body = {
                $resolve: {
                    system: 'systems',
                },
                _type: 'body',
                name: (`${systemName} ${bodyName}`).trim(),
                system: system.id,
                starDistance: body.distance,
                rings: body.rings,
            };
            // body._distanceModifier = body.starDistance * starDistanceFactor;
            system.bodies.push(body);
            galaxy.ringBodies.push(body);
        }
    }
}

console.log('Export');
let data = JSON.stringify(galaxy, function(key, value) {
    if(key === '$resolve' && !(this in galaxy)) {
        throw new Error('Reference required for key: ' + key + ' {' + Object.keys(this).split(', ') + '}');
    }
});
fs.writeFileSync('../elite-navigator/public/data/galaxy.json', data);