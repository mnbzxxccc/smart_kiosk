/**
 * SMART KIOSK AI 2026 V4 - CORE ENGINE
 * 12 Financial Simulations + Auth + Chat History
 */

// === حالة المستخدم ===
let currentUser = null;

// --- 1. Clock ---
function updateClock() {
    const t = document.getElementById('time-display');
    const d = document.getElementById('date-display');
    const now = new Date();
    if (t) t.textContent = now.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
    if (d) d.textContent = now.toLocaleDateString('ar-SA', { weekday: 'long', day: 'numeric', month: 'long' });
}
setInterval(updateClock, 1000);
updateClock();

// --- 2. SPA Views ---
let activeSimPanel = null;

function switchView(viewId) {
    document.querySelectorAll('.spa-view').forEach(v => v.classList.remove('active-view'));
    const target = document.getElementById(viewId);
    if (target) {
        target.classList.add('active-view');
        
        // Update Sidebar Active State
        document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
        const activeNavBtn = document.querySelector(`.nav-item[onclick*="${viewId}"]`);
        if (activeNavBtn) activeNavBtn.classList.add('active');

        if (viewId === 'view-news') { fetchNews(); switchSubView('news-view'); }
        if (viewId === 'view-chat' && currentUser) loadChatHistory();
        if (viewId === 'view-payment') { closeAllSimPanels(); }
    }
}

function switchSubView(subViewId) {
    document.querySelectorAll('.sub-view').forEach(v => v.classList.remove('active-sub-view'));
    const t = document.getElementById(subViewId);
    if (t) t.classList.add('active-sub-view');
}

// --- Finance Hub Navigation ---
function openSimPanel(panelId) {
    closeAllSimPanels();
    document.getElementById('financeHub').style.display = 'none';
    const sub = document.getElementById('hubSubtitle');
    if (sub) sub.style.display = 'none';
    const panel = document.getElementById(panelId);
    if (panel) {
        panel.style.display = 'block';
        activeSimPanel = panelId;
        // Init specific panels
        if (panelId === 'sim-stock') initStockMarket();
        if (panelId === 'sim-payment') initPaymentSim2();
    }
}

function closeAllSimPanels() {
    document.querySelectorAll('.sim-detail-panel').forEach(p => p.style.display = 'none');
    const hub = document.getElementById('financeHub');
    const sub = document.getElementById('hubSubtitle');
    if (hub) hub.style.display = '';
    if (sub) sub.style.display = '';
    activeSimPanel = null;
}

function handleFinanceBack() {
    if (activeSimPanel) {
        closeAllSimPanels();
    } else {
        switchView('view-chat');
    }
}

// --- 3. Chat ---
function scrollToBottom() {
    const c = document.getElementById('chatLines');
    if (c) requestAnimationFrame(() => { c.scrollTop = c.scrollHeight; });
}

function appendMessage(role, text) {
    const c = document.getElementById('chatLines');
    if (!c) return;
    const d = document.createElement('div');
    d.className = `message ${role === 'user' ? 'user-message' : 'bot-message'}`;
    const icon = role === 'user' ? 'fa-user' : 'fa-robot';
    d.innerHTML = `<div class="msg-avatar"><i class="fa-solid ${icon}"></i></div><div class="msg-content">${text}</div>`;
    c.appendChild(d);
    scrollToBottom();
}

async function handleSendMessage() {
    const inp = document.getElementById('userInput');
    if (!inp) return;
    const text = inp.value.trim();
    if (!text) return;
    inp.value = '';
    appendMessage('user', text);
    try {
        const body = { question: text };
        if (currentUser) body.user_id = currentUser.user_id;
        const res = await fetch('/ask', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        appendMessage('bot', data.answer);
    } catch (e) {
        console.error("Chat Error:", e);
        appendMessage('bot', "⚠️ فشل الاتصال. يرجى المحاولة لاحقاً.");
    }
}

function sendAction(text) {
    const inp = document.getElementById('userInput');
    if (inp) { inp.value = text; handleSendMessage(); }
}

// --- 4. Finance Query ---
async function checkFinance() {
    const id = document.getElementById('financeIdInput').value.trim();
    const r = document.getElementById('financeResult');
    if (!id) return;
    r.style.display = 'block';
    r.innerHTML = "⏳ جاري البحث...";
    try {
        const res = await fetch('/ask', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: `ما هو موقفي المالي للرقم ${id}` }) });
        const data = await res.json();
        r.innerHTML = `<h3><i class="fa-solid fa-receipt"></i> تقرير الحساب</h3><p>${data.answer}</p>`;
    } catch (e) { r.innerHTML = "❌ خطأ في الاستعلام."; }
}

// ============================================================
// === 5. ALL 12 FINANCIAL SIMULATIONS (COMMAND CENTER V6) ===
// ============================================================

// --- Samer's Advisor Logic ---
function askSamer(type, data) {
    let advice = "";
    if(type === 'loan') {
        const debtRatio = data.monthly_payment / 1500000; // Assuming 1.5M avg salary
        if(debtRatio > 0.4) advice = "🚨 انتبه! هذا القسط يستهلك أكثر من 40% من دخلك المفترض. أنصحك بتقليل المبلغ أو زيادة سنوات التسديد.";
        else advice = "✅ قسط معقول ومناسب لميزانية متوسطة. تأكد من ثبات مصدر دخلك قبل التوقيع.";
    } else if(type === 'savings') {
        if(data.total_profit > data.total_deposited * 0.2) advice = "💰 استثمار ممتاز! أرباحك تتجاوز 20% من رأس المال. الاستمرار على هذا النهج سيبني ثروة جيدة.";
        else advice = "📈 بداية جيدة. هل فكرت في زيادة الإيداع الشهري بمقدار 50 ألف إضافية؟ سيضاعف هذا نتائجك بشكل مذهل.";
    } else if(type === 'stock') {
        advice = "📊 تقلبات السوق طبيعية. القاعدة الذهبية لسامر: لا تضع كل أموالك في سهم واحد. نوّع بين البنوك والاتصالات.";
    }
    
    return `<div class="samer-advice" style="margin-top:15px; background:rgba(16,185,129,0.08); border-right:4px solid var(--samer-primary); padding:12px; border-radius:8px;">
        <small style="color:var(--samer-primary); font-weight:800;">💡 نصيحة المستشار سامر:</small><br>
        <span style="font-size:0.9rem;">${advice}</span>
    </div>`;
}

// --- Dynamic Chart Simulation ---
let stockHistory = [1200, 1300, 1100, 1250, 1400, 1350, 1500];
function renderDynamicChart(containerId, history) {
    const container = document.getElementById(containerId);
    if(!container) return;
    const max = Math.max(...history) * 1.1;
    const min = Math.min(...history) * 0.9;
    const range = (max - min) || 1; // Prevent division by zero
    const points = history.map((val, i) => {
        const x = history.length > 1 ? (i / (history.length - 1)) * 100 : 50;
        const y = 100 - ((val - min) / range) * 100;
        return `${x},${y}`;
    }).join(' ');

    container.innerHTML = `
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" style="width:100%; height:100%; filter: drop-shadow(0 0 5px var(--samer-glow));">
            <defs>
                <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:var(--samer-primary);stop-opacity:0.2" />
                    <stop offset="100%" style="stop-color:var(--samer-primary);stop-opacity:0" />
                </linearGradient>
            </defs>
            <path d="M 0,100 L ${points} L 100,100 Z" fill="url(#grad)" />
            <polyline points="${points}" fill="none" stroke="var(--samer-primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
    `;
}

