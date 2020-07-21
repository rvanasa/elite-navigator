import axios from 'axios';
import {setupCache} from 'axios-cache-adapter';

const cache = setupCache({
    maxAge: 1000 * 60 * 4,
});

const api = axios.create({
    adapter: cache.adapter,
});

const starDistanceFactor = 1e-4;

class Galaxy {
    constructor(data) {
        this.ships = data.ships;
        this.modules = data.modules;
        this.systems = data.systems;
        this.stations = data.stations;
        this.bodies = data.bodies;
        
        console.assert(Object.keys(data).every(k => this.hasOwnProperty(k)));
        
        this.materialTypes = ['Raw', 'Manufactured', 'Encoded'];
        this.ringTypes = ['Rocky', 'Icy', 'Metallic', 'Metal Rich'];
        
        this.searchOptions = [];
        
        this._relativeSystem = null;
        this._sortedSystems = [];
        this._sortedStations = [];
        this._sortedBodies = [];
    }
    
    _getSearchTerms(text) {
        if(!text) {
            return [];
        }
        return [...new Set(text.toString().toLowerCase().replace(/[^a-z0-9 ]/, ' ').split(' ').map(s => s.trim()).filter(s => !!s))].sort();
    }
    
    _registerSearch(type, option) {
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
    
    getBody(body) {
        return this._resolve(this.bodies, body);
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
            if(s._children) {
                s._children.forEach(c => updateDistance(d, c));
            }
        };
        this._sortedSystems.forEach(s => updateDistance(system ? this.getDistanceBetweenSystems(system, s) : 0, s));
        this._sortedSystems.sort((a, b) => system ? a._currentDistance - b._currentDistance : a.name - b.name);
        
        this._sortedStations.sort((a, b) => system ? a._currentDistance - b._currentDistance : a.name - b.name);
        
        this._sortedBodies.sort((a, b) => system ? a._currentDistance - b._currentDistance : a.name - b.name);
        return system;
    }
    
    getNearestSystems(filterFn, count) {
        let results = [];
        if(arguments.length < 2) {
            count = Number.POSITIVE_INFINITY;
        }
        else if(count <= 0) {
            return results;
        }
        if(!filterFn) {
            return this._sortedSystems.slice(0, count);
        }
        for(let system of this._sortedSystems) {
            if(filterFn(system)) {
                results.push(system);
                if(results.length >= count) {
                    break;
                }
            }
        }
        return results;
    }
    
    getNearestStations(filterFn, count) {
        let results = [];
        if(arguments.length < 2) {
            count = Number.POSITIVE_INFINITY;
        }
        else if(count <= 0) {
            return results;
        }
        if(!filterFn) {
            return this._sortedStations.slice(0, count);
        }
        for(let station of this._sortedStations) {
            if(filterFn(station)) {
                results.push(station);
                if(results.length >= count) {
                    break;
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
        for(let body of this._sortedBodies) {
            if(body.rings) {
                for(let ring of body.rings) {
                    if(!type || ring.type === type) {
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

function getShipAttributes() {
    return {
    };
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
        'Economy': this.economies.join(', '),
        'Services': this.services.join(', '),
    };
}

function prepareData(data) {
    for(let items of Object.values(data)) {
        for(let item of Object.values(items)) {
            for(let [key, ref] of Object.entries(item.$resolve)) {
                let value = item[key];
                if(Array.isArray(value)) {
                    item[key] = value.map(v => data[ref][v]);
                }
                else {
                    item[key] = data[ref][value];
                }
            }
        }
    }
    return data;
}

export async function loadGalaxy() {
    console.log('Loading galaxy...');
    
    let data = prepareData((await api.get('data/galaxy.json')).data);
    
    let galaxy = new Galaxy(data);
    
    for(let ship of Object.values(galaxy.ships)) {
        // ship._type = 'ship';////
    
        Object.defineProperty(ship, 'attributes', {get: getShipAttributes});
        
        galaxy._registerSearch('ship', ship);
    }
    for(let module of Object.values(galaxy.modules)) {
        Object.defineProperty(module, 'attributes', {get: getModuleAttributes});
        
        galaxy._registerSearch('module', module);
    }
    for(let system of Object.values(galaxy.systems)) {
        Object.defineProperty(system, 'attributes', {get: getSystemAttributes});
        
        galaxy.systems[system.name.toLowerCase()] = system;////
        galaxy._sortedSystems.push(system);
        
        system.stations.sort((a, b) => a.starDistance - b.starDistance);///
        system.bodies.sort((a, b) => a.starDistance - b.starDistance);///
        
        system._children = [...system.stations, ...system.bodies]
            .sort((a, b) => a.starDistance - b.starDistance);///
        
        galaxy._registerSearch('system', system);
    }
    for(let station of Object.values(galaxy.stations)) {
        Object.defineProperty(station, 'attributes', {get: getStationAttributes});
        
        galaxy._sortedStations.push(station);
        
        station._distanceModifier = station.starDistance * starDistanceFactor;
        
        galaxy._registerSearch('station', station);
    }
    for(let body of Object.values(data.bodies)) {
        body._type = 'body'; ////////
        
        galaxy._sortedBodies.push(body);
        
        body._distanceModifier = body.starDistance * starDistanceFactor;
    }
    return galaxy;
}

let currentGalaxyPromise = null;

export async function findGalaxy() {
    if(!currentGalaxyPromise) {
        currentGalaxyPromise = loadGalaxy();
    }
    return currentGalaxyPromise;
}
