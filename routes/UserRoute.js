const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const User = mongoose.model("User");
const Tweet = mongoose.model("Tweet");
const verifyToken = require("../middlewares/verifyToken");
const upload = require("../middlewares/multerMiddleware");

//Endpoint to get single user details
router.get("/api/user/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Filter out the password field - user.toObject() method is used to convert the Mongoose document into a plain JavaScript object
    const { password, ...filteredUser } = user.toObject();
    res.status(200).json({ user: filteredUser });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

//Endpoint to follow a user
router.post("/api/user/:id/follow", verifyToken, async (req, res) => {
  const userId = req.params.id;
  const loggedInUserId = req.user.id;

  try {
    // Find the logged in user
    const loggedInUser = await User.findById(loggedInUserId);
    if (!loggedInUser) {
      return res.status(404).json({ error: "Logged in user not found" });
    }

    // Find the user to follow
    const userToFollow = await User.findById(userId);
    if (!userToFollow) {
      return res.status(404).json({ error: "User to follow not found" });
    }

    // Update following array for logged in user and followers array for user to follow
    loggedInUser.following.push(userId);
    userToFollow.followers.push(loggedInUserId);

    // Save both users
    await loggedInUser.save();
    await userToFollow.save();

    res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

//Endpoint to unfollow a user
router.post("/api/user/:id/unfollow", verifyToken, async (req, res) => {
  const userId = req.params.id;
  const loggedInUserId = req.user.id;

  try {
    // Find the logged in user
    const loggedInUser = await User.findById(loggedInUserId);
    if (!loggedInUser) {
      return res.status(404).json({ error: "Logged in user not found" });
    }

    // Find the user to unfollow
    const userToUnfollow = await User.findById(userId);
    if (!userToUnfollow) {
      return res.status(404).json({ error: "User to unfollow not found" });
    }

    // Remove the user to unfollow from following array of logged in user
    loggedInUser.following = loggedInUser.following.filter(
      (id) => id.toString() !== userId
    );

    // Remove the logged in user from followers array of user to unfollow
    userToUnfollow.followers = userToUnfollow.followers.filter(
      (id) => id.toString() !== loggedInUserId
    );

    // Save both users
    await loggedInUser.save();
    await userToUnfollow.save();

    res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

//Endpoint to edit a user's details
router.put("/api/user/:id", verifyToken, async (req, res) => {
  const userId = req.params.id;
  const loggedInUserId = req.user.id;
  const { name, dob, location } = req.body;

  try {
    // Check if the logged-in user is trying to edit their own profile
    if (userId !== loggedInUserId) {
      return res
        .status(403)
        .json({ error: "You are not authorized to edit this user's details" });
    }

    // Validate input data
    if (!name || !dob || !location) {
      return res.status(400).json({
        error: "Name, date of birth, and location are required fields",
      });
    }

    // Find the user to edit
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update user details
    user.name = name;
    user.dob = dob;
    user.location = location;

    // Save the edited user
    await user.save();

    res.status(200).json({ message: "User details updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

//Endpoint to get all tweets posted by a user
router.get("/api/user/:id/tweets", async (req, res) => {
  const userId = req.params.id;

  try {
    // Fetch the tweets of the specified user from the database
    const userTweets = await Tweet.find({ tweetedBy: userId });

    res.status(200).json({ tweets: userTweets });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

//Upload user profile picture
router.post(
  "/api/user/:id/uploadProfilePic",
  verifyToken,
  upload.single("profilePic"),
  async (req, res) => {
    const userId = req.params.id;

    try {
      if (req.file == undefined) {
        res.status(400).json({ error: "Error: No file selected!" });
      } else {
        // Update profilePic field in user document
        const imagePath =
          "http://localhost:5000" + "/files/" + req.file.filename;
        const user = await User.findByIdAndUpdate(
          userId,
          { profilePicture: imagePath },
          { new: true }
        );

        if (!user) {
          res.status(404).json({ error: "User not found" });
        } else {
          res
            .status(200)
            .json({
              message: "Profile picture uploaded successfully",
              user: user
            });
        }
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

module.exports = router;
