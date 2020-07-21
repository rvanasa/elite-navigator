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
                entry.timestamp = new Date(entry.timestamp);
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
                        if(other.timestamp < entry.timestamp || other.uid < entry.uid) {
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