// --- 5.1 حاسبة القروض (Hub) ---
async function runLoanSim2() {
    const a = parseFloat(document.getElementById('loanAmount2').value);
    const r = parseFloat(document.getElementById('loanRate2').value);
    const y = parseInt(document.getElementById('loanYears2').value);
    const box = document.getElementById('loanRes2');
    if (!a || !r || !y) { box.innerHTML = "⚠️ يرجى ملء جميع الحقول."; return; }
    try {
        const res = await fetch('/api/simulation/loan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: a, rate: r, years: y }) });
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const d = await res.json();
        if (d.error) { box.innerHTML = `❌ خطأ في الحساب: ${d.error}`; return; }
        box.innerHTML = `<div class="result-item">💰 القسط الشهري: <b>${d.monthly_payment.toLocaleString()} د.ع</b></div>
            <div class="result-item">📈 إجمالي المسدد: ${d.total_repayment.toLocaleString()} د.ع</div>
            <div class="result-item">💸 فوائد البنك: ${d.total_interest.toLocaleString()} د.ع</div>
            ${askSamer('loan', d)}`;
    } catch (e) { 
        console.error("Loan Sim Error:", e);
        box.innerHTML = "❌ خطأ في الحساب. تأكد من اتصال الخادم."; 
    }
}

// Also keep original for news section
async function runLoanSim() {
    const a = parseFloat(document.getElementById('loanAmount').value);
    const r = parseFloat(document.getElementById('loanRate').value);
    const y = parseInt(document.getElementById('loanYears').value);
    const box = document.getElementById('loanRes');
    if (!a || !r || !y) { box.innerHTML = "⚠️ ملء الحقول."; return; }
    try {
        const res = await fetch('/api/simulation/loan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: a, rate: r, years: y }) });
        const d = await res.json();
        box.innerHTML = `<div class="result-item">💰 القسط الشهري: <b>${d.monthly_payment.toLocaleString()} د.ع</b></div>
            <div class="result-item">📈 إجمالي: ${d.total_repayment.toLocaleString()} د.ع</div>
            <div class="result-item">💸 فوائد: ${d.total_interest.toLocaleString()} د.ع</div>`;
    } catch (e) { box.innerHTML = "❌ خطأ."; }
}

// --- 5.2 حاسبة التوفير (Hub) ---
async function runSavingsSim2() {
    const ini = parseFloat(document.getElementById('savInit2').value);
    const mon = parseFloat(document.getElementById('savMonthly2').value);
    const r = parseFloat(document.getElementById('savRate2').value);
    const y = parseInt(document.getElementById('savYears2').value);
    const box = document.getElementById('savRes2');
    if (!ini && ini !== 0 || !r || !y) { box.innerHTML = "⚠️ ملء الحقول."; return; }
    try {
        const res = await fetch('/api/simulation/savings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ initial: ini, monthly: mon, rate: r, years: y }) });
        const d = await res.json();
        box.innerHTML = `<div class="result-item">🏦 الرصيد النهائي: <b>${d.final_balance.toLocaleString()} د.ع</b></div>
            <div class="result-item">💵 إجمالي الإيداعات: ${d.total_deposited.toLocaleString()} د.ع</div>
            <div class="result-item">📈 الأرباح: <b style="color:#10b981;">${d.total_profit.toLocaleString()} د.ع</b></div>
            ${askSamer('savings', d)}`;
    } catch (e) { box.innerHTML = "❌ خطأ."; }
}

async function runSavingsSim() {
    const ini = parseFloat(document.getElementById('savingsInitial').value);
    const mon = parseFloat(document.getElementById('savingsMonthly').value);
    const r = parseFloat(document.getElementById('savingsRate').value);
    const y = parseInt(document.getElementById('savingsYears').value);
    const box = document.getElementById('savingsRes');
    if (!ini && ini !== 0 || !r || !y) { box.innerHTML = "⚠️ ملء الحقول."; return; }
    try {
        const res = await fetch('/api/simulation/savings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ initial: ini, monthly: mon, rate: r, years: y }) });
        const d = await res.json();
        box.innerHTML = `<div class="result-item">🏦 الرصيد: <b>${d.final_balance.toLocaleString()} د.ع</b></div>
            <div class="result-item">💵 إيداعات: ${d.total_deposited.toLocaleString()} د.ع</div>
            <div class="result-item">📈 أرباح: <b style="color:#10b981;">${d.total_profit.toLocaleString()} د.ع</b></div>`;
    } catch (e) { box.innerHTML = "❌ خطأ."; }
}

// --- 5.3 محول العملات ---
const FX = { USD_IQD: 1500, IQD_USD: 1/1500, EUR_IQD: 1650, IQD_EUR: 1/1650, USD_EUR: 1650/1500, EUR_USD: 1500/1650 };
const CURR_NAMES = { USD: "دولار أمريكي", EUR: "يورو", IQD: "دينار عراقي" };

function _convertCurrency(amt, from, to, resId) {
    const box = document.getElementById(resId);
    if (!amt || isNaN(amt)) { box.innerHTML = "⚠️ أدخل مبلغ صحيح."; return; }
    if (from === to) { box.innerHTML = "⚠️ اختر عملتين مختلفتين."; return; }
    const pair = `${from}_${to}`;
    if (FX[pair] !== undefined) {
        const result = (amt * FX[pair]).toFixed(2);
        box.innerHTML = `<div class="result-item">💱 ${amt.toLocaleString()} ${CURR_NAMES[from]}</div>
            <div class="result-item" style="font-size:1.5rem;font-weight:800;margin:10px 0;">= ${parseFloat(result).toLocaleString()} ${CURR_NAMES[to]}</div>`;
    } else { box.innerHTML = "❌ غير مدعوم."; }
}

function runCurrencyConvert() { _convertCurrency(parseFloat(document.getElementById('currencyAmount').value), document.getElementById('currencyFrom').value, document.getElementById('currencyTo').value, 'currencyRes'); }
function runCurrency2() { _convertCurrency(parseFloat(document.getElementById('curAmt2').value), document.getElementById('curFrom2').value, document.getElementById('curTo2').value, 'curRes2'); }

// --- 5.4 الدفع الإلكتروني ---
let payStep2 = 1;
function initPaymentSim2() {
    payStep2 = 1;
    updatePaymentUI2();
}

function updatePaymentUI2() {
    const content = document.getElementById('paymentContent2');
    if (!content) return;
    ['pStep1','pStep2','pStep3'].forEach((s,i) => {
        const el = document.getElementById(s);
        if (el) el.classList.toggle('active', i + 1 === payStep2);
    });
    if (payStep2 === 1) {
        content.innerHTML = `<h3 style="margin-bottom:20px;">كيف تود الدفع؟</h3>
            <div class="payment-method-grid">
                <div class="method-card" onclick="payStep2=2;updatePaymentUI2()"><i class="fa-solid fa-wallet"></i><h5>زين كاش</h5></div>
                <div class="method-card" onclick="payStep2=2;updatePaymentUI2()"><i class="fa-solid fa-credit-card"></i><h5>كي كارد</h5></div>
            </div>`;
    } else if (payStep2 === 2) {
        content.innerHTML = `<h3>أدخل تفاصيل الدفعة (تدريب)</h3>
            <div class="input-group"><label>رقم المحفظة / البطاقة:</label><input type="text" placeholder="07XXXXXXXXX"></div>
            <div class="input-group"><label>المبلغ (دينار عراقي):</label><input type="number" value="500000"></div>
            <button class="action-btn" onclick="payStep2=3;updatePaymentUI2()">دفع الآن</button>`;
    } else {
        content.innerHTML = `<div class="res-box text-center" style="padding:40px;">
            <i class="fa-solid fa-circle-check text-success" style="font-size:3.5rem;margin-bottom:20px;"></i>
            <h3>تمت المحاكاة بنجاح!</h3><p>هذا نظام تدريبي فقط.</p>
            <button class="back-btn" onclick="initPaymentSim2()">إعادة التجربة</button></div>`;
    }
}

// Keep old payment sim for backward compat
let paymentStep = 1;
function initPaymentSim() { paymentStep = 1; }
function updatePaymentUI() { }
function nextPaymentStep() { paymentStep++; }

// --- 5.5 محاكاة البورصة ---
let stockBalance = 10000000;
let stocks = [
    { name: "بنك بغداد", symbol: "BBAG", price: 1200, owned: 0, change: 0 },
    { name: "اسيا سيل", symbol: "ASIA", price: 8500, owned: 0, change: 0 },
    { name: "المصرف العراقي", symbol: "BIQB", price: 620, owned: 0, change: 0 },
    { name: "الخطوط الجوية", symbol: "IAIR", price: 3200, owned: 0, change: 0 },
    { name: "زين العراق", symbol: "ZAIN", price: 4100, owned: 0, change: 0 },
    { name: "نفط ميسان", symbol: "MOIL", price: 15600, owned: 0, change: 0 },
];

function initStockMarket() {
    renderStocks();
    renderDynamicChart('stock-canvas-sim', stockHistory);
}

function renderStocks() {
    const body = document.getElementById('stockBody');
    if (!body) return;
    document.getElementById('stockBalance').textContent = stockBalance.toLocaleString();
    body.innerHTML = stocks.map((s, i) => {
        const changeColor = s.change > 0 ? '#10b981' : s.change < 0 ? '#ef4444' : '#94a3b8';
        const changeIcon = s.change > 0 ? '▲' : s.change < 0 ? '▼' : '—';
        return `<tr>
            <td><b>${s.name}</b><br><small style="color:var(--text-dim)">${s.symbol}</small></td>
            <td>${s.price.toLocaleString()} د.ع</td>
            <td style="color:${changeColor};">${changeIcon} ${Math.abs(s.change).toFixed(1)}%</td>
            <td>${s.owned}</td>
            <td>
                <button class="mini-btn buy-btn" onclick="buyStock(${i})">شراء</button>
                <button class="mini-btn sell-btn" onclick="sellStock(${i})">بيع</button>
            </td>
        </tr>`;
    }).join('');
}

function refreshStockPrices() {
    stocks.forEach(s => {
        const changePercent = (Math.random() - 0.4) * 10;
        s.change = changePercent;
        s.price = Math.max(100, Math.round(s.price * (1 + changePercent / 100)));
    });
    
    // Update global history (BBAG as representative)
    stockHistory.push(stocks[0].price);
    if(stockHistory.length > 20) stockHistory.shift();
    renderDynamicChart('stock-canvas-sim', stockHistory);
    
    renderStocks();
    const box = document.getElementById('stockRes');
    box.style.display = 'block';
    box.innerHTML = `📊 تم تحديث الأسعار — السوق ${stocks[0].change > 0 ? "في ارتفاع 📈" : "في انخفاض 📉"} ${askSamer('stock', stocks[0])}`;
}

function buyStock(idx) {
    const s = stocks[idx];
    const qty = parseInt(prompt(`كم سهم تريد شراء من ${s.name}؟ (السعر: ${s.price.toLocaleString()} د.ع)`));
    if (!qty || qty <= 0) return;
    const cost = qty * s.price;
    if (cost > stockBalance) { alert("❌ رصيدك غير كافي!"); return; }
    stockBalance -= cost;
    s.owned += qty;
    renderStocks();
}

function sellStock(idx) {
    const s = stocks[idx];
    if (s.owned === 0) { alert("❌ لا تملك أسهم من " + s.name); return; }
    const qty = parseInt(prompt(`كم سهم تريد بيع من ${s.name}؟ (تملك: ${s.owned})`));
    if (!qty || qty <= 0 || qty > s.owned) return;
    stockBalance += qty * s.price;
    s.owned -= qty;
    renderStocks();
}

// --- 5.6 التمويل العقاري (المرابحة) ---
function calcRealEstate() {
    const price = parseFloat(document.getElementById('realPrice').value);
    const downPct = parseFloat(document.getElementById('realDown').value);
    const profitRate = parseFloat(document.getElementById('realProfit').value);
    const years = parseInt(document.getElementById('realYears').value);
    const box = document.getElementById('realRes');

    const down = price * (downPct / 100);
    const financed = price - down;
    const totalProfit = financed * (profitRate / 100) * years;
    const totalCost = financed + totalProfit;
    const monthly = totalCost / (years * 12);

    box.innerHTML = `
        <div class="result-item">🏠 سعر العقار: ${price.toLocaleString()} د.ع</div>
        <div class="result-item">💰 الدفعة الأولى (${downPct}%): <b>${down.toLocaleString()} د.ع</b></div>
        <div class="result-item">🏦 المبلغ الممول: ${financed.toLocaleString()} د.ع</div>
        <div class="result-item">📊 إجمالي ربح البنك: ${totalProfit.toLocaleString()} د.ع</div>
        <div class="result-item">💵 إجمالي المسدد: ${totalCost.toLocaleString()} د.ع</div>
        <div class="result-item" style="font-size:1.3rem;">📅 القسط الشهري: <b style="color:#10b981;">${Math.round(monthly).toLocaleString()} د.ع</b></div>
    `;
}

// --- 5.7 القيود المحاسبية ---
let journalEntries = [];
let accounts = {};

function addJournalEntry() {
    const desc = document.getElementById('jrnlDesc').value.trim();
    const debit = document.getElementById('jrnlDebit').value.trim();
    const credit = document.getElementById('jrnlCredit').value.trim();
    const amount = parseFloat(document.getElementById('jrnlAmount').value);

    if (!desc || !debit || !credit || !amount) { alert("يرجى ملء جميع الحقول!"); return; }

    journalEntries.push({ desc, debit, credit, amount, date: new Date().toLocaleDateString('ar-SA') });

    // Update accounts
    accounts[debit] = (accounts[debit] || { debit: 0, credit: 0 });
    accounts[debit].debit += amount;
    accounts[credit] = (accounts[credit] || { debit: 0, credit: 0 });
    accounts[credit].credit += amount;

    renderJournal();

    // Clear inputs
    document.getElementById('jrnlDesc').value = '';
    document.getElementById('jrnlDebit').value = '';
    document.getElementById('jrnlCredit').value = '';
}

function renderJournal() {
    const div = document.getElementById('journalTable');
    if (journalEntries.length === 0) { div.innerHTML = ''; return; }
    let html = `<table class="journal-tbl"><thead><tr><th>#</th><th>التاريخ</th><th>البيان</th><th>مدين</th><th>دائن</th><th>المبلغ</th></tr></thead><tbody>`;
    journalEntries.forEach((e, i) => {
        html += `<tr><td>${i + 1}</td><td>${e.date}</td><td>${e.desc}</td><td>${e.debit}</td><td>${e.credit}</td><td>${e.amount.toLocaleString()}</td></tr>`;
    });
    html += `</tbody></table>`;
    div.innerHTML = html;
}

function showTrialBalance() {
    const box = document.getElementById('trialBalance');
    if (Object.keys(accounts).length === 0) { box.style.display = 'block'; box.innerHTML = "⚠️ لا توجد قيود مسجلة."; return; }
    let html = `<h4 style="margin-bottom:10px;">📋 ميزان المراجعة</h4>
        <table class="journal-tbl"><thead><tr><th>الحساب</th><th>مدين</th><th>دائن</th></tr></thead><tbody>`;
    let totalD = 0, totalC = 0;
    Object.entries(accounts).forEach(([name, bal]) => {
        html += `<tr><td>${name}</td><td>${bal.debit.toLocaleString()}</td><td>${bal.credit.toLocaleString()}</td></tr>`;
        totalD += bal.debit;
        totalC += bal.credit;
    });
    html += `<tr style="font-weight:800;border-top:2px solid var(--accent);"><td>المجموع</td><td>${totalD.toLocaleString()}</td><td>${totalC.toLocaleString()}</td></tr>`;
    html += `</tbody></table>`;
    if (totalD === totalC) html += `<p style="color:#10b981;margin-top:10px;">✅ الميزان متوازن!</p>`;
    else html += `<p style="color:#ef4444;margin-top:10px;">⚠️ الميزان غير متوازن! الفرق: ${Math.abs(totalD - totalC).toLocaleString()}</p>`;
    box.style.display = 'block';
    box.innerHTML = html;
}

// --- 5.8 صراف ATM ---
let atmBal = 5000000;

function atmAction(action) {
    const area = document.getElementById('atmActionArea');
    area.style.display = 'block';

    if (action === 'balance') {
        area.innerHTML = `<div class="res-box"><h4>📄 كشف الحساب</h4>
            <p>الرصيد المتاح: <b>${atmBal.toLocaleString()} د.ع</b></p>
            <p>التاريخ: ${new Date().toLocaleDateString('ar-SA')}</p>
            <p>الساعة: ${new Date().toLocaleTimeString('ar-SA')}</p>
            <button class="back-btn" onclick="document.getElementById('atmActionArea').style.display='none'" style="margin-top:15px;">رجوع</button></div>`;
        return;
    }

    const labels = { withdraw: 'السحب', deposit: 'الإيداع', transfer: 'التحويل' };
    let extraField = action === 'transfer' ? `<div class="input-group"><label>رقم حساب المستلم:</label><input type="text" id="atmTransferTo" placeholder="رقم الحساب"></div>` : '';

    area.innerHTML = `<div class="sim-panel">
        <h4>${labels[action]}</h4>
        ${extraField}
        <div class="input-group"><label>المبلغ (د.ع):</label><input type="number" id="atmAmount" value="250000"></div>
        <button onclick="processATM('${action}')">تنفيذ</button>
        <button class="back-btn" onclick="document.getElementById('atmActionArea').style.display='none'" style="margin-top:10px;">إلغاء</button>
    </div>`;
}

function processATM(action) {
    const amount = parseInt(document.getElementById('atmAmount').value);
    const area = document.getElementById('atmActionArea');

    if (!amount || amount <= 0) { alert("مبلغ غير صحيح!"); return; }

    if (action === 'withdraw' || action === 'transfer') {
        if (amount > atmBal) { alert("❌ رصيد غير كافي!"); return; }
        atmBal -= amount;
    } else if (action === 'deposit') {
        atmBal += amount;
    }

    document.getElementById('atmBalance').textContent = atmBal.toLocaleString();
    const msgs = { withdraw: '✅ تم السحب بنجاح', deposit: '✅ تم الإيداع بنجاح', transfer: '✅ تم التحويل بنجاح' };
    area.innerHTML = `<div class="res-box text-center" style="padding:30px;">
        <i class="fa-solid fa-circle-check text-success" style="font-size:2.5rem;margin-bottom:15px;"></i>
        <h3>${msgs[action]}</h3>
        <p>المبلغ: ${amount.toLocaleString()} د.ع</p>
        <p>الرصيد الحالي: ${atmBal.toLocaleString()} د.ع</p>
        <button class="back-btn" onclick="document.getElementById('atmActionArea').style.display='none'" style="margin-top:15px;">رجوع للقائمة</button>
    </div>`;
}

// --- 5.9 فتح حساب مصرفي ---
function openBankAccount() {
    const name = document.getElementById('accName').value.trim();
    const id = document.getElementById('accId').value.trim();
    const type = document.getElementById('accType').value;
    const curr = document.getElementById('accCurrency').value;
    const deposit = parseInt(document.getElementById('accDeposit').value);
    const box = document.getElementById('accRes');

    const errors = [];
    if (!name) errors.push("الاسم مطلوب");
    if (!id) errors.push("رقم الهوية مطلوب");
    if (!deposit || deposit < 25000) errors.push("الحد الأدنى للإيداع 25,000 د.ع");

    if (errors.length > 0) {
        box.innerHTML = `<p style="color:#ef4444;">❌ أخطاء:<br>${errors.join('<br>')}</p>`;
        return;
    }

    const accNum = 'IQ' + Math.random().toString().substr(2, 12);
    box.innerHTML = `
        <div style="text-align:center;">
            <i class="fa-solid fa-circle-check text-success" style="font-size:3rem;margin-bottom:15px;"></i>
            <h3>✅ تم فتح الحساب بنجاح!</h3>
        </div>
        <div class="result-item">👤 صاحب الحساب: <b>${name}</b></div>
        <div class="result-item">🔢 رقم الحساب: <b style="direction:ltr">${accNum}</b></div>
        <div class="result-item">📋 نوع الحساب: ${type}</div>
        <div class="result-item">💱 العملة: ${curr === 'IQD' ? 'دينار عراقي' : 'دولار أمريكي'}</div>
        <div class="result-item">💰 الإيداع الأولي: ${deposit.toLocaleString()} د.ع</div>
        <div class="result-item">📅 تاريخ الفتح: ${new Date().toLocaleDateString('ar-SA')}</div>
        <p style="margin-top:15px;color:var(--text-dim);font-size:0.9rem;">⚠️ هذا حساب تدريبي وهمي لغرض التعليم فقط.</p>
    `;
}

// --- 5.10 حاسبة التضخم ---
function calcInflation() {
    const amount = parseFloat(document.getElementById('infAmount').value);
    const rate = parseFloat(document.getElementById('infRate').value);
    const years = parseInt(document.getElementById('infYears').value);
    const box = document.getElementById('infRes');

    const futureValue = amount / Math.pow(1 + rate / 100, years);
    const lostPercent = ((1 - futureValue / amount) * 100).toFixed(1);

    let timeline = '';
    for (let y = 1; y <= Math.min(years, 5); y++) {
        const val = amount / Math.pow(1 + rate / 100, y);
        timeline += `<div class="result-item">بعد ${y} ${y === 1 ? 'سنة' : 'سنوات'}: ${Math.round(val).toLocaleString()} د.ع</div>`;
    }
    if (years > 5) timeline += `<div class="result-item">...</div><div class="result-item">بعد ${years} سنة: ${Math.round(futureValue).toLocaleString()} د.ع</div>`;

    box.innerHTML = `
        <h4>📉 تأثير التضخم على ${amount.toLocaleString()} د.ع</h4>
        <div class="result-item" style="font-size:1.2rem;">القوة الشرائية بعد ${years} سنة: <b style="color:#ef4444;">${Math.round(futureValue).toLocaleString()} د.ع</b></div>
        <div class="result-item">نسبة الخسارة: <b style="color:#ef4444;">${lostPercent}%</b></div>
        <hr style="border-color:var(--border);margin:15px 0;">
        <h4>📅 التدرج السنوي:</h4>
        ${timeline}
    `;
}

// --- 5.11 إصدار شيك ---
function validateCheck() {
    const date = document.getElementById('checkDate').value;
    const payee = document.getElementById('checkPayee').value.trim();
    const amount = document.getElementById('checkAmount').value;
    const words = document.getElementById('checkWords').value.trim();
    const sign = document.getElementById('checkSign').value.trim();
    const box = document.getElementById('checkRes');

    const errors = [];
    if (!date) errors.push("❌ التاريخ مطلوب — شيك بدون تاريخ يعتبر باطلاً");
    if (!payee) errors.push("❌ اسم المستفيد مطلوب");
    if (!amount || parseInt(amount) <= 0) errors.push("❌ المبلغ يجب أن يكون أكبر من صفر");
    if (!words) errors.push("❌ المبلغ كتابة مطلوب — يحمي من التزوير");
    if (!sign) errors.push("❌ التوقيع مطلوب — شيك بدون توقيع يعتبر لاغياً");

    if (errors.length > 0) {
        box.innerHTML = `<h4 style="color:#ef4444;">⚠️ تدقيق الشيك — أخطاء:</h4><div style="line-height:2;">${errors.join('<br>')}</div>`;
    } else {
        box.innerHTML = `
            <div style="text-align:center;margin-bottom:15px;">
                <i class="fa-solid fa-circle-check text-success" style="font-size:3rem;"></i>
                <h3>✅ الشيك صحيح وجاهز للإصدار!</h3>
            </div>
            <div class="check-preview">
                <div style="text-align:center;font-weight:800;margin-bottom:15px;">بنك صدر العراق — فرع بغداد</div>
                <div class="result-item">📅 التاريخ: ${date}</div>
                <div class="result-item">👤 المستفيد: ${payee}</div>
                <div class="result-item">💰 المبلغ: ${parseInt(amount).toLocaleString()} د.ع</div>
                <div class="result-item">📝 كتابة: ${words}</div>
                <div class="result-item">✍️ التوقيع: ${sign}</div>
            </div>
        `;
    }
}

// --- 5.12 الميزانية الشخصية ---
function calcBudget() {
    const income = parseFloat(document.getElementById('budgetIncome').value);
    const expenses = {
        'السكن': parseFloat(document.getElementById('budRent').value) || 0,
        'الطعام': parseFloat(document.getElementById('budFood').value) || 0,
        'المواصلات': parseFloat(document.getElementById('budTransport').value) || 0,
        'الاتصالات': parseFloat(document.getElementById('budPhone').value) || 0,
        'التعليم': parseFloat(document.getElementById('budEducation').value) || 0,
        'الترفيه': parseFloat(document.getElementById('budEntertain').value) || 0,
    };

    const totalExp = Object.values(expenses).reduce((a, b) => a + b, 0);
    const remaining = income - totalExp;
    const savingsRate = ((remaining / income) * 100).toFixed(1);
    const box = document.getElementById('budgetRes');

    const emojis = { 'السكن': '🏠', 'الطعام': '🍽️', 'المواصلات': '🚗', 'الاتصالات': '📱', 'التعليم': '📚', 'الترفيه': '🎉' };

    let breakdown = '';
    Object.entries(expenses).forEach(([name, val]) => {
        const pct = ((val / income) * 100).toFixed(1);
        const barWidth = Math.min(pct, 100);
        breakdown += `<div class="budget-item">
            <span>${emojis[name]} ${name}: ${val.toLocaleString()} د.ع (${pct}%)</span>
            <div class="budget-bar"><div class="budget-bar-fill" style="width:${barWidth}%"></div></div>
        </div>`;
    });

    const statusColor = remaining >= 0 ? '#10b981' : '#ef4444';
    const statusText = remaining >= 0 ? '✅ ميزانية متوازنة' : '⚠️ عجز في الميزانية!';
    const advice = remaining >= 0
        ? `💡 نصيحة: حاول ادخار ${savingsRate}% شهرياً (${remaining.toLocaleString()} د.ع) لبناء صندوق طوارئ.`
        : `💡 نصيحة: قلل المصاريف بمقدار ${Math.abs(remaining).toLocaleString()} د.ع لتحقيق التوازن.`;

    box.innerHTML = `
        <h4 style="color:${statusColor};">${statusText}</h4>
        <div class="result-item">💵 الدخل: <b>${income.toLocaleString()} د.ع</b></div>
        <div class="result-item">💸 المصاريف: <b>${totalExp.toLocaleString()} د.ع</b></div>
        <div class="result-item" style="font-size:1.2rem;color:${statusColor};">💰 المتبقي: <b>${remaining.toLocaleString()} د.ع</b></div>
        <hr style="border-color:var(--border);margin:15px 0;">
        <h4>📊 تفصيل المصاريف:</h4>
        ${breakdown}
        <hr style="border-color:var(--border);margin:15px 0;">
        <p style="color:var(--text-dim);">${advice}</p>
    `;
}

// --- 6. News (Magazine) ---
async function fetchNews() {
    const c = document.getElementById('newsContainer');
    if (!c) return;
    try {
        const res = await fetch('/api/news');
        const data = await res.json();
        if (data.length === 0) { c.innerHTML = "<p class='no-content'>لا توجد أخبار حالياً.</p>"; return; }
        
        let html = '';
        data.forEach((item, i) => {
            const hasImg = item.image_url ? true : false;
            const sizeClass = i === 0 ? 'magazine-hero' : 'magazine-card';
            const author = item.author_id ? `بواسطة الكاتب` : `أخبار الإدارة`;
            const cate = item.category || 'عام';
            const imgStyle = hasImg ? `background-image: url('${item.image_url}');` : `background: linear-gradient(135deg, var(--bg-card), var(--bg-body));`;
            
            html += `
            <div class="${sizeClass}" style="${hasImg ? '' : imgStyle}">
                ${hasImg ? `<img src="${item.image_url}" alt="${item.title}" class="magazine-img">` : ''}
                <div class="magazine-content">
                    <span class="magazine-category">${cate}</span>
                    <h3 class="magazine-title">${item.title}</h3>
                    <p class="magazine-excerpt">${item.content.substring(0, 100)}...</p>
                    <div class="magazine-meta">
                        <span><i class="fa-solid fa-pen-nib"></i> ${author}</span>
                        <span><i class="fa-regular fa-clock"></i> ${new Date(item.date).toLocaleDateString('ar-SA')}</span>
                    </div>
                </div>
            </div>`;
        });
        c.innerHTML = html;
    } catch (e) { c.innerHTML = "<p class='no-content'>فشل تحميل المجلة.</p>"; }
}

function openSubmitNewsModal() {
    if (!currentUser) {
        showAuthModal();
        return;
    }
    document.getElementById('submitNewsModal').style.display = 'flex';
    document.getElementById('newsSubmitMsg').innerHTML = '';
}

async function submitNewsArticle() {
    if (!currentUser) return;
    const title = document.getElementById('newsSubmitTitle').value.trim();
    const cat = document.getElementById('newsSubmitCategory').value;
    const img = document.getElementById('newsSubmitImage').value.trim();
    const content = document.getElementById('newsSubmitContent').value.trim();
    const msg = document.getElementById('newsSubmitMsg');
    
    if (!title || !content) { msg.innerHTML = "يرجى ملء العنوان والمحتوى."; return; }
    
    msg.innerHTML = "⏳ جاري الإرسال...";
    try {
        const body = { title, content, category: cat, image_url: img || null, author_id: currentUser.student_id };
        const res = await fetch('/api/news', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        const d = await res.json();
        if (d.success) {
            msg.innerHTML = "<span style='color:#10b981;'>✅ تم إرسال مقالك للمراجعة بنجاح!</span>";
            setTimeout(() => { document.getElementById('submitNewsModal').style.display='none'; }, 2000);
            document.getElementById('newsSubmitTitle').value = '';
            document.getElementById('newsSubmitContent').value = '';
        } else {
            msg.innerHTML = "❌ فشل الإرسال.";
        }
    } catch (e) { msg.innerHTML = "❌ خطأ في الاتصال."; }
}

// --- 6.5 Law Hub ---
function openLawPanel(panelId) {
    document.getElementById('lawHub').style.display = 'none';
    document.querySelectorAll('#view-law .sim-detail-panel').forEach(p => p.style.display = 'none');
    const p = document.getElementById(panelId);
    if(p) {
        p.style.display = 'block';
        if (panelId === 'law-court') document.body.classList.add('immersive-mode');
    }
}

function closeAllLawPanels() {
    document.getElementById('lawHub').style.display = '';
    document.querySelectorAll('#view-law .sim-detail-panel').forEach(p => p.style.display = 'none');
    document.body.classList.remove('immersive-mode');
}

let currentCourtCase = null;
let trialStartTime = null;
let trialTimerInterval = null;

async function loadCourtCases() {
    const grid = document.getElementById('vc-cases-grid');
    if(!grid) return;
    grid.innerHTML = '<div class="loading-spinner"></div>';
    try {
        const res = await fetch('/api/court/cases');
        const cases = await res.json();
        grid.innerHTML = '';
        cases.forEach(c => {
            let diffHtml = '';
            for(let i=0; i<5; i++) {
                diffHtml += `<i class="fa-solid fa-circle" style="color:${i < c.difficulty ? 'var(--accent)' : 'rgba(255,255,255,0.1)'}; font-size: 8px; margin-right: 4px;"></i>`;
            }
            
            grid.innerHTML += `
            <div class="vc-case-card" onclick='startTrial(${JSON.stringify(c).replace(/'/g, "&apos;")})'>
                <div class="badge-type" style="margin-bottom: 15px;">${c.type}</div>
                <h4 style="margin:0 0 10px 0; font-size:1.2rem; color:white;">${c.title}</h4>
                <div style="font-size:0.8rem; color:var(--text-dim); margin-bottom: 15px;">المستوى: ${diffHtml}</div>
                <p style="margin:0; font-size:0.9rem; line-height:1.6; color: rgba(255,255,255,0.6);">${c.facts.substring(0, 100)}...</p>
                <div style="margin-top:20px; display:flex; align-items:center; justify-content:space-between; color:var(--accent); font-weight:700; font-size:0.9rem;">
                    <span>بدء المحاكاة</span>
                    <i class="fa-solid fa-arrow-left"></i>
                </div>
            </div>`;
        });
    } catch(e) { grid.innerHTML = '<p style="color:#ef4444;">❌ فشل تحميل القضايا المنظورة.</p>'; }
}

function startTrial(caseObj) {
    currentCourtCase = caseObj;
    document.getElementById('vc-selection-screen').style.display = 'none';
    document.getElementById('vc-trial-screen').style.display = 'flex';
    
    // Reset Sidebar state on mobile if needed
    if (window.innerWidth <= 992) {
        document.getElementById('vc-lateral-sidebar')?.classList.remove('active');
    }
    
    // UI Updates (New Clean IDs)
    document.getElementById('td-title-clean').innerText = caseObj.title;
    document.getElementById('td-type-clean').innerText = caseObj.type;
    document.getElementById('td-facts-clean').innerText = caseObj.facts;
    
    // Timer
    trialStartTime = Date.now();
    if(trialTimerInterval) clearInterval(trialTimerInterval);
    trialTimerInterval = setInterval(updateTrialTimer, 1000);
    
    const attList = document.getElementById('td-attachments-clean');
    attList.innerHTML = '';
    caseObj.attachments.forEach(att => {
        attList.innerHTML += `<li><i class="fa-solid fa-file-contract"></i> ${att}</li>`;
    });
    
    // Reset Chat
    const chatDisplay = document.getElementById('vc-chat-display');
    chatDisplay.innerHTML = '';
    addChatMessage('bot', `بصفتي ${caseObj.ai_role}، افتتح هذه الجلسة للنظر في ${caseObj.title}. يرجى تقديم دفوعك القانونية أو مرافعتك الافتتاحية.`);
}

function updateTrialTimer() {
    const diff = Math.floor((Date.now() - trialStartTime) / 1000);
    const m = Math.floor(diff / 60).toString().padStart(2, '0');
    const s = (diff % 60).toString().padStart(2, '0');
    const timerElem = document.getElementById('trial-timer-badge');
    if(timerElem) timerElem.innerText = `${m}:${s}`;
}

async function sendCourtMessage() {
    const input = document.getElementById('vc-chat-input');
    const msg = input.value.trim();
    if(!msg || !currentCourtCase) return;
    
    addChatMessage('user', msg);
    input.value = '';
    input.style.height = 'auto'; // Reset auto-expand
    
    // AI Loading
    const typingId = addChatMessage('bot', `<div class="typing-indicator"><span></span><span></span><span></span></div>`, true);
    
    try {
        const res = await fetch('/api/court/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ case_id: currentCourtCase.id, message: msg })
        });
        const data = await res.json();
        removeChatMessage(typingId);
        addChatMessage('bot', data.reply);
    } catch(e) {
        removeChatMessage(typingId);
        addChatMessage('bot', '❌ حدث خطأ في تقنيات الاتصال مع المحكمة. يرجى التأكد من تشغيل السيرفر.');
    }
}

function addChatMessage(role, text, isRaw = false) {
    const display = document.getElementById('vc-chat-display');
    const id = 'msg-' + Date.now();
    const isBot = role === 'bot';
    
    const html = `
    <div id="${id}" class="vc-msg-${role}" style="display: flex; gap: 15px; margin-bottom: 20px; align-self: ${isBot ? 'flex-start' : 'flex-end'}; max-width: 80%; flex-direction: ${isBot ? 'row' : 'row-reverse'};">
        <div class="vc-avatar" style="width: 40px; height: 40px; border-radius: 10px; background: ${isBot ? '#1e3a8a' : 'var(--accent)'}; color: ${isBot ? 'white' : '#05070a'}; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; flex-shrink: 0;">
            <i class="fa-solid ${isBot ? 'fa-scale-balanced' : 'fa-user-tie'}"></i>
        </div>
        <div class="vc-bubble" style="padding: 18px 22px; border-radius: 18px; font-size: 0.95rem; line-height: 1.7; background: ${isBot ? 'rgba(255,255,255,0.04)' : 'var(--accent)'}; color: ${isBot ? 'white' : '#05070a'}; border: ${isBot ? '1px solid rgba(255,255,255,0.1)' : 'none'}; border-top-${isBot ? 'left' : 'right'}-radius: 2px;">
            ${isRaw ? text : text.replace(/\n/g, '<br>')}
        </div>
    </div>`;
    
    display.insertAdjacentHTML('beforeend', html);
    display.scrollTop = display.scrollHeight;
    return id;
}

function removeChatMessage(id) {
    const el = document.getElementById(id);
    if(el) el.remove();
}

async function requestVerdict() {
    if(!currentCourtCase) return;
    addChatMessage('user', 'أطلب من الهيئة الموقرة النطق بالحكم الختامي في هذه القضية.');
    const typingId = addChatMessage('bot', `جاري المداولة لإصدار الحكم...`, true);
    
    try {
        const res = await fetch('/api/court/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ case_id: currentCourtCase.id, message: "أصدر حكماً نهائياً بناءً على وقائع القضية ومرافعة الطالب، وقدم له نصيحة قانونية ختامية." })
        });
        const data = await res.json();
        removeChatMessage(typingId);
        addChatMessage('bot', `<div style="border-right: 4px solid var(--accent); padding-right: 15px;"><strong>⚖️ منطوق الحكم:</strong><br>${data.reply}</div>`);
    } catch(e) {
        removeChatMessage(typingId);
    }
}

function closeVirtualCourt() {
    if(trialTimerInterval) clearInterval(trialTimerInterval);
    currentCourtCase = null;
    document.getElementById('vc-trial-screen').style.display = 'none';
    document.getElementById('vc-selection-screen').style.display = 'block';
    closeAllLawPanels();
}




// --- 7. Map, Files, Search ---
function showMapInfo(title, desc) {
    const p = document.getElementById('mapInfoPanel');
    if (p) p.innerHTML = `<div class="map-info-active"><i class="fa-solid fa-location-dot" style="font-size:2rem;color:var(--accent);margin-bottom:10px;"></i><h3>${title}</h3><p>${desc}</p></div>`;
    document.querySelectorAll('.map-marker').forEach(m => m.classList.remove('active-marker'));
    if (event && event.currentTarget) event.currentTarget.classList.add('active-marker');
}

async function checkFileStatus() {
    const id = document.getElementById('fileIdInput').value.trim();
    const r = document.getElementById('fileStatusResult');
    if (!id) return;
    r.innerHTML = "<p>⏳ جاري التحقق...</p>";
    try {
        const res = await fetch(`/api/student/files?student_id=${id}`);
        const data = await res.json();
        if (data.length === 0) { r.innerHTML = "<div class='res-box'>⚠️ لم يتم العثور على وثائق.</div>"; return; }
        let html = "<h4><i class='fa-solid fa-folder-open'></i> المستندات:</h4><ul style='list-style:none;padding:0;'>";
        data.forEach(f => {
            const icon = f.status === 'مكتمل' ? 'fa-check-circle text-success' : 'fa-circle-xmark text-danger';
            html += `<li style="margin-bottom:10px;"><i class="fa-solid ${icon}"></i> ${f.doc_name}: <b>${f.status}</b></li>`;
        });
        r.innerHTML = `<div class='res-box'>${html}</ul></div>`;
    } catch (e) { r.innerHTML = "❌ خطأ."; }
}

function searchNews() {
    const q = document.getElementById('newsSearchInput').value.toLowerCase();
    document.querySelectorAll('.news-card').forEach(c => { c.style.display = c.innerText.toLowerCase().includes(q) ? 'flex' : 'none'; });
}

// --- 8. Theme & Share ---
function toggleTheme() { document.body.classList.toggle('light-theme'); localStorage.setItem('theme', document.body.classList.contains('light-theme') ? 'light' : 'dark'); }
function shareToWhatsApp() { window.open(`https://wa.me/?text=${encodeURIComponent("البوابة الذكية - كلية صدر العراق التقني: " + window.location.href)}`, '_blank'); }

// --- 9. Auth ---
function showAuthModal() { document.getElementById('authModal').style.display = 'flex'; switchAuthTab('login'); }
function closeAuthModal() {
    document.getElementById('authModal').style.display = 'none';
    ['loginStudentId','loginPassword','regStudentId','regDisplayName','regPassword'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    ['loginError','regError','regSuccess'].forEach(id => { const el = document.getElementById(id); if (el) el.textContent = ''; });
}

function switchAuthTab(tab) {
    document.getElementById('loginForm').style.display = tab === 'login' ? 'block' : 'none';
    document.getElementById('registerForm').style.display = tab === 'register' ? 'block' : 'none';
    document.getElementById('tabLogin').classList.toggle('active', tab === 'login');
    document.getElementById('tabRegister').classList.toggle('active', tab === 'register');
}

async function loginUser() {
    const sid = document.getElementById('loginStudentId').value.trim();
    const pw = document.getElementById('loginPassword').value.trim();
    const err = document.getElementById('loginError');
    if (!sid || !pw) { err.textContent = "يرجى ملء جميع الحقول."; return; }
    try {
        const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ student_id: sid, password: pw }) });
        const d = await res.json();
        if (d.success) { currentUser = d.user; localStorage.setItem('kiosk_user', JSON.stringify(currentUser)); updateUserUI(); closeAuthModal(); }
        else err.textContent = d.error || "فشل الدخول.";
    } catch (e) { err.textContent = "خطأ في الاتصال."; }
}

