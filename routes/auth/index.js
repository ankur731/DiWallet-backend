const express = require("express");
const jwt = require("jsonwebtoken");
const SECRET_KEY = "ankur@123";
const bcrypt = require("bcryptjs");
const User = require("../../models/user");

const router = express.Router();

router.post("/register", async (req, res) => {
  console.log(req.body);
  const { email, password, fullName, phone } = req.body;
  if (!email || !password || !fullName || !phone) {
    return res.status(400).json({ msg: "All fields are required" });
  }
  // Check if user already exists
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ status: "false", msg: 'User already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save the user
    const newUser = new User({
      email,
      password: hashedPassword,
      fullName,
      phone
    });
    await newUser.save();

    // Generate JWT token
    const token = jwt.sign({ email }, SECRET_KEY, { expiresIn: '1h' });

    res.status(201).json({ status: "true", msg: 'Registration successful', token, newUser });
  } catch (error) {
    res.status(500).json({ status: "false", msg: 'Server error', error: error.message });
  }
});

router.post("/login", async function (req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ msg: "All fields are required" });
  }
  try {
    // Find the user
    console.log(req.body);
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid emailcvm' });
    }

    // Compare the password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid password' });
    }

    // Generate JWT token
    const token = jwt.sign({ email }, SECRET_KEY, { expiresIn: '1h' });

    res.status(200).json({ status: "true", msg: 'Login successful', token:token, user });
  } catch (error) {
    res.status(500).json({ status: "false", msg: 'Server error', error: error.message });
  }
});

module.exports = router;
