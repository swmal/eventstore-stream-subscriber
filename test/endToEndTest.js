'esversion: 6';
var subscriber = require("../app/eventstore-stream-subscriber.js");
let { expect, should } =  require("chai");

describe("test end to end", async () => {
// register eventhandlers for eventtypes of a stream
it("should add a handler, connect to EventStore, emit an event and close the connection", async () => {

    let promise = new Promise(function(resolve, reject){
        subscriber.registerHandler("myEventType", (subscription, evt) => {
            let e = evt.originalEvent.data.toString();
            console.log("Event received");
            console.log(e);
    
            //Close the connection
            subscriber.closeConnection();

            resolve(true);
        });

        //Register a second handler for the same event, should not be registered
        subscriber.registerHandler("myEventType", (subscription, evt) => {
            let e = evt.originalEvent.data.toString();
            console.log("Event received");
            console.log(e);
    
            //Close the connection
            subscriber.closeConnection();

            resolve(true);
        });

        // configure the subscriber
        subscriber.configure({
            resolveLinkTos : false,
            logHeartbeats : false,
            eventstoreHost:"192.168.99.100",
            eventstorePort: "1113"
        });

        // connect and start consuming events
        subscriber.createConnection({}).then(() =>
            subscriber.catchupAndSubscribeToStream("myStream")
                .catch((reason) => reject(reason))
        )
        .catch((reason) => reject(reason));
    });
    
    let result = await promise;

    expect(result).to.equal(true); 
    
    


});
});

