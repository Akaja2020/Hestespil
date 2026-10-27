
 // Kalenderens visning. Selve tidsstyringen ligger i game-time.js.
const STORAGE_KEY = "hestespil_horses_v1";

const MONTH_NAMES = [
    "Januar", "Februar", "Marts", "April", "Maj", "Juni",
    "Juli", "August", "September", "Oktober", "November", "December"
];

function getSeason(month) {
    if (month === 12 || month <= 2) return "Vinter";
    if (month <= 5) return "Forår";
    if (month <= 8) return "Sommer";
    return "Efterår";
}

function setCalendarText(id, text) {
    const element = document.getElementById(id);

    if (element) {
        element.textContent = text;
    }
}

function renderCalendarPage() {
    const status = document.getElementById("calendarStatus");

    try {
        const raw = localStorage.getItem(STORAGE_KEY);

        if (!raw) {
            setCalendarText(
                "calendarStatus",
                "Spillets data blev ikke fundet. Gå til forsiden, og kontrollér, at spillet er indlæst."
            );
            return;
        }

        const data = JSON.parse(raw);

        if (
            !data ||
            !data.calendar ||
            !Number.isInteger(data.calendar.year) ||
            !Number.isInteger(data.calendar.month) ||
            data.calendar.month < 1 ||
            data.calendar.month > 12
        ) {
            setCalendarText(
                "calendarStatus",
                "Kalenderdata mangler eller er ugyldige. Data er ikke ændret."
            );
            return;
        }

        setCalendarText("calendarYear", "År " + data.calendar.year);
        setCalendarText(
            "calendarMonth",
            MONTH_NAMES[data.calendar.month - 1]
        );
        setCalendarText(
            "calendarSeason",
            getSeason(data.calendar.month)
        );

        setCalendarText("calendarStatus", "Kalenderen er klar.");
    } catch (error) {
        setCalendarText(
            "calendarStatus",
            "Kalenderen kunne ikke indlæses. Data er ikke ændret."
        );

        console.error("Kalenderfejl:", error);
    }
}

renderCalendarPage();