async function registerUser() {
    const sid = document.getElementById('regStudentId').value.trim();
    const name = document.getElementById('regDisplayName').value.trim();
    const dept = document.getElementById('regDepartment').value;
    const stage = document.getElementById('regStage').value;
    const pw = document.getElementById('regPassword').value.trim();
    const err = document.getElementById('regError');
    const succ = document.getElementById('regSuccess');
    err.textContent = ''; succ.textContent = '';
    if (!sid || !pw) { err.textContent = "الرقم الجامعي وكلمة السر مطلوبين."; return; }
    try {
        const res = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ student_id: sid, password: pw, display_name: name, department: dept, stage: stage }) });
        const d = await res.json();
        if (d.success) { succ.textContent = "✅ تم إنشاء الحساب! يمكنك تسجيل الدخول."; setTimeout(() => { switchAuthTab('login'); document.getElementById('loginStudentId').value = sid; }, 1500); }
        else err.textContent = d.error || "فشل.";
    } catch (e) { err.textContent = "خطأ."; }
}

async function logoutUser() {
    try { await fetch('/api/auth/logout', { method: 'POST' }); } catch (e) {}
    currentUser = null; localStorage.removeItem('kiosk_user'); updateUserUI();
}

function updateUserUI() {
    const btn = document.getElementById('loginSidebarBtn');
    const badge = document.getElementById('userBadge');
    const nameSpan = document.getElementById('userDisplayName');
    if (currentUser) { btn.style.display = 'none'; badge.style.display = 'flex'; nameSpan.textContent = currentUser.display_name; }
    else { btn.style.display = 'flex'; badge.style.display = 'none'; }
}

