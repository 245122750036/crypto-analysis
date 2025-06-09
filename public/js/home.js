document.addEventListener("DOMContentLoaded", async () => {
  try {
    const cryptoData = await window.api.fetchCryptoData();
    if (!cryptoData || cryptoData.length === 0) {
      console.error("No crypto data found.");
      return;
    }

    updateTopMovers(cryptoData);
    updateMarketTable(cryptoData);
    updateQuickStats(await window.api.fetchGlobalData());
  } catch (error) {
      console.error("Error initializing dashboard:", error);
  }
});

function updateTopMovers(data) {
  const container = document.getElementById("top-movers-container");
  if (!container) return;
  container.innerHTML = "";

  data.slice(0, 4).forEach(coin => {
    const card = document.createElement("div");
    card.className = "top-mover-card";
    card.innerHTML = `
      <h4>${coin.name}</h4>
      <p>$ ${coin.current_price.toLocaleString()}</p>
      <p class="${coin.price_change_percentage_24h >= 0 ? 'positive-change' : 'negative-change'}">
        ${coin.price_change_percentage_24h.toFixed(2)}%
      </p>
    `;
    container.appendChild(card);
  });
}

function updateMarketTable(data) {
  const tbody = document.getElementById("crypto-table-body");
  if (!tbody) return;
  tbody.innerHTML = "";

  data.slice(0, 10).forEach((coin, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${coin.name} (${coin.symbol.toUpperCase()})</td>
      <td>$ ${coin.current_price.toLocaleString()}</td>
      <td class="${coin.price_change_percentage_24h >= 0 ? 'positive-change' : 'negative-change'}">
        ${coin.price_change_percentage_24h.toFixed(2)}%
      </td>
      <td>$ ${coin.market_cap.toLocaleString()}</td>
      <td>$ ${coin.total_volume.toLocaleString()}</td>
      <td><canvas height="20"></canvas></td>
    `;
    tbody.appendChild(row);
  });
}

function updateQuickStats(globalData) {
  if (!globalData) return;

  const btcDomElem = document.getElementById("btc-dominance-value");
  const volumeElem = document.getElementById("market-volume-value");
  const activeElem = document.getElementById("active-crypto-value");

  if (btcDomElem && globalData.market_cap_percentage?.btc) {
    btcDomElem.textContent = `${globalData.market_cap_percentage.btc.toFixed(2)}%`;
  }

  if (volumeElem) {
    volumeElem.textContent = "$1.23B"; // Placeholder or you can use globalData.volume if available
  }

  if (activeElem && globalData.active_cryptocurrencies) {
    activeElem.textContent = globalData.active_cryptocurrencies.toLocaleString();
  }
}
