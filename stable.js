/*
 * stable.js
 * Udlejningsstalden i Horsedreams Online.
 *
 * Arbejdsgang:
 * 1. Vælg en hest.
 * 2. Vælg opstaldningsgård på boarding.html.
 * 3. Bekræft samlet betaling.
 * 4. Første måneds leje og opstaldning trækkes én gang.
 *
 * Bevarer eksisterende localStorage-nøgler og hestedata.
 */
"use strict";
const STABLE_STORAGE_KEY = "hestespil_stable_horses_v1";
const GAME_STORAGE_KEY = "hestespil_horses_v1";
const BOARDING_STORAGE_KEY = "hestespil_boarding_v1";
const PENDING_LEASE_KEY = "hestespil_pending_lease_horse_v1";
const MONTHLY_RENT = 2000;
const DEFAULT_STABLE_HORSES = [
    {
        id: "S-000001",
        name: "Stjerneskud",
        breed: "Araber",
        gender: "Hoppe",
        color: "Skimmel",
        height: 153,
        temperament: "Vågen og energisk",
        image: "stjerneskud.PNG"
    },
    {
        id: "S-000002",
        name: "Safir",
        breed: "Araber",
        gender: "Hingst",
        color: "Brun",
        height: 156,
        temperament: "Stolt og følsom",
        image: "safir.PNG"
    },
    {
        id: "S-000003",
        name: "Dusty",
        breed: "Quarter",
        gender: "Hingst",
        color: "Rødskimmel",
        height: 151,
        temperament: "Rolig og samarbejdsvillig",
        image: "dusty.PNG"
    },
    {
        id: "S-000004",
        name: "Clover",
        breed: "Quarter",
        gender: "Hoppe",
        color: "Palomino",
        height: 150,
        temperament: "Venlig og lærenem",
        image: "clover.PNG"
    },
    {
        id: "S-000005",
        name: "Måneskin",
        breed: "Welsh Cob",
        gender: "Hoppe",
        color: "Rød",
        height: 145,
        temperament: "Livlig og nysgerrig",
        image: "maaneskin.PNG"
    },
    {
        id: "S-000006",
        name: "Midnat",
        breed: "Frieser",
        gender: "Hingst",
        color: "Sort",
        height: 164,
        temperament: "Rolig og modig",
        image: "midnat.PNG"
    }
];
const BOARDING_FARMS = {
    enggaarden: {
        name: "Enggården",
        price: 1500
    },
    skovly: {
        name: "Skovly",
        price: 2500
    },
    hojgaard: {
        name: "Højgård Ridecenter",
        price: 3000
    },
    hoejgaard: {
        name: "Højgård Ridecenter",
        price: 3000
    }
};
/* ---------- Hjælpefunktioner ---------- */
function readJSON(key) {
    try {
        const raw = localStorage.getItem(key);
        return raw === null ? null : JSON.parse(raw);
    } catch (error) {
        console.error(
            "Kunne ikke læse gemte data:",
            key,
            error
        );
        return null;
    }
}
function money(amount) {
    const value = Number(amount);
    if (!Number.isFinite(value)) {
        return "ukendt beløb";
    }
    return value.toLocaleString("da-DK") + " kr.";
}
function textEl(tag, className, text) {
    const element = document.createElement(tag);
    if (className) {
        element.className = className;
    }
    element.textContent = text == null ? "" : String(text);
    return element;
}
function isValidHorse(horse) {
    return Boolean(
        horse &&
        typeof horse === "object" &&
        !Array.isArray(horse) &&
        typeof horse.id === "string" &&
        horse.id.trim() &&
        typeof horse.name === "string" &&
        horse.name.trim()
    );
}
/*
 * Hent gårdens heste.
 *
 * Vigtigt:
 * - Eksisterende gyldige stalddata bevares.
 * - Ugyldige stalddata overskrives ikke automatisk.
 * - Hvis staldlisten mangler, udelades heste, som allerede
 *   findes i spillerens hesteoversigt.
 * - Standardhestene gemmes ikke automatisk, blot fordi
 *   staldlisten mangler.
 *
 * Det sidste punkt hjælper med at undgå, at en lejet hest
 * kommer tilbage, hvis staldlisten er blevet slettet.
 */
