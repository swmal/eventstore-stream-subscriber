var assert = require("assert");

describe("test eventhandler", () => {
  it("should export a constructor", () => {
    let eventhandler1 = require("../app/eventstore-eventhandler.js")();
    let eventhandler2 = require("../app/eventstore-eventhandler.js")();
    eventhandler1.registerHandler("test", () => {
      console.log("handler 1");
    });
    eventhandler2.registerHandler("test", () => {
      assert.equal(1, 2);
    });

    eventhandler1.emitEvent("test", "test123", { herp: "derp" });
  });
});
