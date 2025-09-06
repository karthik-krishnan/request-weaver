// engine.js
const fs = require("fs");
const path = require("path");

function safeRequire(p) { try { return require(p); } catch { return null; } }

function compileAjv(ajv, absPath, cache) {
    if (cache.has(absPath)) return cache.get(absPath);
    const schema = JSON.parse(fs.readFileSync(absPath, "utf8"));
    const validate = ajv.compile(schema);
    cache.set(absPath, validate);
    return validate;
}

function resolveSchemaPath(schemaRef, { flowRoot, commonSchemasDir }) {
    if (!schemaRef) return null;
    if (Array.isArray(schemaRef)) return schemaRef.map(s => resolveSchemaPath(s, { flowRoot, commonSchemasDir }));
    if (schemaRef.startsWith("@common/")) return path.join(commonSchemasDir, schemaRef.slice(8));
    return path.join(flowRoot, schemaRef); // e.g., "schemas/order.schema.json"
}

async function getValidatorForFlow(flowId, { ajv, flowsDir, commonSchemasDir }) {
    const flowRoot = path.join(flowsDir, flowId);
    const flowMod  = safeRequire(path.join(flowRoot, "index.js")) || {};
    const selectSchema   = flowMod.selectSchema || (() => null);
    const customValidate = flowMod.validate     || (() => []);

    const cache = new Map();

    async function validate(message, ctx) {
        let valid = true, schemaErrors = [], customErrors = [];

        const selection   = selectSchema(message, ctx);
        const schemaPaths = resolveSchemaPath(selection, { flowRoot, commonSchemasDir });

        const runOne = (abs) => {
            const v = compileAjv(ajv, abs, cache);
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
            // optional fallback: single-file heuristic
            const dir = path.join(flowRoot, "schemas");
            if (fs.existsSync(dir)) {
                const files = fs.readdirSync(dir).filter(f => f.endsWith(".json"));
                if (files.length === 1) {
                    const { ok, errs } = runOne(path.join(dir, files[0]));
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

module.exports = { getValidatorForFlow };
