const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const puppeteer = require('puppeteer');
const app = express();
const PORT = 3000; // Changed from 5000 to 3000

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

 // Serve frontend files

// Mock API endpoints
app.get('/api/coin-details/:coinId', async (req, res) => {
  const coinId = req.params.coinId;
  const url = `https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&tickers=false&market_data=true`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Error fetching coin details:", error);
    res.status(500).json({ error: "Failed to fetch data" });
  }
});

app.get('/api/crypto-data', (req, res) => {
  res.json([{ name: "Bitcoin", symbol: "BTC", current_price: 68000, market_cap: 1200000000, total_volume: 250000000, price_change_percentage_24h: 2.3, image: "https://example.com/btc.png" }]);
});

app.get('/api/global-data', (req, res) => {
  res.json({ market_cap_percentage: { btc: 45.6 }, active_cryptocurrencies: 9850, active_exchanges: 500 });
});

app.get('/api/historical-data/:coin/:days', (req, res) => {
  const { coin, days } = req.params;
  res.json({
    prices: Array.from({ length: parseInt(days) }, (_, i) => [Date.now() - i * 86400000, 60000 + Math.random() * 5000])
  });
});
// Express backend (Node.js)
app.get("/api/coin-details/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const response = await fetch(`https://api.coingecko.com/api/v3/coins/${id}`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch coin data" });
  }
});

app.post('/api/send-report', async (req, res) => {
  const { email, coin, timeframe, reportData } = req.body;

  // Generate a simple 7-day prediction (mock: +2% per day)
  const predictions = [];
  let price = Number(reportData.current_price);
  for (let i = 1; i <= 7; i++) {
    price = price * 1.02; // increase by 2% each day
    const date = new Date();
    date.setDate(date.getDate() + i);
    predictions.push({
      date: date.toISOString().slice(0, 10),
      price: price.toFixed(2)
    });
  }

  // Build the preview report HTML with Chart.js for predictions
  const previewReportHtml = `
    <html>
      <head>
        <meta charset="UTF-8">
        <title>${coin} Report Preview</title>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <style>
          body { background:#fff; font-family:Segoe UI,Arial,sans-serif; }
          .report-container { border-radius:8px; box-shadow:0 2px 8px #eee; padding:24px; max-width:420px; margin:auto; }
          .section { margin-bottom:12px; }
          .section strong { display:block; margin-bottom:4px; }
        </style>
      </head>
      <body>
        <div class="report-container">
          <h2 style="margin-top:0;margin-bottom:8px;font-size:1.5em;">${coin} Report</h2>
          <div style="color:#888;font-size:0.95em;margin-bottom:18px;">
            Generated on: ${new Date().toLocaleString()}
          </div>
          <div class="section">
            <div><strong>Current Price:</strong> <span style="font-size:1.2em;">$${reportData.current_price}</span></div>
            <div><strong>Period High:</strong> $${reportData.high}</div>
            <div><strong>Period Low:</strong> $${reportData.low}</div>
            <div><strong>Price Change:</strong> ${reportData.change}%</div>
            <div><strong>Volume:</strong> $${reportData.volume}B</div>
          </div>
          <div class="section">
            <strong>Analysis:</strong>
            <div style="margin-top:4px;">${reportData.analysis}</div>
          </div>
          <div class="section">
            <strong>Future Prediction (Next 7 Days):</strong>
            <canvas id="predictionChart" width="350" height="180"></canvas>
          </div>
        </div>
        <script>
          const ctx = document.getElementById('predictionChart').getContext('2d');
          new Chart(ctx, {
            type: 'line',
            data: {
              labels: ${JSON.stringify(predictions.map(p => p.date))},
              datasets: [{
                label: 'Predicted Price',
                data: ${JSON.stringify(predictions.map(p => p.price))},
                borderColor: '#4285f4',
                backgroundColor: 'rgba(66,133,244,0.08)',
                fill: true,
                tension: 0.3,
                pointRadius: 3
              }]
            },
            options: {
              plugins: { legend: { display: false } },
              scales: {
                x: { title: { display: true, text: 'Date' } },
                y: { title: { display: true, text: 'Price ($)' } }
              }
            }
          });
        </script>
      </body>
    </html>
  `;

  // Generate screenshot with Puppeteer
  let screenshotBuffer;
  try {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    await page.setContent(previewReportHtml, { waitUntil: 'networkidle0' });
    await page.waitForSelector('#predictionChart');
    // Wait until the chart canvas has pixels drawn (not blank)
    await page.waitForFunction(() => {
      const canvas = document.getElementById('predictionChart');
      if (!canvas) return false;
      const ctx = canvas.getContext('2d');
      const pixelBuffer = new Uint32Array(
        ctx.getImageData(0, 0, canvas.width, canvas.height).data.buffer
      );
      return pixelBuffer.some(color => color !== 0);
    });
    screenshotBuffer = await page.screenshot({ type: 'png' });
    await browser.close();
  } catch (err) {
    console.error('Puppeteer screenshot error:', err);
    screenshotBuffer = null;
  }

  // Email options with screenshot attachment (HTML body can remain as before)
  const mailOptions = {
    from: 'vidishareddy984@gmail.com',
    to: email,
    subject: `Crypto Report: ${coin} (${timeframe})`,
    html: `
      <div>
        <h2>${coin} Report</h2>
        <div>Generated on: ${new Date().toLocaleString()}</div>
        <div><strong>Current Price:</strong> $${reportData.current_price}</div>
        <div><strong>Period High:</strong> $${reportData.high}</div>
        <div><strong>Period Low:</strong> $${reportData.low}</div>
        <div><strong>Price Change:</strong> ${reportData.change}%</div>
        <div><strong>Volume:</strong> $${reportData.volume}B</div>
        <div><strong>Analysis:</strong> ${reportData.analysis}</div>
        <h3>Future Prediction (Next 7 Days)</h3>
        <ul>
          ${predictions.map(p => `<li><strong>${p.date}:</strong> $${p.price}</li>`).join('')}
        </ul>
        <p style="margin-top:24px;">See attached image for a screenshot of the preview report with chart.</p>
      </div>
    `,
    attachments: screenshotBuffer
      ? [{
          filename: 'preview-report.png',
          content: screenshotBuffer,
          contentType: 'image/png'
        }]
      : []
  };

  // Configure your SMTP transporter (use your real credentials)
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'vidishareddy984@gmail.com',
      pass: 'drba ahmj gitp mvxf'
    },
    port: 465,
    secure: false // Use TLS, not SSL
  });

  try {
    await transporter.sendMail(mailOptions);
    res.json({ success: true });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
