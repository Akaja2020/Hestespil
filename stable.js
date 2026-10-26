
/*
 * stable.js
 * Udlejningsstalden i Horsedreams Online.
 * Bevarer hestens ID og eksisterende data ved udlejning.
 */

"use strict";

const STABLE_STORAGE_KEY = "hestespil_stable_horses_v1";
const GAME_STORAGE_KEY = "hestespil_horses_v1";
const BOARDING_STORAGE_KEY = "hestespil_boarding_v1";

const MONTHLY_RENT = 2000;

const DEFAULT_STABLE_HORSES = [
    { id: "S-000001", name: "Stjerneskud", breed: "Araber", gender: "Hoppe", color: "Skimmel", height: "153 cm", temperament: "Vågen og energisk", image: "stjerneskud.PNG" },
    { id: "S-000002", name: "Safir", breed: "Araber", gender: "Hingst", color: "Brun", height: "156 cm", temperament: "Stolt og følsom", image: "safir.PNG" },
    { id: "S-000003", name: "Dusty", breed: "Quarter", gender: "Hingst", color: "Rødskimmel", height: "151 cm", temperament: "Rolig og samarbejdsvillig", image: "dusty.PNG" },
    { id: "S-000004", name: "Clover", breed: "Quarter", gender: "Hoppe", color: "Palomino", height: "150 cm", temperament: "Venlig og lærenem", image: "clover.PNG" },
    { id: "S-000005", name: "Måneskin", breed: "Welsh Cob", gender: "Hoppe", color: "Rød", height: "145 cm", temperament: "Livlig og nysgerrig", image: "maaneskin.PNG" },
    { id: "S-000006", name: "Midnat", breed: "Frieser", gender: "Hingst", color: "Sort", height: "164 cm", temperament: "Rolig og modig", image: "midnat.PNG" }
];

const BOARDING_FARMS = {
    enggaarden: { name: "Enggården", price: 1500 },
    skovly: { name: "Skovly", price: 2500 },
    hojgaard: { name: "Højgård Ridecenter", price: 3000 },
    hoejgaard: { name: "Højgård Ridecenter", price: 3000 }
};

function readJSON(key) {
    const raw = localStorage.getItem(key);
    return raw === null ? null : JSON.parse(raw);
}

function getStableHorses() {
    try {
        const raw = localStorage.getItem(STABLE_STORAGE_KEY);

        // Standardhestene oprettes kun første gang.
        if (raw === null) {
            return DEFAULT_STABLE_HORSES.map(horse => ({ ...horse }));
        }

        const saved = JSON.parse(raw);

        if (!Array.isArray(saved)) {
            throw new Error("Udlejningsstaldens data er ugyldige.");
        }

        // En tom liste er gyldig: alle hestene kan være udlejet.
        return saved.map(horse => {
            const defaults = DEFAULT_STABLE_HORSES.find(
                item => item.id === horse.id
            ) || {};

            return { ...defaults, ...horse };
        });
    } catch (error) {
        console.error("Kunne ikke indlæse udlejningsstalden:", error);
        return [];
    }
}

function textEl(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    element.textContent = text;
    return element;
}

