const express = require("express");
const { login, logout } = require("../controllers/authController");

const router = express.Router();

// POST /api/auth/login  -> { email, password } in, { token } out (Session 19)
// POST /api/auth/logout -> invalidates the caller's token
router.post("/login", login);
router.post("/logout", logout);

module.exports = router;
