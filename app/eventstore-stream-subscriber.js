
const eventhandler = require('./eventstore-eventhandler.js');
const logger = require('./logging.js')
const client = require("node-eventstore-client");
const absorb = require("absorb");
const connectionConfig = require("./connectionConfigurator.js");


module.exports = () => {
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
        resolveLinkTos: true,
        logHeartbeats: true,
        userName: "admin",
        password: "changeit",
        eventstoreHost: "127.0.0.1",
        eventstorePort: 1113,
        logger: console.log

    };


    const eventstoreHelper = {
        getCredentials: () => new client.UserCredentials(configuration.userName, configuration.password),
        getEndpoint: () => {
            if (process.env.EVENTSTORE_STREAM_SUB_HOST)
                return `tcp://${process.env.EVENTSTORE_STREAM_SUB_HOST}:${process.env.EVENTSTORE_STREAM_SUB_PORT}`;
            return `tcp://${configuration.eventstoreHost}:${configuration.eventstorePort}`;
        },
        connection: null
    };

    /**
     * Configures the subscriber before usage
     * @param {configuration} config The configuration.
     */
    function configure(config) {
        if (typeof config !== 'object') {
            logger.handleLog(logger.logLevels.FATAL, "argument 'config' must be an object");
            throw Error("argument 'config' must be an object");
        }
        absorb(configuration, config);
    }



    const eventAppeared = (subscription, event) => {
        logger.handleLog(logger.logLevels.INFO, "Event appeared...");
        if (event.eventType) {
            logger.handleLog(logger.logLevels.INFO, "Type: " + event.eventType);
            eventHandler.emitEvent(event.eventType, subscription, event);
        }
        else if (event.event && event.event.eventType) {
            logger.handleLog(logger.logLevels.INFO, "Type: " + event.event.eventType);
            eventhandler.emitEvent(event.event.eventType, subscription, event);
        }
        else if (event.originalEvent && event.originalEvent.eventType) {
            logger.handleLog(logger.logLevels.INFO, "Type: " + event.originalEvent.eventType);
            eventhandler.emitEvent(event.originalEvent.eventType, subscription, event);
        } else {
            logger.handleLog(logger.logLevels.WARNING, "Event appeared, but no eventType could be detected.")
        }

    }
    const subscriptionDropped = (subscription, reason, error) => logger.handleLog(LogLevels.ERROR, "Subscription dropped " + reason + " error: " + error);

    /**
     * Connects to an eventstore server: either to localhost:
     * @param {Object} settings settings to Eventstore
     * @param {number} settings.maxQueueSize Max queue size
     * @param {boolean} settings.useSslConnection True if ssl connection
     * @param {number} settings.heartbeatInterval Heartbeat interval
     * @returns {Promise.void} 
     */
    function createConnection(settings, connectionName) {
        var error = null;
        if (!settings)
            logger.handleLog(logger.logLevels.FATAL, "parameterSettings must be an object");
        let endpoint = eventstoreHelper.getEndpoint();
        logger.handleLog(logger.logLevels.INFO, "Creating connection to host " + endpoint);
        let conn = client.createConnection(settings, eventstoreHelper.getEndpoint(), connectionName);
        eventstoreHelper.connection = conn;
        conn.connect().catch(err => error = err);
        return new Promise(function (resolve, reject) {
            if (error) {
                logger.handleLog(logger.logLevels.ERROR, error);
                reject(error);
            } else {
                /*
                conn.on("error", error =>
                    logger.handleLog(logger.logLevels.ERROR, `Error occurred on connection: ${error}`)
                );
    
                conn.on("closed", reason =>
                    logger.handleLog(logger.logLevels.INFO, `Connection closed, reason: ${reason}`)
                );
                if(configuration.logHeartbeats){
                    conn.on('heartbeatInfo', heartbeatInfo =>
                    
                    logger.handleLog(logger.logLevels.INFO, 'Heartbeat latency', heartbeatInfo.responseReceivedAt - heartbeatInfo.requestSentAt, 'ms'));
                }*/
                connectionConfig.addEventHandlers(conn, configuration, logger);
                conn.once("connected", tcpEndpoint => {
                    logger.handleLog(logger.logLevels.INFO, `connected to Eventstore - host: ${tcpEndpoint.host} port: ${tcpEndpoint.port}`);
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
        logger.handleLog(logger.logLevels.INFO, "Closing connection to host " + endpoint);
        eventstoreHelper.connection.close();
        eventhandler.removeAllListeners();

    }

    /**
     * Subscribes to the supplied stream over the initiated connection.
     * @param {string} stream the stream to subscribe to
     * @returns {Promise.void}
     */
    function subscribeToStream(stream) {
        var conn = eventstoreHelper.connection;
        return new Promise(function (resolve, reject) {
            if (!conn) {
                reject("Connection not initialized, call createConnection() first");
            } else {
                logger.handleLog(logger.logLevels.INFO, "Subscribing to stream " + stream);
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

    async function readWholeStreamFromStart(stream, settings, connectionName) {
        let endpoint = eventstoreHelper.getEndpoint();
        let conn = client.createConnection(settings, endpoint, connectionName);
        connectionConfig.addEventHandlers(conn, configuration, logger);
        conn.once('connected', tcpEndpoint => {
            logger.handleLog(logger.logLevels.INFO, `connected to Eventstore - host: ${tcpEndpoint.host} port: ${tcpEndpoint.port}`);
        });
        readStreamForward(stream, settings, conn)
            .then(() => conn.close())
            .catch((error) => {
                logger.handleLog(logger.logLevels.ERROR, error);
                try {
                    conn.close();
                } catch (e) { }

            });

    }

    async function readStreamForward(stream, settings, conn) {
        logger.info("connecting to eventstore");
        await conn.connect();
        let eh = (e) => eventAppeared(null, e);
        var result;
        await readEventSliceForward(conn, stream, 0, eh).then(async (r) => {
            result = r;
        });
        while (!result.isEOS) {
            await readEventSliceForward(conn, stream, result.next, eh).then(async (r) => result = r);
        }
    }

    async function readEventSliceForward(conn, stream, startPos, eventHandler) {
        let rs = await conn.readStreamEventsForward(stream, startPos, 2, true, eventstoreHelper.getCredentials());
        var jsonString = JSON.stringify(rs);
        var slice = JSON.parse(jsonString);
        for (ix in slice.events) {
            let e = slice.events[ix];
            eventHandler(e);
        }
        return {
            isEOS: slice.isEndOfStream,
            next: slice.nextEventNumber.low
        };
    }

    function catchupAndSubscribeToStream(stream) {
        var conn = eventstoreHelper.connection;
        logger.handleLog(logger.logLevels.INFO, "cred: " + JSON.stringify(eventstoreHelper.getCredentials()));
        return new Promise(function (resolve, reject) {
            if (!conn) {
                reject("Connection not initialized, call createConnection() first");
            } else {
                conn.subscribeToStreamFrom(
                    stream,
                    null,
                    resolve,
                    eventAppeared,
                    (s) => logger.handleLog(logger.logLevels.INFO, "Live processing started..."),
                    subscriptionDropped,
                    eventstoreHelper.getCredentials()
                );
                resolve();
            }
        });
    }

    return {
        configure: configure,
        createConnection: createConnection,
        closeConnection: closeConnection,
        subscribeToStream: subscribeToStream,
        catchupAndSubscribeToStream: catchupAndSubscribeToStream,
        registerHandler: eventhandler.registerHandler,
        registerGlobalHandler: eventhandler.registerGlobalHandler,
        readWholeStreamFromStart: readWholeStreamFromStart
    }
}

/**
 * module for subscribing to events from an Eventstore stream.
 * Eventhandlers for individual eventtypes on the stream can be added
 * via the registerHandler() function.
 * @module eventstore-stream-subscriber
//  */
// module.exports.configure = configure;
// module.exports.createConnection = createConnection;
// module.exports.closeConnection = closeConnection;
// module.exports.subscribeToStream = subscribeToStream;
// module.exports.catchupAndSubscribeToStream = catchupAndSubscribeToStream;
// module.exports.registerHandler = eventhandler.registerHandler;
// module.exports.readWholeStreamFromStart = readWholeStreamFromStart;



