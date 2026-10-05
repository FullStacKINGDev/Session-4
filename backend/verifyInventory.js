/**
 * Session 09 - Verify aggregation results against the workbook (Slide 19 checklist)
 *
 * Run:  node verifyInventory.js
 */

const mongoose = require("mongoose");
const Project = require("./models/Project");
const Supplier = require("./models/Supplier");

const MONGO_URI = "mongodb://localhost:27017/dashboardDB";

// Reference numbers from the workbook / slide deck
const EXPECTED = {
    projectCount: 14,
    totalStockValue: 16.315843,
    under90: 10.776856,
    over90: 1.84722,
    over180: 1.083161,
    over365: 1.236311,
    supplierTotal: 70.74
};

const round = (n, places = 6) => Math.round(n * 10 ** places) / 10 ** places;

async function run() {
    await mongoose.connect(MONGO_URI);

    const [summary] = await Project.aggregate([
        { $match: { stockValue: { $gt: 0 } } },
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

    const supplierAgg = await Supplier.aggregate([
        { $group: { _id: null, total: { $sum: "$stockValue" } } }
    ]);
    const supplierTotal = supplierAgg[0] ? supplierAgg[0].total : 0;

    const topProject = await Project.findOne().sort({ stockValue: -1 }).select("projectName stockValue -_id");
    const bottomProject = await Project.findOne().sort({ stockValue: 1 }).select("projectName stockValue -_id");

    console.log("Field                | MongoDB result | Expected (workbook) | Match");
    console.log("----------------------------------------------------------------------");
    const check = (label, actual, expected) => {
        const ok = Math.abs(round(actual) - round(expected)) < 0.0001;
        console.log(
            `${label.padEnd(21)} | ${String(round(actual)).padEnd(14)} | ${String(expected).padEnd(20)} | ${ok ? "OK" : "MISMATCH"}`
        );
    };

    check("projectCount", summary.projectCount, EXPECTED.projectCount);
    check("totalStockValue", summary.totalStockValue, EXPECTED.totalStockValue);
    check("under90", summary.under90, EXPECTED.under90);
    check("over90", summary.over90, EXPECTED.over90);
    check("over180", summary.over180, EXPECTED.over180);
    check("over365", summary.over365, EXPECTED.over365);
    check("supplierTotal", supplierTotal, EXPECTED.supplierTotal);

    console.log("\nOther checks:");
    console.log(`  averageStockValue    : ${round(summary.averageStockValue, 6)} (16.315843 / 14 = 1.165417)`);
    console.log(`  highest stock project: ${topProject.projectName} = ${topProject.stockValue}`);
    console.log(`  lowest stock project : ${bottomProject.projectName} = ${bottomProject.stockValue}`);

    const projectDocs = await Project.find().lean();
    const supplierDocs = await Supplier.find().lean();
    const nullNumeric = [...projectDocs, ...supplierDocs].some(
        (d) => d.stockValue == null || Number.isNaN(d.stockValue)
    );
    console.log(`  unexpected nulls?    : ${nullNumeric ? "YES - check the data" : "none"}`);
    console.log(
        `  all numeric fields typed as Number? : ${
            projectDocs.every((d) => typeof d.stockValue === "number") &&
            supplierDocs.every((d) => typeof d.stockValue === "number")
                ? "yes"
                : "NO"
        }`
    );

    await mongoose.disconnect();
}

run().catch(async (err) => {
    console.error("Verify failed:", err.message);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
});
