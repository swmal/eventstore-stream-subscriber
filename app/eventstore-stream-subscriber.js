
/**
 * module for subscribing to events from an Eventstore stream.
 * Eventhandlers for individual eventtypes on the stream can be added
 * via the registerHandler() function.
 * @module eventstore-stream-subscriber
 */
const eventhandler = require('./eventstore-eventhandler.js');
const client = require("node-eventstore-client");

var endpoint = "tcp://localhost:1113";
if (process.env.DEMO1_EVENTSTORE_URL)
    endpoint = process.env.DEMO1_EVENTSTORE_URL;

const resolveLinkTos = true;
const eventAppeared = (subscription, event) => eventhandler.emitEvent(event.originalEvent.eventType, subscription, event);
const subscriptionDropped = (subscription, reason, error) => console.log("Subscription dropped " + reason + " error: " + error);
var connection = null;
var credentials = null;

/**
 * Connects to an eventstore server: either to localhost:
 * @param {Object} settings settings to Eventstore
 * @param {number} settings.maxQueueSize Max queue size
 * @param {boolean} settings.useSslConnection True if ssl connection
 * @param {number} settings.heartbeatInterval Heartbeat interval
 * @param {string} userName Eventstore username for authentication
 * @param {string} password Eventstore password for authentication
 * @returns {Promise.void} 
 */
function createConnection(settings, userName, password) {
    var error = null;
    if(!settings) throw new Error("parameter settings must be an object");
    credentials = new client.UserCredentials(userName, password);
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
                console.log('Heartbeat latency', heartbeatInfo.responseReceivedAt - heartbeatInfo.requestSentAt, 'ms'));
            connection.once("connected", tcpEndpoint => {
                console.log("connected to Eventstore!");
                resolve();
            });
            
        }
    });
}

/**
 * Subscribes to the supplied stream over the initiated connection.
 * @param {string} stream the stream to subscribe to
 * @returns {Promise.void}
 */
function subscribeToStream(stream) {
    return new Promise(function(resolve, reject){
        if(!connection){
            reject("Connection not initialized, call createConnection() first");
        } else{
            connection.subscribeToStream(
                stream,
                resolveLinkTos,
                eventAppeared,
                subscriptionDropped,
                credentials
            );
            resolve();
        }
    });
    
}


module.exports.createConnection = createConnection;
module.exports.subscribeToStream = subscribeToStream;
module.exports.registerHandler = eventhandler.registerHandler;



