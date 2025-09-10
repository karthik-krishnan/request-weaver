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

// expose a richer snapshot for GET /state
function snapshot() {
    const sessions = {}; // renamed from outSessions
    let totalSessions = 0;
    let totalFlows = 0;
    let totalMessages = 0;
    let totalValid = 0;
    let totalInvalid = 0;

    const isValidStatus = (v) => {
        if (v === true) return true;
        if (typeof v === "string") return v.toLowerCase() === "valid";
        return false;
    };

    for (const [sid, s] of Object.entries(state.sessions)) {
        totalSessions++;

        const flows = {};
        for (const [fid, f] of Object.entries(s.flows || {})) {
            totalFlows++;
            const msgs = Array.isArray(f.messages) ? f.messages : [];

            let validCount = 0;
            for (const m of msgs) if (isValidStatus(m?.ValidationStatus)) validCount++;
            const messageCount = msgs.length;
            const invalidCount = messageCount - validCount;

            totalMessages += messageCount;
            totalValid += validCount;
            totalInvalid += invalidCount;

            flows[fid] = {
                // keep flow name if you have it; safe if undefined
                name: f.name ?? null,
                startedAt: f.startedAt ?? null,
                endedAt: f.endedAt ?? null,
                messageCount,
                validCount,
                invalidCount,
            };
        }

        // NOTE: session-level 'name' removed as requested
        sessions[sid] = {
            startedAt: s.startedAt ?? null,
            endedAt: s.endedAt ?? null,
            flows: flows,
        };
    }

    return {
        current: { ...state.current },
        summary: {
            totalSessions,
            totalFlows,
            totalMessages,
            totalValid,
            totalInvalid,
        },
        sessions: sessions, // key stays 'sessions'; only the local var is renamed
    };
}

function snapshot_old() {
    // lightweight view; adjust if you store more fields
    const sessions = Object.fromEntries(
        Object.entries(state.sessions).map(([sid, s]) => ([
            sid,
            {
                name: s.name || null,
                startedAt: s.startedAt,
                endedAt: s.endedAt || null,
                flows: Object.fromEntries(
                    Object.entries(s.flows || {}).map(([fid, f]) => ([
                        fid,
                        { name: f.name || null, startedAt: f.startedAt, endedAt: f.endedAt || null, messageCount: (f.messages || []).length }
                    ]))
                )
            }
        ]))
    );
    return { current: { ...state.current }, sessions };
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
