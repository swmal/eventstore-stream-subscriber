var assert = require("assert");
var subscriber = require("../app/eventstore-stream-subscriber");

describe("test main subscriber", function(){
    it("should add a handler and emit an event", function(){
        var actual = -1;
        var handler = (data) => {
            actual = data;
        };
        subscriber.registerHandler("test", handler);
        subscriber.emitEvent("test", 2);

        assert.strictEqual(actual, 2);
    });
    it("should just notify handlers by topic", function(){
        //handler 1
        var actual1 = -1;
        var handler1 = (data) => {
            actual1 = data;
        };
        subscriber.registerHandler("test1", handler1);

        //handler 2
        var actual2 = -1;
        var handler2 = (data) => {
            actual2 = data;
        };
        subscriber.registerHandler("test2", handler2);
        
        subscriber.emitEvent("test1", 2);

        assert.strictEqual(actual1, 2);
        assert.strictEqual(actual2, -1);
    });
});