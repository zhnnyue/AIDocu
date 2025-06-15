const express = require('express');
const multer = require('multer');
const fs = require('fs');
const cors = require('cors');
const path = require('path');
const cloudmersiveConvertApiClient = require('cloudmersive-convert-api-client');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(express.json());

// Cloudmersive API key setup
const defaultClient = cloudmersiveConvertApiClient.ApiClient.instance;
const Apikey = defaultClient.authentications['Apikey'];
Apikey.apiKey = '07895b15-6385-4948-94bf-e58c0c332c2c'; // Replace with your own if necessary

// POST: /convert/pdf-to-word
app.post('/convert/pdf-to-word', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  // MIME type check
  if (req.file.mimetype !== 'application/pdf') {
    fs.unlink(req.file.path, () => {});
    return res.status(400).json({ error: 'Uploaded file is not a valid PDF.' });
  }

  const inputFile = fs.createReadStream(req.file.path);
  const apiInstance = new cloudmersiveConvertApiClient.ConvertDocumentApi();

  console.log(`📎 MIME type: ${req.file.mimetype}`);
  console.log(`🛣 File path: ${req.file.path}`);
  console.log(`📄 Received file: ${req.file.originalname}`);

  try {
    apiInstance.convertDocumentPdfToDocx(inputFile, (error, data, response) => {
      fs.unlink(req.file.path, () => {}); // Always clean up

      if (error) {
        console.error('❌ Conversion error:', error?.response?.text || error.message);
        return res.status(500).json({ error: 'Conversion failed - ' + (error?.response?.text || error.message) });
      }

      res.set('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.send(data);
    });
  } catch (err) {
    fs.unlink(req.file.path, () => {});
    console.error('❌ Unexpected error:', err.message);
    return res.status(500).json({ error: 'Unexpected error occurred.' });
  }
});

// Start server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
