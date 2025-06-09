document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("report-form");
  const previewBtn = document.getElementById("preview-report-btn");
  const closePreviewBtn = document.getElementById("close-preview-btn");
  const previewSection = document.getElementById("report-preview");
  const modal = document.getElementById("email-success");
  const closeModalBtns = modal.querySelectorAll(".close-btn-primary, .close-modal-btn");
  const loadingOverlay = document.getElementById("loading-overlay");

  let lastPreviewData = null; // Stores the last previewed report data

  function formatCurrency(value) {
    return `$${parseFloat(value).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  // Map timeframes to CoinGecko-supported days
  const daysMap = {
    minute: 1, // CoinGecko does not support <1 day, so use 1
    hour: 1,
    day: 1,
    week: 7,
    month: 30
  };

  // Fetch real report data from CoinGecko
  async function fetchReportData(coin, timeframe) {
    const days = daysMap[timeframe] || 1;

    // Fetch current data
    const marketRes = await fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${coin}`);
    const marketData = (await marketRes.json())[0];

    // Fetch historical data
    const histRes = await fetch(`https://api.coingecko.com/api/v3/coins/${coin}/market_chart?vs_currency=usd&days=${days}`);
    const histData = await histRes.json();

    // Use all prices for high/low, and first/last for change
    const prices = histData.prices.map(p => p[1]);
    const high = Math.max(...prices);
    const low = Math.min(...prices);
    const firstPrice = prices[0];
    const lastPrice = prices[prices.length - 1];
    const change = ((lastPrice - firstPrice) / firstPrice) * 100;

    // Volume (last value)
    const volume = histData.total_volumes.length > 0 ? histData.total_volumes[histData.total_volumes.length - 1][1] : 0;

    return {
      current_price: marketData.current_price,
      high,
      low,
      change: change.toFixed(2),
      volume: (volume / 1_000_000_000).toFixed(2), // in B
      analysis: `In the selected period, ${marketData.name} moved from $${firstPrice.toFixed(2)} to $${lastPrice.toFixed(2)}.`
    };
  }

  async function generatePreview() {
    showLoading();
    const coin = document.getElementById("report-coin").value;
    const timeframe = document.getElementById("report-timeframe").value;

    try {
      const data = await fetchReportData(coin, timeframe);
      lastPreviewData = data; // Store the previewed data here

      document.getElementById("preview-title").textContent = `${coin.charAt(0).toUpperCase() + coin.slice(1)} Report`;
      document.getElementById("preview-date").textContent = `Generated on: ${new Date().toLocaleString()}`;
      document.getElementById("preview-price").textContent = formatCurrency(data.current_price);
      document.getElementById("preview-high").textContent = formatCurrency(data.high);
      document.getElementById("preview-low").textContent = formatCurrency(data.low);
      document.getElementById("preview-change").textContent = `${data.change}%`;
      document.getElementById("preview-volume").textContent = `$${data.volume}B`;
      document.getElementById("preview-analysis").textContent = data.analysis;

      // Chart
      const ctx = document.getElementById("report-chart").getContext("2d");
      if (window.reportChart) {
        window.reportChart.destroy();
      }
      // Use the same historical data for the chart
      const histRes = await fetch(`https://api.coingecko.com/api/v3/coins/${coin}/market_chart?vs_currency=usd&days=${daysMap[timeframe] || 1}`);
      const histData = await histRes.json();
      const chartLabels = histData.prices.map(p => new Date(p[0]).toLocaleString());
      const chartData = histData.prices.map(p => p[1]);

      window.reportChart = new Chart(ctx, {
        type: "line",
        data: {
          labels: chartLabels,
          datasets: [{
            label: `${coin.toUpperCase()} Price`,
            data: chartData,
            borderColor: "rgba(75,192,192,1)",
            backgroundColor: "rgba(75,192,192,0.2)",
            tension: 0.3,
          }]
        },
        options: {
          responsive: true,
          scales: {
            y: { beginAtZero: false }
          }
        }
      });

      previewSection.classList.remove("hidden");

      // Store the last previewed data
      lastPreviewData = data;
    } catch (error) {
      alert("Failed to fetch report data. Please try again.");
      console.error(error);
      // Wait for 2 minutes before allowing another preview
      previewBtn.disabled = true;
      setTimeout(() => {
      previewBtn.disabled = false;
      }, 2 * 60 * 1000);
    } finally {
      hideLoading();
    }
  }

  // Success popup logic
  const emailSuccessModal = document.getElementById('email-success');
  const successEmailSpan = document.getElementById('success-email');
  const closeBtns = emailSuccessModal.querySelectorAll('.close-btn, .close-btn-primary');

  // Hide modal on close or OK
  closeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      emailSuccessModal.classList.add('hidden');
    });
  });

  // Show modal after successful email send
  function showEmailSuccess(email) {
    successEmailSpan.textContent = email;
    emailSuccessModal.classList.remove('hidden');
  }

  function closeModal() {
    modal.classList.add("hidden");
  }

  function showLoading() {
    loadingOverlay.classList.remove("hidden");
  }

  function hideLoading() {
    loadingOverlay.classList.add("hidden");
  }

  previewBtn.addEventListener("click", () => {
    generatePreview();
  });

  closePreviewBtn.addEventListener("click", () => {
    previewSection.classList.add("hidden");
  });

  closeModalBtns.forEach(btn => {
    btn.addEventListener("click", closeModal);
  });

  // Send Report handler for the form submit
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("report-email").value;
    const coin = document.getElementById("report-coin").value;
    const timeframe = document.getElementById("report-timeframe").value;

    try {
      showLoading();

      if (!lastPreviewData) {
        alert("Please preview the report before sending.");
        hideLoading();
        return;
      }

      const response = await fetch('http://localhost:3000/api/send-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          coin: coin,
          timeframe: timeframe,
          reportData: lastPreviewData // Use the previewed data
        }),
      });

      if (response.ok) {
        showEmailSuccess(email); // Show popup with email
      } else {
        alert("Failed to send report. Please try again.");
      }
    } catch (error) {
      alert("Error sending report. Please check your network connection.");
      console.error(error);
      // Wait for 2 minutes before showing the modal again
      setTimeout(() => {
      showModal(email);
      }, 2 * 60 * 1000);
    } finally {
      hideLoading();
    }
  });
});
