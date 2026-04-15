
> <script>
      // === ðŸ“Š MarketStore: Ù…ÙØ­Ø±Ùƒ Ø§Ù„Ø¨ÙˆØ±ØµØ© Ø§Ù„Ø­Ø¯ÙŠØ«Ø© v5 (Premium Edition) ===
      const MarketStore = {
          cash: 10000000,
          portfolio: [], // {id, qty, avgPrice}
          stocks: [
              { id: 1, name: "Ù…Ø³ØªØ´ÙÙ‰ Ø§Ù„ÙƒÙÙŠÙ„", symbol: "KFHL", price: 5200, change: 0, type: 'health', 
history: [5100, 5150, 5200], icon: 'fa-hospital' },
              { id: 2, name: "Ù…ØµØ±Ù Ø¨ØºØ¯Ø§Ø¯", symbol: "BGD", price: 1250, change: 0, type: 'bank', history: 
[1300, 1280, 1250], icon: 'fa-building-columns' },
              { id: 3, name: "Ø§Ø³ÙŠØ§ Ø³ÙŠÙ„", symbol: "ASIA", price: 8900, change: 0, type: 'telecom', history: 
[8600, 8700, 8900], icon: 'fa-tower-cell' },
              { id: 4, name: "Ø²ÙŠÙ† Ø§Ù„Ø¹Ø±Ø§Ù‚", symbol: "ZAIN", price: 4100, change: 0, type: 'telecom', history: 
[4000, 4050, 4100], icon: 'fa-mobile-screen' },
              { id: 5, name: "Ù†ÙØ· Ø§Ù„ÙˆØ³Ø·", symbol: "MOIL", price: 15600, change: 0, type: 'energy', history: 
[16000, 15800, 15600], icon: 'fa-oil-well' },
              { id: 6, name: "Ø§Ù„Ø®Ø·ÙˆØ· Ø§Ù„Ø¬ÙˆÙŠØ©", symbol: "IAIR", price: 3200, change: 0, type: 'transport', 
history: [3200, 3180, 3200], icon: 'fa-plane' },
              { id: 7, name: "Ø§Ù„Ø°Ù‡Ø¨ Ø§Ù„Ø¹Ø±Ø§Ù‚ÙŠ", symbol: "GOLD", price: 485000, change: 0, type: 'commodity', 
history: [465000, 475000, 485000], icon: 'fa-coins' },
              { id: 8, name: "Ø³Ø¹Ø± Ø§Ù„Ø¯ÙˆÙ„Ø§Ø±", symbol: "USD", price: 1500, change: 0, type: 'commodity', 
history: [1480, 1490, 1500], icon: 'fa-dollar-sign' }
          ],
          activeIndex: 0,
          chart: null,
          econState: { inflation: 2, recession: 0, spending: 50, taxes: 15, interest_rate: 5 }
      };
  
      // --- Core Navigation ---
      function openSimPanel(id) {
          try {
              document.getElementById('financeHub').style.display = 'none';
              const banner = document.getElementById('advisorBanner');
              if(banner) banner.style.display = 'none';
              const sub = document.getElementById('hubSubtitle');
              if(sub) sub.style.display = 'none';
              const backBtn = document.getElementById('financeBackBtn');
              if(backBtn) backBtn.style.display = 'inline-block';
              
              document.querySelectorAll('.sim-detail-panel').forEach(p => p.style.display = 'none');
              const targetPanel = document.getElementById(id);
              if(targetPanel) targetPanel.style.display = 'block';
              else alert('Ø¹Ø°Ø±Ø§Ù‹ØŒ Ù„Ù… ÙŠØªÙ… Ø§Ù„Ø¹Ø«ÙˆØ± Ø¹Ù„Ù‰ Ù„ÙˆØ­Ø© Ø§Ù„Ù…Ø­Ø§ÙƒØ§Ø©: ' + id);
              
              if (id === 'sim-stock') initTradingTerminal();
          } catch (e) {
              alert('Ø­Ø¯Ø« Ø®Ø·Ø£ Ø£Ø«Ù†Ø§Ø¡ ÙØªØ­ Ø§Ù„Ù…Ø­Ø§ÙƒØ§Ø©: ' + e.message);
          }
      }
  
      function closeSimPanel() {
          document.querySelectorAll('.sim-detail-panel').forEach(p => p.style.display = 'none');
          document.getElementById('financeHub').style.display = 'grid';
          document.getElementById('advisorBanner').style.display = 'flex';
          document.getElementById('hubSubtitle').style.display = 'block';
          document.getElementById('financeBackBtn').style.display = 'none';
      }
  
      // --- Modern Trading Terminal Logic ---
      function initTradingTerminal() {
          fetchEconomyState();
          renderMiniTicker();
          selectAsset(0);
          updateInvestorUI();
          startMarketSimulation();
      }
  
      function renderMiniTicker() {
          const container = document.getElementById('miniTickerList');
          const ticker = document.getElementById('globalTickerV5');
          
          container.innerHTML = MarketStore.stocks.map((s, idx) => `
              <div class="stock-card-mini ${idx === MarketStore.activeIndex ? 'active' : ''}" 
onclick="selectAsset(${idx})">
                  <div class="stock-icon-box"><i class="fa-solid ${s.icon}"></i></div>
                  <div class="stock-info-mini">
                      <span class="stock-name-mini">${s.name}</span>
                      <span class="stock-symbol-mini">${s.symbol}</span>
                  </div>
                  <div class="stock-price-mini">
                      <span class="price-val">${s.price.toLocaleString()}</span>
                      <span class="price-change ${s.change >= 0 ? 'gain-glow' : 'loss-glow'}">${s.change > 0 ? '+' : 
''}${s.change}%</span>
                  </div>
              </div>
          `).join('');
  
          ticker.innerHTML = MarketStore.stocks.map(s => `
              <span class="ticker-item" style="margin-left:40px;">
                  ${s.symbol}: <b class="${s.change >= 0 ? 'text-success' : 
'text-danger'}">${s.price.toLocaleString()} ${s.change >= 0 ? 'â–²' : 'â–¼'}</b>
              </span>
          `).join('');
      }
  
      function selectAsset(idx) {
          MarketStore.activeIndex = idx;
          const s = MarketStore.stocks[idx];
          
          document.getElementById('activeAssetName').innerText = s.name;
          document.getElementById('activeAssetSymbol').innerText = s.symbol;
          document.getElementById('activeAssetPrice').innerText = s.price.toLocaleString();
          document.getElementById('activeAssetChange').innerText = `${s.change > 0 ? '+' : ''}${s.change}%`;
          document.getElementById('activeAssetChange').className = `price-change ${s.change >= 0 ? 'gain-glow' : 
'loss-glow'}`;
          document.getElementById('activeAssetIcon').innerHTML = `<i class="fa-solid ${s.icon}"></i>`;
          
          // Advisor Logic (Advisor Samer)
          let advice = "Ø§Ù„Ø³ÙˆÙ‚ Ù…Ø³ØªÙ‚Ø± Ø­Ø§Ù„ÙŠØ§Ù‹.";
          if (s.change > 2) advice = "ðŸ“ˆ ØµØ¹ÙˆØ¯ Ù‚ÙˆÙŠ! Ø³Ø§Ù…Ø± ÙŠÙ†ØµØ Ø¨Ø§Ù„ØªØ±ÙˆÙŠ Ù‚Ø¨Ù„ Ø§Ù„Ø´Ø±Ø§Ø¡ Ø¹Ù†Ø¯ 
Ø§Ù„Ù‚Ù…Ø©.";
          else if (s.change < -2) advice = "ðŸ“‰ Ø§Ù†Ø®ÙØ§Ø¶ Ù…Ù„ØÙˆØ¸. Ù‡Ù„ Ù‡ÙŠ ÙØ±ØµØ© Ù„Ù„Ø´Ø±Ø§Ø¡ Ø¨Ø³Ø¹Ø± 
Ø±Ø®ÙŠØµ Ù„Ù„Ù…Ø³ØªØ«Ù…Ø± Ø§Ù„ØµØ¨ÙˆØ±ØŸ";
          document.getElementById('samerTradeAdvice').innerText = advice;
  
          updateMainChart(s);
          renderMiniTicker();
      }
  
      function updateMainChart(stock) {
          const ctx = document.getElementById('mainTradingChart').getContext('2d');
          if (MarketStore.chart) MarketStore.chart.destroy();
          
          const gradient = ctx.createLinearGradient(0, 0, 0, 400);
          gradient.addColorStop(0, stock.change >= 0 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)');
          gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  
          MarketStore.chart = new Chart(ctx, {
              type: 'line',
              data: {
                  labels: stock.history.map((_, i) => i),
                  datasets: [{
                      label: stock.symbol,
                      data: stock.history,
                      borderColor: stock.change >= 0 ? '#10b981' : '#ef4444',
                      borderWidth: 4,
                      pointRadius: 0,
                      pointHoverRadius: 6,
                      backgroundColor: gradient,
                      fill: true,
                      tension: 0.4
                  }]
              },
              options: {
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
                  scales: {
                      x: { display: false },
                      y: { 
                          grid: { color: 'rgba(255,255,255,0.05)' },
                          ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 10 } }
                      }
                  }
              }
          });
      }
  
      function updateInvestorUI() {
          document.getElementById('userCash').innerText = MarketStore.cash.toLocaleString();
          
          let portfolioValue = 0;
          const holdingsContainer = document.getElementById('myHoldingsList');
          
          if (MarketStore.portfolio.length === 0) {
              holdingsContainer.innerHTML = '<p class="text-dim text-center" style="margin-top:20px;">Ù„Ø§ ØªÙˆØ¬Ø¯ 
Ø£Ø³Ù‡Ù… ØØ§Ù„ÙŠØ§Ù‹</p>';
          } else {
              holdingsContainer.innerHTML = MarketStore.portfolio.map(p => {
                  const stock = MarketStore.stocks.find(s => s.id === p.id);
                  const currentVal = p.qty * stock.price;
                  portfolioValue += currentVal;
                  const profit = currentVal - (p.qty * p.avgPrice);
                  return `
                      <div class="stock-card-mini" style="margin-bottom:8px; cursor:default; border-left: 3px solid 
${profit >= 0 ? 'var(--success)' : 'var(--danger)'}">
                          <div class="stock-info-mini">
                              <span class="stock-name-mini">${stock.name}</span>
                              <span class="stock-symbol-mini">${p.qty} Ø³Ù‡Ù… | Ù‚.Ø¹: 
${Math.round(p.avgPrice).toLocaleString()}</span>
                          </div>
                          <div class="stock-price-mini">
                              <span class="price-val">${currentVal.toLocaleString()}</span>
                              <span class="price-change ${profit >= 0 ? 'text-success' : 'text-danger'}">${profit >= 0 
? '+' : ''}${Math.round(profit).toLocaleString()}</span>
                          </div>
                      </div>
                  `;
              }).join('');
          }
          document.getElementById('portfolioValue').innerText = portfolioValue.toLocaleString();
      }
  
      // --- Trade Modal UI Logic ---
      let currentTradeStock = null;
  
      function openTradeModal() {
          const s = MarketStore.stocks[MarketStore.activeIndex];
          currentTradeStock = s;
          
          document.getElementById('modalStockName').innerText = s.name;
          document.getElementById('modalStockSymbol').innerText = s.symbol;
          document.getElementById('modalStockIcon').innerHTML = `<i class="fa-solid ${s.icon}"></i>`;
          document.getElementById('modalCurrentPrice').innerText = s.price.toLocaleString();
          document.getElementById('tradeQty').value = 10;
          
          calculateTradeTotal();
          document.getElementById('tradeModal').style.display = 'flex';
          document.getElementById('tradeError').style.display = 'none';
      }
  
      function closeTradeModal() {
          document.getElementById('tradeModal').style.display = 'none';
          currentTradeStock = null;
      }
  
      function calculateTradeTotal() {
          const qty = parseInt(document.getElementById('tradeQty').value) || 0;
          if (currentTradeStock) {
              const total = qty * currentTradeStock.price;
              document.getElementById('modalTotalPrice').innerText = total.toLocaleString() + " Ø¯.Ø¹";
          }
      }
  
      async function executeTrade(type) {
          const qty = parseInt(document.getElementById('tradeQty').value);
          if(!qty || qty <= 0) return;
          
          const total = qty * currentTradeStock.price;
          const errorEl = document.getElementById('tradeError');
          errorEl.style.display = 'none';
  
          if (type === 'buy') {
              if (total > MarketStore.cash) {
                  errorEl.innerText = "âŒ Ø¹Ø°Ø±Ø§Ù‹ØŒ Ø±ØµÙŠØ¯Ùƒ Ø§Ù„Ù†Ù‚Ø¯ÙŠ Ù„Ø§ ÙŠÙƒÙÙŠ Ù„Ø¥ØªÙ…Ø§Ù… 
Ø§Ù„Ø´Ø±Ø§Ø¡.";
                  errorEl.style.display = 'block';
                  return;
              }
              MarketStore.cash -= total;
              const existing = MarketStore.portfolio.find(p => p.id === currentTradeStock.id);
              if (existing) {
                  const oldCost = existing.qty * existing.avgPrice;
                  existing.qty += qty;
                  existing.avgPrice = (oldCost + total) / existing.qty;
              } else {
                  MarketStore.portfolio.push({ id: currentTradeStock.id, qty: qty, avgPrice: currentTradeStock.price 
});
              }
          } else {
              const existing = MarketStore.portfolio.find(p => p.id === currentTradeStock.id);
              if (!existing || existing.qty < qty) {
                  errorEl.innerText = "âŒ Ø¹Ø°Ø±Ø§Ù‹ØŒ Ù„Ø§ ØªÙ…Ù„Ùƒ Ù‡Ø°Ù‡ Ø§Ù„ÙƒÙ…ÙŠØ© Ù…Ù† Ø§Ù„Ù…ØÙØ¸Ø© 
Ù„Ù„Ø¨ÙŠØ¹.";
                  errorEl.style.display = 'block';
                  return;
              }
              MarketStore.cash += total;
              existing.qty -= qty;
              if (existing.qty === 0) {
                  MarketStore.portfolio = MarketStore.portfolio.filter(p => p.id !== currentTradeStock.id);
              }
          }
          
          updateInvestorUI();
          closeTradeModal();
          // Visual feedback
          const toast = document.createElement('div');
          toast.style = "position:fixed; bottom:20px; right:20px; background:var(--success); color:white; padding:15px 
30px; border-radius:12px; z-index:9999; animation:fadeIn 0.3s;";
          toast.innerHTML = `âœ… ØªÙ… ØªÙ†ÙÙŠØ° Ø¹Ù…Ù„ÙŠØ© ${type === 'buy' ? 'Ø´Ø±Ø§Ø¡' : 'Ø¨ÙŠØ¹'} Ø¨Ù†Ø¬Ø§Ø­.`;
          document.body.appendChild(toast);
          setTimeout(() => toast.remove(), 3000);
      }
  
      function startMarketSimulation() {
          if (window.marketTimer) clearInterval(window.marketTimer);
          window.marketTimer = setInterval(() => {
              const econ = MarketStore.econState;
              const inflationImpact = (econ.inflation - 2) / 5;
              const recessionImpact = econ.recession / 3;
              const interestImpact = (econ.interest_rate - 5) / 5;
  
              MarketStore.stocks.forEach(s => {
                  let sectorModifier = 0;
                  if(s.type === 'bank') sectorModifier += interestImpact * 1.5 - recessionImpact * 2;
                  if(s.type === 'energy') sectorModifier += inflationImpact * 1.2;
                  if(s.type === 'commodity') sectorModifier += inflationImpact * 2.0;
                  
                  const volatility = s.type === 'commodity' ? 0.015 : 0.04;
                  const naturalNoise = (Math.random() - 0.48) * volatility;
                  const changeP = (naturalNoise + sectorModifier/100);
                  
                  const oldPrice = s.price;
                  s.price = Math.round(s.price * (1 + changeP));
                  if(s.price < 10) s.price = 10;
                  s.change = parseFloat(((s.price - oldPrice) / oldPrice * 100).toFixed(2));
                  
                  s.history.push(s.price);
                  if (s.history.length > 30) s.history.shift();
              });
  
              const active = MarketStore.stocks[MarketStore.activeIndex];
              document.getElementById('activeAssetPrice').innerText = active.price.toLocaleString();
              document.getElementById('activeAssetChange').innerText = `${active.change > 0 ? '+' : 
''}${active.change}%`;
              document.getElementById('activeAssetChange').className = `price-change ${active.change >= 0 ? 
'gain-glow' : 'loss-glow'}`;
              
              if (MarketStore.chart) {
                  MarketStore.chart.data.datasets[0].data = active.history;
                  MarketStore.chart.data.datasets[0].borderColor = active.change >= 0 ? '#10b981' : '#ef4444';
                  MarketStore.chart.update('none');
              }
              updateInvestorUI();
              renderMiniTicker();
          }, 5000);
      }
  
      // --- 1. LOAN SIMULATOR LOGIC (V5) ---
      let loanChartObj = null;
      function runLoanSim() {
          const amount = parseFloat(document.getElementById('loanAmount').value);
          const annualRate = parseFloat(document.getElementById('loanRate').value) / 100;
          const years = parseFloat(document.getElementById('loanYears').value);
          
          const monthlyRate = annualRate / 12;
          const nPayments = years * 12;
          const monthlyPayment = (amount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -nPayments));
          const totalPayment = monthlyPayment * nPayments;
          const totalInterest = totalPayment - amount;
  
          const resBox = document.getElementById('loanRes');
          resBox.style.display = 'block';
          resBox.innerHTML = `
              <div style="font-size:1.1rem; line-height:1.8;">
                  <p>ðŸ’° Ø§Ù„Ù‚Ø³Ø· Ø§Ù„Ø´Ù‡Ø±ÙŠ: <b>${Math.round(monthlyPayment).toLocaleString()} Ø¯.Ø¹</b></p>
                  <p>ðŸ“ˆ Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø§Ù„ÙÙˆØ§Ø¦Ø¯: <span 
style="color:var(--danger)">${Math.round(totalInterest).toLocaleString()} Ø¯.Ø¹</span></p>
                  <p>ðŸ¦ Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ù…Ø§ Ø³ÙŠØªÙ… Ø³Ø¯Ø§Ø¯Ù‡: <b>${Math.round(totalPayment).toLocaleString()} 
Ø¯.Ø¹</b></p>
              </div>
          `;
  
          // Render Amortization Table & Chart
          let balance = amount;
          const chartData = [];
          const tableBody = document.getElementById('loanTableBody');
          tableBody.innerHTML = "";
          
          for (let i = 1; i <= nPayments; i++) {
              const interest = balance * monthlyRate;
              const principal = monthlyPayment - interest;
              balance -= principal;
              
              if (i <= 12) {
                  tableBody.innerHTML += `<tr><td>${i}</td><td>${Math.round(monthlyPayment).toLocaleString()}</td><td>$
{Math.round(interest).toLocaleString()}</td><td>${Math.round(principal).toLocaleString()}</td><td>${Math.max(0, 
Math.round(balance)).toLocaleString()}</td></tr>`;
              }
              chartData.push(Math.max(0, balance));
          }
          document.getElementById('loanTableContainer').style.display = 'block';
  
          // Chart.js
          const ctx = document.getElementById('loanChart').getContext('2d');
          if (loanChartObj) loanChartObj.destroy();
          loanChartObj = new Chart(ctx, {
              type: 'line',
              data: {
                  labels: Array.from({length: nPayments}, (_, i) => i + 1),
                  datasets: [{
                      label: 'Ø±ØµÙŠØ¯ Ø§Ù„Ù‚Ø±Ø¶ Ø§Ù„Ù…ØªØ¨Ù‚ÙŠ',
                      data: chartData,
                      borderColor: '#3b82f6',
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      fill: true,
                      tension: 0.1
                  }]
              },
              options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
          });
      }
  
      // --- 2. SAVINGS SIMULATOR LOGIC (V5) ---
      let savingsChartObj = null;
      function runSavingsSim() {
          const initial = parseFloat(document.getElementById('savInitial').value);
          const monthly = parseFloat(document.getElementById('savMonthly').value);
          const annualRate = parseFloat(document.getElementById('savRate').value) / 100;
          const years = parseInt(document.getElementById('savYears').value);
          
          let total = initial;
          const history = [initial];
          const monthlyRate = annualRate / 12;
          
          for (let m = 1; m <= years * 12; m++) {
              total = (total + monthly) * (1 + monthlyRate);
              if (m % 12 === 0) history.push(total);
          }
  
          const resBox = document.getElementById('savRes');
          resBox.style.display = 'block';
          resBox.innerHTML = `
              <div style="font-size:1.1rem; line-height:1.8;">
                  <p>ðŸ’Ž Ø§Ù„Ù‚ÙŠÙ…Ø© Ø§Ù„Ù…Ø³ØªÙ‚Ø¨Ù„ÙŠØ©: <b style="color:var(--success); 
font-size:1.4rem;">${Math.round(total).toLocaleString()} Ø¯.Ø¹</b></p>
                  <p>ðŸ“ˆ Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø§Ù„Ø¹Ø§Ø¦Ø¯ Ø§Ù„Ù…ØÙ‚Ù‚: <b>${Math.round(total - (initial + monthly * years * 
12)).toLocaleString()} Ø¯.Ø¹</b></p>
              </div>
          `;
  
          const ctx = document.getElementById('savingsChart').getContext('2d');
          if (savingsChartObj) savingsChartObj.destroy();
          savingsChartObj = new Chart(ctx, {
              type: 'bar',
              data: {
                  labels: Array.from({length: years + 1}, (_, i) => `Ø³Ù†Ø© ${i}`),
                  datasets: [{
                      label: 'Ù†Ù…Ùˆ Ø§Ù„Ù…Ø­ÙØ¸Ø©',
                      data: history,
                      backgroundColor: '#10b981',
                      borderRadius: 5
                  }]
              },
              options: { responsive: true, maintainAspectRatio: false }
          });
      }
  
      async function fetchEconomyState() {
          try {
              const res = await fetch('/api/simulation/economy');
              const data = await res.json();
              if (data && !data.error) { MarketStore.econState = data; }
          } catch(e) {}
      }
  
  
      // --- 3. Currency Sim ---
      function runCurrencySim() {
          const amt = parseFloat(document.getElementById('currAmount').value);
          const pair = document.getElementById('currPair').value;
          const resBox = document.getElementById('currRes');
          const rates = { "usd_iqd": 1500, "iqd_usd": 1/1500, "eur_iqd": 1650 };
          if (!amt) return;
          const res = amt * rates[pair];
          resBox.style.display = 'block';
          resBox.innerHTML = `Ø§Ù„Ù†ØªÙŠØ¬Ø©: <b>${res.toLocaleString(undefined,{maximumFractionDigits:2})}</b>`;
      }
  
      // --- 5. PROFESSIONAL ACCOUNTING CYCLE (ERP V5) ---
      const acctState = {
          months: ["ÙŠÙ†Ø§ÙŠØ±", "ÙØ¨Ø±Ø§ÙŠØ±", "Ù…Ø§Ø±Ø³", "Ø£Ø¨Ø±ÙŠÙ„", "Ù…Ø§ÙŠÙˆ", "ÙŠÙˆÙ†ÙŠÙˆ", "ÙŠÙˆÙ„ÙŠÙˆ", 
"Ø£ØºØ³Ø·Ø³", "Ø³Ø¨ØªÙ…Ø¨Ø±", "Ø£ÙƒØªÙˆØ¨Ø±", "Ù†ÙˆÙÙ…Ø¨Ø±", "Ø¯ÙŠØ³Ù…Ø¨Ø±"],
          currentMonth: 0, // 0-indexed (Jan)
          accounts: [
              "Ø§Ù„ØµÙ†Ø¯ÙˆÙ‚", "Ø§Ù„Ù…ØµØ±Ù", "Ø§Ù„Ù…Ø®Ø²ÙˆÙ†", "Ø§Ù„Ù…Ø¯ÙŠÙ†ÙˆÙ† (Ø§Ù„Ø¹Ù…Ù„Ø§Ø¡)", "Ø§Ù„Ø£Ø«Ø§Ø«", 
"Ø§Ù„Ù…Ø¹Ø¯Ø§Øª", "Ø§Ù„Ø¹Ù‚Ø§Ø±Ø§Øª", 
              "Ø§Ù„Ø¯Ø§Ø¦Ù†ÙˆÙ† (Ø§Ù„Ù…ÙˆØ±Ø¯ÙˆÙ†)", "Ø§Ù„Ù‚Ø±ÙˆØ¶", "Ø±Ø£Ø³ Ø§Ù„Ù…Ø§Ù„", 
              "Ø§Ù„Ù…Ø¨ÙŠØ¹Ø§Øª", "Ø¥ÙŠØ±Ø§Ø¯Ø§Øª Ø£Ø®Ø±Ù‰",
              "Ø§Ù„Ù…Ø´ØªØ±ÙŠØ§Øª", "Ù…ØµØ±ÙˆÙ Ø§Ù„Ø±ÙˆØ§ØªØ¨", "Ù…ØµØ±ÙˆÙ Ø§Ù„Ø¥ÙŠØ¬Ø§Ø±", "Ù…ØµØ±ÙˆÙ 
Ø§Ù„Ø§Ù†Ø¯Ø«Ø§Ø±", "Ù…ØµØ§Ø±ÙŠÙ Ø¹Ù…ÙˆÙ…ÙŠØ©"
          ]
      };
  
      async function initFiscalTimeline() {
          const tl = document.getElementById('fiscalTimeline');
          tl.innerHTML = acctState.months.map((m, i) => {
              const isActive = i === acctState.currentMonth;
              return `
                  <div class="month-pill ${isActive ? 'active' : ''}" onclick="setFiscalMonth(${i})">
                      <div style="font-weight:800;">${m}</div>
                      <div style="font-size:0.6rem; opacity:0.8;">Ø§Ù„Ø³Ù†Ø© Ø§Ù„Ù…Ø§Ù„ÙŠØ© 26</div>
                  </div>
              `;
          }).join('');
          document.getElementById('jTxDate').value = 
`2026-${String(acctState.currentMonth+1).padStart(2,'0')}-${String(acctState.currentDay === 'all' ? 1 : 
acctState.currentDay).padStart(2,'0')}`;
      }
  
      function setFiscalMonth(m) {
          acctState.currentMonth = m;
          initFiscalTimeline();
          loadJournalEntries();
      }
  
      function setFiscalDay(d) {
          acctState.currentDay = d === 'all' ? 'all' : parseInt(d);
          initFiscalTimeline();
          loadJournalEntries();
      }
  
      let compoundRowCount = 0;
      function addCompoundRow(acc = "", deb = 0, cre = 0) {
          const tbody = document.getElementById('compoundRows');
          const tr = document.createElement('tr');
          tr.id = `row-${compoundRowCount++}`;
          tr.innerHTML = `
              <td>
                  <select class="acct-input row-acc">
                      ${acctState.accounts.map(a => `<option value="${a}" ${a === acc ? 'selected' : 
''}>${a}</option>`).join('')}
                  </select>
              </td>
              <td><input type="number" class="acct-input row-debit" value="${deb}" 
oninput="calculateEntryBalance()"></td>
              <td><input type="number" class="acct-input row-credit" value="${cre}" 
oninput="calculateEntryBalance()"></td>
              <td><button class="mini-btn" style="color:var(--danger);" onclick="this.closest('tr').remove(); 
calculateEntryBalance();"><i class="fa-solid fa-trash"></i></button></td>
          `;
          tbody.appendChild(tr);
          calculateEntryBalance();
      }
  
      function calculateEntryBalance() {
          let deb = 0; let cre = 0;
          document.querySelectorAll('.row-debit').forEach(i => deb += parseFloat(i.value || 0));
          document.querySelectorAll('.row-credit').forEach(i => cre += parseFloat(i.value || 0));
          document.getElementById('totalDebit').innerText = deb.toLocaleString();
          document.getElementById('totalCredit').innerText = cre.toLocaleString();
          
          const checker = document.getElementById('balanceChecker');
          if (deb === cre && deb > 0) {
              checker.className = "balance-checker balance-ok";
          } else {
              checker.className = "balance-checker balance-error";
          }
          return { deb, cre };
      }
  
      async function postCompoundJournal() {
          const { deb, cre } = calculateEntryBalance();
          if (deb !== cre || deb === 0) { alert("âŒ Ø§Ù„Ù‚ÙŠØ¯ ØºÙŠØ± Ù…ØªÙˆØ§Ø²Ù†! ÙŠØ¬Ø¨ Ø£Ù† ÙŠØªØ³Ø§ÙˆÙ‰ 
Ù…Ø¬Ù…ÙˆØ¹ Ø§Ù„Ù…Ø¯ÙŠÙ† Ù…Ø¹ Ù…Ø¬Ù…ÙˆØ¹ Ø§Ù„Ø¯Ø§Ø¦Ù†."); return; }
          
          const tx_date = document.getElementById('jTxDate').value;
          const description = document.getElementById('jDesc').value;
          const lines = [];
          document.querySelectorAll('#compoundRows tr').forEach(tr => {
              lines.push({
                  account: tr.querySelector('.row-acc').value,
                  debit: parseFloat(tr.querySelector('.row-debit').value || 0),
                  credit: parseFloat(tr.querySelector('.row-credit').value || 0)
              });
          });
  
          const res = await fetch('/api/finance/journal', {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({ tx_date, description, lines })
          });
          const d = await res.json();
          if (d.status === 'success') {
              document.getElementById('journalRes').style.display = 'block';
              document.getElementById('journalRes').innerText = "âœ… ØªÙ… ØªØ±ØÙŠÙ„ Ø§Ù„Ù‚ÙŠØ¯ Ø§Ù„Ù…Ø¹ÙŠØ§Ø±ÙŠ 
Ø¨Ù†Ø¬Ø§Ø.";
              document.getElementById('compoundRows').innerHTML = "";
              document.getElementById('jDesc').value = "";
              addCompoundRow(); addCompoundRow(); // Reset starting rows
              loadJournalEntries();
          }
      }
  
      async function loadJournalEntries() {
          const body = document.getElementById('journalTableBody');
          try {
              const res = await fetch('/api/finance/journal');
              const data = await res.json();
              // Filter by current month
              const filtered = data.filter(e => {
                  const m = new Date(e.tx_date).getMonth();
                  return m === acctState.currentMonth;
              });
  
              if (filtered.length === 0) {
                  body.innerHTML = '<tr><td colspan="5" class="text-dim text-center">Ù„Ø§ ØªÙˆØ¬Ø¯ Ù‚ÙŠÙˆØ¯ Ù…Ø³Ø¬Ù„Ø© 
Ù„Ù‡Ø°Ø§ Ø§Ù„Ø´Ù‡Ø±.</td></tr>';
                  return;
              }
  
              let html = "";
              let currentGroup = "";
              filtered.forEach(e => {
                  const isNewGroup = e.tx_group_id !== currentGroup;
                  html += `
                      <tr style="${isNewGroup ? 'border-top:2px solid var(--border);' : ''}">
                          <td>${isNewGroup ? e.tx_date : ''}</td>
                          <td style="font-size:0.8rem; max-width:150px;">${isNewGroup ? e.description : ''}</td>
                          <td>${e.account_name}</td>
                          <td style="color:var(--success); font-weight:700;">${e.debit > 0 ? e.debit.toLocaleString() 
: ''}</td>
                          <td style="color:var(--danger); font-weight:700;">${e.credit > 0 ? e.credit.toLocaleString() 
: ''}</td>
                      </tr>
                  `;
                  currentGroup = e.tx_group_id;
              });
              body.innerHTML = html;
          } catch(e) { console.error(e); }
      }
  
      function switchAcctTab(tab) {
          document.querySelectorAll('.acct-pane').forEach(p => p.style.display = 'none');
          document.querySelectorAll('.acct-tab').forEach(t => t.classList.remove('active'));
          document.getElementById(`acct-${tab}`).style.display = 'block';
          document.getElementById(`tab-${tab}`).classList.add('active');
          if(tab === 'ledger') renderStandardLedger();
          if(tab === 'trial') renderTrialBalance();
          if(tab === 'reports') renderStandardReports();
      }
  
      async function getProcessedLedger() {
          const res = await fetch('/api/finance/journal');
          const entries = await res.json();
          const ledger = {};
          acctState.accounts.forEach(a => ledger[a] = { debits: [], credits: [], balance: 0 });
          
          entries.forEach(e => {
              if (ledger[e.account_name]) {
                  if (e.debit > 0) ledger[e.account_name].debits.push(e);
                  if (e.credit > 0) ledger[e.account_name].credits.push(e);
              }
          });
          
          for (let acc in ledger) {
              const dSum = ledger[acc].debits.reduce((sum, e) => sum + e.debit, 0);
              const cSum = ledger[acc].credits.reduce((sum, e) => sum + e.credit, 0);
              ledger[acc].balance = dSum - cSum;
              ledger[acc].totalDebit = dSum;
              ledger[acc].totalCredit = cSum;
          }
          return ledger;
      }
  
      async function renderStandardLedger() {
          const grid = document.getElementById('ledger-grid');
          grid.innerHTML = "<p class='text-dim'>Ø¬Ø§Ø±ÙŠ ØªÙ„Ø®ÙŠØµ Ø§Ù„Ø­Ø³Ø§Ø¨Ø§Øª...</p>";
          const ledger = await getProcessedLedger();
          
          let html = "";
          for (let acc in ledger) {
              const data = ledger[acc];
              if (data.debits.length === 0 && data.credits.length === 0) continue;
              
              html += `
                  <div class="t-account">
                      <div class="t-account-header">${acc}</div>
                      <div class="t-account-body">
                          <div class="t-side debit">
                              <small class="text-dim">Ù…Ø¯ÙŠÙ† (Debits)</small>
                              ${data.debits.map(e => `<div class="t-row"><span>${e.tx_date}</span> 
<b>${e.debit.toLocaleString()}</b></div>`).join('')}
                          </div>
                          <div class="t-side credit">
                              <small class="text-dim">Ø¯Ø§Ø¦Ù† (Credits)</small>
                              ${data.credits.map(e => `<div class="t-row"><span>${e.tx_date}</span> 
<b>${e.credit.toLocaleString()}</b></div>`).join('')}
                          </div>
                      </div>
                      <div class="t-footer">
                          <span>Ø§Ù„Ø±ØµÙŠØ¯ Ø§Ù„Ù†Ù‡Ø§Ø¦ÙŠ:</span>
                          <span style="color:${data.balance >= 0 ? 'var(--success)' : 
'var(--danger)'}">${Math.abs(data.balance).toLocaleString()} ${data.balance >= 0 ? '(Ù…Ø¯ÙŠÙ†)' : '(Ø¯Ø§Ø¦Ù†)'}</span>
                      </div>
                  </div>
              `;
          }
          grid.innerHTML = html || "<p class='text-dim text-center' style='grid-column:1/-1;'>Ù„Ø§ ØªÙˆØ¬Ø¯ 
Ø¨ÙŠØ§Ù†Ø§Øª Ù…Ø±ØÙ„Ø© Ù„Ø¯ÙØªØ± Ø§Ù„Ø£Ø³ØªØ§Ø° Ø¨Ø¹Ø¯.</p>";
      }
  
      async function renderTrialBalance() {
          const body = document.getElementById('trialBalanceBody');
          body.innerHTML = "<tr><td colspan='3'>Ø¬Ø§Ø±ÙŠ Ø§Ù„ÙØ­Øµ...</td></tr>";
          const ledger = await getProcessedLedger();
          
          let html = "";
          let totalD = 0; let totalC = 0;
          for (let acc in ledger) {
              const bal = ledger[acc].balance;
              if (bal === 0) continue;
              const d = bal > 0 ? bal : 0;
              const c = bal < 0 ? Math.abs(bal) : 0;
              totalD += d; totalC += c;
              html += `
                  <tr>
                      <td>${acc}</td>
                      <td style="text-align:center;">${d ? d.toLocaleString() : '-'}</td>
                      <td style="text-align:center;">${c ? c.toLocaleString() : '-'}</td>
                  </tr>
              `;
          }
          html += `
              <tr class="total-row">
                  <td>Ø§Ù„Ø¥Ø¬Ù…Ø§Ù„ÙŠ</td>
                  <td style="text-align:center;">${totalD.toLocaleString()}</td>
                  <td style="text-align:center;">${totalC.toLocaleString()}</td>
              </tr>
          `;
          body.innerHTML = html;
      }
  
      async function renderStandardReports() {
          const container = document.getElementById('reports-content');
          container.innerHTML = "<p class='text-dim'>Ø¬Ø§Ø±ÙŠ Ø§Ø³ØªØ®Ø±Ø§Ø¬ Ø§Ù„Ù‚ÙˆØ§Ø¦Ù…...</p>";
          const ledger = await getProcessedLedger();
          const res = await fetch('/api/finance/journal');
          const allEntries = await res.json();
          
          // Calculate Yearly Distribution
          const monthlyStats = acctState.months.map((m, i) => {
              const mEntries = allEntries.filter(e => new Date(e.tx_date).getMonth() === i);
              const revenues = mEntries.filter(e => ["Ø§Ù„Ù…Ø¨ÙŠØ¹Ø§Øª", "Ø¥ÙŠØ±Ø§Ø¯Ø§Øª 
Ø£Ø®Ø±Ù‰"].includes(e.account_name)).reduce((s,e) => s + e.credit, 0);
              const expenses = mEntries.filter(e => ["Ø§Ù„Ù…Ø´ØªØ±ÙŠØ§Øª", "Ù…ØµØ±ÙˆÙ Ø§Ù„Ø±ÙˆØ§ØªØ¨", "Ù…ØµØ±ÙˆÙ 
Ø§Ù„Ø¥ÙŠØ¬Ø§Ø±", "Ù…ØµØ±ÙˆÙ Ø§Ù„Ø§Ù†Ø¯Ø«Ø§Ø±", "Ù…ØµØ§Ø±ÙŠÙ Ø¹Ù…ÙˆÙ…ÙŠØ©"].includes(e.account_name)).reduce((s,e) => 
s + (e.debit || 0), 0);
              return { name: m, rev: revenues, exp: expenses, profit: revenues - expenses };
          });
  
          // Simplified Logic for IFRS reports
          const rev = (ledger["Ø§Ù„Ù…Ø¨ÙŠØ¹Ø§Øª"]?.balance || 0) * -1 + (ledger["Ø¥ÙŠØ±Ø§Ø¯Ø§Øª Ø£Ø®Ø±Ù‰"]?.balance || 
0) * -1;
          const cogs = (ledger["Ø§Ù„Ù…Ø´ØªØ±ÙŠØ§Øª"]?.balance || 0);
          const exp = (ledger["Ù…ØµØ±ÙˆÙ Ø§Ù„Ø±ÙˆØ§ØªØ¨"]?.balance || 0) + (ledger["Ù…ØµØ±ÙˆÙ 
Ø§Ù„Ø¥ÙŠØ¬Ø§Ø±"]?.balance || 0) + (ledger["Ù…ØµØ±ÙˆÙ Ø§Ù„Ø§Ù†Ø¯Ø«Ø§Ø±"]?.balance || 0) + (ledger["Ù…ØµØ§Ø±ÙŠÙ 
Ø¹Ù…ÙˆÙ…ÙŠØ©"]?.balance || 0);
          const netProfit = rev - cogs - exp;
  
          container.innerHTML = `
              <div style="grid-column: 1 / -1; background: var(--surface); padding: 20px; border-radius: 
var(--radius); border: 1px solid var(--border); margin-bottom: 20px;">
                  <h4 class="mb-20">ðŸ“… Ù…Ù„Ø®Øµ Ø§Ù„Ø£Ø¯Ø§Ø¡ Ø§Ù„Ù…ÙˆØ²Ø¹ Ø¹Ù„Ù‰ Ø´Ù‡ÙˆØ± Ø§Ù„Ø³Ù†Ø© (2026)</h4>
                  <div style="overflow-x:auto;">
                      <table class="finance-table" style="font-size:0.8rem; text-align:center;">
                          <thead>
                              
<tr><th>Ø§Ù„Ø´Ù‡Ø±</th><th>Ø§Ù„Ø¥ÙŠØ±Ø§Ø¯Ø§Øª</th><th>Ø§Ù„Ù…ØµØ±ÙˆÙØ§Øª</th><th>ØµØ§ÙÙŠ Ø§Ù„Ø±Ø¨Ø</th><th>Ø§Ù„Ø
Ø§Ù„Ø©</th></tr>
                          </thead>
                          <tbody>
                              ${monthlyStats.map(s => `
                                  <tr>
                                      <td>${s.name}</td>
                                      <td>${s.rev.toLocaleString()}</td>
                                      <td>${s.exp.toLocaleString()}</td>
                                      <td style="color:${s.profit >= 0 ? 'var(--success)' : 'var(--danger)'}; 
font-weight:800;">${s.profit.toLocaleString()}</td>
                                      <td><span class="badge" style="background:${s.rev > 0 ? 'var(--success)' : 
'var(--text-dim)'}; opacity:0.3; padding:2px 8px; border-radius:4px;">${s.rev > 0 ? 'Ù…Ø±ØÙ„' : 'Ù…ÙØªÙˆØ
'}</span></td>
                                  </tr>
                              `).join('')}
                          </tbody>
                      </table>
                  </div>
              </div>
              <div class="glass-card" style="padding:20px; border-color:var(--success);">
                  <h4 style="color:var(--success); margin-bottom:15px;">ðŸ“Š Ù‚Ø§Ø¦Ù…Ø© Ø§Ù„Ø¯Ø®Ù„ (Income 
Statement)</h4>
                  <div class="summary-row"><span>Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø§Ù„Ø¥ÙŠØ±Ø§Ø¯Ø§Øª:</span> 
<b>${rev.toLocaleString()}</b></div>
                  <div class="summary-row"><span>ØªÙƒÙ„ÙØ© Ø§Ù„Ù…Ø¨ÙŠØ¹Ø§Øª:</span> <b 
style="color:var(--danger)">(${cogs.toLocaleString()})</b></div>
                  <div class="summary-row" style="border-top:1px solid var(--border); 
padding-top:5px;"><span>Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø§Ù„Ø±Ø¨Ø:</span> <b>${(rev-cogs).toLocaleString()}</b></div>
                  <div class="summary-row"><span>Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø§Ù„Ù…ØµØ±ÙˆÙØ§Øª:</span> <b 
style="color:var(--danger)">(${exp.toLocaleString()})</b></div>
                  <div class="summary-row total" style="margin-top:10px;"><span>ØµØ§ÙÙŠ Ø§Ù„Ø±Ø¨Ø / 
Ø§Ù„Ø®Ø³Ø§Ø±Ø©:</span> <b>${netProfit.toLocaleString()}</b></div>
              </div>
              <div class="glass-card" style="padding:20px; border-color:var(--primary);">
                  <h4 style="color:var(--primary); margin-bottom:15px;">âš–ï¸ Ø§Ù„Ù…ÙŠØ²Ø§Ù†ÙŠØ© Ø§Ù„Ø¹Ù…ÙˆÙ…ÙŠØ© 
(Balance Sheet)</h4>
                  <div class="summary-row"><span>Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø§Ù„Ø£ØµÙˆÙ„:</span> <b>${Math.max(0, 
(ledger["Ø§Ù„ØµÙ†Ø¯ÙˆÙ‚"].balance + ledger["Ø§Ù„Ù…ØµØ±Ù"].balance + ledger["Ø§Ù„Ù…Ø®Ø²ÙˆÙ†"].balance + 
ledger["Ø§Ù„Ø£Ø«Ø§Ø«"].balance + ledger["Ø§Ù„Ø¹Ù‚Ø§Ø±Ø§Øª"].balance)).toLocaleString()}</b></div>
                  <div class="summary-row"><span>Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø§Ù„Ø§Ù„ØªØ²Ø§Ù…Ø§Øª:</span> <b>${Math.abs(Math.min(0, 
ledger["Ø§Ù„Ø¯Ø§Ø¦Ù†ÙˆÙ† (Ø§Ù„Ù…ÙˆØ±Ø¯ÙˆÙ†)"].balance + ledger["Ø§Ù„Ù‚Ø±ÙˆØ¶"].balance)).toLocaleString()}</b></div>
                  <div class="summary-row"><span>ØÙ‚ÙˆÙ‚ Ø§Ù„Ù…Ù„ÙƒÙŠØ©:</span> <b>${Math.abs(Math.min(0, 
ledger["Ø±Ø£Ø³ Ø§Ù„Ù…Ø§Ù„"].balance - netProfit)).toLocaleString()}</b></div>
              </div>
          `;
      }
  
      // --- 6. ATM Sim ---
      let atmBal = 5000000; let atmInput = "";
      function atmType(v) { atmInput += v; updateAtm(); }
      function atmClear() { atmInput = ""; updateAtm(); }
      function updateAtm() { document.getElementById('atmDisplayInput').innerText = atmInput; 
document.getElementById('atmDisplayBalance').innerText = atmBal.toLocaleString() + ' Ø¯.Ø¹'; }
      function atmProcess(type) {
          const val = parseInt(atmInput); if (!val) return;
          if(type === 'withdraw' && val > atmBal) { alert("Ø±ØµÙŠØ¯ ØºÙŠØ± ÙƒØ§ÙÙ."); return; }
          if(type === 'withdraw') atmBal -= val; else atmBal += val;
          alert("Ø¹Ù…Ù„ÙŠØ© Ù†Ø§Ø¬Ø­Ø©."); atmClear();
      }
  
      // --- 7. Professor Control ---
      let professorUnlocked = false; let professorCode = "";
      function openProfessorLogin() {
          const code = prompt("Ø£Ø¯Ø®Ù„ Ø±Ù…Ø² Ø§Ù„Ø£Ø³ØªØ§Ø° (Ù…Ø«Ù„Ø§Ù‹: 1234):");
          if (code === "1234") { professorUnlocked = true; professorCode = code; openSimPanel('sim-professor'); 
loadProfessorState(); }
          else alert("Ø±Ù…Ø² Ø®Ø§Ø·Ø¦.");
      }
  
      async function loadProfessorState() {
          try {
              const res = await fetch('/api/simulation/economy');
              const data = await res.json();
              if (data && !data.error) {
                  ['inflation', 'recession', 'spending', 'taxes', 'interest_rate'].forEach(k => {
                     if(document.getElementById('sl_'+k)) document.getElementById('sl_'+k).value = data[k];
                     if(document.getElementById('val_'+k)) document.getElementById('val_'+k).innerText = data[k] + '%';
                  });
                  updateImpactPreview();
              }
          } catch(e) {}
      }
  
      function updateSliderVal(k) {
          document.getElementById('val_'+k).innerText = document.getElementById('sl_'+k).value + '%';
          updateImpactPreview();
      }
  
      function updateImpactPreview() {
          // Same logic as original
          const grid = document.getElementById('impactPreview');
          if(grid) grid.innerHTML = "<small class='text-dim'>Ø¬Ø§Ø±ÙŠ ØØ³Ø§Ø¨ Ø§Ù„ØªØ£Ø«ÙŠØ±Ø§Øª 
Ø§Ù„Ø§Ù‚ØªØµØ§Ø¯ÙŠØ©...</small>";
      }
  
      async function applyEconomyChanges() {
          const payload = {
              professor_code: professorCode,
              inflation: document.getElementById('sl_inflation').value,
              recession: document.getElementById('sl_recession').value,
              spending: document.getElementById('sl_spending').value,
              taxes: document.getElementById('sl_taxes').value,
              interest_rate: document.getElementById('sl_interest_rate').value
          };
          const res = await fetch('/api/simulation/economy', { method: 'POST', headers: {'Content-Type': 
'application/json'}, body: JSON.stringify(payload) });
          const d = await res.json();
          if(d.success) alert("ØªÙ… ØªØ·Ø¨ÙŠÙ‚ Ø§Ù„ØªØºÙŠÙŠØ±Ø§Øª Ø§Ù„Ø§Ù‚ØªØµØ§Ø¯ÙŠØ©.");
      }
  
      // Init
      window.onload = () => {
          initFiscalTimeline();
          addCompoundRow();
          addCompoundRow(); 
          loadJournalEntries();
          fetchEconomyState();
      };
  {% endblock %}


