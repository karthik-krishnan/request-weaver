const { randomUUID } = require("crypto");
const { getState, addMessage } = require("../store/state.store");
const { validateMessage } = require("../services/validation.service");
const { newSessionId } = require("../utils/id");
const {newMessageId} = require("../utils/id");

async function postIngest(req, res) {
    const st = getState();
    const { sessionId, flowId } = st.current || {};
    if (!sessionId) return res.status(409).json({ ok: false, error: "No active session. Start a session." });
    if (!flowId)    return res.status(409).json({ ok: false, error: "No active flow. Start a flow." });

    const payload = req.body;

    const ctx = {
        sessionId, flowId, state: st,
        findMessages: ({ flowId: fid, where } = {}) => {
            const flows = fid ? [st.sessions[sessionId]?.flows?.[fid]] : Object.values(st.sessions[sessionId]?.flows || {});
            const out = []; for (const fl of flows) for (const m of (fl?.messages || [])) if (!where || where(m)) out.push(m);
            return out;
        },
        getFlow: fid => st.sessions[sessionId]?.flows?.[fid],
        getSession: () => st.sessions[sessionId]
    };

    const { valid, formatted } = await validateMessage(flowId, payload, ctx);

    const record = {
        messageId: newMessageId(),
        timestamp: new Date().toISOString(),
        ValidationStatus: valid ? "Valid" : "Invalid",
        formattedErrorList: formatted,
        payload
    };
    addMessage(record);

    if (valid) return res.json({ ok: true, messageId: record.messageId });
    return res.status(400).json({ ok: false, messageId: record.messageId, errors: formatted });
}

module.exports = { postIngest };
