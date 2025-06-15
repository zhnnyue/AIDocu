const express = require('express');
const multer = require('multer');
const cloudmersiveConvertApiClient = require('cloudmersive-convert-api-client');
const fs = require('fs');
const path = require('path');

// ... existing config and API setup ...

const upload = multer({ dest: 'uploads/' });

// PDF to Word endpoint
app.post('/convert/pdf-to-word', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Read uploaded file
    const filePath = path.resolve(req.file.path);
    const inputFile = fs.createReadStream(filePath);

    // Prepare Cloudmersive client
    const defaultClient = cloudmersiveConvertApiClient.ApiClient.instance;
    const Apikey = defaultClient.authentications['Apikey'];
    Apikey.apiKey = process.env.CLOUDMERSIVE_API_KEY;

    const apiInstance = new cloudmersiveConvertApiClient.ConvertDocumentApi();

    // Call the API
    apiInstance.convertDocumentPdfToDocx(inputFile, (error, data, response) => {
      // Delete temp upload
      fs.unlinkSync(filePath);

      if (error) {
        return res.status(500).json({ message: 'Conversion failed', error: error.message });
      }

      // Respond with DOCX
      res.set({
        'Content-Disposition': 'attachment; filename="converted.docx"',
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });
      res.send(data);
    });
  } catch (err) {
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
});
