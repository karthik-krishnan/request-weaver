const r5 = require("express").Router();
r5.get("/test", (req, res) => res.send("Validator OK"));
module.exports = r5;