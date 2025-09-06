const router = require("express").Router();
const {postIngest} = require("../controllers/ingest.controller");
router.post("/", postIngest);
module.exports = router;