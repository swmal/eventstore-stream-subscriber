
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
 * @param {ConnectionSettings} settings settings to Eventstore
 * @param {string} userName Eventstore username for authentication
 * @param {string} password Eventstore password for authentication
 * @returns {Promise.void} 
 */
function createConnection(settings : ESConnectionSettings, userName : string, password : string) {
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
function subscribeToStream(stream : string) {
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
    }
    
}

export interface ESConnectionSettings{
    maxQueueSize?: number,
    defaultUserCredentials?: UserCredentials,
    useSslConnection?: boolean,
    heartbeatInterval?: number,
    heartbeatTimeout?: number,
}
/**
 * Connects to an eventstore server: either to localhost:
 * @param {ESConnectionSettings} settings settings to Eventstore
 * @param {string} userName Eventstore username for authentication
 * @param {string} password Eventstore password for authentication
 * @returns {Promise.void} 
 */
 */
module.exports.createConnection = createConnection;
/**
 * Subscribes to the supplied stream over the initiated connection.
 * @param {string} stream the stream to subscribe to
 * @returns {Promise.void}
 */
module.exports.subscribeToStream = subscribeToStream;
/**
 * Registers an event handler on a specific event type on the stream.
 * @param {string} eventType Event type to subscribe to
 * @param {function} handler Event handler. A function with parameters subscription and event.
 */
module.exports.registerHandler = eventhandler.registerHandler;



