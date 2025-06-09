// charts.js

document.addEventListener("DOMContentLoaded", () => {
  const coinSelect = document.getElementById("coin-select");
  const timeRangeSelect = document.getElementById("time-range");
  const chartTypeSelect = document.getElementById("chart-type");
  const updateBtn = document.getElementById("update-chart-btn");
  const priceChartCanvas = document.getElementById("price-chart").getContext("2d");

  let chart;

  async function populateCoinDropdown() {
    try {
      const coins = await window.api.fetchCryptoData();
      coinSelect.innerHTML = "";
      coins.forEach(coin => {
        const option = document.createElement("option");
        option.value = coin.id;
        option.textContent = `${coin.name} (${coin.symbol.toUpperCase()})`;
        coinSelect.appendChild(option);
      });
    } catch (err) {
      console.error("Failed to populate coin list:", err);
    }
  }

  async function updateChart() {
    const coin = coinSelect.value;
    const days = timeRangeSelect.value;
    const chartType = chartTypeSelect.value;

    try {
      const data = await window.api.fetchHistoricalData(coin, days);
      const prices = data.prices;

      const labels = prices.map(p => new Date(p[0]));
      const values = prices.map(p => p[1]);

      if (chart) chart.destroy();

      chart = new Chart(priceChartCanvas, {
        type: chartType,
        data: {
          labels,
          datasets: [{
            label: `${coin.toUpperCase()} Price (USD)`,
            data: values,
            borderColor: '#006400', // dark green
            backgroundColor: 'rgba(0, 100, 0, 0.08)', // dark green with opacity
            fill: true,
            tension: 0.3,
          }]
        },
        options: {
          responsive: true,
          scales: {
            x: {
              type: "time",
              time: {
                unit: days === "1" ? "hour" : "day"
              }
            },
            y: {
              beginAtZero: false
            }
          }
        }
      });

      updatePriceStats(coin);
    } catch (error) {
      console.error("Failed to load chart data:", error);
    }
  }

  async function updatePriceStats(coinId) {
    try {
      const data = await fetch(`https://api.coingecko.com/api/v3/coins/${coinId}`).then(r => r.json());
      document.getElementById("current-price").textContent = `$${data.market_data.current_price.usd.toLocaleString()}`;
      document.getElementById("high-24h").textContent = `$${data.market_data.high_24h.usd.toLocaleString()}`;
      document.getElementById("low-24h").textContent = `$${data.market_data.low_24h.usd.toLocaleString()}`;
      document.getElementById("change-24h").textContent = `${data.market_data.price_change_percentage_24h.toFixed(2)}%`;
      document.getElementById("ath").textContent = `$${data.market_data.ath.usd.toLocaleString()}`;
      document.getElementById("market-cap").textContent = `$${data.market_data.market_cap.usd.toLocaleString()}`;
      document.getElementById("volume-24h").textContent = `$${data.market_data.total_volume.usd.toLocaleString()}`;
      document.getElementById("circulating-supply").textContent = data.market_data.circulating_supply.toLocaleString();
      document.getElementById("total-supply").textContent = data.market_data.total_supply
        ? data.market_data.total_supply.toLocaleString()
        : "N/A";
    } catch (error) {
      console.error("Failed to fetch coin details:", error);
    }
  }

  populateCoinDropdown().then(() => {
    updateChart();
  });

  updateBtn.addEventListener("click", updateChart);
});