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
    
          

            resolve(true);
        });

        //Register a second handler for the same event, should not be registered
        subscriber.registerHandler("myEventType", (subscription, evt) => {
            let e = evt.originalEvent.data.toString();
            console.log("Event received");
            console.log(e);
    

            resolve(true);
        });

        // configure the subscriber
        // removed ip 192.168.99.100
        subscriber.configure({
            resolveLinkTos : false,
            logHeartbeats : false,
            eventstoreHost:"127.0.0.1",
            eventstorePort: "1113"
        });

        // connect and start consuming events
        subscriber.createConnection({}).then(() =>
            subscriber.subscribeToStream("myStream").then(() => {
            // publish an event
            var uuid = require('uuid');
            const esClient = require("node-eventstore-client");
            var connSettings = {};  // Use defaults
            var esConnection = esClient.createConnection(connSettings, "tcp://localhost:1113");
            esConnection.connect();
            esConnection.once('closed', () => console.log("publishing connection closed"));
            esConnection.once('connected', function (tcpEndPoint) {
                console.log('Connected to eventstore at ' + tcpEndPoint.host + ":" + tcpEndPoint.port);
                var eventId = uuid.v4();
                var eventData = {
                    a : Math.random(), 
                    b: uuid.v4()
                };
                var event = esClient.createJsonEventData(eventId, eventData, null, 'myEventType');
                console.log("Appending...");
                esConnection.appendToStream("myStream", esClient.expectedVersion.any, event).then((result) => {
                    console.log("Event published, id: " + result);
                    esConnection.close();
                });
                
            });
            }).catch((reason) => reject(reason))
        )
        .catch((reason) => reject(reason));
    });       
        let result = await promise;

        setTimeout(() => subscriber.closeConnection(), 400);

        expect(result).to.equal(true); 
    });
});

