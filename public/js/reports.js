document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("report-form");
  const previewBtn = document.getElementById("preview-report-btn");
  const closePreviewBtn = document.getElementById("close-preview-btn");
  const previewSection = document.getElementById("report-preview");
  const modal = document.getElementById("email-success");
  const closeModalBtns = modal.querySelectorAll(".close-btn-primary, .close-modal-btn");

  function formatCurrency(value) {
    return `$${parseFloat(value).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  function simulateDataFetch(coin, timeframe) {
    return {
      current_price: (Math.random() * 30000 + 10000).toFixed(2),
      high: (Math.random() * 35000 + 15000).toFixed(2),
      low: (Math.random() * 20000 + 5000).toFixed(2),
      change: (Math.random() * 20 - 10).toFixed(2),
      volume: (Math.random() * 50 + 10).toFixed(2),
      analysis: `Based on the recent ${timeframe}, ${coin.toUpperCase()} has shown signs of ${Math.random() > 0.5 ? "growth" : "volatility"} with moderate trading activity.`
    };
  }

  function generatePreview() {
    const coin = document.getElementById("report-coin").value;
    const timeframe = document.getElementById("report-timeframe").value;
    const data = simulateDataFetch(coin, timeframe);

    document.getElementById("preview-title").textContent = `${coin.charAt(0).toUpperCase() + coin.slice(1)} Report`;
    document.getElementById("preview-date").textContent = `Generated on: ${new Date().toLocaleString()}`;
    document.getElementById("preview-price").textContent = formatCurrency(data.current_price);
    document.getElementById("preview-high").textContent = formatCurrency(data.high);
    document.getElementById("preview-low").textContent = formatCurrency(data.low);
    document.getElementById("preview-change").textContent = `${data.change}%`;
    document.getElementById("preview-volume").textContent = `${data.volume}B`;
    document.getElementById("preview-analysis").textContent = data.analysis;

    const ctx = document.getElementById("report-chart").getContext("2d");
    if (window.reportChart) {
      window.reportChart.destroy();
    }
    window.reportChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: Array.from({ length: 10 }, (_, i) => `${i + 1}h`),
        datasets: [{
          label: `${coin.toUpperCase()} Price`,
          data: Array.from({ length: 10 }, () => (Math.random() * 30000 + 10000).toFixed(2)),
          borderColor: "rgba(75,192,192,1)",
          backgroundColor: "rgba(75,192,192,0.2)",
          tension: 0.3,
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: false
          }
        }
      }
    });

    previewSection.classList.remove("hidden");
  }

  function showModal(email) {
    modal.classList.remove("hidden");
    document.getElementById("success-email").textContent = email;
  }

  function closeModal() {
    modal.classList.add("hidden");
  }

  previewBtn.addEventListener("click", generatePreview);
  closePreviewBtn.addEventListener("click", () => {
    previewSection.classList.add("hidden");
  });

  closeModalBtns.forEach(btn => {
    btn.addEventListener("click", closeModal);
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("report-email").value;
    showModal(email);
  });
});
