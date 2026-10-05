/**
 * Session 09 - Load the inventory workbook (Project Data + Supplier Data)
 * into MongoDB so we have something real to aggregate.
 *
 * This workbook is clean (proper header row, no missing/duplicate rows), so
 * unlike importEmployees.js there is no VALIDATE/skip step - this is a
 * straight PARSE -> TRANSFORM -> LOAD. Re-running is safe: each row is
 * upserted by name, so you can reload after editing the sheet.
 *
 * Run:  node importInventory.js           (upsert on top of existing data)
 *       node importInventory.js --reset    (empty both collections first)
 */

const path = require("path");
const XLSX = require("xlsx");
const mongoose = require("mongoose");
const Project = require("./models/Project");
const Supplier = require("./models/Supplier");

const MONGO_URI = "mongodb://localhost:27017/dashboardDB";
const WORKBOOK_PATH = path.join(__dirname, "data", "inventory.xlsm");
const RESET = process.argv.includes("--reset");

// Excel column -> our field names (same aging buckets for both sheets)
function toRecord(row, nameColumn, nameField) {
    return {
        slNo: Number(row["SL NO"]),
        [nameField]: String(row[nameColumn]).trim(),
        stockValue: Number(row["Stock Value"]),
        under90: Number(row["<90 Days"]) || 0,
        over90: Number(row[">90 Days"]) || 0,
        over180: Number(row[">180 Days"]) || 0,
        over365: Number(row[">365 Days"]) || 0
    };
}

function readSheet(workbook, sheetName) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) throw new Error(`Sheet "${sheetName}" was not found in the workbook.`);
    return XLSX.utils.sheet_to_json(sheet, { defval: null });
}

// Upsert each row by its name field. Returns how many were new vs. updated.
async function loadCollection(Model, key, records) {
    let inserted = 0;
    let updated = 0;

    for (const record of records) {
        const result = await Model.updateOne(
            { [key]: record[key] },
            { $set: record },
            { upsert: true }
        );
        if (result.upsertedCount > 0) {
            inserted += 1;
        } else {
            updated += 1;
        }
    }

    return { inserted, updated };
}

async function run() {
    console.log("\nSession 09 - Loading inventory data into MongoDB");

    const workbook = XLSX.readFile(WORKBOOK_PATH);
    const projectRecords = readSheet(workbook, "Project Data").map((r) =>
        toRecord(r, "Project Name", "projectName")
    );
    const supplierRecords = readSheet(workbook, "Supplier Data").map((r) =>
        toRecord(r, "Supplier Name", "supplierName")
    );

    console.log(`PARSE  : ${projectRecords.length} projects, ${supplierRecords.length} suppliers`);

    await mongoose.connect(MONGO_URI);
    console.log("         connected to", MONGO_URI);

    if (RESET) {
        const p = await Project.deleteMany({});
        const s = await Supplier.deleteMany({});
        console.log(`         --reset: cleared ${p.deletedCount} project(s), ${s.deletedCount} supplier(s)`);
    }

    const projectResult = await loadCollection(Project, "projectName", projectRecords);
    const supplierResult = await loadCollection(Supplier, "supplierName", supplierRecords);

    console.log(
        `LOAD   : projects  -> inserted ${projectResult.inserted}, updated ${projectResult.updated}`
    );
    console.log(
        `         suppliers -> inserted ${supplierResult.inserted}, updated ${supplierResult.updated}`
    );

    const projectTotal = await Project.countDocuments();
    const supplierTotal = await Supplier.countDocuments();
    console.log(`\ndashboardDB.projects  now holds ${projectTotal} document(s).`);
    console.log(`dashboardDB.suppliers now holds ${supplierTotal} document(s).`);
    console.log("Run `npm run verify` to check the numbers against the workbook.\n");

    await mongoose.disconnect();
}

run().catch(async (err) => {
    console.error("\nImport failed:", err.message);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
});
