
const STORAGE_KEY = "hestespil_horses_v1";
const MONTHLY_SALARY = 20000;
const MONTHLY_LIVING_COSTS = 7500;

const MONTH_NAMES = [
    "Januar", "Februar", "Marts", "April", "Maj", "Juni",
    "Juli", "August", "September", "Oktober", "November", "December"
];

let economy = {
    balance: null,
    lastIncome: 0,
    lastExpenses: 0,
    lastNet: 0,
    transactions: [],
    nextTransactionId: 1
};

function formatMoney(amount) {
    const value = Number(amount);

    return (
        Number.isFinite(value)
            ? value.toLocaleString("da-DK") + " kr."
            : "—"
    );
}

function getSavedGame() {
    try {
        const savedData = localStorage.getItem(STORAGE_KEY);

        if (!savedData) return null;

        return JSON.parse(savedData);
    } catch (error) {
        console.error("Kunne ikke læse de gemte spildata:", error);
        return null;
    }
}

function showEconomyStatus(message) {
    const entries = document.getElementById("ledgerEntries");

    if (entries) {
        entries.replaceChildren();
        entries.textContent = message;
    }
}

function showUnavailableEconomy() {
    const ids = [
        "moneyBalance",
        "monthlySalary",
        "livingCosts",
        "lastIncome",
        "lastExpenses",
        "monthlyNet"
    ];

    ids.forEach(id => {
        const element = document.getElementById(id);

        if (element) {
            element.textContent = "—";
        }
    });

    const emptyMessage = document.getElementById("ledgerEmptyMessage");

    if (emptyMessage) {
        emptyMessage.hidden = true;
    }

    showEconomyStatus(
        "Gemte økonomidata blev ikke fundet eller kunne ikke læses. " +
        "Ingen gemte data er blevet ændret."
    );
}

function loadEconomy() {
    const data = getSavedGame();

    if (
        !data ||
        !data.economy ||
        typeof data.economy !== "object" ||
        Array.isArray(data.economy) ||
        !Number.isFinite(data.economy.balance)
    ) {
        economy.balance = null;
        economy.transactions = [];
        showUnavailableEconomy();
        return;
    }

    const saved = data.economy;

    economy = {
        balance: saved.balance,
        lastIncome: Number.isFinite(Number(saved.lastIncome))
            ? Number(saved.lastIncome)
            : 0,
        lastExpenses: Number.isFinite(Number(saved.lastExpenses))
            ? Number(saved.lastExpenses)
            : 0,
        lastNet: Number.isFinite(Number(saved.lastNet))
            ? Number(saved.lastNet)
            : 0,
        transactions: Array.isArray(saved.transactions)
            ? saved.transactions.filter(
                transaction =>
                    transaction !== null &&
                    typeof transaction === "object" &&
                    !Array.isArray(transaction)
            )
            : [],
        nextTransactionId:
            Number.isInteger(saved.nextTransactionId) &&
            saved.nextTransactionId > 0
                ? saved.nextTransactionId
                : 1
    };

    renderEconomy();
    renderLedgerFilters();
    renderLedger();
}

function renderEconomy() {
    const values = {
        moneyBalance: economy.balance,
        monthlySalary: MONTHLY_SALARY,
        livingCosts: MONTHLY_LIVING_COSTS,
        lastIncome: economy.lastIncome,
        lastExpenses: economy.lastExpenses,
        monthlyNet: economy.lastNet
    };

    Object.entries(values).forEach(([id, value]) => {
        const element = document.getElementById(id);

        if (!element) return;

        element.textContent =
            (id === "monthlyNet" && value > 0 ? "+ " : "") +
            formatMoney(value);
    });
}

