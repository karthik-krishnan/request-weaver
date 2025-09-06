const {startFlow, endFlow} = require("../store/state.store");

function start(req, res) {
    const {flowId, name} = req.body || {};
    if (!flowId) return res.status(400).json({error: "flowId required"});
    try {
        startFlow(flowId, name);
        res.json({ok: true, flowId});
    } catch (e) {
        res.status(409).json({ok: false, error: e.message});
    }
}

function end(req, res) {
    endFlow();
    res.json({ok: true});
}

module.exports = {start, end};
