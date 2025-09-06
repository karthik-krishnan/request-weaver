const { newSessionId } = require("../utils/id");

const state = {
    sessions: {},                // { [sessionId]: { createdAt, endedAt, flows: { [flowId]: { name, createdAt, endedAt, messages: [] }}}}
    current: { sessionId: null, flowId: null }
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

function clearAll() {
    state.sessions = {};
    state.current = { sessionId: null, flowId: null };
}

module.exports = {
    getState, startSession, endSession, startFlow, endFlow, addMessage, findByMessageId, clearAll
};
