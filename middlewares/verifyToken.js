const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config");

const mongoose = require("mongoose");
const User = mongoose.model("User");

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  // Check for token in headers
  const { authorization } = req.headers;
  console.log(req.headers);
  if (!authorization) {
    return res.status(401).json({ error: "User not logged in" });
  }
  const token = authorization.replace("Bearer ", "");

  jwt.verify(token, JWT_SECRET, (err, payload) => {
    if (err) {
      return res.status(401).json({ error: "Unauthorized: Invalid token" });
    }
    const { _id } = payload;
    User.findById(_id).then((dbUser) => {
      req.user = dbUser;
      next();
    });
  });
};

module.exports = verifyToken;
