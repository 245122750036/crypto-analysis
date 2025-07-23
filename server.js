const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const puppeteer = require('puppeteer');
const axios = require('axios');
const ARIMA = require('arima'); //  ARIMA imported

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// =========================
//  ARIMA FORECAST FUNCTION
// =========================
function arimaForecast(prices, predictDays = 7, lastTimestamp) {
  const arima = new ARIMA({ p: 2, d: 1, q: 2, verbose: false }).train(prices);

  // Predict next 7 values
  const [predicted, errors] = arima.predict(predictDays);

  // Use last date from historical data if available
  let lastDate = lastTimestamp ? new Date(lastTimestamp) : new Date();
  const predictions = [];
  for (let i = 0; i < predictDays; i++) {
    lastDate.setDate(lastDate.getDate() + 1);
    predictions.push({
      date: lastDate.toISOString().slice(0, 10),
      price: predicted[i].toFixed(2),
      error: errors[i].toFixed(2)
    });
  }
  return predictions;
}

// =========================
//  API ENDPOINTS
// =========================

// Coin Details
app.get('/api/coin-details/:coinId', async (req, res) => {
  const coinId = req.params.coinId;
  const url = `https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&tickers=false&market_data=true`;
  try {
    const response = await axios.get(url);
    res.json(response.data);
  } catch (error) {
    console.error("Error fetching coin details:", error);
    res.status(500).json({ error: "Failed to fetch data" });
  }
});

// Mock Crypto Data
app.get('/api/crypto-data', (req, res) => {
  res.json([{ name: "Bitcoin", symbol: "BTC", current_price: 68000, market_cap: 1200000000, total_volume: 250000000, price_change_percentage_24h: 2.3, image: "https://example.com/btc.png" }]);
});

// Global Data
app.get('/api/global-data', (req, res) => {
  res.json({ market_cap_percentage: { btc: 45.6 }, active_cryptocurrencies: 9850, active_exchanges: 500 });
});

// Historical Mock Data
app.get('/api/historical-data/:coin/:days', (req, res) => {
  const { coin, days } = req.params;
  res.json({
    prices: Array.from({ length: parseInt(days) }, (_, i) => [Date.now() - i * 86400000, 60000 + Math.random() * 5000])
  });
});

// =========================
// SEND REPORT (WITH ARIMA FORECAST)
// =========================
app.post('/api/send-report', async (req, res) => {
  const { email, coin, timeframe, reportData } = req.body;

  // 1. Fetch historical 30-day data for ARIMA
  let histData;
  try {
    const histRes = await axios.get(`https://api.coingecko.com/api/v3/coins/${coin}/market_chart`, {
      params: { vs_currency: 'usd', days: 30, interval: 'daily' }
    });
    histData = histRes.data;
  } catch (err) {
    console.error("Error fetching historical data:", err.message);
    return res.status(500).json({ error: "Failed to fetch historical data" });
  }

  // 2. Run ARIMA Forecast
  const prices = histData.prices.map(p => p[1]);
  const lastTimestamp = histData.prices[histData.prices.length - 1][0];
  const predictions = arimaForecast(prices, 7, lastTimestamp);

  // 3. Build Report HTML with Chart.js
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
        <div class="report-container" id="report-container">
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

  // 4. Generate PDF with Puppeteer
  let pdfBuffer;
  try {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    await page.setContent(previewReportHtml, { waitUntil: 'networkidle0' });
    await page.waitForSelector('#predictionChart');

    await page.waitForFunction(() => {
      const canvas = document.getElementById('predictionChart');
      if (!canvas) return false;
      const ctx = canvas.getContext('2d');
      const pixelBuffer = new Uint32Array(ctx.getImageData(0, 0, canvas.width, canvas.height).data.buffer);
      return pixelBuffer.some(color => color !== 0);
    });

    pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();
  } catch (err) {
    console.error('Puppeteer PDF generation error:', err);
    pdfBuffer = null;
  }

  // 5. Send Email with ARIMA Predictions
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
          ${predictions.map(p => `<li><strong>${p.date}:</strong> $${p.price} (±${p.error})</li>`).join('')}
        </ul>
        <p style="margin-top:24px;">See attached PDF for full report with chart.</p>
      </div>
    `,
    attachments: pdfBuffer ? [{
      filename: 'crypto-report.pdf',
      content: pdfBuffer,
      contentType: 'application/pdf'
    }] : []
  };

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'vidishareddy984@gmail.com',
      pass: 'drba ahmj gitp mvxf'
    },
    port: 465,
    secure: false
  });

  try {
    await transporter.sendMail(mailOptions);
    res.json({ success: true });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// =========================
//  START SERVER
// =========================
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
