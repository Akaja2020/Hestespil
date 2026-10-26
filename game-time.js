
(function () {
    "use strict";

    const STORAGE_KEY = "hestespil_horses_v1";
    const MONTHLY_SALARY = 20000;
    const MONTHLY_LIVING_COSTS = 7500;
    const MONTHLY_RENT = 2000;

    const MONTH_NAMES = [
        "Januar", "Februar", "Marts", "April", "Maj", "Juni",
        "Juli", "August", "September", "Oktober", "November", "December"
    ];

    const BOARDING_STABLES = {
        enggaarden: { name: "Enggården", price: 1500 },
        skovly: { name: "Skovly", price: 2500 },
        hojgaard: { name: "Højgård Ridecenter", price: 3000 },
        hoejgaard: { name: "Højgård Ridecenter", price: 3000 }
    };

    let currentData = null;
    let boundButton = null;
    let isAdvancing = false;

    function getSeason(month) {
        if (month === 12 || month <= 2) return "Vinter";
        if (month <= 5) return "Forår";
        if (month <= 8) return "Sommer";
        return "Efterår";
    }

    function setStatus(message) {
        const status = document.getElementById("gameTimeStatus");
        if (status) status.textContent = message;
    }

    function setButtonEnabled(enabled) {
        const button = document.getElementById("nextMonthButton");
        if (button) button.disabled = !enabled || isAdvancing;
    }

    function validate(data) {
        return Boolean(
            data &&
            data.calendar &&
            Number.isInteger(data.calendar.year) &&
            data.calendar.year >= 1 &&
            Number.isInteger(data.calendar.month) &&
            data.calendar.month >= 1 &&
            data.calendar.month <= 12 &&
            data.economy &&
            typeof data.economy.balance === "number" &&
            Number.isFinite(data.economy.balance) &&
            Array.isArray(data.economy.transactions) &&
            Array.isArray(data.horses)
        );
    }

    function normalizeData(data) {
        // Udfyld kun manglende tekniske felter i hukommelsen.
        // Gem ikke noget, før spilleren vælger Næste måned.
        if (!Number.isInteger(data.economy.nextTransactionId) ||
            data.economy.nextTransactionId < 1) {
            const ids = data.economy.transactions
                .map(t => Number(t.id))
                .filter(Number.isFinite);

            data.economy.nextTransactionId =
                Math.max(0, ...ids) + 1;
        }

        if (!Number.isFinite(data.economy.lastIncome)) {
            data.economy.lastIncome = 0;
        }

        if (!Number.isFinite(data.economy.lastExpenses)) {
            data.economy.lastExpenses = 0;
        }

        if (!Number.isFinite(data.economy.lastNet)) {
            data.economy.lastNet = 0;
        }

        return data;
    }

    function render(data) {
        const year = document.getElementById("gameYear");
        const month = document.getElementById("gameMonth");
        const season = document.getElementById("gameSeason");

        if (year) year.textContent = "År " + data.calendar.year;
        if (month) month.textContent = MONTH_NAMES[data.calendar.month - 1];
        if (season) season.textContent = getSeason(data.calendar.month);

        // Kalenderens indhold på sin egen side.
        const calendarYear = document.getElementById("calendarYear");
        const calendarMonth = document.getElementById("calendarMonth");
        const calendarSeason = document.getElementById("calendarSeason");

        if (calendarYear) {
            calendarYear.textContent = "År " + data.calendar.year;
        }
        if (calendarMonth) {
            calendarMonth.textContent = MONTH_NAMES[data.calendar.month - 1];
        }
        if (calendarSeason) {
            calendarSeason.textContent = getSeason(data.calendar.month);
        }
    }

    function loadGame() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);

            if (!raw) {
                currentData = null;
                setButtonEnabled(false);
                setStatus("Spildata blev ikke fundet. Data er ikke ændret.");
                return;
            }

            const data = JSON.parse(raw);

            if (!validate(data)) {
                currentData = null;
                setButtonEnabled(false);
                setStatus(
                    "Kalender eller økonomi kunne ikke valideres. " +
                    "Dine gemte data er ikke ændret."
                );
                return;
            }

            currentData = normalizeData(data);
            render(currentData);
            setButtonEnabled(true);
            setStatus("Spillets tid er klar.");
        } catch (error) {
            console.error("Kunne ikke indlæse spillets tid:", error);
            currentData = null;
            setButtonEnabled(false);
            setStatus("Spillet kunne ikke indlæses. Dine gemte data er ikke ændret.");
        }
    }

    function postTransaction(data, type, category, description, amount, year, month) {
        const economy = data.economy;

        if (!Number.isFinite(amount) || amount < 0) {
            throw new Error("En betaling havde et ugyldigt beløb.");
        }

        if (type === "income") {
            economy.balance += amount;
        } else {
            economy.balance -= amount;
        }

        economy.transactions.push({
            id: economy.nextTransactionId++,
            year: year,
            month: month,
            type: type,
            category: category,
            description: description,
            amount: amount,
            balanceAfter: economy.balance
        });
    }

    function alreadyPaid(rental, prefix, year, month) {
        return rental["last" + prefix + "PaidYear"] === year &&
            rental["last" + prefix + "PaidMonth"] === month;
    }

    function advanceMonth() {
        if (isAdvancing) return;

        if (!currentData) {
            loadGame();
            return;
        }

        isAdvancing = true;
        setButtonEnabled(false);
        setStatus("Måneden skifter …");

        let originalRaw;

        try {
            originalRaw = localStorage.getItem(STORAGE_KEY);

            if (originalRaw === null) {
                throw new Error("De gemte spildata blev ikke fundet.");
            }

            // Arbejd på en kopi, så en fejl ikke efterlader halvfærdige ændringer.
            const data = JSON.parse(originalRaw);

            if (!validate(data)) {
                throw new Error("Spillets gemte kalender eller økonomi er ugyldig.");
            }

            normalizeData(data);

            // Skift til den nye måned.
            data.calendar.month += 1;

            if (data.calendar.month > 12) {
                data.calendar.month = 1;
                data.calendar.year += 1;
            }

            const year = data.calendar.year;
            const month = data.calendar.month;
            const economy = data.economy;

            let monthlyIncome = 0;
            let monthlyExpenses = 0;

            // Månedsløn.
            postTransaction(
                data,
                "income",
                "Løn",
                "Månedsløn",
                MONTHLY_SALARY,
                year,
                month
            );
            monthlyIncome += MONTHLY_SALARY;

            // Leveomkostninger opkræves én gang.
            postTransaction(
                data,
                "expense",
                "Leveomkostninger",
                "Månedens leveomkostninger",
                MONTHLY_LIVING_COSTS,
                year,
                month
            );
            monthlyExpenses += MONTHLY_LIVING_COSTS;

            // Leje og opstaldning opkræves kun for aktive lejeheste.
            data.horses.forEach(function (horse) {
                const rental = horse && horse.rental;

                if (!rental || rental.active !== true) return;

                const rentPaid = alreadyPaid(rental, "Rent", year, month);
                const boardingPaid = alreadyPaid(rental, "Boarding", year, month);

                if (!rentPaid) {
                    const rent = Number.isFinite(rental.monthlyRent)
                        ? rental.monthlyRent
                        : MONTHLY_RENT;

                    postTransaction(
                        data,
                        "expense",
                        "Leje af hest",
                        "Månedlig leje af " + (horse.name || horse.id || "hest"),
                        rent,
                        year,
                        month
                    );

                    monthlyExpenses += rent;
                    rental.lastRentPaidYear = year;
                    rental.lastRentPaidMonth = month;
                }

                if (!boardingPaid) {
                    const farm = BOARDING_STABLES[rental.boardingId];
                    const boarding = Number.isFinite(rental.monthlyBoarding)
                        ? rental.monthlyBoarding
                        : (farm ? farm.price : null);

                    if (boarding === null) {
                        throw new Error(
                            "Opstaldningsprisen for " +
                            (horse.name || horse.id || "en lejehest") +
                            " kunne ikke findes. Måneden blev ikke gemt."
                        );
                    }

                    postTransaction(
                        data,
                        "expense",
                        "Opstaldning",
                        "Månedlig opstaldning af " +
                            (horse.name || horse.id || "hest") +
                            (rental.boardingName ? " hos " + rental.boardingName : ""),
                        boarding,
                        year,
                        month
                    );

                    monthlyExpenses += boarding;
                    rental.lastBoardingPaidYear = year;
                    rental.lastBoardingPaidMonth = month;
                }
            });

            economy.lastIncome = monthlyIncome;
            economy.lastExpenses = monthlyExpenses;
            economy.lastNet = monthlyIncome - monthlyExpenses;

            const newRaw = JSON.stringify(data);

            // Én samlet gemning af kalender, saldo, transaktioner og betalingsmarkeringer.
            localStorage.setItem(STORAGE_KEY, newRaw);

            const verificationRaw = localStorage.getItem(STORAGE_KEY);
            const verification = verificationRaw ? JSON.parse(verificationRaw) : null;

            if (!validate(verification) ||
                verification.calendar.year !== year ||
                verification.calendar.month !== month) {
                throw new Error("Kontrollen af den gemte måned mislykkedes.");
            }

            currentData = verification;
            render(currentData);
            setStatus("Nu er det " + MONTH_NAMES[month - 1] + " år " + year + ".");
            isAdvancing = false;
            setButtonEnabled(true);

            // Genindlæs, så sider med økonomi og kalender opdateres fra samme gemte data.
            window.location.reload();

        } catch (error) {
            console.error("Månedsskiftet mislykkedes:", error);

            // Gendan den oprindelige gemte tilstand, hvis noget gik galt efter gemningen.
            try {
                if (originalRaw !== undefined && originalRaw !== null) {
                    localStorage.setItem(STORAGE_KEY, originalRaw);
                }
            } catch (restoreError) {
                console.error("Gendannelse af spildata mislykkedes:", restoreError);
            }

            isAdvancing = false;
            loadGame();
            setStatus(
                "Månedsskiftet blev afbrudt. Dine tidligere gemte data " +
                "blev bevaret, hvis browseren tillod gendannelse."
            );

            window.alert(
                "Måneden kunne ikke skiftes.\n\n" +
                error.message +
                "\n\nPrøv ikke igen, før du har kontrolleret saldo og transaktioner."
            );
        }
    }

    function bindButton() {
        const button = document.getElementById("nextMonthButton");

        if (!button) return;

        // Fjern kun vores egen tidligere lytter ved at erstatte den med en ny knap.
        // navigation.js opretter en helt ny knap, når menuen genskabes.
        if (boundButton === button) return;

        boundButton = button;
        button.addEventListener("click", advanceMonth);
        button.disabled = !currentData || isAdvancing;
    }

    document.addEventListener("game-navigation-ready", function () {
        bindButton();
        if (currentData) render(currentData);
    });

    // Understøtter både sider med en eksisterende menu og sider,
    // hvor navigation.js indsætter menuen efterfølgende.
    bindButton();
    loadGame();

    // Hvis menuen blev indsat efter denne fil blev indlæst, bind igen.
    document.addEventListener("DOMContentLoaded", function () {
        bindButton();
        if (!currentData) loadGame();
    });
})();
