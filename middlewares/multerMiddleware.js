const multer = require("multer");
const path = require("path");

// Set storage engine for multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images/");
  },
  filename: (req, file, cb) => {
    console.log(file);
    cb(null, file.originalname);
  },
});

// Check file type
function checkFileType(file, cb) {
  /* The line `const filetypes = /jpeg|jpg|png/;` is creating a regular expression pattern that matches
  file extensions for JPEG, JPG, and PNG image files. This pattern is used later in the code to
  check if the uploaded file has one of these allowed image file extensions. */
  const filetypes = /jpeg|jpg|png/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb("Error: Images only! (jpg, jpeg, png)");
  }
}

// Init multer
const upload = multer({
  storage: storage,
  limits: { fileSize: 9000000 }, // 9MB limit
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
});

module.exports = upload;
