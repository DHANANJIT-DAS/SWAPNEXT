import dotenv from "dotenv";
dotenv.config({path:"./.env"});
"use strict";

const DEFAULT_LOCALS = (req) => ({
  currUser  : req.user || req.session?.user || null,
  activePage: "",
});

/* ── 404 Not Found ──────────────────────────────────────────── */
function notFound(req, res) {
    res.status(404).render("./errorPages/404.ejs", {
        ...DEFAULT_LOCALS(req),
        message: `The page "${req.originalUrl}" could not be found.`,
    });
}

/* ── 500 Server Error ───────────────────────────────────────── */
function serverError(err, req, res, next) {   // eslint-disable-line no-unused-vars

    console.error('[ERROR]', err.message, '\n', err.stack);

    const status = err.status || err.statusCode || 500;

    /* Render 404 for CastError (bad Mongo ObjectId) */
    if (err.name === 'CastError') {
        return res.status(404).render("./errorPages/404.ejs", {
        ...DEFAULT_LOCALS(req),
        message: 'Invalid ID — the item you requested does not exist.',
        });
    }

    res.status(status).render("./errorPages/error.ejs", {
        ...DEFAULT_LOCALS(req),
        message : err.message || 'Something went wrong on our end. Please try again.',
        devError: process.env.NODE_ENV !== 'production'
        ? `${err.message}\n\n${err.stack}`
        : null,
    });
}

export { notFound, serverError };
