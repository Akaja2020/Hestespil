const STORAGE_KEY = "hestespil_horses_v1";
const MONTHLY_SALARY = 20000;
const MONTHLY_LIVING_COSTS = 7500;
const MONTH_NAMES = ["Januar","Februar","Marts","April","Maj","Juni","Juli","August","September","Oktober","November","December"];
let economy = { balance: 30000, lastIncome: 0, lastExpenses: 0, lastNet: 0, transactions: [], nextTransactionId: 1 };
function formatMoney(amount) { return Number(amount).toLocaleString("da-DK") + " kr."; }
function getSavedGame() {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (!savedData) return null;
    try { return JSON.parse(savedData); }
    catch (error) { console.error("Kunne ikke læse de gemte spildata:", error); return null; }
}
function loadEconomy() {
    const data = getSavedGame();
    if (!data || !data.economy) {
        renderEconomy(); renderLedgerFilters(); renderLedger();
        const entries = document.getElementById("ledgerEntries");
        if (entries) entries.textContent = "Der blev ikke fundet gemte økonomidata.";
        return;
    }
    const saved = data.economy;
    economy = {
        balance: Number.isFinite(saved.balance) ? saved.balance : 30000,
        lastIncome: Number(saved.lastIncome) || 0,
        lastExpenses: Number(saved.lastExpenses) || 0,
        lastNet: Number(saved.lastNet) || 0,
        transactions: Array.isArray(saved.transactions) ? saved.transactions : [],
        nextTransactionId: Number.isInteger(saved.nextTransactionId) && saved.nextTransactionId > 0 ? saved.nextTransactionId : 1
    };
    renderEconomy(); renderLedgerFilters(); renderLedger();
}
function renderEconomy() {
    const ids = { moneyBalance: economy.balance, monthlySalary: MONTHLY_SALARY, livingCosts: MONTHLY_LIVING_COSTS, lastIncome: economy.lastIncome, lastExpenses: economy.lastExpenses, monthlyNet: economy.lastNet };
    Object.keys(ids).forEach(id => { const el = document.getElementById(id); if (el) { const n=ids[id]; el.textContent = (id === "monthlyNet" && n > 0 ? "+ " : "") + formatMoney(n); } });
}
function renderLedgerFilters() {
    const ys=document.getElementById("ledgerYear"), cs=document.getElementById("ledgerCategory");
    if (!ys || !cs) return;
    const oldY=ys.value, oldC=cs.value, tx=economy.transactions || [];
    const years=[...new Set(tx.map(t=>t.year).filter(Number.isInteger))].sort((a,b)=>a-b);
    ys.replaceChildren(); const allY=document.createElement("option"); allY.value="all"; allY.textContent="Alle år"; ys.appendChild(allY);
    years.forEach(y=>{const o=document.createElement("option");o.value=String(y);o.textContent="År "+y;ys.appendChild(o);});
    ys.value=years.includes(Number(oldY))?oldY:"all";
    const cats=[...new Set(tx.map(t=>t.category).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"da"));
    cs.replaceChildren();const allC=document.createElement("option");allC.value="all";allC.textContent="Alle kategorier";cs.appendChild(allC);
    cats.forEach(c=>{const o=document.createElement("option");o.value=c;o.textContent=c;cs.appendChild(o);});
    cs.value=cats.includes(oldC)?oldC:"all";
}
function renderLedger() {
    const entries=document.getElementById("ledgerEntries"), empty=document.getElementById("ledgerEmptyMessage");
    if (!entries || !empty) return;
    const yf=document.getElementById("ledgerYear")?.value || "all", mf=document.getElementById("ledgerMonth")?.value || "all", cf=document.getElementById("ledgerCategory")?.value || "all";
    const tx=[...economy.transactions].filter(t=>(yf==="all"||t.year===Number(yf))&&(mf==="all"||t.month===Number(mf))&&(cf==="all"||t.category===cf)).reverse();
    entries.replaceChildren();
    tx.forEach(t=>{
        const card=document.createElement("article");card.className="ledger-entry";
        const date=document.createElement("p");date.className="ledger-date";date.textContent="År "+t.year+" · "+(MONTH_NAMES[t.month-1]||"Ukendt måned");
        const desc=document.createElement("h3");desc.textContent=t.description||"Økonomipost";
        const cat=document.createElement("p");cat.className="ledger-category";cat.textContent=t.category||"Andet";
        const amount=document.createElement("p");amount.className="ledger-amount";
        if(t.type==="income"){amount.textContent="+ "+formatMoney(t.amount);amount.classList.add("income");}
        else {amount.textContent="− "+formatMoney(t.amount);amount.classList.add("expense");}
        const bal=document.createElement("p");bal.className="ledger-balance";bal.textContent="Saldo efter post: "+formatMoney(t.balanceAfter);
        card.append(date,desc,cat,amount,bal);entries.appendChild(card);
    });
    empty.hidden=tx.length!==0;
}
["ledgerYear","ledgerMonth","ledgerCategory"].forEach(id=>{const el=document.getElementById(id);if(el)el.addEventListener("change",renderLedger);});
loadEconomy();
