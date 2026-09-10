const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema({
    employeeId: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    department: { type: String },
    salary: { type: Number },
    score: { type: Number, min: 0, max: 100 },
    joiningDate: { type: Date }
});

module.exports = mongoose.model("Employee", employeeSchema);