function generateStudentId() {
    if (!currentUser) return;
    const container = document.getElementById('idCardContainer');
    const dept = currentUser.department || 'غير محدد';
    const stage = currentUser.stage || 'غير محدد';
    container.innerHTML = `
        <div style="background: linear-gradient(135deg, var(--primary), var(--accent)); padding: 20px; border-radius: 15px; color: white; text-align: center; position: relative; overflow: hidden;">
            <i class="fa-solid fa-graduation-cap" style="font-size: 3rem; opacity: 0.2; position: absolute; top: -10px; right: -10px;"></i>
            <h3 style="margin-bottom: 5px;">كلية صدر العراق التقني</h3>
            <p style="font-size: 0.8rem; margin-bottom: 15px; opacity: 0.9;">بوابة الطالب الذكية - هوية رقمية</p>
            <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px; text-align: right;">
                <p><strong>الاسم:</strong> ${currentUser.display_name}</p>
                <p><strong>الرقم الجامعي:</strong> ${currentUser.student_id}</p>
                <p><strong>القسم:</strong> ${dept}</p>
                <p><strong>المرحلة:</strong> ${stage}</p>
            </div>
            <div style="margin-top: 15px; display: inline-block; background: white; padding: 5px; border-radius: 5px;">
                <div id="qrCodeId"></div>
            </div>
        </div>
    `;
    document.getElementById('studentIdModal').style.display = 'flex';
    
    setTimeout(() => {
        document.getElementById('qrCodeId').innerHTML = '';
        new QRCode(document.getElementById("qrCodeId"), {
            text: `SID:${currentUser.student_id}|N:${currentUser.display_name}|D:${dept}`,
            width: 80,
            height: 80,
            colorDark : "#000000",
            colorLight : "#ffffff",
        });
    }, 100);
}