function getStableHorses() {
    try {
        const raw = localStorage.getItem(STABLE_STORAGE_KEY);
        if (raw !== null) {
            const saved = JSON.parse(raw);
            if (!Array.isArray(saved)) {
                throw new Error(
                    "Udlejningsstaldens data er ugyldige."
                );
            }
            const validHorses = saved.filter(isValidHorse);
            if (validHorses.length !== saved.length) {
                console.warn(
                    "Nogle ugyldige hesteoplysninger blev udeladt. " +
                    "De gemte data er ikke automatisk overskrevet."
                );
            }
            return validHorses.map(horse => {
                const defaults = DEFAULT_STABLE_HORSES.find(
                    item => item.id === horse.id
                ) || {};
                return {
                    ...defaults,
                    ...horse
                };
            });
        }
        /*
         * Staldlisten mangler.
         * Undersøg spillerens data, før standardhestene vises.
         */
        const gameRaw = localStorage.getItem(GAME_STORAGE_KEY);
        if (gameRaw !== null) {
            let game;
            try {
                game = JSON.parse(gameRaw);
            } catch (error) {
                console.error(
                    "Spildata kunne ikke læses. " +
                    "Standardheste indsættes ikke automatisk.",
                    error
                );
                return null;
            }
            if (
                !game ||
                typeof game !== "object" ||
                !Array.isArray(game.horses)
            ) {
                console.error(
                    "Spildata har en ugyldig struktur. " +
                    "Standardheste indsættes ikke automatisk."
                );
                return null;
            }
            const playerHorseIds = new Set(
                game.horses
                    .filter(horse =>
                        horse &&
                        typeof horse.id === "string"
                    )
                    .map(horse => horse.id)
            );
            return DEFAULT_STABLE_HORSES
                .filter(horse => !playerHorseIds.has(horse.id))
                .map(horse => ({ ...horse }));
        }
        /*
         * Hvis både stalddata og spildata mangler, opretter
         * denne side ikke selv et nyt spil.
         * Spilleren skal først besøge forsiden.
         */
        console.warn(
            "Spildata og stalddata mangler. " +
            "Gå til forsiden for at starte eller indlæse spillet."
        );
        return null;
    } catch (error) {
        console.error(
            "Kunne ikke indlæse udlejningsstalden:",
            error
        );
        return null;
    }
}
function validateGameData(data) {
    return Boolean(
        data &&
        typeof data === "object" &&
        !Array.isArray(data) &&
        Array.isArray(data.horses) &&
        data.calendar &&
        Number.isInteger(data.calendar.year) &&
        Number.isInteger(data.calendar.month) &&
        data.calendar.year >= 1 &&
        data.calendar.month >= 1 &&
        data.calendar.month <= 12 &&
        data.economy &&
        Number.isFinite(data.economy.balance) &&
        Array.isArray(data.economy.transactions) &&
        Number.isInteger(data.economy.nextTransactionId) &&
        data.economy.nextTransactionId > 0
    );
}
function hasActiveRental(data) {
    return data.horses.some(horse =>
        horse &&
        horse.rental &&
        horse.rental.active === true
    );
}
function getSelectedFarm() {
    const choice = readJSON(BOARDING_STORAGE_KEY);
    if (!choice || !BOARDING_FARMS[choice.id]) {
        return null;
    }
    return {
        id: choice.id,
        ...BOARDING_FARMS[choice.id]
    };
}
/* ---------- Vælg hest ---------- */
/*
 * Opretter kun en midlertidig lejeproces.
 * Der trækkes ikke penge, og hesten flyttes ikke her.
 */
