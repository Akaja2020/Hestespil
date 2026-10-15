
const STORAGE_KEY = "hestespil_horses_v1";

const MONTHLY_SALARY = 20000;
const MONTHLY_LIVING_COSTS = 7500;

const MONTH_NAMES = [
    "Januar", "Februar", "Marts", "April", "Maj", "Juni",
    "Juli", "August", "September", "Oktober", "November", "December"
];

const moneyBalance = document.getElementById("moneyBalance");
const monthlySalary = document.getElementById("monthlySalary");
const livingCosts = document.getElementById("livingCosts");
const lastIncome = document.getElementById("lastIncome");
const lastExpenses = document.getElementById("lastExpenses");
const monthlyNet = document.getElementById("monthlyNet");
const economyMessage = document.getElementById("economyMessage");

const yearSelect = document.getElementById("ledgerYear");
const monthSelect = document.getElementById("ledgerMonth");
const categorySelect = document.getElementById("ledgerCategory");
const entriesElement = document.getElementById("ledgerEntries");
const emptyMessage = document.getElementById("ledgerEmptyMessage");

let economy = null;

function formatMoney(amount) {
    return Number(amount || 0).toLocaleString("da-DK") + " kr.";
}

function loadEconomy() {
    try {
        const savedData = localStorage.getItem(STORAGE_KEY);

        if (!savedData) {
            economyMessage.textContent =
                "Der blev ikke fundet gemte spildata. Åbn forsiden først.";
            return;
        }

        const data = JSON.parse(savedData);

        if (!data.economy || !Number.isFinite(data.economy.balance)) {
            economyMessage.textContent =
                "Spillets økonomi blev ikke fundet.";
            return;
        }

        economy = data.economy;

        if (!Array.isArray(economy.transactions)) {
            economy.transactions = [];
        }

        renderEconomy();
        renderFilters();
        renderLedger();

    } catch (error) {
        console.error("Fejl ved indlæsning af økonomien:", error);
        economyMessage.textContent =
            "Økonomien kunne ikke indlæses.";
    }
}

function renderEconomy() {
    moneyBalance.textContent = formatMoney(economy.balance);
    monthlySalary.textContent = formatMoney(MONTHLY_SALARY);
    livingCosts.textContent = formatMoney(MONTHLY_LIVING_COSTS);
    lastIncome.textContent = formatMoney(economy.lastIncome);
    lastExpenses.textContent = formatMoney(economy.lastExpenses);

    const net = Number(economy.lastNet) || 0;
    monthlyNet.textContent =
        (net > 0 ? "+" : net < 0 ? "−" : "") +
        formatMoney(Math.abs(net));
}

function renderFilters() {
    const selectedYear = yearSelect.value;
    const selectedCategory = categorySelect.value;
    const transactions = economy.transactions;

    const years = [...new Set(
        transactions.map(item => item.year)
            .filter(Number.isInteger)
    )].sort((a, b) => a - b);

    yearSelect.replaceChildren(
        new Option("Alle år", "all")
    );

    years.forEach(function(year) {
        yearSelect.add(new Option("År " + year, String(year)));
    });

    yearSelect.value = years.includes(Number(selectedYear))
        ? selectedYear
        : "all";

    const categories = [...new Set(
        transactions.map(item => item.category).filter(Boolean)
    )].sort((a, b) => a.localeCompare(b, "da"));

    categorySelect.replaceChildren(
        new Option("Alle kategorier", "all")
    );

    categories.forEach(function(category) {
        categorySelect.add(new Option(category, category));
    });

    categorySelect.value = categories.includes(selectedCategory)
        ? selectedCategory
        : "all";
}

function renderLedger() {
    const transactions = economy.transactions
        .filter(function(item) {
            const yearMatches =
                yearSelect.value === "all" ||
                item.year === Number(yearSelect.value);

            const monthMatches =
                monthSelect.value === "all" ||
                item.month === Number(monthSelect.value);

            const categoryMatches =
                categorySelect.value === "all" ||
                item.category === categorySelect.value;

            return yearMatches && monthMatches && categoryMatches;
        })
        .slice()
        .reverse();

    entriesElement.replaceChildren();

    transactions.forEach(function(transaction) {
        const card = document.createElement("article");
        card.className = "ledger-entry";

        const date = document.createElement("p");
        date.className = "ledger-date";
        date.textContent =
            "År " + transaction.year + " · " +
            (MONTH_NAMES[transaction.month - 1] || "Ukendt måned");

        const description = document.createElement("h3");
        description.textContent =
            transaction.description || "Transaktion";

        const category = document.createElement("p");
        category.className = "ledger-category";
        category.textContent = transaction.category || "Andet";

        const amount = document.createElement("p");
        amount.className = "ledger-amount";
        amount.textContent =
            (transaction.type === "income" ? "+ " : "− ") +
            formatMoney(transaction.amount);

        const balance = document.createElement("p");
        balance.className = "ledger-balance";
        balance.textContent =
            "Saldo efter post: " + formatMoney(transaction.balanceAfter);

        card.append(date, description, category, amount, balance);
        entriesElement.appendChild(card);
    });

    emptyMessage.hidden = transactions.length > 0;
}

yearSelect.addEventListener("change", renderLedger);
monthSelect.addEventListener("change", renderLedger);
categorySelect.addEventListener("change", renderLedger);

loadEconomy();