// --- 10. Chat History ---
async function loadChatHistory() {
    if (!currentUser) return;
    const c = document.getElementById('chatLines');
    if (!c || c.children.length > 1) return;
    try {
        const res = await fetch(`/api/chat/history?user_id=${currentUser.user_id}`);
        const h = await res.json();
        if (h.length > 0) {
            const sep = document.createElement('div'); sep.className = 'chat-history-separator'; sep.innerHTML = '<span>📜 محادثاتك السابقة</span>'; c.appendChild(sep);
            h.forEach(m => appendMessage(m.role, m.message));
            const sep2 = document.createElement('div'); sep2.className = 'chat-history-separator'; sep2.innerHTML = '<span>💬 محادثة جديدة</span>'; c.appendChild(sep2);
        }
    } catch (e) { console.error(e); }
}

// === Global Exports ===
window.switchView = switchView;
window.switchSubView = switchSubView;
window.openSimPanel = openSimPanel;
window.closeAllSimPanels = closeAllSimPanels;
window.handleFinanceBack = handleFinanceBack;
window.checkFinance = checkFinance;
window.runLoanSim = runLoanSim;
window.runLoanSim2 = runLoanSim2;
window.runSavingsSim = runSavingsSim;
window.runSavingsSim2 = runSavingsSim2;
window.runCurrencyConvert = runCurrencyConvert;
window.runCurrency2 = runCurrency2;
window.initPaymentSim2 = initPaymentSim2;
window.refreshStockPrices = refreshStockPrices;
window.buyStock = buyStock;
window.sellStock = sellStock;
window.calcRealEstate = calcRealEstate;
window.addJournalEntry = addJournalEntry;
window.showTrialBalance = showTrialBalance;
window.atmAction = atmAction;
window.processATM = processATM;
window.openBankAccount = openBankAccount;
window.calcInflation = calcInflation;
window.validateCheck = validateCheck;
window.calcBudget = calcBudget;
window.sendAction = sendAction;
window.handleSendMessage = handleSendMessage;
// --- 6.6 Lawyer Toolkit ---
function switchToolkitTab(tabId, btn) {
    document.querySelectorAll('.toolkit-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.toolkit-tab').forEach(b => b.classList.remove('active'));
    const target = document.getElementById(tabId);
    if(target) { target.classList.add('active'); btn.classList.add('active'); }
}
function switchTkSubTab(tabId, btn) {
    document.querySelectorAll('.tk-content').forEach(s => s.style.display = 'none');
    document.querySelectorAll('.tk-subtab').forEach(b => b.classList.remove('active'));
    const target = document.getElementById(tabId);
    if(target) { target.style.display = 'block'; btn.classList.add('active'); }
}

