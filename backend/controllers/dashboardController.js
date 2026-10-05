const Project = require("../models/Project");
const Supplier = require("../models/Supplier");

// Round to 4 decimal places for API responses (matches the slide 17 example).
const round = (n) => Math.round(n * 10000) / 10000;

/**
 * GET /api/dashboard/metrics
 *
 * One aggregation pipeline -> total / average / count / aging buckets,
 * plus the highest-value project (Slide 10's $max, tied back to its document).
 */
const getMetrics = async (req, res) => {
    try {
        const [summary] = await Project.aggregate([
            // $match: only consider real stock (Slide 11 / 13)
            { $match: { stockValue: { $gt: 0 } } },
            // $group: calculate every KPI in one pass (Slide 13)
            {
                $group: {
                    _id: null,
                    totalStockValue: { $sum: "$stockValue" },
                    averageStockValue: { $avg: "$stockValue" },
                    projectCount: { $sum: 1 },
                    maxStockValue: { $max: "$stockValue" },
                    minStockValue: { $min: "$stockValue" },
                    under90: { $sum: "$under90" },
                    over90: { $sum: "$over90" },
                    over180: { $sum: "$over180" },
                    over365: { $sum: "$over365" }
                }
            }
        ]);

        if (!summary) {
            return res.status(200).json({
                success: true,
                data: {
                    totalStockValue: 0,
                    averageStockValue: 0,
                    projectCount: 0,
                    aging: { under90: 0, over90: 0, over180: 0, over365: 0 },
                    topProject: null,
                    bottomProject: null
                }
            });
        }

        // $max/$min only give us numbers - look up which projects actually hold them.
        const [topProject, bottomProject] = await Promise.all([
            Project.findOne({ stockValue: summary.maxStockValue }).select("projectName stockValue -_id"),
            Project.findOne({ stockValue: summary.minStockValue }).select("projectName stockValue -_id")
        ]);

        res.status(200).json({
            success: true,
            data: {
                totalStockValue: round(summary.totalStockValue),
                averageStockValue: round(summary.averageStockValue),
                projectCount: summary.projectCount,
                aging: {
                    under90: round(summary.under90),
                    over90: round(summary.over90),
                    over180: round(summary.over180),
                    over365: round(summary.over365)
                },
                topProject,
                bottomProject
            }
        });
    } catch (error) {
        console.error("getMetrics error:", error.message);
        res.status(500).json({ success: false, message: "Failed to calculate dashboard metrics" });
    }
};

/**
 * GET /api/dashboard/projects
 *
 * The individual rows behind /metrics's totals - Session 13's "one API
 * document -> one table row" (the frontend's Projects table used to read
 * these straight out of the Excel workbook; now it fetches them here).
 */
const getProjects = async (req, res) => {
    try {
        const projects = await Project.find().sort({ stockValue: -1 }).select("-__v");
        const totalStockValue = projects.reduce((sum, p) => sum + p.stockValue, 0);

        res.status(200).json({
            success: true,
            data: {
                projects,
                totalStockValue: round(totalStockValue),
                projectCount: projects.length
            }
        });
    } catch (error) {
        console.error("getProjects error:", error.message);
        res.status(500).json({ success: false, message: "Failed to fetch projects" });
    }
};

/**
 * GET /api/dashboard/suppliers
 *
 * Group stock value by supplier, sorted highest-first (Slide 14),
 * shaped with $project into a clean { supplierName, stockValue } list (Slide 12).
 */
const getSupplierMetrics = async (req, res) => {
    try {
        const suppliers = await Supplier.aggregate([
            {
                $group: {
                    _id: "$supplierName",
                    stockValue: { $sum: "$stockValue" }
                }
            },
            { $sort: { stockValue: -1 } },
            { $project: { _id: 0, supplierName: "$_id", stockValue: 1 } }
        ]);

        const totalSupplierStock = suppliers.reduce((sum, s) => sum + s.stockValue, 0);

        res.status(200).json({
            success: true,
            data: {
                suppliers: suppliers.map((s) => ({ ...s, stockValue: round(s.stockValue) })),
                totalSupplierStock: round(totalSupplierStock),
                supplierCount: suppliers.length
            }
        });
    } catch (error) {
        console.error("getSupplierMetrics error:", error.message);
        res.status(500).json({ success: false, message: "Failed to calculate supplier metrics" });
    }
};

module.exports = {
    getMetrics,
    getProjects,
    getSupplierMetrics
};
