const mongoose = require("mongoose");

// One row of the "Supplier Data" sheet -> one document. Same stock-aging
// shape as Project, just keyed by supplier instead of project.
const supplierSchema = new mongoose.Schema({
    slNo: { type: Number },
    supplierName: { type: String, required: true, unique: true, trim: true },
    stockValue: { type: Number, required: true },
    under90: { type: Number, default: 0 },
    over90: { type: Number, default: 0 },
    over180: { type: Number, default: 0 },
    over365: { type: Number, default: 0 }
});

module.exports = mongoose.model("Supplier", supplierSchema);
