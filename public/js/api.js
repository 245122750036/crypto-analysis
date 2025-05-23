// Define mock implementations of all required API functions

async function fetchCryptoData() {
  return [
    {
      id: "bitcoin",
      name: "Bitcoin",
      symbol: "btc",
      current_price: 68200,
      market_cap: 1200000000000,
      total_volume: 30000000000,
      price_change_percentage_24h: 2.3,
      image: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png"
    },
    {
      id: "ethereum",
      name: "Ethereum",
      symbol: "eth",
      current_price: 3500,
      market_cap: 400000000000,
      total_volume: 18000000000,
      price_change_percentage_24h: -1.1,
      image: "https://assets.coingecko.com/coins/images/279/large/ethereum.png"
    },
    {
      id: "cardano",
      name: "Cardano",
      symbol: "ada",
      current_price: 0.45,
      market_cap: 15000000000,
      total_volume: 2000000000,
      price_change_percentage_24h: 0.5,
      image: "https://assets.coingecko.com/coins/images/975/large/cardano.png"
    }
  ];
}

async function fetchGlobalData() {
  return {
    market_cap_percentage: { btc: 47.3 },
    active_cryptocurrencies: 9954,
    markets: 540
  };
}

async function fetchHistoricalData(coin, days) {
  return {
    prices: Array.from({ length: parseInt(days) }, (_, i) => [
      Date.now() - i * 86400000,
      50000 + Math.random() * 10000
    ])
  };
}
async function fetchCryptoData() {
  const response = await fetch("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=false");
  if (!response.ok) {
    throw new Error("Failed to fetch crypto data");
  }
  return await response.json();
}

async function fetchCoinDetails(coinId) {
  return {
    id: coinId,
    name: coinId.toUpperCase(),
    current_price: 50000 + Math.random() * 10000,
    ath: 69000,
    high_24h: 55000,
    low_24h: 48000,
    price_change_percentage_24h: Math.random() * 10 - 5,
    market_cap: 1000000000,
    total_volume: 300000000,
    circulating_supply: 19000000,
    total_supply: 21000000
  };
}

// Attach to window
window.api = {
  fetchCryptoData,
  fetchGlobalData,
  fetchHistoricalData,
  fetchCoinDetails
};
