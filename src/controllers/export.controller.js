const {collectRows, writeXlsx} = require("../services/export.service");

async function allXlsx(req, res) {
    await writeXlsx(res, "validation-all.xlsx", collectRows({}));
}

async function sessionXlsx(req, res) {
    const {sessionId} = req.params;
    await writeXlsx(res, `validation-session-${sessionId}.xlsx`, collectRows({sessionId}));
}

async function flowXlsx(req, res) {
    const {sessionId, flowId} = req.params;
    await writeXlsx(res, `validation-session-${sessionId}-flow-${flowId}.xlsx`, collectRows({sessionId, flowId}));
}

module.exports = {allXlsx, sessionXlsx, flowXlsx};