const checkLists = {
    sale: ['أطراف العقد محددون بالكامل', 'وصف المبيع دقيق وشامل', 'الثمن محدد بصورة واضحة وطريقة دفعه', 'تاريخ التسليم واضح', 'شروط التنازل مكتوبة', 'آلية حل النزاعات موجودة'],
    rent: ['تحديد العين المؤجرة بكل تفصيل', 'قيمة الأجرة ومواعيد استحقاقها', 'مدة العقد تاريخ البدء والانتهاء', 'من يتحمل مصاريف الصيانة؟', 'شروط الإخلاء وتسليم العين', 'غرامات التأخير'],
    work: ['تحديد الوظيفة والمهام بوضوح', 'تحديد الراتب والبدلات والمكافآت', 'ساعات العمل والإجازات', 'فترة التجربة', 'شروط إنهاء العقد', 'شرط عدم المنافسة']
};

function loadChecklist() {
    const type = document.getElementById('tkContractType').value;
    const items = checkLists[type] || checkLists.sale;
    let html = '';
    items.forEach((item, i) => {
        html += `
        <label class="tk-checkbox-wrapper">
            <input type="checkbox" class="tk-checkbox" onchange="updateChecklistProgress()">
            <span class="tk-checkbox-text">${item}</span>
        </label>`;
    });
    document.getElementById('tkChecklistItems').innerHTML = html;
    updateChecklistProgress(items.length);
}

