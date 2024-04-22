const express = require("express");
const router = express.Router();
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = mongoose.model("User");
const { JWT_SECRET } = require("../config");

//Endpoint to register
router.post("/api/auth/register", async (req, res) => {
  const { name, email, username, password } = req.body;
  if (!name || !username || !email || !password) {
    return res.status(400).json({ error: "One or more mandatory fields are empty" });
  }
  
  try {
    const userByEmail = await User.findOne({ email });
    if (userByEmail) {
      return res.status(500).json({ error: "User with this email already registered" });
    }

    const userByUsername = await User.findOne({ username });
    if (userByUsername) {
      return res.status(500).json({ error: "User with this username already registered" });
    }

    const hashedPassword = await bcryptjs.hash(password, 16);
    const user = new User({ name, email, username, password: hashedPassword });
    const newUser = await user.save();
    res.status(201).json({ result: "User Signed up Successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to register user" });
  }
});

//Endpoint to login
router.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;
  if (!password || !username) {
    return res.status(400).json({ error: "One or more mandatory fields are empty" });
  }

  try {
    const userExist = await User.findOne({ username });
    if (!userExist) {
      return res.status(401).json({ error: "Invalid Credentials" });
    }

    const matched = await bcryptjs.compare(password, userExist.password);
    if (matched) {
      const jwtToken = jwt.sign({ _id: userExist._id }, JWT_SECRET);
      const userInfo = {
        _id: userExist._id,
        email: userExist.email,
        name: userExist.name,
        username: userExist.username,
      };
      res.status(200).json({ result: { token: jwtToken, user: userInfo } });
    } else {
      return res.status(401).json({ error: "Invalid Credentials" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to login" });
  }
});


module.exports = router;
