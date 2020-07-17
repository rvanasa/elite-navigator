import axios from 'axios';
import {setupCache} from 'axios-cache-adapter';

const cache = setupCache({
    maxAge: 1000 * 60 * 4,
});

const api = axios.create({
    adapter: cache.adapter,
});

const apiPath = '__data';

const starDistanceFactor = 1e-4;

let currentGalaxy = null;

class Galaxy {
    constructor() {
        this.ships = {};
        this.modules = {};
        this.systems = {};
        this.stations = {};
        
        this.ringTypes = ['Rocky', 'Icy', 'Metallic', 'Metal Rich'];
        this.ringBodies = [];
        
        this.searchOptions = [];
        
        this._relativeSystem = null;
        this._sortedSystems = [];
    }
    
    _getSearchTerms(text) {
        if(!text) {
            return [];
        }
        return [...new Set(text.toString().toLowerCase().replace(/[^a-z0-9 ]/, ' ').split(' ').map(s => s.trim()).filter(s => !!s))].sort();
    }
    
    _register(type, option) {
        option._type = type;
        option._searchTerms = [
            ...new Set([option.name, ...Object.values(option.attributes).filter(v => typeof v === 'string')]
                .filter(s => !!s)
                .flatMap(s => this._getSearchTerms(s))
                .map(s => s.trim())
                .filter(s => s))
        ].sort();
        this.searchOptions.push(option);
        return option;
    }
    
    _resolve(dict, key) {
        return (typeof key === 'string' ? dict[key.toLowerCase()] : typeof key === 'number' ? dict[key] : key) || null;
    }
    
    getShip(ship) {
        return this._resolve(this.ships, ship);
    }
    
    getModule(module) {
        return this._resolve(this.modules, module);
    }
    
    getSystem(system) {
        return this._resolve(this.systems, system);
    }
    
    getStation(station) {
        if(Array.isArray(station)) {
            let system = this.getSystem(station[0]);
            return (system && system.stations[station[1]]) || null;
        }
        return this._resolve(this.stations, station);
    }
    
    getDistanceBetweenSystems(a, b) {
        let [dx, dy, dz] = [a.x - b.x, a.y - b.y, a.z - b.z];
        return Math.round(Math.sqrt(dx ** 2 + dy ** 2 + dz ** 2));
    }
    
    getRelativeSystem() {
        return this._relativeSystem;
    }
    
    setRelativeSystem(system) {
        system = this.getSystem(system);
        if(this._relativeSystem === system) {
            return system;
        }
        this._relativeSystem = system;
        let updateDistance = (d, s) => {
            d *= 1 + (s._distanceModifier || 0);
            // if(s.name === 'Sol') {
            //     console.log(d, s._currentDistance, s._distanceModifier || 0);///////////////////////
            // }
            s._currentDistance = d;
            if(s.children) {
                s.children.forEach(c => updateDistance(d, c));
            }
        };
        this._sortedSystems.forEach(s => updateDistance(system ? this.getDistanceBetweenSystems(system, s) : 0, s));
        this._sortedSystems.sort((a, b) => system ? a._currentDistance - b._currentDistance : a.name - b.name);
        
        this.ringBodies.sort((a, b) => a._currentDistance - b._currentDistance);
        return system;
    }
    
    getNearestStations(filterFn, count) {
        let results = [];
        if(arguments.length < 2) {
            count = Number.POSITIVE_INFINITY;
        }
        else if(count <= 0) {
            return results;
        }
        for(let system of this._sortedSystems) {
            for(let station of system.stations) {
                if(filterFn(station)) {
                    results.push(station);
                    if(results.length >= count) {
                        break;
                    }
                }
            }
        }
        return results;
    }
    
    getNearestRingBodies(type, count) {
        let results = [];
        if(count <= 0) {
            return results;
        }
        for(let body of this.ringBodies) {
            if(body.rings) {
                for(let ring of body.rings) {
                    if(ring.type === type) {
                        results.push(body);
                        break;
                    }
                }
                if(results.length >= count) {
                    break;
                }
            }
        }
        return results;
    }
    
    _isSearchRelevant(query, text) {
        if(!query || !text) {
            return !!query;
        }
        let queryTerms = this._getSearchTerms(query);
        let textTerms = this._getSearchTerms(text);
        return queryTerms.some(q => textTerms.some(t => t.startsWith(q)));
    }
    
