// engine.js
const fs = require("fs");
const path = require("path");

// ---- NEW: module-level caches (persist across requests) ----
const validatorCacheByPath = new Map(); // absPath -> validate fn

function toFileId(absPath) {
    // stable, unique ID per file path; normalize to POSIX-style for consistency
    const p = absPath.replace(/\\/g, "/");
    return `file://${p}`;
}

// ---- UPDATED: compile with caching + id handling ----
function compileAjv(ajv, absPath) {
    // 1) Reuse by absolute path
    if (validatorCacheByPath.has(absPath)) return validatorCacheByPath.get(absPath);

    const raw = fs.readFileSync(absPath, "utf8");
    const schema = JSON.parse(raw);

    let validate;

    // 2) If schema declares $id, reuse Ajv's existing compiled validator if present
    if (schema.$id) {
        const existing = ajv.getSchema(schema.$id);
        if (existing) {
            validate = existing;
        } else {
            validate = ajv.compile(schema);
        }
    } else {
        // 3) No $id → give it a deterministic one based on file path
        const schemaWithId = { ...schema, $id: toFileId(absPath) };
        const existing = ajv.getSchema(schemaWithId.$id);
        validate = existing ? existing : ajv.compile(schemaWithId);
    }

    validatorCacheByPath.set(absPath, validate);
    return validate;
}

function resolveSchemaPath(schemaRef, { flowRoot, commonSchemasDir }) {
    if (!schemaRef) return null;
    if (Array.isArray(schemaRef)) {
        return schemaRef.map(s => resolveSchemaPath(s, { flowRoot, commonSchemasDir }));
    }
    if (schemaRef.startsWith("@common/")) {
        return path.join(commonSchemasDir, schemaRef.replace("@common/", ""));
    }
    return path.join(flowRoot, schemaRef); // e.g., "schemas/order.schema.json"
}

async function getValidatorForFlow(flowId, { ajv, flowsDir, commonSchemasDir }) {
    const flowRoot = path.join(flowsDir, flowId);
    const flowModPath = path.join(flowRoot, "index.js");

    let flowMod = {};
    try { flowMod = require(flowModPath); } catch (_) { /* optional */ }

    const selectSchema   = flowMod.selectSchema || (() => null);
    const customValidate = flowMod.validate     || (() => []);

    async function validate(message, ctx) {
        let valid = true;
        let schemaErrors = [];
        let customErrors = [];

        const selection = selectSchema(message, ctx);
        const schemaPaths = resolveSchemaPath(selection, { flowRoot, commonSchemasDir });

        const runOne = (abs) => {
            const v = compileAjv(ajv, abs);
            const ok = v(message);
            return { ok, errs: v.errors || [] };
        };

        if (Array.isArray(schemaPaths)) {
            for (const abs of schemaPaths) {
                const { ok, errs } = runOne(abs);
                if (!ok) { valid = false; schemaErrors.push(...errs); }
            }
        } else if (typeof schemaPaths === "string") {
            const { ok, errs } = runOne(schemaPaths);
            if (!ok) { valid = false; schemaErrors = errs; }
        } else {
            // Optional heuristic: use the single schema file in ./schemas if exactly one exists
            const dir = path.join(flowRoot, "schemas");
            if (fs.existsSync(dir)) {
                const files = fs.readdirSync(dir).filter(f => f.endsWith(".json"));
                if (files.length === 1) {
                    const abs = path.join(dir, files[0]);
                    const { ok, errs } = runOne(abs);
                    if (!ok) { valid = false; schemaErrors = errs; }
                }
            }
        }

        const extra = await Promise.resolve(customValidate(message, ctx));
        const extras = Array.isArray(extra) ? extra : (extra ? [String(extra)] : []);
        if (extras.length) valid = false;
        customErrors = extras;

        return { valid, schemaErrors, customErrors };
    }

    return { validate };
}

function _clearEngineCaches(ajv) {
    validatorCacheByPath.clear();
    ajv.removeSchema(); // clears all schemas from Ajv
}
module.exports = { getValidatorForFlow, _clearEngineCaches };
