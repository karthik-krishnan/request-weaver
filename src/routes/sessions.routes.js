const r = require("express").Router();
const c = require("../controllers/sessions.controller");
r.post("/sessions", c.start);
r.post("/sessions/end", c.end);
module.exports = r;