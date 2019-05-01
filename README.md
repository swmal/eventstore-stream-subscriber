# eventstore-stream-subscriber
Subscribe to an Eventstore stream with the possibility to add separate event handlers for specific event types.

### Subscribe to realtime events only

```javascript
var subscriber = require("eventstore-stream-subscriber");

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
    subscriber.subscribeToStream("myStream")
        .catch((reason) => console.log(reason))
)
.catch((reason) => console.log(reason));

```

### Catch up from beginning of stream and continue to consume realtime events

```javascript
subscriber.createConnection({}).then(() =>
    subscriber.catchupAndSubscribeToStream("myStream")
        .catch((reason) => console.log(reason))
)
.catch((reason) => console.log(reason));
```