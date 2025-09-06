const { getState } = require("../store/state.store");

function summarizeFlow(sessionId, flowId, fl, current) {
    const list = fl.messages || [];
    const validCount = list.filter(e => e.ValidationStatus === "Valid").length;
    return {
        flowId,
        name: fl.name || flowId,
        createdAt: fl.createdAt,
        endedAt: fl.endedAt || null,
        isCurrent: current.sessionId === sessionId && current.flowId === flowId,
        messageCount: list.length,
        validCount,
        invalidCount: list.length - validCount,
        messages: list.map(m => ({
            messageId: m.messageId,
            timestamp: m.timestamp,
            ValidationStatus: m.ValidationStatus,
            formattedErrorList: m.formattedErrorList || []
        }))
    };
}

function buildDashboardModel() {
    const state = getState();
    const sessions = state.sessions || {};
    const current = state.current || {};
    const sessionObjs = Object.entries(sessions).map(([sid, s]) => {
        const flows = s.flows || {};
        const flowObjs = Object.entries(flows).map(([fid, fl]) => summarizeFlow(sid, fid, fl, current));
        const counts = flowObjs.reduce((acc, f) => {
            acc.messages += f.messageCount; acc.valid += f.validCount; acc.invalid += f.invalidCount; return acc;
        }, { messages: 0, valid: 0, invalid: 0 });
        return {
            sessionId: sid,
            createdAt: s.createdAt,
            endedAt: s.endedAt || null,
            isCurrent: current.sessionId === sid,
            flowCount: Object.keys(flows).length,
            messageCount: counts.messages,
            validCount: counts.valid,
            invalidCount: counts.invalid,
            flows: flowObjs
        };
    });

    const totals = sessionObjs.reduce((acc, ss) => {
        acc.flows += ss.flowCount; acc.messages += ss.messageCount; acc.valid += ss.validCount; acc.invalid += ss.invalidCount; return acc;
    }, { sessions: Object.keys(sessions).length, flows: 0, messages: 0, valid: 0, invalid: 0 });

    return { current, totals, sessions: sessionObjs };
}

module.exports = { buildDashboardModel };
