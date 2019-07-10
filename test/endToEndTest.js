"esversion: 6";
let { expect, should } = require("chai");
const logger = require("../app/logging.js");

describe("test end to end", async () => {
  // register eventhandlers for eventtypes of a stream

  it("should add a handler, connect to EventStore, emit an event and close the connection", async () => {
    let promise = new Promise(function(resolve, reject) {
      let subscriber = require("../app/eventstore-stream-subscriber.js")();
      subscriber.registerHandler("myEventType", (subscription, evt) => {
        let e = evt.originalEvent.data.toString();
        logger.info("Event received");
        logger.info(e);
        resolve(true);
      });

      //Register a second handler for the same event, should not be registered
      subscriber.registerHandler("myEventType", (subscription, evt) => {
        let e = evt.originalEvent.data.toString();
        logger.info("Event received");
        logger.info(e);

        resolve(true);
      });

      // configure the subscriber
      // removed ip 192.168.99.100
      subscriber.configure({
        resolveLinkTos: false,
        logHeartbeats: false,
        eventstoreHost: "127.0.0.1",
        eventstorePort: "1113"
      });

      // connect and start consuming events
      subscriber
        .createConnection({})
        .then(() =>
          subscriber
            .subscribeToStream("myStream")
            .then(() => {
              // publish an event
              var uuid = require("uuid");
              const esClient = require("node-eventstore-client");
              var connSettings = {}; // Use defaults
              var esConnection = esClient.createConnection(
                connSettings,
                "tcp://localhost:1113"
              );
              esConnection.connect();
              esConnection.once("closed", () =>
                logger.info("publishing connection closed")
              );
              esConnection.once("connected", function(tcpEndPoint) {
                logger.info(
                  "Connected to eventstore at " +
                    tcpEndPoint.host +
                    ":" +
                    tcpEndPoint.port
                );
                var eventId = uuid.v4();
                var eventData = {
                  a: Math.random(),
                  b: uuid.v4()
                };
                var event = esClient.createJsonEventData(
                  eventId,
                  eventData,
                  null,
                  "myEventType"
                );
                logger.info("Appending to myStream");
                esConnection
                  .appendToStream(
                    "myStream",
                    esClient.expectedVersion.any,
                    event
                  )
                  .then(result => {
                    logger.info("Event published, id: " + result);
                    esConnection.close();
                  });
              });
            })
            .catch(reason => reject(reason))
        )
        .catch(reason => reject(reason));
      setTimeout(() => subscriber.closeConnection(), 400);
    });
    let result = await promise;

    expect(result).to.equal(true);
  });
  it("should consume events from category stream", async () => {
    let subscriber = require("../app/eventstore-stream-subscriber.js")();

    subscriber.registerHandler("OrderCreated", (subscription, evt) => {
      logger.info("OrderCreated event arrived!");
      logger.info(JSON.stringify(evt));
    });
    subscriber.registerHandler("ItemAdded", (subscription, evt) => {
      logger.info("OrderCreated event arrived!");
      logger.info(JSON.stringify(evt));
    });
    subscriber.configure({ resolveLinkTos: true });

    const streamName = "$ce-Order";
    logger.info("Subscribing to " + streamName);
    subscriber.createConnection({}).then(() => {
      logger.info("Connection for " + streamName + " created!");
      subscriber
        .catchupAndSubscribeToStream(streamName)
        .then(() => logger.info("Subscribed to " + streamName))
        .catch(reason =>
          logger.handleLog(logger.logLevels.WARNING, "reason: " + reason)
        );
    });

    setTimeout(() => {
      logger.info("Closing " + streamName + " connection...");
      subscriber.closeConnection();
    }, 1000);
  });
  it("should readstream forward", async () => {
    let subscriber = require("../app/eventstore-stream-subscriber.js")();

    subscriber.registerGlobalHandler((subscription, evt, type) => {
      logger.info(`${type} event arrived!`);
      logger.info(JSON.stringify(evt));
    });

    subscriber.configure({ resolveLinkTos: true });

    const streamName = "Order-123";
    await subscriber
      .readWholeStreamFromStart(streamName, {}, "c3")
      .then(rs => console.log("ok"))
      .catch(reason =>
        logger.handleLog(logger.logLevels.WARNING, "reason: " + reason)
      );
  });
  it("should configure heartbeats", () =>{
    let subscriber = require("../app/eventstore-stream-subscriber.js")();
    subscriber.configure({ logHeartbeats : true})
    subscriber.createConnection({}).then(() => subscriber.close());
  });
});
