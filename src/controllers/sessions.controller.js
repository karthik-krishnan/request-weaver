const {startSession, endSession} = require("../store/state.store");

function start(req, res) {
    const id = startSession();
    res.json({ok: true, sessionId: id});
}

function end(req, res) {
    endSession();
    res.json({ok: true});
}

module.exports = {start, end};
