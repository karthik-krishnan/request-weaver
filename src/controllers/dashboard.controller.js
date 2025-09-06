const {buildDashboardModel} = require("../services/dashboard.service");
const {findByMessageId} = require("../store/state.store");

function html(req, res) {
    res.render("dashboard");
}

function data(req, res) {
    res.json(buildDashboardModel());
}

function messageHtml(req, res) {
    const {messageId} = req.params;
    const {message, sessionId, flowId} = findByMessageId(messageId);
    if (!message) return res.status(404).send("Not found");
    const payloadPretty = JSON.stringify(message.payload ?? {}, null, 2);
    res.render("message", {message, sessionId, flowId, payloadPretty});
}

function messageJson(req, res) {
    const {messageId} = req.params;
    const {message, sessionId, flowId} = findByMessageId(messageId);
    if (!message) return res.status(404).json({error: "Not found"});
    res.json({sessionId, flowId, message});
}

module.exports = {html, data, messageHtml, messageJson};
