import {sentenceCase} from 'change-case';

const currentSystemEvents = ['Location', 'FSDJump', 'CarrierJump'];

export class Player {
    constructor() {
        this.name = null;
        this.journal = [];
        this.discoveries = [];
        // this.timestamp = null;

        // this.hasExtendedJournal = false;

        this._currentSystem = null;
    }

    getLatest(event) {
        for(let entry of this.journal) {
            if(entry.event === event) {
                return entry;
            }
        }
    }

    // getCurrentMaterials() {
    //     let entry = this.getLatest('Materials');
    //     return entry && ['Raw', 'Manufactured', 'Encoded']
    //         .flatMap(type => entry[type].map(mat => [type, mat.Name, mat.Name_Localized, mat.Count]));
    // }

    getCurrentSystem(galaxy) {
        return this._currentSystem && (galaxy.getSystem(this._currentSystem.name) || this._currentSystem);
    }

    update(data) {
        if(data.journalEntries) {
            data.journalEntries.forEach(entry => {
                entry.timestamp = new Date(entry.timestamp).getTime();
                let index = this.journal.findIndex(e => e.uid && e.uid === entry.uid);
                if(index !== -1) {
                    this.journal[index] = entry;
                }
                else {
                    this.journal.unshift(entry);
                }

                if(entry.hasOwnProperty('WasDiscovered') && !entry.WasDiscovered && !entry.WasMapped) {
                    index = this.discoveries.findIndex(e => e.BodyName === entry.BodyName);
                    if(index !== -1) {
                        let other = this.discoveries[index];
                        if((entry.timestamp === other.timestamp ? entry.uid > other.uid : entry.timestamp > other.timestamp) && (entry.TerraformState || !other.TerraformState)) {
                            this.discoveries[index] = entry;
                        }
                    }
                    else {
                        this.discoveries.unshift(entry);
                    }
                }
            });
            this.journal = this.journal.sort((a, b) => -(a.timestamp === b.timestamp ? a.uid - b.uid : a.timestamp - b.timestamp));

            this.discoveries = this.discoveries.sort((a, b) => -(a.timestamp === b.timestamp ? a.uid - b.uid : a.timestamp - b.timestamp));//////////

            // console.log(this.discoveries.filter(d=>d.TerraformState))///////

            let commanderEntry = this.getLatest('Commander');
            this.name = commanderEntry ? commanderEntry.Name : null;
        }

        // this.discoveries = this.journal.filter(entry => String(entry.WasDiscovered) === 'false');

        this._currentSystem = null;
        for(let entry of this.journal) {
            if(currentSystemEvents.includes(entry.event)) {
                this._currentSystem = {
                    _type: 'system',
                    name: entry.StarSystem || entry.SystemName,
                    x: entry.StarPos[0],
                    y: entry.StarPos[1],
                    z: entry.StarPos[2],
                    population: entry.Population,
                    states: [],
                    stations: [],
                    bodies: [],
                    attributes: {},
                };
                break;
            }
        }
    }
}

export function createBodyFromJournalEntry(entry) {
    return {
        _type: 'body',
        id: entry.BodyID,
        name: entry.Body || entry.BodyName,
        type: entry.PlanetClass || (entry.StarType && `${entry.StarType + entry.Subclass}-${entry.Luminosity} star`),
        system: entry.StarSystem,
        rings: entry.Rings && entry.Rings.map(ring => ({
            name: ring.Name.replace(entry.BodyName, '').trim(),
            type: ring.RingClass
                .replace('eRingClass_', '')
                .replace('MetalRich', 'Metal Rich')
                // eslint-disable-next-line no-useless-concat
                .replace('Metal' + 'ic', 'Metallic'),
        })),
        // starDistance: Math.round(entry.DistanceFromArrivalLS),
        firstDiscovered: !entry.WasDiscovered && !entry.WasMapped,
        attributes: {
            'Type': entry.PlanetClass,
            'Earth masses': entry.MassEM,
            'Atmosphere': sentenceCase(entry.Atmosphere || ''),
            'Volcanism': sentenceCase(entry.Volcanism || ''),
            'Landable': entry.Landable && 'Landable',
            'State': entry.TerraformState,
            'First Discovered': entry.firstDiscovered && 'First Discovered',
        },
    };
}

export function createShipFromJournalEntry(entry) {
    return {
        _type: 'ship',
        name: entry.Ship_Localised,
        pilot: entry.PilotName_Localised || entry.Commander,
    };
}

export function createSignalFromJournalEntry(entry) {
    return {
        _type: 'signal',
        name: entry.USSType_Localised,
        threat: entry.USSThreat,
    };
}