// src/utils/id.js
const { randomUUID, randomBytes } = require("crypto");

// Simple UUIDv4
function uuid() {
    return randomUUID();
}

// Compact, time-friendly ID (sortable-ish): yyyymmdd-hhmmss-<base36>
function timestampId(prefix = "") {
    const now = new Date();
    const pad = (n, l = 2) => String(n).padStart(l, "0");
    const ts = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}` +
        `-${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}`;
    const rand = parseInt(randomBytes(4).toString("hex"), 16).toString(36);
    return `${prefix}${prefix ? "_" : ""}${ts}-${rand}`;
}

// Flow ID rules: alphanumeric + underscore
const FLOW_ID_RE = /^[A-Za-z0-9_]+$/;

function isValidFlowId(s) {
    return typeof s === "string" && FLOW_ID_RE.test(s);
}

// Normalize a string to a valid flowId (best-effort)
function normalizeFlowId(s) {
    if (typeof s !== "string") return null;
    const out = s.trim().replace(/[^A-Za-z0-9_]+/g, "_").replace(/^_+|_+$/g, "");
    return out || null;
}

// Specific factories
function newSessionId()   { return uuid(); }
function newMessageId()   { return uuid(); }            // used for stored messages
function newFlowId(input) {
    if (!input) return timestampId("flow");               // fallback
    const norm = normalizeFlowId(input);
    if (!norm) return timestampId("flow");
    return norm;
}

module.exports = {
    uuid,
    timestampId,
    newSessionId,
    newMessageId,
    newFlowId,
    isValidFlowId,
    normalizeFlowId,
};
