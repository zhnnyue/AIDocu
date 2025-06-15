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

// Set your API key securely
const defaultClient = cloudmersiveConvertApiClient.ApiClient.instance;
const Apikey = defaultClient.authentications['Apikey'];
Apikey.apiKey = '07895b15-6385-4948-94bf-e58c0c332c2c';

const apiInstance = new cloudmersiveConvertApiClient.ConvertDocumentApi();

// PDF to Word route
app.post('/convert/pdf-to-word', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const inputFile = fs.createReadStream(req.file.path);
  console.log('📄 Received file:', req.file.originalname);
  console.log('🛣 File path:', req.file.path);
  console.log('📎 MIME type:', req.file.mimetype);

  // Use callback-style to prevent double send
  apiInstance.convertDocumentPdfToDocx(inputFile, (error, data, response) => {
    fs.unlink(req.file.path, () => {}); // Always clean up

    if (error) {
      console.error('❌ Conversion error:', error.message || error);
      return res.status(500).json({ error: 'PDF to Word conversion failed' });
    }

    // Success: send Word document
    res.set('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.send(data);
  });
});

// Start server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