function startLeaseSelection(horseId) {
    try {
        const game = readJSON(GAME_STORAGE_KEY);
        if (!validateGameData(game)) {
            alert(
                "Spildata blev ikke fundet eller kunne ikke valideres. " +
                "Gå til forsiden først."
            );
            return;
        }
        if (hasActiveRental(game)) {
            alert(
                "Du har allerede en lejehest. " +
                "Du kan kun leje én hest ad gangen."
            );
            return;
        }
        const stableHorses = getStableHorses();
        if (!Array.isArray(stableHorses)) {
            alert(
                "Udlejningsstalden kunne ikke læses. " +
                "Ingen ændringer er foretaget."
            );
            return;
        }
        const horse = stableHorses.find(
            item => item.id === horseId
        );
        if (!horse) {
            alert(
                "Hesten findes ikke længere i udlejningsstalden. " +
                "Opdatér siden, eller gå tilbage til forsiden."
            );
            return;
        }
        if (game.horses.some(item =>
            item && item.id === horse.id
        )) {
            alert(
                "Hesten findes allerede i din hesteoversigt. " +
                "Ingen betaling er gennemført."
            );
            return;
        }
        localStorage.setItem(
            PENDING_LEASE_KEY,
            JSON.stringify({
                horseId: horse.id,
                startedAt: new Date().toISOString()
            })
        );
        window.location.href = "boarding.html?lease=1";
    } catch (error) {
        console.error(
            "Kunne ikke starte lejeprocessen:",
            error
        );
        alert(
            "Lejeprocessen kunne ikke startes. " +
            "Ingen betaling er gennemført. " +
            "Kontrollér, at browseren tillader lokal lagring."
        );
    }
}
/* ---------- Gennemfør leje ---------- */
/*
 * Kaldes fra boarding.js, når spilleren har valgt gård
 * og bekræftet betalingen.
 *
 * Første måneds leje og opstaldning trækkes kun her.
 */
