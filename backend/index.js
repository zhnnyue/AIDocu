require('dotenv').config();
const express = require('express');
const multer = require('multer');
const axios = require('axios');
const cors = require('cors');
const fs = require('fs');

const app = express();
const upload = multer({ dest: 'uploads/' });
const API_KEY = process.env.CLOUDMERSIVE_API_KEY;

app.use(cors());

async function convert(filePath, endpoint, contentType, outExt, res) {
  const data = fs.readFileSync(filePath);
  const apiRes = await axios.post(
    `https://api.cloudmersive.com/convert/${endpoint}`,
    data, {
      headers: {
        'Content-Type': contentType,
        'Apikey': API_KEY
      },
      responseType: 'arraybuffer'
    }
  );
  res.set('Content-Disposition', `attachment; filename=converted.${outExt}`);
  res.send(apiRes.data);
  fs.unlinkSync(filePath);
}

app.post('/convert/pdf-to-word', upload.single('file'), (req, res) =>
  convert(req.file.path, 'pdf/to/docx', 'application/pdf', 'docx', res)
);

app.post('/convert/word-to-pdf', upload.single('file'), (req, res) =>
  convert(req.file.path, 'docx/to/pdf', 'application/octet-stream', 'pdf', res)
);

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`Backend running on port ${port}`));