function renderLedgerFilters() {
    const yearSelect = document.getElementById("ledgerYear");
    const categorySelect = document.getElementById("ledgerCategory");

    if (!yearSelect || !categorySelect) return;

    const oldYear = yearSelect.value;
    const oldCategory = categorySelect.value;
    const transactions = economy.transactions;

    const years = [
        ...new Set(
            transactions
                .map(transaction => transaction.year)
                .filter(Number.isInteger)
        )
    ].sort((a, b) => a - b);

    yearSelect.replaceChildren();

    const allYears = document.createElement("option");
    allYears.value = "all";
    allYears.textContent = "Alle år";
    yearSelect.appendChild(allYears);

    years.forEach(year => {
        const option = document.createElement("option");
        option.value = String(year);
        option.textContent = "År " + year;
        yearSelect.appendChild(option);
    });

    yearSelect.value = years.includes(Number(oldYear))
        ? oldYear
        : "all";

    const categories = [
        ...new Set(
            transactions
                .map(transaction => transaction.category)
                .filter(
                    category =>
                        typeof category === "string" && category.length > 0
                )
        )
    ].sort((a, b) => a.localeCompare(b, "da"));

    categorySelect.replaceChildren();

    const allCategories = document.createElement("option");
    allCategories.value = "all";
    allCategories.textContent = "Alle kategorier";
    categorySelect.appendChild(allCategories);

    categories.forEach(category => {
        const option = document.createElement("option");
        option.value = category;
        option.textContent = category;
        categorySelect.appendChild(option);
    });

    categorySelect.value = categories.includes(oldCategory)
        ? oldCategory
        : "all";
}

function renderLedger() {
    const entries = document.getElementById("ledgerEntries");
    const emptyMessage = document.getElementById("ledgerEmptyMessage");

    if (!entries || !emptyMessage) return;

    const yearFilter =
        document.getElementById("ledgerYear")?.value || "all";
    const monthFilter =
        document.getElementById("ledgerMonth")?.value || "all";
    const categoryFilter =
        document.getElementById("ledgerCategory")?.value || "all";

    const transactions = [...economy.transactions]
        .filter(transaction => {
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

    transactions.forEach(transaction => {
        const card = document.createElement("article");
        card.className = "ledger-entry";

        const date = document.createElement("p");
        date.className = "ledger-date";

        const month =
            Number.isInteger(transaction.month) &&
            transaction.month >= 1 &&
            transaction.month <= 12
                ? MONTH_NAMES[transaction.month - 1]
                : "Ukendt måned";

        date.textContent =
            "År " +
            (Number.isInteger(transaction.year)
                ? transaction.year
                : "ukendt") +
            " · " + month;

        const description = document.createElement("h3");
        description.textContent =
            typeof transaction.description === "string" &&
            transaction.description
                ? transaction.description
                : "Økonomipost";

        const category = document.createElement("p");
        category.className = "ledger-category";
        category.textContent =
            typeof transaction.category === "string" &&
            transaction.category
                ? transaction.category
                : "Andet";

        const amount = document.createElement("p");
        amount.className = "ledger-amount";

        const amountValue = Number.isFinite(Number(transaction.amount))
            ? Number(transaction.amount)
            : 0;

        if (transaction.type === "income") {
            amount.textContent = "+ " + formatMoney(amountValue);
            amount.classList.add("income");
        } else {
            amount.textContent = "− " + formatMoney(amountValue);
            amount.classList.add("expense");
        }

        const balance = document.createElement("p");
        balance.className = "ledger-balance";

        const balanceAfter = Number.isFinite(Number(transaction.balanceAfter))
            ? Number(transaction.balanceAfter)
            : null;

        balance.textContent =
            "Saldo efter post: " + formatMoney(balanceAfter);

        card.append(date, description, category, amount, balance);
        entries.appendChild(card);
    });

    emptyMessage.hidden = transactions.length !== 0;
}

["ledgerYear", "ledgerMonth", "ledgerCategory"].forEach(id => {
    const element = document.getElementById(id);

    if (element) {
        element.addEventListener("change", renderLedger);
    }
});

loadEconomy();
