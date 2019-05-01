# eventstore-stream-subscriber
Subscribe to an Eventstore stream with the possibility to add separate event handlers for specific event types.

```javascript
var consumer = require("eventstore-stream-consumer");
// register handlers
consumer.registerHandler("myEventType", function(subscription, e){
    //handle event here...
});

var settings = {};
consumer.createConnection({}, "admin", "changeit").then(function(){
    consumer.subscribeToStream("myStream");
});

```