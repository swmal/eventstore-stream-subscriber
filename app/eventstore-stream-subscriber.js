
const eventhandler = require('./eventstore-eventhandler.js');
const client = require("node-eventstore-client");
const absorb = require("absorb");


/**
 * @function configuration
 * @param {string} resolveLinkTos
 * @param {boolean} logHeartbeats
 * @param {string} userName Eventstore username
 * @param {string} password Eventstore password
 * @param {string} eventstoreHost Eventstore hostname
 * @param {number} eventstorePort Eventstore port
 */
let configuration = {
    resolveLinkTos : true,
    logHeartbeats : true,
    userName : "admin",
    password : "changeit",
    eventstoreHost : "127.0.0.1",
    eventstorePort : 1113,
    logger: console.log

};

const eventstoreHelper = {
    getCredentials : () => client.UserCredentials(configuration.userName, configuration.password),
    getEndpoint : () => {
        if (process.env.EVENTSTORE_STREAM_SUB_HOST)
            return `tcp://${process.env.EVENTSTORE_STREAM_SUB_HOST}:${process.env.EVENTSTORE_STREAM_SUB_PORT}`;
        return `tcp://${configuration.eventstoreHost}:${configuration.eventstorePort}`;;
    }, 
    connection : null
};

/**
 * Configures the subscriber before usage
 * @param {configuration} config The configuration.
 */
function configure(config){
    if(typeof config !== 'object')
        throw Error("argument 'config' must be an object");
        absorb(configuration, config);
    
}



const eventAppeared = (subscription, event) => eventhandler.emitEvent(event.originalEvent.eventType, subscription, event);
const subscriptionDropped = (subscription, reason, error) => console.log("Subscription dropped " + reason + " error: " + error);

/**
 * Connects to an eventstore server: either to localhost:
 * @param {Object} settings settings to Eventstore
 * @param {number} settings.maxQueueSize Max queue size
 * @param {boolean} settings.useSslConnection True if ssl connection
 * @param {number} settings.heartbeatInterval Heartbeat interval
 * @returns {Promise.void} 
 */
function createConnection(settings) {
    var error = null;
    if(!settings) throw new Error("parameter settings must be an object");
    let endpoint = eventstoreHelper.getEndpoint();
    console.log("Creating connection to host " + endpoint);
    let conn = client.createConnection(settings, eventstoreHelper.getEndpoint());  
    eventstoreHelper.connection = conn;
    conn.connect().catch(err => error = err);
    return new Promise(function (resolve, reject) {
        if (error) {
            reject(error);
        } else {
            conn.on("error", error =>
                console.log(`Error occurred on connection: ${error}`)
            );

            conn.on("closed", reason =>
                console.log(`Connection closed, reason: ${reason}`)
            );
            if(configuration.logHeartbeats){
                conn.on('heartbeatInfo', heartbeatInfo =>
                console.log('Heartbeat latency', heartbeatInfo.responseReceivedAt - heartbeatInfo.requestSentAt, 'ms'));
            }
            conn.once("connected", tcpEndpoint => {
                console.log("connected to Eventstore - host: ${tcpEndpoint.host} port: ${tcpEndpoint.port}");
                resolve();
            });
            
        }
    });
}

/**
 * Closes an open connection
 * @returns
 */
function closeConnection() {
    let endpoint = eventstoreHelper.getEndpoint();
    console.log("Closing connection to host " + endpoint);
    eventstoreHelper.connection.close();
    
}

/**
 * Subscribes to the supplied stream over the initiated connection.
 * @param {string} stream the stream to subscribe to
 * @returns {Promise.void}
 */
function subscribeToStream(stream) {
    var conn = eventstoreHelper.connection;
    return new Promise(function(resolve, reject){
        if(!conn){
            reject("Connection not initialized, call createConnection() first");
        } else{
            conn.subscribeToStream(
                stream,
                configuration.resolveLinkTos,
                eventAppeared,
                subscriptionDropped,
                eventstoreHelper.getCredentials()
            );
            resolve();
        }
    });   
}

function catchupAndSubscribeToStream(stream){
    var conn = eventstoreHelper.connection;
    return new Promise(function(resolve, reject){
        if(!conn){
            reject("Connection not initialized, call createConnection() first");
        } else{
            conn.subscribeToStreamFrom(
                stream, 
                null, 
                resolve, 
                eventAppeared, 
                (s) => console.log("Live processing started..."), 
                subscriptionDropped, 
                eventstoreHelper.getCredentials()
            );
            resolve();
        }       
    });
}

/**
 * module for subscribing to events from an Eventstore stream.
 * Eventhandlers for individual eventtypes on the stream can be added
 * via the registerHandler() function.
 * @module eventstore-stream-subscriber
 */
module.exports.configure = configure;
module.exports.createConnection = createConnection;
module.exports.closeConnection = closeConnection;
module.exports.subscribeToStream = subscribeToStream;
module.exports.catchupAndSubscribeToStream = catchupAndSubscribeToStream;
module.exports.registerHandler = eventhandler.registerHandler;



