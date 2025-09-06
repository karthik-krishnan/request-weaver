const path = require("path");

const PORT = process.env.PORT || 8000;
const ROOT = path.join(__dirname, "..");
const EXTENSIONS_DIR   = process.env.EXTENSIONS_DIR || path.join(ROOT, "..", "extensions");
const FLOWS_DIR        = path.join(EXTENSIONS_DIR, "flows");
const COMMON_SCHEMAS_DIR = path.join(EXTENSIONS_DIR, "common-schemas");

module.exports = { PORT, ROOT, EXTENSIONS_DIR, FLOWS_DIR, COMMON_SCHEMAS_DIR };
