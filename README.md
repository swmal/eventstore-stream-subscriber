# eventstore-stream-subscriber

```javascript
var consumer = require("eventstore-stream-consumer");
// register handlers
consumer.registerHandler("myEventType", function(subscription, e){
    //handle event here...
})

var settings = {};
consumer.createConnection({}, "admin", "changeIt").then(function(){
    consumer.subscribeToStream("myStream");
});

```