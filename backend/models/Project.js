const mongoose = require("mongoose");

// One row of the "Project Data" sheet -> one document.
// Stock-aging buckets mirror the workbook's <90 / >90 / >180 / >365 day columns.
const projectSchema = new mongoose.Schema({
    slNo: { type: Number },
    projectName: { type: String, required: true, unique: true, trim: true },
    stockValue: { type: Number, required: true },
    under90: { type: Number, default: 0 },
    over90: { type: Number, default: 0 },
    over180: { type: Number, default: 0 },
    over365: { type: Number, default: 0 }
});

module.exports = mongoose.model("Project", projectSchema);
