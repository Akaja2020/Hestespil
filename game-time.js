
/* FÆLLES TIDSSTYRING FOR HELE HORSEDREAMS ONLINE
   Denne fil flytter kalenderen og bogfører månedens økonomi. */

(function () {
    "use strict";

    const STORAGE_KEY = "hestespil_horses_v1";
    const BOARDING_KEY = "hestespil_boarding_v1";

    const MONTHLY_SALARY = 20000;
    const MONTHLY_LIVING_COSTS = 7500;

    const BOARDING_STABLES = {
        enggaarden: {
            name: "Enggården",
            price: 1500
        },
        skovly: {
            name: "Skovly",
            price: 2500
        },
        hoejgaard: {
            name: "Højgård Ridecenter",
            price: 3000
        }
    };

    const MONTH_NAMES = [
        "Januar", "Februar", "Marts", "April",
        "Maj", "Juni", "Juli", "August",
        "September", "Oktober", "November", "December"
    ];

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

    function say(text) {
        if (status) status.textContent = text;
    }

    function render(data) {
        if (!data || !data.calendar) return;

        const calendar = data.calendar;
        const monthName = MONTH_NAMES[calendar.month - 1];
        const seasonName = season(calendar.month);

        if (yearEl) yearEl.textContent = "År " + calendar.year;
        if (monthEl) monthEl.textContent = monthName;
        if (seasonEl) seasonEl.textContent = seasonName;

        [
            "calendarYear",
            "calendarMonth",
            "calendarSeason"
        ].forEach((id, index) => {
            const element = document.getElementById(id);

            if (!element) return;

            element.textContent = [
                "År " + calendar.year,
                monthName,
                seasonName
            ][index];
        });
    }

    function validate(data) {
        return data &&
            data.calendar &&
            Number.isInteger(data.calendar.year) &&
            Number.isInteger(data.calendar.month) &&
            data.calendar.year >= 1 &&
            data.calendar.month >= 1 &&
            data.calendar.month <= 12 &&
            data.economy &&
            Array.isArray(data.economy.transactions) &&
            typeof data.economy.balance === "number" &&
            typeof data.economy.nextTransactionId === "number";
    }

    function load() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);

            if (!raw) {
                say("Spildata blev ikke fundet. Gå til forsiden først.");
                return;
            }

            const data = JSON.parse(raw);

            if (!validate(data)) {
                say("Spillets kalender eller økonomi kunne ikke valideres. Data er ikke ændret.");
                return;
            }

            render(data);

            if (button) button.disabled = false;

            say("Spillets tid er klar.");
        } catch (error) {
            console.error("Kunne ikke indlæse spillets tid:", error);
            say("Spillets tid kunne ikke indlæses. Data er ikke ændret.");
        }
    }

    function advance() {
        if (!button) return;

        button.disabled = true;
        say("Måneden opdateres …");

        let previousRaw;
        let previousBoardingRaw;

        try {
            previousRaw = localStorage.getItem(STORAGE_KEY);

            if (!previousRaw) {
                throw new Error("Spildata blev ikke fundet.");
            }

            const data = JSON.parse(previousRaw);

            if (!validate(data)) {
                throw new Error("Kalender eller økonomi kunne ikke valideres.");
            }

            previousBoardingRaw = localStorage.getItem(BOARDING_KEY);

            /* Flyt kalenderen én måned frem. */
            if (data.calendar.month === 12) {
                data.calendar.month = 1;
                data.calendar.year++;
            } else {
                data.calendar.month++;
            }

            const economy = data.economy;

            function post(type, category, description, amount) {
                economy.balance +=
                    type === "income" ? amount : -amount;

                economy.transactions.push({
                    id: economy.nextTransactionId++,
                    year: data.calendar.year,
                    month: data.calendar.month,
                    type: type,
                    category: category,
                    description: description,
                    amount: amount,
                    balanceAfter: economy.balance
                });
            }

            /* Månedens løn og leveomkostninger. */
            post(
                "income",
                "Løn",
                "Fast månedsløn efter skat",
                MONTHLY_SALARY
            );

            post(
                "expense",
                "Leveomkostninger",
                "Månedens faste leveomkostninger",
                MONTHLY_LIVING_COSTS
            );

            /* Aktiver eventuelt planlagt skift af opstaldningssted. */
            const boardingRaw = localStorage.getItem(BOARDING_KEY);

            if (boardingRaw) {
                const boarding = JSON.parse(boardingRaw);

                if (
                    boarding &&
                    boarding.pendingId &&
                    BOARDING_STABLES[boarding.pendingId]
                ) {
                    boarding.id = boarding.pendingId;
                    boarding.name = BOARDING_STABLES[boarding.id].name;
                    boarding.price = BOARDING_STABLES[boarding.id].price;

                    delete boarding.pendingId;
                    delete boarding.pendingName;
                    delete boarding.pendingPrice;

                    localStorage.setItem(
                        BOARDING_KEY,
                        JSON.stringify(boarding)
                    );
                }

                const stable =
                    boarding && BOARDING_STABLES[boarding.id];

                if (stable) {
                    post(
                        "expense",
                        "Opstaldning",
                        "Månedlig opstaldning hos " +
                            stable.name +
                            " (foder inkluderet)",
                        stable.price
                    );
                }
            }

            const boardingForMonth = JSON.parse(
                localStorage.getItem(BOARDING_KEY) || "null"
            );

            const boardingCost =
                boardingForMonth &&
                BOARDING_STABLES[boardingForMonth.id]
                    ? BOARDING_STABLES[boardingForMonth.id].price
                    : 0;

            economy.lastIncome = MONTHLY_SALARY;
            economy.lastExpenses =
                MONTHLY_LIVING_COSTS + boardingCost;
            economy.lastNet =
                economy.lastIncome - economy.lastExpenses;

            /* Gem spillet. */
            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(data)
            );

            const verify = JSON.parse(
                localStorage.getItem(STORAGE_KEY)
            );

            if (
                !verify ||
                verify.calendar.year !== data.calendar.year ||
                verify.calendar.month !== data.calendar.month ||
                verify.economy.balance !== data.economy.balance ||
                verify.economy.transactions.length !==
                    data.economy.transactions.length
            ) {
                throw new Error("Kontrol af gemte data mislykkedes.");
            }

            window.location.reload();

        } catch (error) {
            console.error("Tidsstyringsfejl:", error);

            try {
                if (previousRaw !== undefined && previousRaw !== null) {
                    localStorage.setItem(STORAGE_KEY, previousRaw);
                }

                if (
                    previousBoardingRaw !== undefined &&
                    previousBoardingRaw !== null
                ) {
                    localStorage.setItem(
                        BOARDING_KEY,
                        previousBoardingRaw
                    );
                }
            } catch (restoreError) {
                console.error(
                    "Kunne ikke gendanne spillet:",
                    restoreError
                );
            }

            say(
                "Måneden kunne ikke gemmes. Dine tidligere data er bevaret, hvis browseren tillod gendannelse."
            );

            if (button) button.disabled = false;
        }
    }

    if (button) {
        button.addEventListener("click", advance);
    }

    load();
})();
