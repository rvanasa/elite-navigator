exports.Room = class Room {
    constructor(name) {
        this.name = name != null ? name : 'default';
        this.roleMap = {};
        this.active = false;
    }

    add(x, role) {
        if(x) {
            if(role == null) {
                role = 'default';
            }
            this.remove(x);////
            (this.roleMap.hasOwnProperty(role) ? this.roleMap[role] : (this.roleMap[role] = new Set())).add(x);
            this.active = true;
        }
    }

    remove(x) {
        let active = false;
        Object.values(this.roleMap).forEach(set => {
            set.delete(x);
            if(set.size) {
                active = true;
            }
        });
        this.active = active;
    }

    getRoles() {
        return Object.keys(this.roleMap);
    }

    getAll() {
        return Object.values(this.roleMap).flatMap(set => [...set]);
    }

    getAllByRole(role) {
        if(role == null) {
            role = 'default';
        }

        if((typeof role === 'string' || typeof role === 'number') && this.roleMap.hasOwnProperty(role)) {
            return [...this.roleMap[role]];
        }
        else if(Array.isArray(role)) {
            return role.flatMap(r => this.getAllByRole(r));
        }
        else {
            return [];
        }
    }
};