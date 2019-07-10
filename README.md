# eventstore-stream-subscriber
Subscribe to an Eventstore stream with the possibility to add separate event handlers for specific event types.

### Subscribe to realtime events only

```javascript
var subscriber = require("eventstore-stream-subscriber")();

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

### Read the entire stream from start to end

```javascript
        // register a global handler (will receive all)
        subscriber.registerGlobalHandler((subscription, evt, eventType) => {
            console.log(`${eventType} event arrived!`);
            console.log(JSON.stringify(evt));
        });

        subscriber.configure({ resolveLinkTos: true });

        const streamName = "Order-123";
        await subscriber.readWholeStreamFromStart(streamName, {}, "c3")
            .then((rs) => console.log("ok"))
            .catch(reason => console.log("reason: " + reason));
            
    });
```

### Configuration
The default configuration:
```javascript
var configuration = {
    resolveLinkTos : true,
    logHeartbeats : false,
    userName : "admin",
    password : "changeit",
    eventstoreHost : "127.0.0.1",
    eventstorePort : 1113
}
```
Override these settings in createConnection:
```javascript

subscriber.createConnection({eventstoreHost : "eventstore.local", eventstorePort : 2113}).then(() =>
    subscriber.catchupAndSubscribeToStream("myStream")
        .catch((reason) => console.log(reason))
)
.catch((reason) => console.log(reason));
```
Or using .env (make sure to pass these vars to your application)
```bash
# eventstore.production.env
EVENTSTORE_STREAM_SUB_HOST=eventstoreprod.somewhere.com
EVENTSTORE_STREAM_SUB_PORT=3113
```
Since .env overrides the configuration object, both of these will have the same effect when .env variables are present:
```javascript
//With local config
subscriber.createConnection({eventstoreHost : "eventstore.local", eventstorePort : 2113}).then(() =>
    subscriber.catchupAndSubscribeToStream("myStream")
        .catch((reason) => console.log(reason))
)
.catch((reason) => console.log(reason));

/*
    Resolves to tcp://eventstoreprod.somewhere.com:3113
*/

//without local config
subscriber.createConnection({}).then(() =>
    subscriber.catchupAndSubscribeToStream("myStream")
        .catch((reason) => console.log(reason))
)
.catch((reason) => console.log(reason));

/*
    Resolves to tcp://eventstoreprod.somewhere.com:3113
*/
```
### Logging
The following loglevels can be set in the environment variable EVENTSTORE_STREAM_SUB_LOGLEVEL:

info
warning
error
fatal
