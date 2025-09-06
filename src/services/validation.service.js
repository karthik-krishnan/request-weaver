const Ajv = require("ajv");
const addFormats = require("ajv-formats");
const Engine = require("../core/engine");
const { FLOWS_DIR, COMMON_SCHEMAS_DIR } = require("../config");
const { formatErrorsAsSentences } = require("../utils/formatter");

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

async function validateMessage(flowId, message, ctx) {
    const validator = await Engine.getValidatorForFlow(flowId, { ajv, flowsDir: FLOWS_DIR, commonSchemasDir: COMMON_SCHEMAS_DIR });
    const { valid, schemaErrors, customErrors } = await validator.validate(message, ctx);
    const formatted = valid ? [] : [
        ...formatErrorsAsSentences(schemaErrors),
        ...customErrors.map((m, i) => `${i + 1 + schemaErrors.length}. ${m}`)
    ];
    return { valid, formatted };
}

module.exports = { validateMessage };