function updateChecklistProgress(totalCountOverride = null) {
    const checkboxes = document.querySelectorAll('#tkChecklistItems .tk-checkbox');
    if(checkboxes.length === 0) return;
    const total = checkboxes.length;
    const checked = document.querySelectorAll('#tkChecklistItems .tk-checkbox:checked').length;
    const percent = Math.round((checked / total) * 100);
    
    document.getElementById('tkProgressTxt').innerText = percent;
    document.getElementById('tkProgressBar').style.width = percent + '%';
    document.getElementById('tkCheckedCount').innerText = `${checked} / ${total}`;
    
    const fill = document.getElementById('tkProgressBar');
    if(percent === 100) fill.style.background = 'linear-gradient(90deg, #10b981, #34d399)';
    else fill.style.background = 'linear-gradient(90deg, var(--accent), #f59e0b)';
}

function generateContract() {
    const p1 = document.getElementById('tkGenParty1').value || 'الطرف الأول';
    const p2 = document.getElementById('tkGenParty2').value || 'الطرف الثاني';
    const sub = document.getElementById('tkGenSubject').value || 'موضوع العقد';
    const val = document.getElementById('tkGenValue').value || '---';
    const date = new Date().toLocaleDateString('ar-SA');
    
    const text = `عقد اتفاق (مسودة)\n\nتم الاتفاق في هذا اليوم ${date} بين كل من:\n1. ${p1} (الطرف الأول)\n2. ${p2} (الطرف الثاني)\n\nموضوع العقد:\nيتفق الطرفان بموجب هذا العقد على ${sub} بقيمة إجمالية قدرها (${val} دينار عراقي). يقر الطرفان بأهليتهما القانونية للتعاقد وتنفيذ الالتزامات.\n\nالتوقيعات:\nالطرف الأول: ________________\nالطرف الثاني: ________________\n\nتنويه: هذا العقد تولد للإرشاد التعليمي ضمن مختبر التدريب القانوني.`;
    
    document.getElementById('tkGenText').value = text;
    document.getElementById('tkGenResult').style.display = 'block';
}


window.showMapInfo = showMapInfo;
window.checkFileStatus = checkFileStatus;
// --- GLOBAL UI HELPERS ---
function toggleNavGroup(btn) {
    const group = btn.closest('.nav-group');
    const isOpen = group.classList.contains('open');
    
    // Close other groups
    document.querySelectorAll('.nav-group').forEach(g => {
        if (g !== group) g.classList.remove('open');
    });
    
    // Toggle current
    group.classList.toggle('open', !isOpen);
}

function toggleLateralSidebar() {
    const sidebar = document.getElementById('vc-lateral-sidebar');
    const avatar = document.querySelector('.sarah-avatar-pulse');
    if(sidebar) {
        sidebar.classList.toggle('active');
        if(sidebar.classList.contains('active') && avatar) {
            avatar.style.animation = "sarahPulse 0.5s infinite linear";
            setTimeout(() => { avatar.style.animation = "sarahPulse 2s infinite"; }, 1000);
        }
    }
}

// --- SMARTER INVESTIGATION LOGIC ---
function investigateAction(type) {
    const log = document.getElementById('investigateRes');
    const query = document.getElementById('investigateQuery')?.value;
    
    if(type === 'ask') {
        if(!query) return;
        appendForensicLog('system', `📡 جاري تحليل استفسار: "${query}"...`);
        setTimeout(() => {
            let reply = "لم أرَ أي شيء مريب، كنت في جولة تفقدية بالخارج.";
            if(query.includes('وقت') || query.includes('ساعة')) reply = "أذكر أن الأضواء في الطابق الثاني انطفأت فجأة حوالي الساعة 2:10 صباحاً.";
            appendForensicLog('ai', `💬 رد الحارس: ${reply}`);
        }, 800);
    } else if(type === 'fingerprints') {
        appendForensicLog('system', "تحليل البصمات الرقمية لجهاز الخزنة...");
        setTimeout(() => {
            appendForensicLog('evidence', "🔬 النتيجة: تم العثور على بصمة جزئية على المقبض. مطابقة (70%) للموظف 'سامر'.");
        }, 1500);
    } else if(type === 'camera') {
        appendForensicLog('system', "جاري استرجاع لقطات الـ DVR المعطوبة...");
        setTimeout(() => {
            appendForensicLog('evidence', "📷 التقرير: تسجيلات الكاميرا رقم 4 تعرضت للتشويش المتعمد في الساعة 02:12.");
        }, 1200);
    } else if(type === 'report') {
        appendForensicLog('system', "توليد التقرير الجنائي المتكامل...");
        setTimeout(() => {
            appendForensicLog('ai', "📑 التقرير: هناك تضارب بين أقوال الحارس وتوقيت تعطل الكاميرات. البصمات تشير لفاعل من الداخل.");
        }, 2000);
    } else if(type === 'door') {
        appendForensicLog('system', "معاينة الباب المحطم...");
        setTimeout(() => {
            appendForensicLog('evidence', "🚪 النتيجة: الكسر تم باستخدام أداة حادة (عتلة) من الخارج إلى الداخل. لا توجد آثار عنف على القفل، مما يشير لاحتمالية استخدام مفتاح مكرر.");
            appendForensicLog('sarah', "سارة: الباب المحطم من الخارج قد يكون للتمويه، فآثار العتلة سطحية والقفل سليم، مما يعزز فرضية تورط شخص يملك المفتاح.");
        }, 1000);
    }
}

function appendForensicLog(type, text) {
    const log = document.getElementById('investigateRes');
    if(!log) return;
    const div = document.createElement('div');
    div.className = `log-entry ${type}`;
    
    let icon = "fa-terminal";
    if(type === 'evidence') icon = "fa-dna";
    if(type === 'sarah' || type === 'ai') icon = "fa-robot";
    
    div.innerHTML = `<i class="fa-solid ${icon}"></i> <span class="log-time">[${new Date().toLocaleTimeString('ar-SA')}]</span> ${text}`;
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
}