function money(amount) {
    return Number(amount).toLocaleString("da-DK") + " kr.";
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

function validateGameData(data) {
    return Boolean(
        data &&
        Array.isArray(data.horses) &&
        data.calendar &&
        Number.isInteger(data.calendar.year) &&
        Number.isInteger(data.calendar.month) &&
        data.calendar.year >= 1 &&
        data.calendar.month >= 1 &&
        data.calendar.month <= 12 &&
        data.economy &&
        typeof data.economy.balance === "number" &&
        Number.isFinite(data.economy.balance) &&
        Array.isArray(data.economy.transactions) &&
        Number.isInteger(data.economy.nextTransactionId) &&
        data.economy.nextTransactionId > 0
    );
}

function hasActiveRental(data) {
    return data.horses.some(horse =>
        horse.rental && horse.rental.active === true
    );
}

function leaseHorse(horseId) {
    let oldGameRaw;
    let oldStableRaw;
    let oldBoardingRaw;

    try {
        oldGameRaw = localStorage.getItem(GAME_STORAGE_KEY);
        oldStableRaw = localStorage.getItem(STABLE_STORAGE_KEY);
        oldBoardingRaw = localStorage.getItem(BOARDING_STORAGE_KEY);

        if (oldGameRaw === null) {
            throw new Error(
                "Spildata blev ikke fundet. Gå til forsiden først."
            );
        }

        const game = JSON.parse(oldGameRaw);

        if (!validateGameData(game)) {
            throw new Error(
                "Spillets økonomi eller kalender kunne ikke valideres."
            );
        }

        const stableHorses = getStableHorses();
        const horseIndex = stableHorses.findIndex(
            horse => horse.id === horseId
        );

        if (horseIndex === -1) {
            throw new Error(
                "Hesten findes ikke længere i udlejningsstalden. Opdatér siden."
            );
        }

        if (hasActiveRental(game)) {
            throw new Error(
                "Du har allerede en lejehest. Du kan kun leje én hest ad gangen."
            );
        }

        const farm = getSelectedFarm();

        if (!farm) {
            throw new Error(
                "Vælg først en opstaldningsgård på opstaldningssiden."
            );
        }

        const totalCost = MONTHLY_RENT + farm.price;

        if (game.economy.balance < totalCost) {
            throw new Error(
                "Du har ikke råd til første måneds leje og opstaldning. " +
                "Du skal bruge " + money(totalCost) + "."
            );
        }

        const horse = stableHorses[horseIndex];

        if (game.horses.some(existing => existing.id === horse.id)) {
            throw new Error(
                "Hesten findes allerede i din hesteoversigt. " +
                "Ingen betaling er gennemført."
            );
        }

        const year = game.calendar.year;
        const month = game.calendar.month;

        // Bevar samtlige eksisterende felter på hesten.
        // Tilføj kun oplysninger, som lejesystemet har brug for.
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
                boardingId: farm.id,
                boardingName: farm.name,
                monthlyBoarding: farm.price,
                lastBoardingPaidYear: year,
                lastBoardingPaidMonth: month
            }
        };

        // Fjern kun den valgte hest fra udlejningsstalden.
        stableHorses.splice(horseIndex, 1);

        const economy = game.economy;

        function postExpense(category, description, amount) {
            economy.balance -= amount;

            economy.transactions.push({
                id: economy.nextTransactionId++,
                year,
                month,
                type: "expense",
                category,
                description,
                amount,
                balanceAfter: economy.balance
            });
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
            (Number(economy.lastIncome) || 0) - economy.lastExpenses;

        // Gem begge ændringer. Hvis en af dem fejler,
        // forsøger vi at gendanne de oprindelige data.
        game.horses.push(leasedHorse);

        localStorage.setItem(GAME_STORAGE_KEY, JSON.stringify(game));
        localStorage.setItem(
            STABLE_STORAGE_KEY,
            JSON.stringify(stableHorses)
        );

        // Kontroller, at hesten er flyttet og saldoen gemt.
        const savedGame = readJSON(GAME_STORAGE_KEY);
        const savedStable = readJSON(STABLE_STORAGE_KEY);

        const horseSaved = savedGame.horses.some(
            item => item.id === horse.id &&
                item.rental &&
                item.rental.active === true
        );

        const horseRemoved = Array.isArray(savedStable) &&
            !savedStable.some(item => item.id === horse.id);

        if (!horseSaved || !horseRemoved) {
            throw new Error("Kontrollen af den gemte leje mislykkedes.");
        }

        alert(
            horse.name + " er nu lejet!\n\n" +
            "Første måneds leje: " + money(MONTHLY_RENT) + "\n" +
            "Opstaldning hos " + farm.name + ": " + money(farm.price) + "\n" +
            "Samlet betaling: " + money(totalCost) + "\n" +
            "Resterende saldo: " + money(savedGame.economy.balance)
        );

        window.location.reload();

    } catch (error) {
        console.error("Lejehandlingen mislykkedes:", error);

        // Gendan tidligere data, hvis de var gemt før forsøget.
        try {
            if (oldGameRaw !== undefined && oldGameRaw !== null) {
                localStorage.setItem(GAME_STORAGE_KEY, oldGameRaw);
            }

            if (oldStableRaw !== undefined && oldStableRaw !== null) {
                localStorage.setItem(STABLE_STORAGE_KEY, oldStableRaw);
            }

            if (oldBoardingRaw !== undefined && oldBoardingRaw !== null) {
                localStorage.setItem(BOARDING_STORAGE_KEY, oldBoardingRaw);
            }
        } catch (restoreError) {
            console.error("Gendannelse af data mislykkedes:", restoreError);
        }

        alert(
            "Hesten kunne ikke lejes.\n\n" +
            error.message +
            "\n\nKontrollér spillet, før du prøver igen."
        );
    }
}

function renderStableHorses() {
    const container = document.getElementById("stableHorseCards");
    const empty = document.getElementById("stableEmptyMessage");
    const count = document.getElementById("stableHorseCount");

    if (!container || !empty) return;

    const horses = getStableHorses();

    container.replaceChildren();
    empty.hidden = horses.length > 0;

    if (count) {
        count.textContent =
            horses.length + (horses.length === 1 ? " hest" : " heste");
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
            textEl("p", "horse-id", "ID: " + (horse.id || "Ukendt")),
            textEl("h3", "", horse.name || "Hest"),
            textEl(
                "p",
                "horse-info",
                [horse.breed, horse.gender || horse.sex, horse.color]
                    .filter(Boolean)
                    .join(" · ")
            ),
            textEl("p", "", "Højde: " + (horse.height || "Ikke angivet")),
            textEl(
                "p",
                "",
                "Temperament: " + (horse.temperament || "Ikke angivet")
            ),
            textEl("p", "", "Leje: " + money(MONTHLY_RENT) + " pr. måned"),
            textEl(
                "p",
                "",
                "Opstaldning: " +
                (getSelectedFarm()
                    ? money(getSelectedFarm().price) + " pr. måned"
                    : "Vælg opstaldningsgård først")
            )
        );

        const button = document.createElement("button");
        button.type = "button";
        button.textContent = "Lej denne hest";

        button.addEventListener("click", () => {
            const farm = getSelectedFarm();

            if (!farm) {
                alert(
                    "Du skal vælge en opstaldningsgård, før du kan leje en hest."
                );
                return;
            }

            const total = MONTHLY_RENT + farm.price;

            const confirmed = window.confirm(
                "Vil du leje " + horse.name + "?\n\n" +
                "Første måneds leje: " + money(MONTHLY_RENT) + "\n" +
                "Første måneds opstaldning hos " + farm.name + ": " +
                money(farm.price) + "\n" +
                "Samlet betaling nu: " + money(total) + "\n\n" +
                "Betalingen trækkes straks, hvis du bekræfter."
            );

            if (confirmed) {
                leaseHorse(horse.id);
            }
        });

        content.appendChild(button);
        card.append(img, content);
        container.appendChild(card);
    });
}

renderStableHorses();
