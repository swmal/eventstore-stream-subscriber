var EventsEmitter = require("events");

class MyEmitter extends EventsEmitter{}
const eventHandlers = new MyEmitter();

function registerHandler(eventType, shandler){
    if(!(typeof(handler) === 'function')){
        throw new Error("argument 'handler' must be a function");
    }
    eventHandlers.on(eventType, handler);
}

function emitEvent(eventType, subscription, data){
    eventHandlers.emit(eventType, subscription, data);
}

module.exports.registerHandler = registerHandler;
module.exports.emitEvent = emitEvent;