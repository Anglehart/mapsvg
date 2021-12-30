class ArrayIndexed extends Array {
    constructor(indexKey, items, options) {
        if (items) {
            super(...items);
        }
        else {
            super();
        }
        this.key = indexKey;
        this.dict = {};
        this.nextId = 1;
        if (options) {
            this.options = options;
        }
        else {
            this.options = { autoId: false, unique: false };
        }
        if (this.length > 0) {
            let i = 0;
            const _this = this;
            if (this.options.autoId) {
                let maxId = 0;
                let missingIds = false;
                this.forEach(function (item) {
                    if (item[_this.key] != null) {
                        if (item[_this.key] > maxId) {
                            maxId = item[_this.key];
                        }
                    }
                    else {
                        missingIds = true;
                    }
                });
                this.nextId = ++maxId;
                if (missingIds) {
                    this.forEach(function (item) {
                        if (item[_this.key] == null) {
                            item[_this.key] = _this.nextId;
                            _this.nextId++;
                        }
                    });
                }
            }
            this.forEach(function (item) {
                _this.dict[item[_this.key]] = i;
                i++;
            });
        }
    }
    push(item) {
        const length = super.push(item);
        if (this.options.autoId === true) {
            item[this.key] = this.nextId;
            this.nextId++;
        }
        this.dict[item[this.key]] = length - 1;
        return length;
    }
    pop() {
        const item = this[this.length - 1];
        const id = item[this.key];
        const length = super.pop();
        delete this.dict[id];
        this.reindex();
        return super.pop();
    }
    update(data) {
        if (data[this.key] != null) {
            const obj = this.get(data[this.key]);
            for (const i in data) {
                obj[i] = data[i];
            }
            return obj;
        }
        return false;
    }
    get(id) {
        return this.findById(id);
    }
    findById(id) {
        return this[this.dict[id]];
    }
    deleteById(id) {
        const index = this.dict[id];
        if (typeof index !== "undefined") {
            delete this.dict[id];
            this.splice(index, 1);
        }
    }
    delete(id) {
        this.deleteById(id);
    }
    clear() {
        this.length = 0;
        this.reindex();
    }
    reindex() {
        const _this = this;
        this.dict = {};
        this.forEach(function (item, index) {
            _this.dict[item[_this.key]] = index;
        });
    }
    sort(compareFn) {
        super.sort(compareFn);
        this.reindex();
        return this;
    }
    splice(start, deleteCount) {
        const res = super.splice(start, deleteCount);
        this.reindex();
        return res;
    }
}
export { ArrayIndexed };
//# sourceMappingURL=ArrayIndexed.js.map