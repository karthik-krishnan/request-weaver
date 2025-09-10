const { newSessionId } = require("../utils/id");

const state = {
    sessions: {},
    current: { sessionId: null, flowId: null },
    index:   { messagesById: new Map() },
};

function getState() { return state; }

function startSession() {
    const sessionId = newSessionId();
    state.sessions[sessionId] = { createdAt: new Date().toISOString(), endedAt: null, flows: {} };
    state.current.sessionId = sessionId;
    state.current.flowId = null;
    return sessionId;
}

function endSession() {
    const sid = state.current.sessionId;
    if (sid && state.sessions[sid]) state.sessions[sid].endedAt = new Date().toISOString();
    state.current.sessionId = null;
    state.current.flowId = null;
}

function startFlow(flowId, name) {
    const sid = state.current.sessionId;
    if (!sid) throw new Error("No active session");
    const flows = state.sessions[sid].flows;
    if (!flows[flowId]) flows[flowId] = { name: name || flowId, createdAt: new Date().toISOString(), endedAt: null, messages: [] };
    state.current.flowId = flowId;
}

function endFlow() {
    const { sessionId, flowId } = state.current;
    if (sessionId && flowId) {
        const f = state.sessions[sessionId]?.flows?.[flowId];
        if (f) f.endedAt = new Date().toISOString();
    }
    state.current.flowId = null;
}

function addMessage(record) {
    const { sessionId, flowId } = state.current;
    if (!sessionId || !flowId) throw new Error("No active session/flow");
    state.sessions[sessionId].flows[flowId].messages.push(record);
}

function findByMessageId(messageId) {
    for (const [sid, s] of Object.entries(state.sessions)) {
        for (const [fid, fl] of Object.entries(s.flows)) {
            const m = fl.messages.find(e => e.messageId === messageId);
            if (m) return { sessionId: sid, flowId: fid, message: m };
        }
    }
    return { sessionId: null, flowId: null, message: null };
}

// expose a richer snapshot for GET /state (with per-session summary)
function snapshot() {
    const sessions = {}; // output view
    let sessionCount = 0;
    let totalFlowCount = 0;
    let totalMessageCount = 0;
    let totalValid = 0;
    let totalInvalid = 0;

    const isValidStatus = (v) => {
        if (v === true) return true;
        if (typeof v === "string") return v.toLowerCase() === "valid";
        return false;
    };

    for (const [sid, s] of Object.entries(state.sessions)) {
        sessionCount++;

        const flows = {};
        let sessionFlowCount = 0;
        let sessionMsgCount = 0;
        let sessionValidCount = 0;
        let sessionInvalidCount = 0;

        for (const [fid, f] of Object.entries(s.flows || {})) {
            sessionFlowCount++;
            totalFlowCount++;

            const msgs = Array.isArray(f.messages) ? f.messages : [];
            const validCount = msgs.reduce((acc, m) => acc + (isValidStatus(m?.ValidationStatus) ? 1 : 0), 0);
            const messageCount = msgs.length;
            const invalidCount = messageCount - validCount;

            sessionMsgCount += messageCount;
            sessionValidCount += validCount;
            sessionInvalidCount += invalidCount;

            totalMessageCount += messageCount;
            totalValid += validCount;
            totalInvalid += invalidCount;

            flows[fid] = {
                name: f.name ?? null,            // flow still has a name
                startedAt: f.startedAt ?? null,
                endedAt: f.endedAt ?? null,
                messageCount,
                validCount,
                invalidCount,
            };
        }

        sessions[sid] = {
            startedAt: s.startedAt ?? null,
            endedAt: s.endedAt ?? null,
            summary: {                         // NEW: per-session summary
                flowCount: sessionFlowCount,
                messageCount: sessionMsgCount,
                validCount: sessionValidCount,
                invalidCount: sessionInvalidCount,
            },
            flows: flows,
        };
    }

    return {
        current: { ...state.current },
        summary: {
            sessionCount: sessionCount,
            flowCount: totalFlowCount,
            messageCount: totalMessageCount,
            validCount: totalValid,
            invalidCount: totalInvalid,
        },
        sessions: sessions,
    };
}

function clearAll() {
    state.sessions = {};
    state.current = { sessionId: null, flowId: null };
    state.index.messagesById.clear?.();
    return { ok: true, cleared: true };
}

module.exports = {
    getState, startSession, endSession, startFlow, endFlow, addMessage, findByMessageId, snapshot, clearAll
};
