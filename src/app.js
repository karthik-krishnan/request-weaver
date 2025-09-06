const express = require("express");
const path = require("path");
const routes = require("./routes");
const { errorMiddleware } = require("./utils/errors");

const app = express();
app.use(express.json({ limit: "1mb" }));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

app.use(routes);

app.use(errorMiddleware);

// // Basic error handler (optional)
// app.use((err, req, res, next) => {
//     console.error(err);
//     res.status(500).json({ ok:false, error:"Internal server error" });
// });

module.exports = app;
