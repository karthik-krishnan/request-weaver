#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const flowId = process.argv[2];
if (!flowId) {
  console.error("Usage: node scripts/scaffold-flow.js <flowId>");
  process.exit(1);
}
const ROOT = path.join(__dirname, "..");
const flowRoot = path.join(ROOT, "extensions", "flows", flowId);
const schemasDir = path.join(flowRoot, "schemas");
fs.mkdirSync(schemasDir, { recursive: true });

const indexJs = `module.exports = {
    selectSchema(message /*, ctx */) {
        if (message?.type === "order")   return "schemas/order.schema.json";
        if (message?.type === "payment") return "@common/payment-method.schema.json";
        return null; // engine fallback (single-file heuristic)
    },
    validate(message, ctx) {
        const errs = [];
        if (message?.channel !== "ios") errs.push("channel must equal 'ios'.");
        if (message?.type === "payment") {
            const prior = ctx.findEvents({ flowId: ctx.flowId, where: e => e.message?.type === "order" });
            if (prior.length === 0) errs.push("Payment arrived before any order in this flow.");
        }
        return errs;
    }
};`;

const orderSchema = `{
    "$schema": "http://json-schema.org/draft/2020-12/schema",
        "$id": "order.schema.json",
        "type": "object",
        "required": ["type", "orderId", "channel"],
        "properties": {
        "type": { "const": "order" },
        "orderId": { "type": "string", "minLength": 1 },
        "channel": { "type": "string" }
    },
    "additionalProperties": true
}`;

const paymentSchema = `{
    "$schema": "http://json-schema.org/draft/2020-12/schema",
        "$id": "payment.schema.json",
        "type": "object",
        "required": ["type", "paymentId", "orderId"],
        "properties": {
        "type": { "const": "payment" },
        "paymentId": { "type": "string", "minLength": 1 },
        "orderId": { "type": "string", "minLength": 1 }
    },
    "additionalProperties": true
}`;

fs.writeFileSync(path.join(flowRoot, "index.js"), indexJs);
fs.writeFileSync(path.join(schemasDir, "order.schema.json"), orderSchema);
const commonDir = path.join(ROOT, "extensions", "common-schemas");
fs.mkdirSync(commonDir, { recursive: true });
fs.writeFileSync(path.join(commonDir, "payment-method.schema.json"), paymentSchema);

console.log(`✓ Created flow '${flowId}' at ${flowRoot}`);
