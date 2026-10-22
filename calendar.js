const STORAGE_KEY = "hestespil_horses_v1";

const MONTHLY_SALARY = 20000;
const MONTHLY_LIVING_COSTS = 7500;

const MONTH_NAMES = [
    "Januar", "Februar", "Marts", "April",
    "Maj", "Juni", "Juli", "August",
    "September", "Oktober", "November", "December"
];

const yearElement = document.getElementById("calendarYear");
const monthElement = document.getElementById("calendarMonth");
const seasonElement = document.getElementById("calendarSeason");
const nextMonthButton = document.getElementById("nextMonthButton");
const statusElement = document.getElementById("calendarStatus");

let gameData = null;<!-- -->

function getSeason(month) {
    if (month === 12 || month <= 2) return "Vinter";
    if (month <= 5) return "Forår";
    if (month <= 8) return "Sommer";
    return "Efterår";
}

function showStatus(message) {
    statusElement.textContent = message;
}

function renderCalendar() {
    const calendar = gameData.calendar;

    yearElement.textContent = "År " + calendar.year;
    monthElement.textContent = MONTH_NAMES[calendar.month - 1];
    seasonElement.textContent = getSeason(calendar.month);
}

function loadGameData() {
    const savedData = localStorage.getItem(STORAGE_KEY);

    if (!savedData) {
        showStatus(
            "Spillets data blev ikke fundet. Gå til forsiden, " +
            "og kontrollér, at spillet er indlæst."
        );
        return false;
    }

    try {
        gameData = JSON.parse(savedData);
    } catch (error) {
        showStatus(
            "Spillets gemte data kunne ikke læses. " +
            "Data er ikke blevet ændret."
        );
        return false;
    }

    if (
        !gameData ||
        !gameData.calendar ||
        !Number.isInteger(gameData.calendar.year) ||
        !Number.isInteger(gameData.calendar.month) ||
        gameData.calendar.year < 1 ||
        gameData.calendar.month < 1 ||
        gameData.calendar.month > 12 ||
        !gameData.economy ||
        !Array.isArray(gameData.economy.transactions)
    ) {
        gameData = null;
        showStatus(
            "Spillets kalenderdata mangler eller er ugyldige. " +
            "Data er ikke blevet ændret."
        );
        return false;
    }

    const economy = gameData.economy;

    if (
        typeof economy.balance !== "number" ||
        typeof economy.nextTransactionId !== "number"
    ) {
        gameData = null;
        showStatus(
            "Spillets økonomidata kunne ikke valideres. " +
            "Data er ikke blevet ændret."
        );
        return false;
    }

    renderCalendar();
    showStatus("Kalenderen er klar.");
    nextMonthButton.disabled = false;

    return true;
}

function advanceMonth() {
    if (!gameData) return;

    nextMonthButton.disabled = true;
    showStatus("Måneden opdateres …");

    // Gem en kopi, så ændringer kan rulles tilbage ved fejl.
    const previousData = JSON.stringify(gameData);
    const previousStoredData = localStorage.getItem(STORAGE_KEY);

    try {
        if (gameData.calendar.month === 12) {
            gameData.calendar.month = 1;
            gameData.calendar.year++;
        } else {
            gameData.calendar.month++;
        }

        const economy = gameData.economy;

        // Bogfør månedens løn.
        economy.balance += MONTHLY_SALARY;
        economy.transactions.push({
            id: economy.nextTransactionId++,
            year: gameData.calendar.year,
            month: gameData.calendar.month,
            type: "income",
            category: "Løn",
            description: "Fast månedsløn fra staldarbejde",
            amount: MONTHLY_SALARY,
            balanceAfter: economy.balance
        });

        // Bogfør månedens leveomkostninger.
        economy.balance -= MONTHLY_LIVING_COSTS;
        economy.transactions.push({
            id: economy.nextTransactionId++,
            year: gameData.calendar.year,
            month: gameData.calendar.month,
            type: "expense",
            category: "Leveomkostninger",
            description: "Månedens faste leveomkostninger",
            amount: MONTHLY_LIVING_COSTS,
            balanceAfter: economy.balance
        });

        economy.lastIncome = MONTHLY_SALARY;
        economy.lastExpenses = MONTHLY_LIVING_COSTS;
        economy.lastNet = MONTHLY_SALARY - MONTHLY_LIVING_COSTS;

        localStorage.setItem(STORAGE_KEY, JSON.stringify(gameData));

        // Kontrollér, at de gemte data kan læses igen.
        const verification = JSON.parse(
            localStorage.getItem(STORAGE_KEY)
        );

        if (
            !verification ||
            !verification.calendar ||
            verification.calendar.year !== gameData.calendar.year ||
            verification.calendar.month !== gameData.calendar.month
        ) {
            throw new Error("Kontrol af gemte data mislykkedes.");
        }

        renderCalendar();
        showStatus(
            "Måneden er opdateret. Løn og leveomkostninger er bogført."
        );
    } catch (error) {
        // Gendan både den tidligere spiltilstand og den gemte version.
        gameData = JSON.parse(previousData);

        try {
            if (previousStoredData !== null) {
                localStorage.setItem(STORAGE_KEY, previousStoredData);
            }
        } catch (restoreError) {
            console.error("Kunne ikke gendanne gemte data:", restoreError);
        }

        renderCalendar();
        showStatus(
            "Måneden kunne ikke gemmes. Kontrollér lagerpladsen, " +
            "og prøv igen."
        );

        console.error("Kalenderfejl:", error);
    } finally {
        nextMonthButton.disabled = false;
    }
}

nextMonthButton.addEventListener("click", advanceMonth);

loadGameData();
