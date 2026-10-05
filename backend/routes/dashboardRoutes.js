const express = require("express");
const { getMetrics, getProjects, getSupplierMetrics } = require("../controllers/dashboardController");

const router = express.Router();

// GET /api/dashboard/metrics    -> total / average / count / aging / top+bottom project
// GET /api/dashboard/projects   -> every project row, sorted highest-first
// GET /api/dashboard/suppliers  -> per-supplier stock, sorted highest-first
router.get("/metrics", getMetrics);
router.get("/projects", getProjects);
router.get("/suppliers", getSupplierMetrics);

module.exports = router;
