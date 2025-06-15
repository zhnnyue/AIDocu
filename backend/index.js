const express = require('express');
const multer = require('multer');
const fs = require('fs');
const cors = require('cors');
const cloudmersiveConvertApiClient = require('cloudmersive-convert-api-client');

const app = express(); // Must be declared before use

// Middlewares
app.use(cors());
app.use(express.json());

// Multer setup for file upload
const upload = multer({ dest: 'uploads/' });

// Cloudmersive API setup
const defaultClient = cloudmersiveConvertApiClient.ApiClient.instance;
const Apikey = defaultClient.authentications['Apikey'];
Apikey.apiKey = '07895b15-6385-4948-94bf-e58c0c332c2c'; // Replace with your real key

// Route: Convert PDF to Word
app.post('/convert/pdf-to-word', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  console.log('📄 Received file:', req.file.originalname);
  console.log('🛣 File path:', req.file.path);
  console.log('📎 MIME type:', req.file.mimetype);

  const inputFile = fs.createReadStream(req.file.path);
  const apiInstance = new cloudmersiveConvertApiClient.ConvertDocumentApi();

  try {
    const result = await apiInstance.convertDocumentPdfToDocx(inputFile);
    console.log('✅ Conversion successful');

    res.set('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.send(result.body);
  } catch (error) {
    console.error('❌ Conversion error:', error);

    if (error.response) {
      console.error('⚠️ Cloudmersive API responded with:', error.response.status, error.response.text);
    }

    if (!res.headersSent) {
      res.status(500).json({ error: 'PDF to Word conversion failed' });
    }
  } finally {
    fs.unlink(req.file.path, () => {}); // Cleanup uploaded file
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
