const currentSystemEvents = ['Location', 'FSDJump', 'SupercruiseEntry', 'SupercruiseExit', 'SupercruiseDrop'];

export class Player {
    constructor() {
        this.name = null;
        this.journal = [];
        // this.timestamp = null;
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
    
    getCurrentSystem() {
        for(let entry of this.journal) {
            if(currentSystemEvents.includes(entry.event)) {
                return entry.StarSystem;
            }
        }
    }
    
    update(data) {
        if(data.addLogEntries) {
            data.addLogEntries.forEach(entry => {
                entry.timestamp = new Date(entry.timestamp);
                let index = this.journal.findIndex(e => e.uid && e.uid === entry.uid);
                if(index !== -1) {
                    this.journal[index] = entry;
                }
                else {
                    this.journal.unshift(entry);
                }
            });
            this.journal = this.journal.sort((a, b) => -(a.timestamp === b.timestamp ? a.uid - b.uid : a.timestamp - b.timestamp));
            
            let commanderEntry = this.getLatest('Commander');
            this.name = commanderEntry ? commanderEntry.Name : null;
        }
    }
}
