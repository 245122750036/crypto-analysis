// Fetch top cryptocurrencies by market cap
async function fetchCryptoData() {
  const response = await fetch("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=false");
  if (!response.ok) {
    throw new Error("Failed to fetch crypto data");
  }
  return await response.json();
}

// Fetch global market data
async function fetchGlobalData() {
  const response = await fetch("https://api.coingecko.com/api/v3/global");
  if (!response.ok) {
    throw new Error("Failed to fetch global data");
  }
  const data = await response.json();
  return data.data;
}

// Fetch historical price data for a coin
async function fetchHistoricalData(coin, days) {
  const response = await fetch(`https://api.coingecko.com/api/v3/coins/${coin}/market_chart?vs_currency=usd&days=${days}`);
  if (!response.ok) {
    throw new Error("Failed to fetch historical data");
  }
  return await response.json();
}

// Fetch detailed coin info
async function fetchCoinDetails(coinId) {
  const response = await fetch(`https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`);
  if (!response.ok) {
    throw new Error("Failed to fetch coin details");
  }
  return await response.json();
}

// Attach to window
window.api = {
  fetchCryptoData,
  fetchGlobalData,
  fetchHistoricalData,
  fetchCoinDetails
};

document.addEventListener("DOMContentLoaded", () => {
  const globalMarketCapElem = document.getElementById("global-market-cap");
  const globalVolumeElem = document.getElementById("global-volume");
  const btcDominanceElem = document.getElementById("btc-dominance");

  async function fetchMarketSummary() {
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/global');
      const data = await response.json();

      if (data && data.data) {
        const marketCap = data.data.total_market_cap.usd;
        const volume = data.data.total_volume.usd;
        const btcDominance = data.data.market_cap_percentage.btc;

        globalMarketCapElem.textContent = `Global Market Cap: $${(marketCap / 1_000_000_000_000).toFixed(2)}T`;
        globalVolumeElem.textContent = `24h Volume: $${(volume / 1_000_000_000).toFixed(2)}B`;
        btcDominanceElem.textContent = `BTC Dominance: ${btcDominance.toFixed(2)}%`;
      }
    } catch (e) {
      // Optionally handle errors
    }
  }

  fetchMarketSummary();
  // Optional: Update every minute
  // setInterval(fetchMarketSummary, 60000);
});