// --- SMARTER FORGERY LOGIC ---
let currentForgeryFilter = 'normal';
function setForgeryFilter(type) {
    currentForgeryFilter = type;
    const canvas = document.getElementById('forgeryDoc');
    const riskFill = document.getElementById('risk-fill');
    
    canvas.className = `document-canvas ${type}`;
    
    // Update Risk/Confidence UI
    if(type === 'uv') {
        riskFill.style.width = '65%';
        riskFill.style.background = '#f59e0b';
    } else if(type === 'micro') {
        riskFill.style.width = '95%';
        riskFill.style.background = '#ef4444';
    } else {
        riskFill.style.width = '10%';
        riskFill.style.background = '#10b981';
    }
    
    // Tool buttons active state
    document.querySelectorAll('.tool-btn').forEach(b => {
        b.classList.toggle('active', b.innerText.toLowerCase().includes(type) || (type === 'normal' && b.innerText.includes('طبيعية')));
    });
}

function runForgerySim() {
    const res = document.getElementById('forgeryRes');
    res.innerHTML = "⏳ جاري فحص 'البصمة الخطية' والخصائص الجزيئية للورق...";
    
    setTimeout(() => {
        let msg = "";
        if(currentForgeryFilter === 'normal') {
            msg = "⚠️ لم يتم اكتشاف عيوب واضحة بالعين المجردة. المحاذاة تبدو سليمة.";
        } else if(currentForgeryFilter === 'uv') {
            msg = "🚨 كشف الـ UV: تم رصد اختلاف في لمعان الحبر عند الرقم '0' الثالث. تم الإضافة لاحقاً!";
        } else {
            msg = "🛑 مجهر: حواف الحبر عند المبلغ '100,000' تظهر تداخلاً غير طبيعي مع ألياف الورق مقارنة بباقي النص. تزوير مؤكد.";
        }
        res.innerHTML = `<div class="res-box" style="border-right: 4px solid var(--accent);">🔍 التقرير المخبري: ${msg}</div>`;
    }, 1500);
}

// --- NEW V6 FEATURES: SARAH & BLOCKCHAIN ---
async function askSarah() {
    if(!currentCourtCase) return;
    
    const display = document.getElementById('vc-chat-display');
    const msgId = addChatMessage('bot', "جاري تحليل القضية من منظور القانون العراقي...", true);
    
    setTimeout(() => {
        removeChatMessage(msgId);
        let lawTip = "";
        if(currentCourtCase.id === "case_01") { // Corporate Fraud
            lawTip = "تنص المادة 444 من قانون العقوبات العراقي على عقوبات مشددة في حال كان الجاني مستخدماً لدى المجني عليه. الأدلة الرقمية هنا تعزز ركن القصد الجنائي.";
        } else if(currentCourtCase.id === "case_02") { // Criminal Embezzlement
            lawTip = "وفقاً للمادة 315 من قانون العقوبات العراقي، تعتبر جريمة الاختلاس جناية إذا ارتكبها موظف عمومي. ركز في تساؤلاتك على 'القصد الخاص' والتصرف بالأموال.";
        } else {
            lawTip = "ينص القانون العراقي على أن 'البينة على من ادعى'. يجب ربط الأدلة الجنائية المسحوبة من المختبر بالوقائع المذكورة في ملف القضية.";
        }
        
        addChatMessage('bot', `<div style="background: rgba(168, 85, 247, 0.1); padding: 15px; border-radius: 12px; border-right: 4px solid #a855f7;">
            <strong>✨ المستشار سارة يوضح:</strong><br>${lawTip}
        </div>`, true);
    }, 1500);
}

function generateDigitalSeal() {
    const chatDisplay = document.getElementById('vc-chat-display');
    const timestamp = new Date().getTime();
    const hash = "SHA256-" + btoa(timestamp).substring(0, 32);
    
    const sealHtml = `
        <div class="digital-seal-overlay">
            <i class="fa-solid fa-shield-halved" style="font-size: 2rem; color: #10b981; margin-bottom: 10px;"></i>
            <h4>تم التوثيق الرقمي بنجاح</h4>
            <p style="font-size: 0.85rem;">هذا القرار موثق بنظام Iraqi-Justice-Chain وغير قابل للتلاعب.</p>
            <div class="seal-hash">المعرف الرقمي: ${hash}</div>
            <div style="margin-top: 10px; background: white; display: inline-block; padding: 5px; border-radius: 5px;">
                <i class="fa-solid fa-qrcode" style="font-size: 3rem; color: black;"></i>
            </div>
        </div>
    `;
    
    const div = document.createElement('div');
    div.innerHTML = sealHtml;
    chatDisplay.appendChild(div);
    chatDisplay.scrollTop = chatDisplay.scrollHeight;
}

// Remove standalone wrapper which was causing errors
function wrapRequestVerdict() { 
    // Handled in DOMReady now
}


// Auto-expand textarea
document.addEventListener('input', (e) => {
    if (e.target.id === 'vc-chat-input') {
        e.target.style.height = 'auto';
        e.target.style.height = (e.target.scrollHeight) + 'px';
    }
});

document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('theme') === 'light') document.body.classList.add('light-theme');
    const btn = document.createElement('button'); btn.className = 'theme-toggle-btn'; btn.innerHTML = '<i class="fa-solid fa-circle-half-stroke"></i>'; btn.onclick = toggleTheme; document.body.appendChild(btn);
    const savedUser = localStorage.getItem('kiosk_user');
    if (savedUser) { try { currentUser = JSON.parse(savedUser); updateUserUI(); } catch (e) { localStorage.removeItem('kiosk_user'); } }
    document.getElementById('userInput')?.addEventListener('keypress', e => { if (e.key === 'Enter') handleSendMessage(); });
    document.getElementById('loginPassword')?.addEventListener('keypress', e => { if (e.key === 'Enter') loginUser(); });
    document.getElementById('regPassword')?.addEventListener('keypress', e => { if (e.key === 'Enter') registerUser(); });
    document.getElementById('authModal')?.addEventListener('click', e => { if (e.target.id === 'authModal') closeAuthModal(); });
    fetchNews();
    if(typeof loadCourtCases === 'function') setTimeout(loadCourtCases, 500);
    
    // --- GLOBAL SCOPE ASSIGNMENTS (V6-FIX) ---
    window.logoutUser = logoutUser;
    window.generateStudentId = generateStudentId;
    window.openSubmitNewsModal = openSubmitNewsModal;
    window.submitNewsArticle = submitNewsArticle;
    window.openLawPanel = openLawPanel;
    window.closeAllLawPanels = closeAllLawPanels;
    window.investigateAction = investigateAction;
    window.runForgerySim = runForgerySim;
    window.setForgeryFilter = setForgeryFilter;
    window.toggleLateralSidebar = toggleLateralSidebar;
    window.askSarah = askSarah;
    window.generateDigitalSeal = generateDigitalSeal;
    window.requestVerdict = requestVerdict;
    
    // Now wrap for digital seal enhancement safely
    const originalV = window.requestVerdict;
    window.requestVerdict = async function() {
        if(typeof originalV === 'function') {
            await originalV();
            setTimeout(generateDigitalSeal, 3000);
        }
    };

    window.switchToolkitTab = switchToolkitTab;
    window.switchTkSubTab = switchTkSubTab;
    window.loadChecklist = loadChecklist;
    window.updateChecklistProgress = updateChecklistProgress;
    window.generateContract = generateContract;
    window.loadCourtCases = loadCourtCases;
    window.startTrial = startTrial;
    window.closeVirtualCourt = closeVirtualCourt;
    window.sendCourtMessage = sendCourtMessage;
    window.calcBudget = calcBudget;
    window.calcInflation = calcInflation;
    window.validateCheck = validateCheck;
    window.openBankAccount = openBankAccount;
    window.processATM = processATM;
    window.atmAction = atmAction;
    window.showTrialBalance = showTrialBalance;
    window.addJournalEntry = addJournalEntry;
    window.calcRealEstate = calcRealEstate;
    window.sellStock = sellStock;
    window.buyStock = buyStock;
    window.refreshStockPrices = refreshStockPrices;
    window.runLoanSim = runLoanSim;
    window.runLoanSim2 = runLoanSim2;
    window.runSavingsSim = runSavingsSim;
    window.runSavingsSim2 = runSavingsSim2;
    window.runCurrencyConvert = runCurrencyConvert;
    window.runCurrency2 = runCurrency2;
    window.initPaymentSim2 = initPaymentSim2;
    window.checkFinance = checkFinance;
    window.handleFinanceBack = handleFinanceBack;
    window.switchView = switchView;
    window.switchSubView = switchSubView;
    window.openSimPanel = openSimPanel;
    window.closeAllSimPanels = closeAllSimPanels;

    // Finally, ensure the first view is activated
    switchView('view-chat');
});
