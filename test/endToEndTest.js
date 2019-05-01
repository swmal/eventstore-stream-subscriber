var subscriber = require("../app/eventstore-stream-subscriber.js");

// register eventhandlers for eventtypes of a stream
subscriber.registerHandler("myEventType", (subscription, evt) => {
    let e = evt.originalEvent.data.toString();
    console.log("Event received");
    console.log(e);
});

// configure the subscriber
subscriber.configure({
    resolveLinkTos : false,
    logHeartbeats : false
});

// connect and start consuming events
subscriber.createConnection({}).then(() =>
    subscriber.catchupAndSubscribeToStream("myStream")
        .catch((reason) => console.log(reason))
)
.catch((reason) => console.log(reason));