function leaseHorse(horseId, farmId) {
    let oldStableRaw = null;
    let stableWasChanged = false;
    let gameWasCommitted = false;
    try {
        const pending = readJSON(PENDING_LEASE_KEY);
        if (!pending || pending.horseId !== horseId) {
            throw new Error(
                "Den valgte hest stemmer ikke med den igangværende leje. " +
                "Gå tilbage og vælg hesten igen."
            );
        }
        const oldGameRaw = localStorage.getItem(GAME_STORAGE_KEY);
        if (oldGameRaw === null) {
            throw new Error(
                "Spildata blev ikke fundet. Gå til forsiden først."
            );
        }
        let game;
        try {
            game = JSON.parse(oldGameRaw);
        } catch (error) {
            throw new Error(
                "Spildata kunne ikke læses. Ingen betaling er gennemført."
            );
        }
        if (!validateGameData(game)) {
            throw new Error(
                "Spillets økonomi eller kalender kunne ikke valideres."
            );
        }
        if (hasActiveRental(game)) {
            throw new Error(
                "Du har allerede en lejehest. " +
                "Du kan kun leje én hest ad gangen."
            );
        }
        const farm = BOARDING_FARMS[farmId];
        if (!farm) {
            throw new Error(
                "Vælg en gyldig opstaldningsgård."
            );
        }
        const stableHorses = getStableHorses();
        if (!Array.isArray(stableHorses)) {
            throw new Error(
                "Udlejningsstalden kunne ikke læses. " +
                "Ingen betaling er gennemført."
            );
        }
        const matchingHorses = stableHorses.filter(
            item => item && item.id === horseId
        );
        if (matchingHorses.length !== 1) {
            throw new Error(
                "Hesten findes ikke entydigt i udlejningsstalden. " +
                "Ingen betaling er gennemført."
            );
        }
        const horseIndex = stableHorses.findIndex(
            item => item && item.id === horseId
        );
        const horse = stableHorses[horseIndex];
        if (!isValidHorse(horse)) {
            throw new Error(
                "Hestens gemte oplysninger er ugyldige."
            );
        }
        if (game.horses.some(item =>
            item && item.id === horse.id
        )) {
            throw new Error(
                "Hesten findes allerede i din hesteoversigt."
            );
        }
        const totalCost = MONTHLY_RENT + farm.price;
        if (game.economy.balance < totalCost) {
            throw new Error(
                "Du har ikke råd til første måneds leje og opstaldning. " +
                "Du skal bruge " + money(totalCost) +
                ". Din saldo er " + money(game.economy.balance) + "."
            );
        }
        const year = game.calendar.year;
        const month = game.calendar.month;
        /*
         * Bevar hestens eksisterende oplysninger.
         * Tilføj oplysninger om leje og opstaldning.
         */
        const leasedHorse = {
            ...horse,
            sex: horse.sex || horse.gender || "",
            gender: horse.gender || horse.sex || "",
            rental: {
                active: true,
                monthlyRent: MONTHLY_RENT,
                startYear: year,
                startMonth: month,
                lastRentPaidYear: year,
                lastRentPaidMonth: month,
                boardingId: farmId,
                boardingName: farm.name,
                monthlyBoarding: farm.price,
                lastBoardingPaidYear: year,
                lastBoardingPaidMonth: month
            }
        };
        /*
         * Arbejd på en kopi, så den eksisterende økonomi
         * ikke ændres, før den nye spiltilstand er klar.
         */
        const newGame = JSON.parse(JSON.stringify(game));
        const economy = newGame.economy;
        function postExpense(category, description, amount) {
            economy.balance -= amount;
            economy.transactions.push({
                id: economy.nextTransactionId,
                year,
                month,
                type: "expense",
                category,
                description,
                amount,
                balanceAfter: economy.balance
            });
            economy.nextTransactionId += 1;
        }
        postExpense(
            "Leje af hest",
            "Første måneds leje af " + horse.name,
            MONTHLY_RENT
        );
        postExpense(
            "Opstaldning",
            "Første måneds opstaldning hos " + farm.name,
            farm.price
        );
        economy.lastExpenses =
            (Number(economy.lastExpenses) || 0) + totalCost;
        economy.lastNet =
            (Number(economy.lastIncome) || 0) -
            economy.lastExpenses;
        newGame.horses.push(leasedHorse);
        /*
         * Fjern hesten fra den nye staldliste.
         * Den gemte liste ændres først nedenfor.
         */
        const newStable = stableHorses.filter(
            item => item && item.id !== horseId
        );
        if (newStable.length !== stableHorses.length - 1) {
            throw new Error(
                "Hesten kunne ikke fjernes entydigt fra udlejningsstalden."
            );
        }
        /*
         * Gem den gamle staldliste, så vi kan forsøge at
         * gendanne den, hvis spillet ikke kan gemmes.
         */
        oldStableRaw = localStorage.getItem(STABLE_STORAGE_KEY);
        /*
         * Gem først den nye staldliste.
         */
        localStorage.setItem(
            STABLE_STORAGE_KEY,
            JSON.stringify(newStable)
        );
        stableWasChanged = true;
        /*
         * Gem derefter spillet med hesten og begge udgifter.
         */
        localStorage.setItem(
            GAME_STORAGE_KEY,
            JSON.stringify(newGame)
        );
        gameWasCommitted = true;
        /*
         * Når spillet er gemt, må økonomien ikke rulles tilbage.
         * Kontrollér de gemte data efterfølgende.
         */
        const savedGame = readJSON(GAME_STORAGE_KEY);
        const savedStable = readJSON(STABLE_STORAGE_KEY);
        const savedHorse = Boolean(
            savedGame &&
            Array.isArray(savedGame.horses) &&
            savedGame.horses.some(item =>
                item &&
                item.id === horseId &&
                item.rental &&
                item.rental.active === true
            )
        );
        const removedFromStable = Boolean(
            Array.isArray(savedStable) &&
            !savedStable.some(item =>
                item && item.id === horseId
            )
        );
        /*
         * Fjern kun den midlertidige markering, hvis hesten
         * faktisk er gemt i spillerens hesteoversigt.
         */
        if (savedHorse) {
            try {
                localStorage.removeItem(PENDING_LEASE_KEY);
            } catch (pendingError) {
                console.error(
                    "Den midlertidige lejemarkering kunne ikke fjernes:",
                    pendingError
                );
            }
        }
        const remainingBalance =
            savedGame &&
            savedGame.economy &&
            Number.isFinite(savedGame.economy.balance)
                ? savedGame.economy.balance
                : newGame.economy.balance;
        let message =
            horse.name + " er nu lejet!\n\n" +
            "Første måneds leje: " +
            money(MONTHLY_RENT) + "\n" +
            "Opstaldning hos " + farm.name + ": " +
            money(farm.price) + "\n" +
            "Samlet betaling: " + money(totalCost) + "\n" +
            "Resterende saldo: " + money(remainingBalance);
        if (!savedHorse || !removedFromStable) {
            message +=
                "\n\nBemærk: Kontrollen af de gemte hestelister " +
                "gav ikke det forventede resultat. Betalingen er " +
                "gemt og bliver ikke trukket igen automatisk. " +
                "Kontrollér hesteoversigten og udlejningsstalden, " +
                "før du foretager dig mere.";
        }
        alert(message);
        window.location.href = "stable.html";
    } catch (error) {
        console.error(
            "Lejehandlingen mislykkedes:",
            error
        );
        /*
         * Hvis spillet allerede er gemt, må vi ikke gendanne
         * gamle data og risikere en dobbeltbetaling.
         */
        if (!gameWasCommitted && stableWasChanged) {
            try {
                if (oldStableRaw === null) {
                    localStorage.removeItem(STABLE_STORAGE_KEY);
                } else {
                    localStorage.setItem(
                        STABLE_STORAGE_KEY,
                        oldStableRaw
                    );
                }
            } catch (restoreError) {
                console.error(
                    "Staldlisten kunne ikke gendannes:",
                    restoreError
                );
            }
        }
        alert(
            "Hesten kunne ikke lejes.\n\n" +
            (
                error && error.message
                    ? error.message
                    : "Der opstod en ukendt fejl."
            ) +
            "\n\nKontrollér saldo, stalden og hesteoversigten, " +
            "før du prøver igen."
        );
    }
}
/* ---------- Vis hestene i udlejningsstalden ---------- */
function renderStableHorses() {
    const container = document.getElementById("stableHorseCards");
    const empty = document.getElementById("stableEmptyMessage");
    const count = document.getElementById("stableHorseCount");
    /*
     * På boarding.html findes disse elementer normalt ikke.
     */
    if (!container || !empty) {
        return;
    }
    const horses = getStableHorses();
    container.replaceChildren();
    if (!Array.isArray(horses)) {
        empty.hidden = false;
        empty.textContent =
            "Udlejningsstalden kunne ikke indlæses. " +
            "Dine gemte data er ikke blevet nulstillet.";
        if (count) {
            count.textContent = "Kunne ikke indlæse heste";
        }
        return;
    }
    empty.hidden = horses.length > 0;
    if (count) {
        count.textContent =
            horses.length +
            (horses.length === 1 ? " hest" : " heste");
    }
    horses.forEach(horse => {
        const card = document.createElement("article");
        card.className = "horse-overview-card";
        const img = document.createElement("img");
        img.className = "stable-horse-image";
        img.src = horse.image || "Horse-illustration.JPEG";
        img.alt = "Billede af " + (horse.name || "hesten");
        img.loading = "lazy";
        img.onerror = () => {
            img.onerror = null;
            img.src = "Horse-illustration.JPEG";
        };
        const content = document.createElement("div");
        content.className = "horse-card-content";
        content.append(
            textEl(
                "p",
                "horse-id",
                "ID: " + (horse.id || "Ukendt")
            ),
            textEl(
                "h3",
                "",
                horse.name || "Hest"
            ),
            textEl(
                "p",
                "horse-info",
                [
                    horse.breed,
                    horse.gender || horse.sex,
                    horse.color
                ]
                    .filter(Boolean)
                    .join(" · ")
            ),
            textEl(
                "p",
                "",
                "Højde: " +
                (
                    horse.height == null
                        ? "Ikke angivet"
                        : (
                            typeof horse.height === "number"
                                ? horse.height + " cm"
                                : horse.height
                        )
                )
            ),
            textEl(
                "p",
                "",
                "Temperament: " +
                (horse.temperament || "Ikke angivet")
            ),
            textEl(
                "p",
                "",
                "Leje: " + money(MONTHLY_RENT) + " pr. måned"
            ),
            textEl(
                "p",
                "",
                "Vælg hesten først; derefter vælger du opstaldningsgård."
            )
        );
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = "Vælg hest og fortsæt";
        button.addEventListener("click", () => {
            startLeaseSelection(horse.id);
        });
        content.appendChild(button);
        card.append(img, content);
        container.appendChild(card);
    });
}
/* ---------- Tilgængelighed for boarding.js ---------- */
window.leaseHorse = leaseHorse;
window.startLeaseSelection = startLeaseSelection;
window.getSelectedBoardingFarm = getSelectedFarm;
/* ---------- Start ---------- */
renderStableHorses();