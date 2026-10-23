// FÆLLES TIDSSTYRING FOR HELE HESTESPILLET
// Denne fil er den eneste, der flytter kalenderen og bogfører månedens økonomi.
(function () {
    "use strict";
    const STORAGE_KEY = "hestespil_horses_v1";
    const MONTHLY_SALARY = 20000;
    const MONTHLY_LIVING_COSTS = 7500;
    const MONTH_NAMES = ["Januar","Februar","Marts","April","Maj","Juni","Juli","August","September","Oktober","November","December"];
    const yearEl = document.getElementById("gameYear");
    const monthEl = document.getElementById("gameMonth");
    const seasonEl = document.getElementById("gameSeason");
    const button = document.getElementById("nextMonthButton");
    const status = document.getElementById("gameTimeStatus");

    function season(month) {
        if (month === 12 || month <= 2) return "Vinter";
        if (month <= 5) return "Forår";
        if (month <= 8) return "Sommer";
        return "Efterår";
    }
    function say(text) { if (status) status.textContent = text; }
    function render(data) {
        if (!data || !data.calendar) return;
        const c = data.calendar;
        if (yearEl) yearEl.textContent = "År " + c.year;
        if (monthEl) monthEl.textContent = MONTH_NAMES[c.month - 1];
        if (seasonEl) seasonEl.textContent = season(c.month);
        ["calendarYear","calendarMonth","calendarSeason"].forEach((id, i) => {
            const el = document.getElementById(id);
            if (el) el.textContent = [ "År " + c.year, MONTH_NAMES[c.month - 1], season(c.month) ][i];
        });
    }
    function load() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) { say("Spildata blev ikke fundet. Gå til forsiden først."); return; }
            const data = JSON.parse(raw);
            if (!data.calendar || !Number.isInteger(data.calendar.year) || !Number.isInteger(data.calendar.month) ||
                data.calendar.year < 1 || data.calendar.month < 1 || data.calendar.month > 12 ||
                !data.economy || !Array.isArray(data.economy.transactions) ||
                typeof data.economy.balance !== "number" ||
                typeof data.economy.nextTransactionId !== "number") {
                say("Spillets kalender eller økonomi kunne ikke valideres. Data er ikke ændret."); return;
            }
            render(data);
            if (button) button.disabled = false;
            say("Spillets tid er klar.");
        } catch (e) {
            console.error("Kunne ikke indlæse spillets tid:", e);
            say("Spillets tid kunne ikke indlæses. Data er ikke ændret.");
        }
    }
    function advance() {
        if (!button) return;
        button.disabled = true;
        say("Måneden opdateres …");
        let previousRaw;
        try {
            previousRaw = localStorage.getItem(STORAGE_KEY);
            if (!previousRaw) throw new Error("Spildata blev ikke fundet.");
            const data = JSON.parse(previousRaw);
            if (!data.calendar || !data.economy || !Array.isArray(data.economy.transactions) ||
                !Number.isInteger(data.calendar.year) || !Number.isInteger(data.calendar.month) ||
                data.calendar.month < 1 || data.calendar.month > 12 ||
                typeof data.economy.balance !== "number" ||
                typeof data.economy.nextTransactionId !== "number") {
                throw new Error("Kalender eller økonomi kunne ikke valideres.");
            }
            // Ændr kun kalender og økonomi; alle andre gemte data bevares uændret.
            if (data.calendar.month === 12) { data.calendar.month = 1; data.calendar.year++; }
            else data.calendar.month++;
            const e = data.economy;
            e.balance += MONTHLY_SALARY;
            e.transactions.push({id:e.nextTransactionId++,year:data.calendar.year,month:data.calendar.month,type:"income",category:"Løn",description:"Fast månedsløn fra staldarbejde",amount:MONTHLY_SALARY,balanceAfter:e.balance});
            e.balance -= MONTHLY_LIVING_COSTS;
            e.transactions.push({id:e.nextTransactionId++,year:data.calendar.year,month:data.calendar.month,type:"expense",category:"Leveomkostninger",description:"Månedens faste leveomkostninger",amount:MONTHLY_LIVING_COSTS,balanceAfter:e.balance});
            e.lastIncome=MONTHLY_SALARY; e.lastExpenses=MONTHLY_LIVING_COSTS; e.lastNet=MONTHLY_SALARY-MONTHLY_LIVING_COSTS;
            const updated = JSON.stringify(data);
            localStorage.setItem(STORAGE_KEY, updated);
            const verify = JSON.parse(localStorage.getItem(STORAGE_KEY));
            if (!verify || verify.calendar.year !== data.calendar.year || verify.calendar.month !== data.calendar.month ||
                verify.economy.balance !== data.economy.balance || verify.economy.transactions.length !== data.economy.transactions.length) {
                throw new Error("Kontrol af gemte data mislykkedes.");
            }
            // Genindlæs siden, så alle sider bruger den samme friske spiltilstand.
            window.location.reload();
        } catch (e) {
            console.error("Tidsstyringsfejl:", e);
            try { if (previousRaw !== undefined && previousRaw !== null) localStorage.setItem(STORAGE_KEY, previousRaw); } catch (restoreError) { console.error("Kunne ikke gendanne spillet:", restoreError); }
            say("Måneden kunne ikke gemmes. Dine tidligere data er bevaret, hvis browseren tillod gendannelse.");
            if (button) button.disabled = false;
        }
    }
    if (button) button.addEventListener("click", advance);
    load();
})();
