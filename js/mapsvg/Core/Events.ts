export class Events {
    context: any;
    events: { [key: string]: Function[] };

    constructor(context?: any) {
        this.events = {};
        this.context = context;
    }

    on(event: string, callbackOrObjectType: Function | string, callback?: Function) {
        if (!this.events[event]) this.events[event] = [];

        let objectType, callbackFunction;

        if (typeof callbackOrObjectType === "string") {
            objectType = callbackOrObjectType;
            callbackFunction = callback;
        } else {
            objectType = "";
            callbackFunction = callbackOrObjectType;
        }

        // let duplicatedEvent = false;
        // this.events[event].forEach(function (existingCallback) {
        //     if (existingCallback.toString() === callbackFunction.toString()) {
        //         duplicatedEvent = true;
        //     }
        // });
        //
        // if (duplicatedEvent === false) {
        this.events[event].push(callbackFunction);
        // }

        return this;
    }

    off(event: string, callback?: Function) {
        const _this = this;
        if (this.events[event] && this.events[event].length) {
            this.events[event].forEach(function (_callback, index) {
                if (typeof callback === "undefined") {
                    _this.events[event].splice(index, 1);
                } else if (_callback === callback) {
                    _this.events[event].splice(index, 1);
                }
            });
        }
        return this;
    }

    trigger(event: string, thisArg?: any, args?: Array<any>) {
        if (this.events[event] && this.events[event].length)
            this.events[event].forEach((callback) => {
                try {
                    callback && callback.apply(thisArg || this.context, args || [this.context]);
                } catch (err) {
                    console.error(err);
                }
            });
        return this;
    }
}
