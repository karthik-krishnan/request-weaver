const ExcelJS = require("exceljs");
const { getState } = require("../store/state.store");

function collectRows(scope = {}) {
    const rows = [];
    const st = getState();
    const push = (sid, fid, m) => rows.push({
        messageId: m.messageId,
        sessionId: sid,
        flowId: fid,
        timestamp: m.timestamp,
        status: m.ValidationStatus,
        errors: (m.formattedErrorList || []).join(" | "),
        payload: JSON.stringify(m.payload ?? {})
    });

    const sessions = st.sessions || {};
    const { sessionId, flowId } = scope;
    if (sessionId && flowId) {
        const fl = sessions[sessionId]?.flows?.[flowId]; if (fl) fl.events.forEach(ev => push(sessionId, flowId, ev)); return rows;
    }
    if (sessionId) {
        const s = sessions[sessionId]; if (s) Object.entries(s.flows || {}).forEach(([fid, fl]) => fl.events.forEach(ev => push(sessionId, fid, ev))); return rows;
    }
    Object.entries(sessions).forEach(([sid, s]) => Object.entries(s.flows || {}).forEach(([fid, fl]) => fl.events.forEach(ev => push(sid, fid, ev))));
    return rows;
}

async function writeXlsx(res, filename, rows) {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Messages");
    ws.columns = [
        { header: "Message ID", key: "messageId", width: 40 },
        { header: "Session ID", key: "sessionId", width: 36 },
        { header: "Flow ID",    key: "flowId",    width: 20 },
        { header: "Timestamp",  key: "timestamp", width: 24 },
        { header: "Status",     key: "status",    width: 10 },
        { header: "Errors",     key: "errors",    width: 60 },
        { header: "Payload (JSON)", key: "payload", width: 80 }
    ];
    ws.addRows(rows);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    await wb.xlsx.write(res);
    res.end();
}

module.exports = { collectRows, writeXlsx };
