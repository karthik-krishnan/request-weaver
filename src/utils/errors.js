// src/utils/errors.js

class HttpError extends Error {
    constructor(status = 500, message = "Internal Server Error", meta = undefined) {
        super(message);
        this.name = "HttpError";
        this.status = status;
        if (meta !== undefined) this.meta = meta;
        Error.captureStackTrace?.(this, HttpError);
    }
}

class ValidationError extends Error {
    constructor(message = "Validation failed", details = []) {
        super(message);
        this.name = "ValidationError";
        this.status = 400;
        this.details = Array.isArray(details) ? details : [String(details)];
        Error.captureStackTrace?.(this, ValidationError);
    }
}

// Handy assertion that throws HttpError when condition is falsy
function assert(condition, status, message) {
    if (!condition) throw new HttpError(status, message);
}

// Wrap async route handlers to forward errors to Express
const wrapAsync = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// Centralized Express error middleware
function errorMiddleware(err, req, res, _next) {
    // Known, typed errors
    if (err instanceof ValidationError) {
        return res.status(err.status).json({
            ok: false,
            error: err.message,
            errors: err.details,
            type: "validation",
        });
    }
    if (err instanceof HttpError) {
        const body = { ok: false, error: err.message };
        if (err.meta !== undefined) body.meta = err.meta;
        return res.status(err.status).json(body);
    }

    // Fallback
    console.error("Unhandled error:", err);
    return res.status(500).json({ ok: false, error: "Internal server error" });
}

module.exports = {
    HttpError,
    ValidationError,
    assert,
    wrapAsync,
    errorMiddleware,
};
