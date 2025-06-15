const express = require("express");
const cors = require("cors");
const multer = require("multer");
const axios = require("axios");
const fs = require("fs");
require("dotenv").config();

const app = express();
const upload = multer({ dest: "uploads/" });

app.use(cors());
app.use(express.json());

// Logging basic server status
console.log("Server is starting...");

app.post("/convert", upload.single("file"), async (req, res) => {
  try {
    console.log("🔁 Received a file upload request");

    if (!req.file) {
      console.error("❌ No file received in the request");
      return res.status(400).send("No file uploaded.");
    }

    console.log("📄 Received file:", req.file);
    console.log("📎 Original filename:", req.file.originalname);
    console.log("📏 File size:", req.file.size, "bytes");
    console.log("🔑 API key present:", !!process.env.CLOUDMERSIVE_API_KEY);

    const fileStream = fs.createReadStream(req.file.path);

    const response = await axios.post(
      "https://api.cloudmersive.com/convert/pdf/to/docx/rasterize",
      fileStream,
      {
        headers: {
          "Content-Type": "application/pdf",
          Apikey: process.env.CLOUDMERSIVE_API_KEY,
        },
        responseType: "arraybuffer",
      }
    );

    console.log("✅ File converted successfully");

    res.setHeader("Content-Disposition", "attachment; filename=converted.docx");
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.send(response.data);
  } catch (error) {
    console.error("❌ Conversion failed:", error.response?.status, error.response?.data || error.message);
    res.status(500).send("Conversion failed.");
  } finally {
    // Clean up uploaded file
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("⚠️ Error deleting uploaded file:", err);
      });
    }
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
