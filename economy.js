
const STORAGE_KEY = "hestespil_horses_v1";

const MONTHLY_SALARY = 20000;
const MONTHLY_LIVING_COSTS = 7500;

const MONTH_NAMES = [
    "Januar", "Februar", "Marts", "April", "Maj", "Juni",
    "Juli", "August", "September", "Oktober", "November", "December"
];

let economy = {
    balance: 30000,
    lastIncome: 0,
    lastExpenses: 0,
    lastNet: 0,
    transactions: [],
    nextTransactionId: 1
};


// ========================================
// HJÆLPEFUNKTIONER
// ========================================

function formatMoney(amount) {
    return Number(amount).toLocaleString("da-DK") + " kr.";
}

function getSavedGame() {
    const savedData = localStorage.getItem(STORAGE_KEY);

    if (!savedData) {
        return null;
    }

    try {
        return JSON.parse(savedData);
    } catch (error) {
        console.error("Kunne ikke læse de gemte spildata:", error);
        return null;
    }
}


// ========================================
// INDLÆS ØKONOMIEN
// ========================================

function loadEconomy() {
    const data = getSavedGame();

    if (!data || !data.economy) {
        renderEconomy();
        renderLedgerFilters();
        renderLedger();

        const entries = document.getElementById("ledgerEntries");

        if (entries) {
            entries.textContent =
                "Der blev ikke fundet gemte økonomidata.";
        }

        return;
    }

    const savedEconomy = data.economy;

    economy = {
        balance: Number.isFinite(savedEconomy.balance)
            ? savedEconomy.balance
            : 30000,

        lastIncome: Number(savedEconomy.lastIncome) || 0,
        lastExpenses: Number(savedEconomy.lastExpenses) || 0,
        lastNet: Number(savedEconomy.lastNet) || 0,

        transactions: Array.isArray(savedEconomy.transactions)
            ? savedEconomy.transactions
            : [],

        nextTransactionId:
            Number.isInteger(savedEconomy.nextTransactionId) &&
            savedEconomy.nextTransactionId > 0
                ? savedEconomy.nextTransactionId
                : 1
    };

    renderEconomy();
    renderLedgerFilters();
    renderLedger();
}


// ========================================
// VIS ØKONOMIENS OVERSIGT
// ========================================

function renderEconomy() {
    const balance = document.getElementById("moneyBalance");
    const salary = document.getElementById("monthlySalary");
    const costs = document.getElementById("livingCosts");
    const income = document.getElementById("lastIncome");
    const expenses = document.getElementById("lastExpenses");
    const net = document.getElementById("monthlyNet");

    if (balance) {
        balance.textContent = formatMoney(economy.balance);
    }

    if (salary) {
        salary.textContent = formatMoney(MONTHLY_SALARY);
    }

    if (costs) {
        costs.textContent = formatMoney(MONTHLY_LIVING_COSTS);
    }

    if (income) {
        income.textContent = formatMoney(economy.lastIncome);
    }

    if (expenses) {
        expenses.textContent = formatMoney(economy.lastExpenses);
    }

    if (net) {
        const sign = economy.lastNet > 0 ? "+ " : "";

        net.textContent = sign + formatMoney(economy.lastNet);
    }
}


// ========================================
// FILTRE TIL ØKONOMIBOGEN
// ========================================

