const mongoose = require("mongoose");

//Defining tweetSchema
const tweetSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
    },
    tweetedBy: { 
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    reTweetedBy: [ 
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    image: String,
    replies: [ 
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tweet",
      },
    ]
  },
  { timestamps: true } 
);

mongoose.model("Tweet", tweetSchema);
