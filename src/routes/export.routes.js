const r4 = require("express").Router();
const c4 = require("../controllers/export.controller");
r4.get("/export/all.xlsx", c4.allXlsx);
r4.get("/sessions/:sessionId/export.xlsx", c4.sessionXlsx);
r4.get("/sessions/:sessionId/flows/:flowId/export.xlsx", c4.flowXlsx);
module.exports = r4;