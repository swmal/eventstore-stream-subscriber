var EventsEmitter = require("events");
module.exports = () => {
  class MyEmitter extends EventsEmitter {}
  const eventHandlers = new MyEmitter();

  const GlobalHandlerName = "15c7cc75-cdbf-4c71-8914-6c6de0f91790";

  /**
   * Register a event handler
   * @param {string} eventType Event type to subscribe to
   * @param {function} handler Event handler. A function with parameters subscription and event.
   */
  function registerHandler(eventType, handler) {
    if (typeof handler !== "function") {
      throw new Error("argument 'handler' must be a function");
    }
    let found = eventHandlers.listeners(eventType).find(element => {
      return "" + element === "" + handler;
    });
    if (found === undefined) eventHandlers.addListener(eventType, handler);
  }

  function registerGlobalHandler(handler) {
    if (typeof handler !== "function") {
      throw new Error("argument 'handler' must be a function");
    }

    eventHandlers.addListener(GlobalHandlerName, handler);
  }

  /**
   *
   * @param {string} eventType Event type to subscribe to
   * @param {*} subscription Eventstore subscription
   * @param {*} e The eventstore event. Payload available via e.orginalEvent.data (Buffer).
   */
  function emitEvent(eventType, subscription, e) {
    eventHandlers.emit(eventType, subscription, e);
    eventHandlers.emit(GlobalHandlerName, subscription, e, eventType);
  }

  function removeAllListeners() {
    eventHandlers.removeAllListeners();
  }

  return {
    registerHandler: registerHandler,
    registerGlobalHandler: registerGlobalHandler,
    emitEvent: emitEvent,
    removeAllListeners: removeAllListeners
  };
};
