const express = require('express');
const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const app = express();
app.use(express.json({ limit: '50mb' }));

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'rembg-service v1' });
});

// POST /remove-bg
// Body: { image: "data:image/jpeg;base64,..." }
// Returns: { image: "data:image/png;base64,..." }
app.post('/remove-bg', async (req, res) => {
  const { image } = req.body;

  if (!image) {
    return res.status(400).json({ error: 'Missing image field' });
  }

  // Wyodrębnij base64
  const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
  const inputExt = image.startsWith('data:image/png') ? 'png' : 'jpg';

  // Pliki tymczasowe
  const tmpDir = os.tmpdir();
  const inputPath  = path.join(tmpDir, `input_${Date.now()}.${inputExt}`);
  const outputPath = path.join(tmpDir, `output_${Date.now()}.png`);

  try {
    // Zapisz input
    fs.writeFileSync(inputPath, Buffer.from(base64Data, 'base64'));

    // Wywołaj rembg
    await new Promise((resolve, reject) => {
      execFile('rembg', ['i', inputPath, outputPath], { timeout: 60000 }, (err, stdout, stderr) => {
        if (err) reject(new Error(stderr || err.message));
        else resolve();
      });
    });

    // Odczytaj output
    const outputBuffer = fs.readFileSync(outputPath);
    const outputBase64 = outputBuffer.toString('base64');

    res.json({ image: `data:image/png;base64,${outputBase64}` });

  } catch (err) {
    console.error('rembg error:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    // Cleanup
    try { fs.unlinkSync(inputPath); } catch {}
    try { fs.unlinkSync(outputPath); } catch {}
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`rembg-service running on port ${PORT}`);
});
