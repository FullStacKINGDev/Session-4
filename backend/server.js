const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dashboardRoutes = require("./routes/dashboardRoutes");

const app = express();

// Session 13: the Next.js dev server runs on a different origin
// (localhost:3000) than this API (localhost:5000) - without CORS the
// browser blocks the frontend's fetch() calls. Open to all origins here
// since this is local dev; restrict this in production (Slide 15).
app.use(cors());

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

// Route -> Controller -> Aggregation -> MongoDB (Session 9)
app.use("/api/dashboard", dashboardRoutes);
