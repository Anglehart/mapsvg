export class Events {
    constructor(context) {
        this.events = {};
        this.context = context;
    }
    on(event, callbackOrObjectType, callback) {
        if (!this.events[event])
            this.events[event] = [];
        let objectType, callbackFunction;
        if (typeof callbackOrObjectType === "string") {
            objectType = callbackOrObjectType;
            callbackFunction = callback;
        }
        else {
            objectType = "";
            callbackFunction = callbackOrObjectType;
        }
        this.events[event].push(callbackFunction);
        return this;
    }
    off(event, callback) {
        const _this = this;
        if (this.events[event] && this.events[event].length) {
            this.events[event].forEach(function (_callback, index) {
                if (typeof callback === "undefined") {
                    _this.events[event].splice(index, 1);
                }
                else if (_callback === callback) {
                    _this.events[event].splice(index, 1);
                }
            });
        }
        return this;
    }
    trigger(event, thisArg, args) {
        if (this.events[event] && this.events[event].length)
            this.events[event].forEach((callback) => {
                try {
                    callback && callback.apply(thisArg || this.context, args || [this.context]);
                }
                catch (err) {
                    console.error(err);
                }
            });
        return this;
    }
}
//# sourceMappingURL=Events.js.map