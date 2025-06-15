const express = require('express');
const multer = require('multer');
const fs = require('fs');
const cors = require('cors');
const path = require('path');
const cloudmersiveConvertApiClient = require('cloudmersive-convert-api-client');

const app = express(); // ✅ This must come BEFORE using `app`

const upload = multer({ dest: 'uploads/' });
app.use(cors());
app.use(express.json());

// Cloudmersive API key
const defaultClient = cloudmersiveConvertApiClient.ApiClient.instance;
const Apikey = defaultClient.authentications['Apikey'];
Apikey.apiKey = '07895b15-6385-4948-94bf-e58c0c332c2c';

// Endpoint
app.post('/convert/pdf-to-word', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const inputFile = fs.createReadStream(req.file.path);
  const apiInstance = new cloudmersiveConvertApiClient.ConvertDocumentApi();

  try {
    const result = await apiInstance.convertDocumentPdfToDocx(inputFile);
    res.set('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.send(result.body);
  } catch (error) {
    console.error('Conversion error:', error?.response?.text || error.message);
    res.status(500).json({ error: 'PDF to Word conversion failed' });
  } finally {
    fs.unlink(req.file.path, () => {});
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
