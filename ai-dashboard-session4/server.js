const express = require("express");
const mongoose = require("mongoose");
const Employee = require("./models/Employee");

const app = express();

app.use(express.json());

app.use((req, res, next) => {
    console.log(req.method, req.url);
    next();
});

// Connect to MongoDB (Compass: mongodb://localhost:27017)
mongoose
    .connect("mongodb://localhost:27017/dashboardDB")
    .then(() => {
        console.log("Connected to MongoDB: dashboardDB");
        app.listen(5000, () => {
            console.log("Server running on port 5000");
        });
    })
    .catch((err) => {
        console.error("MongoDB connection error:", err.message);
    });

app.get("/", (req, res) => {
    res.send("Full Stack AI Dashboard");
});

// Read every employee from the "employees" collection
app.get("/api/employees", async (req, res) => {
    try {
        const employees = await Employee.find();
        res.json(employees);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create an employee record
app.post("/api/employees", async (req, res) => {
    try {
        const employee = await Employee.create(req.body);
        res.status(201).json(employee);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});
