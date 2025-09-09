// src/routes/state.routes.js
const router = require("express").Router();
const ctrl = require("../controllers/state.controller");

router.get("/state", ctrl.getState);
router.delete("/state", ctrl.deleteState);

module.exports = router;
