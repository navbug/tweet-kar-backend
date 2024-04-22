const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const User = mongoose.model("User");
const Tweet = mongoose.model("Tweet");
const verifyToken = require("../middlewares/verifyToken");
const upload = require("../middlewares/multerMiddleware");

// Endpoint to create a tweet
router.post(
  "/api/tweet",
  verifyToken,
  upload.single("image"),
  async (req, res) => {
    const { content } = req.body;
    const tweetedBy = req.user._id;
    let imagePath = "";

    try {
      // Verify if the content is present
      if (!content) {
        return res
          .status(400)
          .json({ error: "Content is required for a tweet" });
      }

      // If image is uploaded, get the image path
      if (req.file) {
        imagePath = "http://localhost:5000" + "/files/" + req.file.filename;
      }

      // Create the tweet
      const tweet = new Tweet({
        content,
        tweetedBy,
        image: imagePath,
      });

      // Save the tweet into the database
      await tweet.save();

      res.status(201).json({ message: "Tweet created successfully", tweet });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Endpoint to like a tweet
router.post("/api/tweet/:id/like", verifyToken, async (req, res) => {
  try {
    const tweetId = req.params.id;
    const userId = req.user._id;

    // Find the tweet by ID
    const tweet = await Tweet.findById(tweetId);
    if (!tweet) {
      return res.status(404).json({ error: "Tweet not found" });
    }

    // Check if the user has already liked the tweet if not then add the user's ID to the likes array and save the tweet
    if (!tweet.likes.includes(userId)) {
      tweet.likes.push(userId);
    }

    // Add the user's ID to the likes array and save the tweet
    await tweet.save();

    res.status(200).json({ message: "Tweet liked successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Endpoint to dislike (unlike) a tweet
router.post("/api/tweet/:id/dislike", verifyToken, async (req, res) => {
  try {
    const tweetId = req.params.id;
    const userId = req.user._id;

    // Find the tweet by ID
    const tweet = await Tweet.findById(tweetId);
    if (!tweet) {
      return res.status(404).json({ error: "Tweet not found" });
    }

    // Check if the user has not liked the tweet before
    if (!tweet.likes.includes(userId)) {
      return res.status(400).json({ message: "You have not liked this tweet" });
    }

    // Remove the user's ID from the likes array and save the tweet
    tweet.likes = tweet.likes.filter(
      (id) => id.toString() !== userId.toString()
    );
    await tweet.save();

    res.status(200).json({ message: "Tweet disliked successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Endpoint to reply to a tweet
router.post("/api/tweet/:id/reply", verifyToken, async (req, res) => {
  const { content } = req.body;
  const parentTweetId = req.params.id;
  const userId = req.user._id;

  if (!content) {
    return res.status(400).json({ error: "Content is required for a reply" });
  }

  try {
    // Create a new tweet based on the reply
    const newReplyTweet = new Tweet({
      content,
      tweetedBy: userId,
    });

    // Save the new tweet (the reply) in the DB
    const savedReplyTweet = await newReplyTweet.save();

    // Find the original tweet to reply to and add this new tweet's ID to its replies array
    const parentTweet = await Tweet.findById(parentTweetId);
    if (!parentTweet) {
      return res.status(404).json({ error: "Original tweet not found" });
    }

    // Add the new reply tweet's ID to the parent tweet's replies array and save it
    parentTweet.replies.push(savedReplyTweet._id);
    await parentTweet.save();

    res
      .status(201)
      .json({
        message: "Reply added successfully",
        replyId: savedReplyTweet._id,
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Endpoint to get single tweet details
router.get("/api/tweet/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // Find the tweet by ID and populate all referenced fields
    const tweet = await Tweet.findById(id)
      .populate("tweetedBy", "-password")
      .populate("likes", "-password") 
      .populate("reTweetedBy", "-password") 
      .populate({
        path: "replies",
        populate: { path: "tweetedBy", select: "-password" }, 
      });

    if (!tweet) {
      return res.status(404).json({ message: "Tweet not found." });
    }

    res.json(tweet);
  } catch (error) {
    console.error("Failed to get tweet details:", error);
    res
      .status(500)
      .json({
        message: "Failed to get tweet details",
        error: error.toString(),
      });
  }
});

// Endpoint to get all tweet details
router.get("/api/tweet", async (req, res) => {
  try {
    // Find all tweets, populate referenced fields, sort by createdAt in descending order
    const tweets = await Tweet.find({})
      .populate("tweetedBy", "-password") 
      .populate("likes", "-password") 
      .populate("reTweetedBy", "-password") 
      .populate({
        path: "replies",
        populate: { path: "tweetedBy", select: "-password" },
      })
      .sort({ createdAt: -1 }); // Sort by createdAt in descending order

    res.json(tweets);
  } catch (error) {
    console.error("Failed to get tweets:", error);
    res
      .status(500)
      .json({ message: "Failed to get tweets", error: error.toString() });
  }
});

//Endpoint to delete a tweet
router.delete("/api/tweet/:id", verifyToken, async (req, res) => {
  const tweetId = req.params.id;
  const userId = req.user._id;

  try {
    const tweet = await Tweet.findById(tweetId);

    if (!tweet) {
      return res.status(404).json({ message: "Tweet not found" });
    }

    // Check if the logged-in user is the one who created the tweet
    if (tweet.tweetedBy.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: "You can only delete your tweets" });
    }

    // Delete the tweet
    await Tweet.findByIdAndDelete(tweetId);
    // Remove references from other tweets
    await Tweet.updateMany(
      { replies: tweetId },
      { $pull: { replies: tweetId } }
    );

    res.status(200).json({ message: "Tweet deleted successfully" });
  } catch (error) {
    console.error("Failed to delete tweet:", error);
    res
      .status(500)
      .json({ message: "Failed to delete tweet", error: error.toString() });
  }
});

//Endpoint to retweet
router.post("/api/tweet/:id/retweet", verifyToken, async (req, res) => {
  const tweetId = req.params.id;
  const userId = req.user._id;

  try {
    const tweet = await Tweet.findById(tweetId);

    if (!tweet) {
      return res.status(404).json({ message: "Tweet not found" });
    }

    // Check if the user has already retweeted this tweet
    if (tweet.reTweetedBy.includes(userId)) {
      return res
        .status(400)
        .json({ message: "You have already retweeted this tweet" });
    }

    // Add the user's ID to the reTweetedBy array
    tweet.reTweetedBy.push(userId);

    // Save the updated tweet
    await tweet.save();

    res.status(200).json({ message: "Retweet successful" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to retweet" });
  }
});

//Endpoint to download a tweet image
const downloadFile = (req, res) => {
  const fileName = req.params.filename;
  const path = "./images/";

  res.download(path + fileName, (error) => {
      if (error) {
          res.status(500).send({ meassge: "File cannot be downloaded " + error })
      }
  })
}
router.get("/files/:filename", downloadFile);


module.exports = router;
