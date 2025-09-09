// src/controllers/state.controller.js
const { snapshot, clearAll } = require("../store/state.store");

let clearEngineCaches;
try {
    ({ clearEngineCaches } = require("../core/engine"));
} catch (_) {
    clearEngineCaches = null;
}

async function getState(req, res) {
    return res.json(snapshot());
}

async function deleteState(req, res) {
    const out = clearAll();
    // Optionally also reset Ajv/engine caches (if available)
    try {
        const ajv = req.app?.get?.("ajv");
        if (clearEngineCaches) clearEngineCaches(ajv);
    } catch (_) {}
    return res.json(out);
}

module.exports = { getState, deleteState };
