const client = require("node-eventstore-client");
const eventhandler = require("./eventstore-eventhandler.js");

var endpoint = "tcp://localhost:1113";
if (process.env.DEMO1_EVENTSTORE_URL)
    endpoint = process.env.DEMO1_EVENTSTORE_URL;

const resolveLinkTos = true;
const eventAppeared = (subscription, event) => eventhandler.emitEvent(event.originalEvent.eventType, subscription, event);
const subscriptionDropped = (subscription, reason, error);
const settings = {};
const connection = null;

function createConnection(settings, userName, password) {
    var error = null;
    if(!settings) throw new Error("parameter settings must be an object");
    var credentials = new client.UserCredentials(userName, password);
    connection = client.createConnection(settings, endpoint);
    connection.connect().catch(err => error = err);
    return new Promise(function (resolve, reject) {
        if (error) {
            reject(error);
        } else {
            connection.on("error", error =>
                console.log(`Error occurred on connection: ${error}`)
            );

            connection.on("closed", reason =>
                console.log(`Connection closed, reason: ${reason}`)
            );
            connection.on('heartbeatInfo', heartbeatInfo =>
                console.log('Heartbeat latency', heartbeatInfo.responseReceivedAt - heartbeatInfo.requestSentAt, 'ms');
            connection.once("connected"), tcpEndpoint => {
                resolve();
            };
            
        }
    });
}

async function subscribeToStream(stream) {
    if(!connection) throw new Error("Connection not initialized, call createConnection() first");
        
        connection.subscribeToStream(
            stream,
            resolveLinkTos,
            eventAppeared,
            subscriptionDropped,
            credentials
        );
    });
}

module.exports.createConnection = createConnection;
module.exports.subscribeToStream = subscribeToStream;
module.exports.registerHandler = eventHandler.registerHandler;



