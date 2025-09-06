const r2 = require("express").Router();
const c2 = require("../controllers/flows.controller");
r2.post("/flows", c2.start);
r2.post("/flows/end", c2.end);
module.exports = r2;