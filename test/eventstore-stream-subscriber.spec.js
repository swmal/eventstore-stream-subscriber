var assert = require("assert");
var eventhandler = require("../app/eventstore-eventhandler.js")();

describe("test main subscriber", function() {
  it("should add a handler and emit an event", function() {
    var actual = -1;
    var handler = data => {
      actual = data;
    };
    eventhandler.registerHandler("test", handler);
    eventhandler.emitEvent("test", 2);

    assert.strictEqual(actual, 2);
  });
  it("should just notify handlers by topic", function() {
    //handler 1
    var actual1 = -1;
    var handler1 = data => {
      actual1 = data;
    };
    eventhandler.registerHandler("test1", handler1);

    //handler 2
    var actual2 = -1;
    var handler2 = data => {
      actual2 = data;
    };
    eventhandler.registerHandler("test2", handler2);

    eventhandler.emitEvent("test1", 2);

    assert.strictEqual(actual1, 2);
    assert.strictEqual(actual2, -1);
  });
});
