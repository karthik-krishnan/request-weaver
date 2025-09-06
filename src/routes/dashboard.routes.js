const r3 = require("express").Router();
const c3 = require("../controllers/dashboard.controller");
r3.get("/dashboard/html", c3.html);
r3.get("/dashboard/data", c3.data);
r3.get("/messages/:messageId", c3.messageHtml);
r3.get("/messages/:messageId.json", c3.messageJson);
module.exports = r3;