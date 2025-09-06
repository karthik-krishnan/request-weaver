const router = require("express").Router();
router.use(require("./health.routes"));
router.use(require("./ingest.routes"));
router.use(require("./sessions.routes"));
router.use(require("./flows.routes"));
router.use(require("./dashboard.routes"));
router.use(require("./export.routes"));
module.exports = router;