# eventstore-stream-subscriber

```javascript
var consumer = require("eventstore-stream-consumer");
// register handlers
consumer.registerHanler("myEventType", function(subscription, event){
    //handle event here...
})

var settings = {};
consumer.createConnection({}, "admin", "changeIt").then(function(){
    consumer.subscribeToStream("myStream");
});

```