    search(query) {
        if(!query.trim()) {
            return [];
        }
        let matches = this.searchOptions.filter(opt => opt.name && opt.name.toLowerCase() === query);
        let results = [];
        let terms = this._getSearchTerms(query);
        if(!terms.length) {
            return results;
        }
        
        let minTermLen = 3 - terms.length;
        let opts = this.searchOptions;
        let optsLen = opts.length;
        let termsLen = terms.length;
        for(let i = 0; i < optsLen; i++) {
            let opt = opts[i];
            let hasAllTerms = true;
            for(let j = 0; j < termsLen; j++) {
                let term = terms[j];
                let termLen = term.length;
                if(termLen < minTermLen) {
                    termLen = minTermLen;
                }
                
                let optTerms = opt._searchTerms;
                let optTermsLen = optTerms.length;
                
                let foundTerm = false;
                for(let k = 0; k < optTermsLen; k++) {
                    let optTerm = optTerms[k].substring(0, termLen);
                    if(optTerm === term) {
                        foundTerm = true;
                    }
                    if(optTerm >= term) {
                        break;
                    }
                }
                if(!foundTerm) {
                    hasAllTerms = false;
                    break;
                }
            }
            if(hasAllTerms && !matches.includes(opt)) {
                results.push(opt);
            }
        }
        
        results.sort((a, b) => (a._currentDistance || 0) - (b._currentDistance || 0));
        return [...matches, ...results];
    }
}

function getModuleAttributes() {
    return {
        'Group': this.groupName,
        'Class': `${this.class}${this.rating}`,
        'Ship': this.ship && this.ship.name,
        'Category': this.category,
        'Mode': this.mode,
    };
}

function getShipAttributes() {
    return {};
}

function getSystemAttributes() {
    return {
        'Allegiance': this.allegiance,
        'Power': this.power,
        // 'Minor faction': this.faction,
        'Power state': this.powerState,
        'System state': this.states.join(', '),
        'Resources': this.reserveType,
        'Habitation': this.population ? 'Populated' : 'Unpopulated',
        'Population': this.population,
    };
}

function getStationAttributes() {
    return {
        'Type': this.Type,
        'Services': this.services.join(', '),
    };
}

export async function requestGalaxy() {
    let [modules, systems, stations, rings] = [
        await api.get(apiPath + '/modules.json'),
        await api.get(apiPath + '/systems_populated.json'),
        await api.get(apiPath + '/stations.json'),
        await api.get(apiPath + '/system_body_rings.json'),
    ].map(res => res.data);
    
    let galaxy = new Galaxy();
    
    for(let module of modules) {
        module = {
            id: module.id,
            name: module.name || module.group.name,
            ship: module.ship,
            class: module.class,
            rating: module.rating,
            category: module.category,
            mode: module.weapon_mode,
        };
        Object.defineProperty(module, 'attributes', {get: getModuleAttributes});
        
        galaxy.modules[module.id] = module;
        
        if(module.ship) {
            let ship = galaxy.getShip(module.ship);
            if(!ship) {
                ship = {
                    name: module.ship,
                };
                Object.defineProperty(ship, 'attributes', {get: getShipAttributes});
                galaxy.ships[ship.name.toLowerCase()] = ship;
                galaxy._register('ship', ship);
            }
            module.ship = ship;
            // ship.modules.push(module);
        }
        
        galaxy._register('module', module);
    }
    for(let system of systems) {
        system = {
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
        };
        Object.defineProperty(system, 'attributes', {get: getSystemAttributes});
        
        galaxy.systems[system.id] = system;
        galaxy.systems[system.name.toLowerCase()] = system;
        galaxy._sortedSystems.push(system);
        
        system.stations = [];
        system.children = [];////
        
        galaxy._register('system', system);
    }
    for(let station of stations) {
        station = {
            id: station.id,
            name: station.name,
            type: station.type,
            system: galaxy.getSystem(station.system_id),
            ships: station.selling_ships.map(id => galaxy.getShip(id)),
            modules: station.selling_modules.map(id => galaxy.getModule(id)),
            starDistance: station.distance_to_star,
            planetary: station.is_planetary,
            services: [
                station.has_refuel && 'Refuel',
                station.has_repair && 'Repair',
                station.has_rearm && 'Rearm',
                station.has_market && 'Market',
                station.has_blackmarket && 'Black Market',
                station.has_outfitting && 'Outfitting',
                station.has_shipyard && 'Shipyard',
            ].filter(s => s),
        };
        Object.defineProperty(station, 'attributes', {get: getStationAttributes});
        
        galaxy.stations[station.id] = station;
        
        if(station.system) {
            station.system.children.push(station);////
            station.system.stations.push(station);
            station.system.stations.sort((a, b) => a.starDistance - b.starDistance);
        }
        
        station._distanceModifier = station.starDistance * starDistanceFactor;
        
        galaxy._register('station', station);
    }
    for(let [systemName, bodyMap] of Object.entries(rings)) {
        let system = galaxy.getSystem(systemName);
        if(system) {
            for(let [bodyName, body] of Object.entries(bodyMap)) {
                body = {
                    _type: 'body',
                    name: (`${systemName} ${bodyName}`).trim(),
                    system: system,
                    starDistance: body.distance,
                    rings: body.rings,
                };
                body._distanceModifier = body.starDistance * starDistanceFactor;
                system.children.push(body);
                galaxy.ringBodies.push(body);
            }
        }
    }
    return galaxy;
}

export async function findGalaxy() {
    if(!currentGalaxy) {
        currentGalaxy = requestGalaxy();
    }
    return currentGalaxy;
}
