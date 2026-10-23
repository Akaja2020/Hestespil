// Kalenderens visning. Selve tidsstyringen ligger i game-time.js.
const STORAGE_KEY = "hestespil_horses_v1";
const MONTH_NAMES = ["Januar", "Februar", "Marts", "April", "Maj", "Juni",
    "Juli", "August", "September", "Oktober", "November", "December"];

function getSeason(month) {
    if (month === 12 || month <= 2) return "Vinter";
    if (month <= 5) return "Forår";
    if (month <= 8) return "Sommer";
    return "Efterår";
}

function renderCalendarPage() {
    const status = document.getElementById("calendarStatus");
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            if (status) status.textContent = "Spillets data blev ikke fundet. Gå til forsiden, og kontrollér, at spillet er indlæst.";
            return;
        }
        const data = JSON.parse(raw);
        if (!data.calendar || !Number.isInteger(data.calendar.year) ||
            !Number.isInteger(data.calendar.month) || data.calendar.month < 1 ||
            data.calendar.month > 12) {
            if (status) status.textContent = "Kalenderdata mangler eller er ugyldige. Data er ikke ændret.";
            return;
        }
        document.getElementById("calendarYear").textContent = "År " + data.calendar.year;
        document.getElementById("calendarMonth").textContent = MONTH_NAMES[data.calendar.month - 1];
        document.getElementById("calendarSeason").textContent = getSeason(data.calendar.month);
        if (status) status.textContent = "Kalenderen er klar.";
    } catch (error) {
        if (status) status.textContent = "Kalenderen kunne ikke indlæses. Data er ikke ændret.";
        console.error("Kalenderfejl:", error);
    }
}
renderCalendarPage();
