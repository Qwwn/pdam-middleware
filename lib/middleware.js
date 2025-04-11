const cors = require("cors");
const express = require("express");
const morgan = require("morgan");
const multer = require("multer");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const upload = multer().none();

function setupMiddleware(app) {
  app.use(helmet());

  app.use(
    cors({
      origin:
        process.env.NODE_ENV === "production"
          ? [/\.vercel\.app$/, /localhost/]
          : "*",
      methods: ["GET", "POST"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );

  app.use((req, res, next) => {
    req.id = Date.now().toString(36) + Math.random().toString(36).substr(2);
    next();
  });

  app.use(express.json({ limit: "100kb" }));

  app.use(express.urlencoded({ extended: true, limit: "100kb" }));

  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
      error: true,
      message: "Too many requests from this IP, please try again later",
    },
  });

  app.use(apiLimiter);

  if (process.env.NODE_ENV !== "production") {
    app.use(morgan("dev"));
  } else {
    app.use(morgan("combined"));
  }

  app.use((req, res, next) => {
    if (req.is("multipart/form-data")) {
      upload(req, res, next);
    } else {
      next();
    }
  });

  app.use((req, res, next) => {
    const start = Date.now();

    res.on("finish", () => {
      const duration = Date.now() - start;
      console.log(
        `[${req.id}] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`
      );
    });

    next();
  });

  app.use((err, req, res, next) => {
    console.error(`[${req.id}] Middleware error:`, err);
    res.status(500).json({
      error: true,
      message:
        process.env.NODE_ENV === "production"
          ? "An unexpected error occurred"
          : `Server error: ${err.message}`,
    });
  });
}

module.exports = {
  setupMiddleware,
};
