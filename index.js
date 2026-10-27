const STORAGE_KEY = "hestespil_horses_v1";
const STABLE_STORAGE_KEY = "hestespil_stable_horses_v1";
const STARTING_BALANCE = 30000;
const MONTHLY_SALARY = 20000;
const MONTHLY_LIVING_COSTS = 7500;
let horses = [];
let nextHorseId = 1;
let player = { id: null, name: "" };
let nextPlayerId = 1;
let gameCalendar = { year: 1, month: 1 };
let stableHorses = [];
let economy = {
    balance: STARTING_BALANCE,
    lastIncome: 0,
    lastExpenses: 0,
    lastNet: 0,
    transactions: [],
    nextTransactionId: 1
};
const MONTH_NAMES = [
    "Januar", "Februar", "Marts", "April", "Maj", "Juni",
    "Juli", "August", "September", "Oktober", "November", "December"
];
const STABLE_HORSE_BLUEPRINTS = [
    {
        id: "S-000001",
        name: "Stjerneskud",
        breed: "Araber",
        sex: "Hoppe",
        color: "Skimmel",
        height: 153,
        temperament: "Vågen og energisk"
    },
    {
        id: "S-000002",
        name: "Safir",
        breed: "Araber",
        sex: "Hingst",
        color: "Brun",
        height: 156,
        temperament: "Stolt og følsom"
    },
    {
        id: "S-000003",
        name: "Dusty",
        breed: "Quarter",
        sex: "Hingst",
        color: "Rødskimmel",
        height: 151,
        temperament: "Rolig og samarbejdsvillig"
    },
    {
        id: "S-000004",
        name: "Clover",
        breed: "Quarter",
        sex: "Hoppe",
        color: "Palomino",
        height: 150,
        temperament: "Venlig og lærenem"
    },
    {
        id: "S-000005",
        name: "Måneskin",
        breed: "Welsh Cob",
        sex: "Hoppe",
        color: "Rød",
        height: 145,
        temperament: "Livlig og nysgerrig"
    },
    {
        id: "S-000006",
        name: "Midnat",
        breed: "Frieser",
        sex: "Hingst",
        color: "Sort",
        height: 164,
        temperament: "Rolig og modig"
    }
];
function getSeason(month) {
    if (month === 12 || month <= 2) return "Vinter";
    if (month >= 3 && month <= 5) return "Forår";
    if (month >= 6 && month <= 8) return "Sommer";
    return "Efterår";
}
function calculateAge(horse) {
    const birthYear = Number.isInteger(horse.birthYear)
        ? horse.birthYear
        : gameCalendar.year;
    const birthMonth = Number.isInteger(horse.birthMonth)
        ? horse.birthMonth
        : gameCalendar.month;
    const totalMonths = Math.max(
        0,
        (gameCalendar.year - birthYear) * 12 +
        (gameCalendar.month - birthMonth)
    );
    return {
        years: Math.floor(totalMonths / 12),
        months: totalMonths % 12
    };
}
function formatAge(horse) {
    const age = calculateAge(horse);
    return age.years + " år og " + age.months +
        (age.months === 1 ? " måned" : " måneder");
}
function formatMoney(amount) {
    return Number(amount).toLocaleString("da-DK") + " kr.";
}
// ========================================
// OPRET NY SPILTILSTAND
// ========================================
function createNewGameState() {
    horses = [];
    nextHorseId = 1;
    player = {
        id: "P-000001",
        name: ""
    };
    nextPlayerId = 2;
    gameCalendar = {
        year: 1,
        month: 1
    };
    economy = {
        balance: STARTING_BALANCE,
        lastIncome: 0,
        lastExpenses: 0,
        lastNet: 0,
        transactions: [],
        nextTransactionId: 1
    };
}
// ========================================
// SIKKERHEDSKOPI AF UGYLDIGE DATA
// ========================================
function backupCorruptGameData(rawData) {
    if (typeof rawData !== "string" || rawData.length === 0) {
        return false;
    }
    try {
        const backupKey =
            STORAGE_KEY + "_backup_" +
            new Date().toISOString().replace(/[:.]/g, "-");
        localStorage.setItem(backupKey, rawData);
        console.warn(
            "En sikkerhedskopi af de ugyldige spildata blev gemt som:",
            backupKey
        );
        return true;
    } catch (error) {
        console.error(
            "Kunne ikke sikkerhedskopiere de ugyldige spildata:",
            error
        );
        return false;
    }
}
// ========================================
// INDLÆS, REPARÉR ELLER OPRET SPILLET
// ========================================
function loadHorses() {
    try {
        const savedData = localStorage.getItem(STORAGE_KEY);
        // ------------------------------------
        // 1. Ingen gemte data: opret nyt spil.
        // ------------------------------------
        if (savedData === null) {
            createNewGameState();
            if (!saveHorses()) {
                throw new Error("Det nye spil kunne ikke gemmes.");
            }
            return;
        }
        let data;
        // ------------------------------------
        // 2. Kontrollér, om data er gyldig JSON.
        // ------------------------------------
        try {
            data = JSON.parse(savedData);
        } catch (parseError) {
            backupCorruptGameData(savedData);
            createNewGameState();
            if (!saveHorses()) {
                throw new Error(
                    "Et nyt spil kunne ikke gemmes efter ugyldige data."
                );
            }
            console.error(
                "De gemte spildata var ikke gyldig JSON:",
                parseError
            );
            alert(
                "De gemte spildata kunne ikke læses. " +
                "En sikkerhedskopi blev forsøgt gemt, " +
                "og spillet er startet forfra."
            );
            return;
        }
        // ------------------------------------
        // 3. Kontrollér den overordnede struktur.
        // ------------------------------------
        if (
            !data ||
            typeof data !== "object" ||
            Array.isArray(data)
        ) {
            backupCorruptGameData(savedData);
            createNewGameState();
            if (!saveHorses()) {
                throw new Error(
                    "Et nyt spil kunne ikke gemmes efter ugyldige data."
                );
            }
            alert(
                "De gemte spildata havde et ugyldigt format. " +
                "Spillet er startet forfra."
            );
            return;
        }
        let wasRepaired = false;
        // ------------------------------------
        // 4. Heste.
        // Bevar listen, hvis den er gyldig.
        // ------------------------------------
        if (Array.isArray(data.horses)) {
            horses = data.horses;
        } else {
            horses = [];
            wasRepaired = true;
        }
        nextHorseId =
            Number.isInteger(data.nextHorseId) &&
            data.nextHorseId > 0
                ? data.nextHorseId
                : 1;
        if (nextHorseId !== data.nextHorseId) {
            wasRepaired = true;
        }
        // ------------------------------------
        // 5. Kalender.
        // Bevar gyldigt år og måned.
        // ------------------------------------
        const sourceCalendar =
            data.calendar &&
            typeof data.calendar === "object" &&
            !Array.isArray(data.calendar)
                ? data.calendar
                : {};
        if (
            !data.calendar ||
            typeof data.calendar !== "object" ||
            Array.isArray(data.calendar)
        ) {
            wasRepaired = true;
        }
        gameCalendar = {
            year:
                Number.isInteger(sourceCalendar.year) &&
                sourceCalendar.year > 0
                    ? sourceCalendar.year
                    : 1,
            month:
                Number.isInteger(sourceCalendar.month) &&
                sourceCalendar.month >= 1 &&
                sourceCalendar.month <= 12
                    ? sourceCalendar.month
                    : 1
        };
        if (
            gameCalendar.year !== sourceCalendar.year ||
            gameCalendar.month !== sourceCalendar.month
        ) {
            wasRepaired = true;
        }
        // ------------------------------------
        // 6. Økonomi.
        // Bevar saldoen, hvis den er gyldig.
        // ------------------------------------
        const sourceEconomy =
            data.economy &&
            typeof data.economy === "object" &&
            !Array.isArray(data.economy)
                ? data.economy
                : {};
        if (
            !data.economy ||
            typeof data.economy !== "object" ||
            Array.isArray(data.economy)
        ) {
            wasRepaired = true;
        }
        economy = {
            balance: Number.isFinite(sourceEconomy.balance)
                ? sourceEconomy.balance
                : STARTING_BALANCE,
            lastIncome:
                Number.isFinite(Number(sourceEconomy.lastIncome))
                    ? Number(sourceEconomy.lastIncome)
                    : 0,
            lastExpenses:
                Number.isFinite(Number(sourceEconomy.lastExpenses))
                    ? Number(sourceEconomy.lastExpenses)
                    : 0,
            lastNet:
                Number.isFinite(Number(sourceEconomy.lastNet))
                    ? Number(sourceEconomy.lastNet)
                    : 0,
            transactions:
                Array.isArray(sourceEconomy.transactions)
                    ? sourceEconomy.transactions
                    : [],
            nextTransactionId:
                Number.isInteger(sourceEconomy.nextTransactionId) &&
                sourceEconomy.nextTransactionId > 0
                    ? sourceEconomy.nextTransactionId
                    : 1
        };
        if (
            economy.balance !== sourceEconomy.balance ||
            economy.lastIncome !== Number(sourceEconomy.lastIncome || 0) ||
            economy.lastExpenses !== Number(sourceEconomy.lastExpenses || 0) ||
            economy.lastNet !== Number(sourceEconomy.lastNet || 0) ||
            !Array.isArray(sourceEconomy.transactions) ||
            economy.nextTransactionId !== sourceEconomy.nextTransactionId
        ) {
            wasRepaired = true;
        }
        // ------------------------------------
        // 7. Spillerprofil og spiller-ID.
        // ------------------------------------
        const sourcePlayer =
            data.player &&
            typeof data.player === "object" &&
            !Array.isArray(data.player)
                ? data.player
                : {};
        if (
            !data.player ||
            typeof data.player !== "object" ||
            Array.isArray(data.player)
        ) {
            wasRepaired = true;
        }
        player = {
            id:
                typeof sourcePlayer.id === "string" &&
                sourcePlayer.id.trim()
                    ? sourcePlayer.id
                    : "P-000001",
            name:
                typeof sourcePlayer.name === "string"
                    ? sourcePlayer.name
                    : ""
        };
        if (
            player.id !== sourcePlayer.id ||
            player.name !== sourcePlayer.name
        ) {
            wasRepaired = true;
        }
        nextPlayerId =
            Number.isInteger(data.nextPlayerId) &&
            data.nextPlayerId > 0
                ? data.nextPlayerId
                : 2;
        if (nextPlayerId !== data.nextPlayerId) {
            wasRepaired = true;
        }
        // ------------------------------------
        // 8. Gem kun, hvis data er blevet repareret.
        // ------------------------------------
        if (wasRepaired) {
            if (!saveHorses()) {
                throw new Error(
                    "De reparerede spildata kunne ikke gemmes."
                );
            }
            const recoveryMessage =
                "Nogle gemte spildata manglede eller var ugyldige. " +
                "Spillet har repareret det, det kunne, " +
                "og bevaret gyldige data.";
            console.warn(recoveryMessage);
            alert(recoveryMessage);
        }
    } catch (error) {
        console.error(
            "Fejl ved indlæsning eller reparation af spillet:",
            error
        );
        alert(
            "Spillet kunne ikke gemme eller reparere dataene. " +
            "Kontrollér browserens lagerplads, og prøv at genindlæse siden. " +
            "Data er ikke med vilje blevet nulstillet i denne fejlbehandling."
        );
    }
}
// ========================================
// GÅRDENS FASTE HESTE
// ========================================
function loadStableHorses() {
    try {
        const savedStable = localStorage.getItem(STABLE_STORAGE_KEY);
        if (savedStable !== null) {
            const parsedStable = JSON.parse(savedStable);
            if (Array.isArray(parsedStable)) {
                stableHorses = parsedStable;
                return;
            }
            throw new Error(
                "Udlejningsstaldens data har et ugyldigt format."
            );
        }
        // Opret kun standardhestene første gang,
        // hvis der slet ikke findes gemte data.
        stableHorses = STABLE_HORSE_BLUEPRINTS.map(function(blueprint) {
            return {
                ...blueprint,
                birthYear: 1,
                birthMonth: 1
            };
        });
        saveStableHorses();
    } catch (error) {
        console.error("Fejl ved indlæsning af gårdens heste:", error);
        // Gendan ikke automatisk hestene ved fejl.
        // Det kan ellers få allerede udlejede heste tilbage.
        stableHorses = [];
        alert(
            "Udlejningsstalden kunne ikke indlæses korrekt. " +
            "De gemte data er ikke med vilje blevet overskrevet."
        );
    }
}
// ========================================
// GEM SPILLET
// ========================================
function saveHorses() {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
                horses: horses,
                nextHorseId: nextHorseId,
                calendar: gameCalendar,
                economy: economy,
                player: player,
                nextPlayerId: nextPlayerId
            })
        );
        return true;
    } catch (error) {
        console.error("Fejl ved gemning af spillet:", error);
        alert("Spillet kunne ikke gemmes i browserens lager.");
        return false;
    }
}
function saveStableHorses() {
    try {
        localStorage.setItem(
            STABLE_STORAGE_KEY,
            JSON.stringify(stableHorses)
        );
        return true;
    } catch (error) {
        console.error("Fejl ved gemning af gårdens heste:", error);
        alert("Gårdens heste kunne ikke gemmes.");
        return false;
    }
}
// ========================================
// ØKONOMIENS TRANSAKTIONSSYSTEM
// ========================================
function registerTransaction(type, category, description, amount) {
    if (type !== "income" && type !== "expense") {
        throw new Error("Transaktionen har en ugyldig type.");
    }
    if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error("Transaktionen skal have et positivt beløb.");
    }
    const previousBalance = economy.balance;
    economy.balance += type === "income" ? amount : -amount;
    const transaction = {
        id: economy.nextTransactionId,
        year: gameCalendar.year,
        month: gameCalendar.month,
        type: type,
        category: category,
        description: description,
        amount: amount,
        balanceAfter: economy.balance
    };
    economy.nextTransactionId++;
    economy.transactions.push(transaction);
    return {
        transaction: transaction,
        previousBalance: previousBalance
    };
}
// ========================================
// KALENDER
// ========================================
function renderCalendar() {
    const yearElement = document.getElementById("calendarYear");
    const monthElement = document.getElementById("calendarMonth");
    const seasonElement = document.getElementById("calendarSeason");
    if (yearElement) {
        yearElement.textContent = "År " + gameCalendar.year;
    }
    if (monthElement) {
        monthElement.textContent =
            MONTH_NAMES[gameCalendar.month - 1];
    }
    if (seasonElement) {
        seasonElement.textContent = getSeason(gameCalendar.month);
    }
}
// ========================================
// SALDO PÅ FORSIDEN
// ========================================
function renderEconomy() {
    const balanceElement = document.getElementById("moneyBalance");
    if (balanceElement) {
        balanceElement.textContent = formatMoney(economy.balance);
    }
}
// Tidsstyringen håndteres af game-time.js på alle sider.
// ========================================
// VIS GÅRDENS HESTE
// ========================================
function renderStableHorses() {
    const cards = document.getElementById("stableHorseCards");
    const emptyMessage = document.getElementById("stableEmptyMessage");
    if (!cards) return;
    cards.replaceChildren();
    if (emptyMessage) {
        emptyMessage.hidden = stableHorses.length > 0;
    }
    const horseImages = {
        "S-000001": "stjerneskud.PNG",
        "S-000002": "safir.PNG",
        "S-000003": "dusty.PNG",
        "S-000004": "clover.PNG",
        "S-000005": "maaneskin.PNG",
        "S-000006": "midnat.PNG"
    };
    stableHorses.forEach(function(horse) {
        // Ret Clovers farve i allerede gemte data.
        if (horse.id === "S-000004") {
            horse.color = "Palomino";
        }
        const card = document.createElement("article");
        card.className = "horse-card horse-overview-card";
        const image = document.createElement("img");
        image.className = "stable-horse-image";
        image.src = horseImages[horse.id] || "";
        image.alt = "Billede af " + horse.name;
        image.loading = "lazy";
        image.onerror = function() {
            image.hidden = true;
        };
        const content = document.createElement("div");
        content.className = "horse-card-content";
        const name = document.createElement("h3");
        name.textContent = horse.name;
        const id = document.createElement("p");
        id.className = "horse-id";
        id.textContent = horse.id;
        const breed = document.createElement("p");
        breed.className = "horse-info";
        breed.textContent = horse.breed + " · " + horse.sex;
        const color = document.createElement("p");
        color.textContent = "Farve: " + horse.color;
        const height = document.createElement("p");
        height.textContent = "Højde: " + horse.height + " cm";
        const temperament = document.createElement("p");
        temperament.textContent =
            "Temperament: " + horse.temperament;
        content.append(
            name,
            id,
            breed,
            color,
            height,
            temperament
        );
        card.append(image, content);
        cards.appendChild(card);
    });
    // Gem den rettede farve uden at ændre resten af spillet.
    saveStableHorses();
}
// ========================================
// GAMLE HESTE: BEHOLDES OG VISES, HVIS FELTERNE FINDES
// ========================================
function renderHorses() {
    const horseCards = document.getElementById("horseCards");
    const horseCount = document.getElementById("horseCount");
    const emptyMessage = document.getElementById("emptyMessage");
    // Den nye forside bruger gårdens hesteliste i stedet.
    // Denne funktion er stadig tilgængelig for ældre sider.
    if (!horseCards || !horseCount || !emptyMessage) {
        return;
    }
    horseCards.replaceChildren();
    horseCount.textContent =
        horses.length + (horses.length === 1 ? " hest" : " heste");
    emptyMessage.hidden = horses.length !== 0;
    horses.forEach(function(horse) {
        const card = document.createElement("article");
        card.className = "horse-card";
        const name = document.createElement("h3");
        name.textContent = horse.name;
        const id = document.createElement("p");
        id.className = "horse-id";
        id.textContent = horse.id;
        const info = document.createElement("p");
        info.className = "horse-info";
        info.textContent =
            horse.breed + " · " + horse.sex + " · " + formatAge(horse);
        const openButton = document.createElement("button");
        openButton.type = "button";
        openButton.textContent = "Åbn profil";
        openButton.className = "open-profile-button";
        openButton.addEventListener("click", function() {
            window.location.href =
                "profile.html?id=" + encodeURIComponent(horse.id);
        });
        card.append(name, id, info, openButton);
        horseCards.appendChild(card);
    });
}
// ========================================
// VELKOMST
// ========================================
function renderPlayer() {
    const heading = document.getElementById("playerHeading");
    const welcomeMessage = document.getElementById("welcomeMessage");
    if (!heading || !welcomeMessage) return;
    if (player.name && player.name.trim()) {
        heading.textContent = "Velkommen " + player.name.trim() + "!";
        welcomeMessage.textContent =
            "Dejligt at se dig tilbage i dit hesteunivers.";
    } else {
        heading.textContent = "Velkommen!";
        welcomeMessage.textContent =
            "Gå til spillerprofilen for at vælge dit spillernavn.";
    }
}
// ========================================
// NULSTILLING – KUN TIL TEST
// ========================================
const resetGameButton = document.getElementById("resetGameButton");
if (resetGameButton) {
    resetGameButton.addEventListener("click", function() {
        if (!confirm(
            "Vil du nulstille spillet? Alle gemte heste slettes, " +
            "kalenderen sættes tilbage, og økonomien starter forfra. " +
            "Dette kan ikke fortrydes."
        )) {
            return;
        }
        const previousHorses = horses;
        const previousNextHorseId = nextHorseId;
        const previousCalendar = gameCalendar;
        const previousEconomy = economy;
        horses = [];
        nextHorseId = 1;
        gameCalendar = { year: 1, month: 1 };
        economy = {
            balance: STARTING_BALANCE,
            lastIncome: 0,
            lastExpenses: 0,
            lastNet: 0,
            transactions: [],
            nextTransactionId: 1
        };
        if (!saveHorses()) {
            horses = previousHorses;
            nextHorseId = previousNextHorseId;
            gameCalendar = previousCalendar;
            economy = previousEconomy;
            return;
        }
        renderCalendar();
        renderEconomy();
        renderHorses();
        renderStableHorses();
        alert("Spillet er nulstillet. Startkapitalen er 30.000 kr.");
    });
}
// ========================================
// START SPILLET
// ========================================
loadHorses();
loadStableHorses();
renderPlayer();
renderCalendar();
renderEconomy();
renderHorses();
renderStableHorses();