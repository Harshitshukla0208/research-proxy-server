// server.js
const express = require("express");
const cors = require("cors");
const { createProxyMiddleware } = require("http-proxy-middleware");
const multer = require("multer");
const FormData = require("form-data");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3001;

// Configure storage for uploaded files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Create uploads directory if it doesn't exist
if (!fs.existsSync("./uploads")) {
  fs.mkdirSync("./uploads");
}

// Proxy endpoint for processing research papers
app.post("/api/research/process", upload.single("file"), async (req, res) => {
  try {
    const { author, title, year, publisher } = req.query;

    // Create form data to send to the actual API
    const formData = new FormData();
    formData.append("file", fs.createReadStream(req.file.path));

    // Build URL with query parameters
    let url = "https://agent-gpt-based.onrender.com/api/research/process";
    const params = new URLSearchParams();
    if (author) params.append("author", author);
    if (title) params.append("title", title);
    if (year) params.append("year", year);
    if (publisher) params.append("publisher", publisher);

    if ([...params].length > 0) {
      url += `?${params.toString()}`;
    }

    // Forward the request to the actual API
    const response = await axios.post(url, formData, {
      headers: {
        ...formData.getHeaders(),
      },
    });

    // Return the API response to the client
    res.json(response.data);

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);
  } catch (error) {
    console.error("Error proxying request:", error);
    res.status(500).json({
      error: "Failed to process request",
      details: error.message,
    });

    // Clean up uploaded file if it exists
    if (req.file && req.file.path) {
      fs.unlinkSync(req.file.path);
    }
  }
});

// Proxy endpoint for querying research papers
app.post("/api/research/query", upload.single("file"), async (req, res) => {
  try {
    const { query } = req.query;

    // Create form data to send to the actual API
    const formData = new FormData();
    formData.append("file", fs.createReadStream(req.file.path));

    // Build URL with query parameters
    let url = "https://agent-gpt-based.onrender.com/api/research/query";
    if (query) {
      url += `?query=${encodeURIComponent(query)}`;
    }

    // Forward the request to the actual API
    const response = await axios.post(url, formData, {
      headers: {
        ...formData.getHeaders(),
      },
    });

    // Return the API response to the client
    res.json(response.data);

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);
  } catch (error) {
    console.error("Error proxying request:", error);
    res.status(500).json({
      error: "Failed to process request",
      details: error.message,
    });

    // Clean up uploaded file if it exists
    if (req.file && req.file.path) {
      fs.unlinkSync(req.file.path);
    }
  }
});

// Serve static files from the 'public' directory
app.use(express.static("public"));

app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});
