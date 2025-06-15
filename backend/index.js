const express = require('express');
const multer = require('multer');
const axios = require('axios');
const axiosRetry = require('axios-retry');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());             // Enable CORS for all routes
app.options('*', cors());    // Handle preflight requests

const upload = multer({ dest: 'uploads/' });
const API_KEY = process.env.CLOUDMERSIVE_API_KEY;

axiosRetry(axios, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => {
    return error.response?.status >= 500;
  },
  onRetry: (err, attempt) => {
    console.log(`Retry attempt ${attempt}:`, err.message);
  }
});

async function convertPDF(filePath) {
  console.log(`Uploading to Cloudmersive (rasterize) ${filePath}`);
  const data = require('fs').readFileSync(filePath);
  const res = await axios.post(
    'https://api.cloudmersive.com/convert/pdf/to/docx/rasterize',
    data,
    {
      headers: { Apikey: API_KEY, 'Content-Type': 'application/pdf' },
      responseType: 'arraybuffer'
    }
  );
  return res.data;
}

async function convertDocx(filePath) {
  console.log(`Converting DOCX → PDF for ${filePath}`);
  const data = require('fs').readFileSync(filePath);
  const res = await axios.post(
    'https://api.cloudmersive.com/convert/docx/to/pdf',
    data,
    {
      headers: { Apikey: API_KEY, 'Content-Type': 'application/octet-stream' },
      responseType: 'arraybuffer'
    }
  );
  return res.data;
}

app.post('/convert/pdf-to-word', upload.single('file'), async (req, res) => {
  try {
    const blob = await convertPDF(req.file.path);
    res.set('Content-Disposition', 'attachment; filename=converted.docx');
    res.send(blob);
  } catch (err) {
    console.error('PDF conversion error:', err.response?.status, err.response?.data);
    res.status(502).json({ error: 'Conversion failed due to internal server error.' });
  }
});

app.post('/convert/word-to-pdf', upload.single('file'), async (req, res) => {
  try {
    const blob = await convertDocx(req.file.path);
    res.set('Content-Disposition', 'attachment; filename=converted.pdf');
    res.send(blob);
  } catch (err) {
    console.error('DOCX conversion error:', err.response?.status, err.response?.data);
    res.status(502).json({ error: 'Conversion failed due to internal server error.' });
  }
});

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`Server running on port ${port}`));
