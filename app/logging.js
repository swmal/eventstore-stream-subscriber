var logLevels = {
    INFO : { label: "info", value: 1},
    WARNING : { label: "warning", value: 2},
    ERROR : { label: "error", value: 3},
    FATAL : { label: "fatal", value: 4}
};

function getLogLevel(){
    var l = process.env.EVENTSTORE_STREAM_SUB_LOGLEVEL;
    l = l ? l : logLevels.INFO.label;
    switch(l){
        case logLevels.INFO.label:
            return logLevels.INFO;
        case logLevels.WARNING.label:
            return logLevels.WARNING;
        case logLevels.ERROR.label:
            return logLevels.ERROR.label;
        case logLevels.FATAL.label:
            return logLevels.FATAL;
        default:
            return logLevels.ERROR;
    }
}

function handleLog(logLevel, msg){
    if(logLevel.value >= getLogLevel().value)
    {
        console.log(logLevel.label.toUpperCase() + ": " + msg);
        if(logLevel.value == logLevels.FATAL.value)
            throw new Error(msg);
    }  
}

function info(msg)
{
    if(getLogLevel().value == logLevels.INFO.value)
        console.log(msg);
}

module.exports.logLevels = logLevels;
module.exports.handleLog = handleLog;
module.exports.info = info;