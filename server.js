const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
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

  // Build the email content
  const mailOptions = {
    from: '245122750060@mvsrec.edu.in',
    to: email,
    subject: `Crypto Report: ${coin} (${timeframe})`,
    html: `
      <h2>Crypto Report for ${coin}</h2>
      <p><strong>Timeframe:</strong> ${timeframe}</p>
      <ul>
        <li><strong>Current Price:</strong> $${reportData.current_price}</li>
        <li><strong>High:</strong> $${reportData.high}</li>
        <li><strong>Low:</strong> $${reportData.low}</li>
        <li><strong>Change:</strong> ${reportData.change}%</li>
        <li><strong>Volume:</strong> $${reportData.volume}B</li>
      </ul>
      <p>${reportData.analysis}</p>
    `
  };

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
