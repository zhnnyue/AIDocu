const express = require('express');
const multer = require('multer');
const axios = require('axios');
const fs = require('fs');
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

require('dotenv').config();

// Enable CORS for all routes
app.use(cors());
app.options('*', cors());

// Set up multer for handling file uploads
const upload = multer({ dest: 'uploads/' });

// POST endpoint to handle PDF-to-Word conversion
app.post('/convert', upload.single('file'), async (req, res) => {
  const filePath = req.file.path;
  const cloudmersiveUrl = 'https://api.cloudmersive.com/convert/pdf/to/docx/rasterize';
  const apiKey = process.env.CLOUDMERSIVE_API_KEY;

  const fileStream = fs.createReadStream(filePath);
  const headers = {
    'Apikey': apiKey,
    'Content-Type': 'application/pdf',
  };

  let attempt = 0;
  const maxRetries = 3;
  let success = false;
  let response;

  while (attempt < maxRetries && !success) {
    try {
      console.log(`Attempt ${attempt + 1} to convert file...`);

      response = await axios.post(cloudmersiveUrl, fileStream, {
        headers: headers,
        responseType: 'arraybuffer',
        timeout: 10000,
      });

      success = true;
    } catch (error) {
      attempt++;
      console.error(`Attempt ${attempt} failed:`, error.message);

      if (attempt >= maxRetries) {
        return res.status(502).json({
          error: 'Cloudmersive API failed after multiple attempts.',
          details: error.message,
        });
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // Clean up the uploaded file
  fs.unlink(filePath, (err) => {
    if (err) console.error('Error deleting file:', err);
  });

  // Send the resulting DOCX file to the client
  res.set({
    'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'Content-Disposition': 'attachment; filename="converted.docx"',
  });
  res.send(response.data);
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
