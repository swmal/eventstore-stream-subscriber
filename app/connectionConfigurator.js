function addEventHandlers(conn, configuration, logger){
    conn.on("error", error =>
        logger.handleLog(logger.logLevels.ERROR, `Error occurred on connection: ${error}`)
    );

    conn.on("closed", reason =>
        logger.handleLog(logger.logLevels.INFO, `Connection closed, reason: ${reason}`)
    );
    if(configuration.logHeartbeats){
        conn.on('heartbeatInfo', heartbeatInfo =>
        
        logger.handleLog(logger.logLevels.INFO, 'Heartbeat latency', heartbeatInfo.responseReceivedAt - heartbeatInfo.requestSentAt, 'ms'));
    }
} 

module.exports.addEventHandlers = addEventHandlers;