function renderLedgerFilters() {
    const yearSelect = document.getElementById("ledgerYear");
    const categorySelect = document.getElementById("ledgerCategory");

    if (!yearSelect || !categorySelect) {
        return;
    }

    const selectedYear = yearSelect.value;
    const selectedCategory = categorySelect.value;

    const transactions = economy.transactions || [];

    const years = [
        ...new Set(
            transactions
                .map(function(transaction) {
                    return transaction.year;
                })
                .filter(Number.isInteger)
        )
    ].sort(function(a, b) {
        return a - b;
    });

    yearSelect.replaceChildren();

    const allYears = document.createElement("option");
    allYears.value = "all";
    allYears.textContent = "Alle år";
    yearSelect.appendChild(allYears);

    years.forEach(function(year) {
        const option = document.createElement("option");
        option.value = String(year);
        option.textContent = "År " + year;
        yearSelect.appendChild(option);
    });

    yearSelect.value = years.includes(Number(selectedYear))
        ? selectedYear
        : "all";

    const categories = [
        ...new Set(
            transactions
                .map(function(transaction) {
                    return transaction.category;
                })
                .filter(Boolean)
        )
    ].sort(function(a, b) {
        return a.localeCompare(b, "da");
    });

    categorySelect.replaceChildren();

    const allCategories = document.createElement("option");
    allCategories.value = "all";
    allCategories.textContent = "Alle kategorier";
    categorySelect.appendChild(allCategories);

    categories.forEach(function(category) {
        const option = document.createElement("option");
        option.value = category;
        option.textContent = category;
        categorySelect.appendChild(option);
    });

    categorySelect.value = categories.includes(selectedCategory)
        ? selectedCategory
        : "all";
}


// ========================================
// VIS DE ENKELTE ØKONOMIPOSTER
// ========================================

function renderLedger() {
    const entries = document.getElementById("ledgerEntries");
    const emptyMessage = document.getElementById("ledgerEmptyMessage");

    if (!entries || !emptyMessage) {
        return;
    }

    const yearSelect = document.getElementById("ledgerYear");
    const monthSelect = document.getElementById("ledgerMonth");
    const categorySelect = document.getElementById("ledgerCategory");

    const yearFilter = yearSelect ? yearSelect.value : "all";
    const monthFilter = monthSelect ? monthSelect.value : "all";
    const categoryFilter = categorySelect
        ? categorySelect.value
        : "all";

    const transactions = [...economy.transactions]
        .filter(function(transaction) {
            const matchesYear =
                yearFilter === "all" ||
                transaction.year === Number(yearFilter);

            const matchesMonth =
                monthFilter === "all" ||
                transaction.month === Number(monthFilter);

            const matchesCategory =
                categoryFilter === "all" ||
                transaction.category === categoryFilter;

            return matchesYear && matchesMonth && matchesCategory;
        })
        .reverse();

    entries.replaceChildren();

    transactions.forEach(function(transaction) {
        const card = document.createElement("article");
        card.className = "ledger-entry";

        const date = document.createElement("p");
        date.className = "ledger-date";

        const monthName = MONTH_NAMES[transaction.month - 1] || "Ukendt måned";

        date.textContent =
            "År " + transaction.year + " · " + monthName;

        const description = document.createElement("h3");
        description.textContent =
            transaction.description || "Økonomipost";

        const category = document.createElement("p");
        category.className = "ledger-category";
        category.textContent = transaction.category || "Andet";

        const amount = document.createElement("p");
        amount.className = "ledger-amount";

        if (transaction.type === "income") {
            amount.textContent = "+ " + formatMoney(transaction.amount);
            amount.classList.add("income");
        } else {
            amount.textContent = "− " + formatMoney(transaction.amount);
            amount.classList.add("expense");
        }

        const balance = document.createElement("p");
        balance.className = "ledger-balance";
        balance.textContent =
            "Saldo efter post: " + formatMoney(transaction.balanceAfter);

        card.append(date, description, category, amount, balance);
        entries.appendChild(card);
    });

    emptyMessage.hidden = transactions.length !== 0;
}


// ========================================
// FILTRE OPDATERER ØKONOMIBOGEN
// ========================================

const ledgerYear = document.getElementById("ledgerYear");
const ledgerMonth = document.getElementById("ledgerMonth");
const ledgerCategory = document.getElementById("ledgerCategory");

if (ledgerYear) {
    ledgerYear.addEventListener("change", renderLedger);
}

if (ledgerMonth) {
    ledgerMonth.addEventListener("change", renderLedger);
}

if (ledgerCategory) {
    ledgerCategory.addEventListener("change", renderLedger);
}


// ========================================
// START ØKONOMISIDEN
// ========================================

loadEconomy();
