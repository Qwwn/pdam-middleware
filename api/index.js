const express = require("express");
const { setupMiddleware } = require("../lib/middleware");
const { handleBillInfo } = require("../lib/pdamApi");

const app = express();

setupMiddleware(app);

const startTime = Date.now();
app.get("/api", (req, res) => {
  const uptime = Math.floor((Date.now() - startTime) / 1000);
  res.json({
    status: "OK",
    message: "PDAM API is running",
    uptime: `${uptime} seconds`,
  });
});

app.post("/api/bill-info", handleBillInfo);

if (process.env.NODE_ENV !== "production") {
  app.post("/api/debug", (req, res) => {
    res.json({
      body: req.body,
      headers: req.headers,
      method: req.method,
      url: req.url,
      requestId: req.id,
    });
  });
}

app.use((req, res) => {
  res.status(404).json({
    error: true,
    message: `Not found: ${req.originalUrl}`,
  });
});

module.exports = app;
