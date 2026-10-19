
const STORAGE_KEY = "hestespil_horses_v1";

const STARTING_BALANCE = 30000;
const MONTHLY_SALARY = 20000;
const MONTHLY_LIVING_COSTS = 7500;

let horses = [];
let nextHorseId = 1;
let editingHorseId = null;

let player = { id: null, name: "" };
let nextPlayerId = 1;

let gameCalendar = { year: 1, month: 1 };

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

function getSeason(month) {
    if (month === 12 || month <= 2) return "Vinter";
    if (month >= 3 && month <= 5) return "Forår";
    if (month >= 6 && month <= 8) return "Sommer";
    return "Efterår";
}

function calculateAge(horse) {
    const totalMonths = Math.max(
        0,
        (gameCalendar.year - horse.birthYear) * 12 +
        (gameCalendar.month - horse.birthMonth)
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
// INDLÆS SPILLET
// ========================================

function loadHorses() {
    try {
        const savedData = localStorage.getItem(STORAGE_KEY);

        if (savedData !== null) {
            const data = JSON.parse(savedData);

            horses = Array.isArray(data.horses)
                ? data.horses
                : [];

            nextHorseId =
                Number.isInteger(data.nextHorseId) &&
                data.nextHorseId > 0
                    ? data.nextHorseId
                    : 1;

            if (data.player && typeof data.player === "object") {
                player = {
                    id: typeof data.player.id === "string"
                        ? data.player.id
                        : null,
                    name: typeof data.player.name === "string"
                        ? data.player.name
                        : ""
                };
            }

            nextPlayerId =
                Number.isInteger(data.nextPlayerId) &&
                data.nextPlayerId > 0
                    ? data.nextPlayerId
                    : 1;

            if (
                data.calendar &&
                Number.isInteger(data.calendar.year) &&
                Number.isInteger(data.calendar.month) &&
                data.calendar.year >= 1 &&
                data.calendar.month >= 1 &&
                data.calendar.month <= 12
            ) {
                gameCalendar = {
                    year: data.calendar.year,
                    month: data.calendar.month
                };
            } else {
                let oldestAge = 0;

                horses.forEach(function(horse) {
                    if (
                        !Number.isInteger(horse.birthYear) ||
                        !Number.isInteger(horse.birthMonth)
                    ) {
                        oldestAge = Math.max(
                            oldestAge,
                            Number(horse.age) || 0
                        );
                    }
                });

                gameCalendar = {
                    year: Math.max(1, oldestAge + 1),
                    month: 1
                };
            }

            // Indlæs den gemte økonomi uden at nulstille saldoen.
            if (
                data.economy &&
                Number.isFinite(data.economy.balance)
            ) {
                economy = {
                    balance: data.economy.balance,
                    lastIncome: Number(data.economy.lastIncome) || 0,
                    lastExpenses: Number(data.economy.lastExpenses) || 0,
                    lastNet: Number(data.economy.lastNet) || 0,
                    transactions: Array.isArray(
                        data.economy.transactions
                    )
                        ? data.economy.transactions
                        : [],
                    nextTransactionId:
                        Number.isInteger(
                            data.economy.nextTransactionId
                        ) &&
                        data.economy.nextTransactionId > 0
                            ? data.economy.nextTransactionId
                            : 1
                };

                economy.transactions.forEach(function(transaction) {
                    if (
                        Number.isInteger(transaction.id) &&
                        transaction.id >= economy.nextTransactionId
                    ) {
                        economy.nextTransactionId = transaction.id + 1;
                    }
                });
            }
        }

        // Sørg for, at spilleren har et permanent ID.
        if (!player.id || !/^P-\d{6,}$/.test(player.id)) {
            player.id = "P-" + String(nextPlayerId).padStart(6, "0");
            nextPlayerId++;
        } else {
            nextPlayerId = Math.max(
                nextPlayerId,
                Number(player.id.slice(2)) + 1
            );
        }

        // Find næste ledige heste-ID.
        horses.forEach(function(horse) {
            if (typeof horse.id === "string") {
                const number = Number(horse.id.slice(2));

                if (Number.isFinite(number) && number >= nextHorseId) {
                    nextHorseId = number + 1;
                }
            }
        });

        // Giv ældre heste en fødselsdato, hvis de mangler den.
        horses.forEach(function(horse) {
            if (
                !Number.isInteger(horse.birthYear) ||
                !Number.isInteger(horse.birthMonth)
            ) {
                const oldAge = Math.max(0, Number(horse.age) || 0);

                horse.birthYear = Math.max(
                    1,
                    gameCalendar.year - oldAge
                );

                horse.birthMonth = gameCalendar.month;
            }
        });

        if (!saveHorses()) {
            throw new Error("Spillet kunne ikke gemmes.");
        }

    } catch (error) {
        console.error("Fejl ved indlæsning af spillet:", error);

        alert(
            "Spillet kunne ikke indlæses eller gemmes. " +
            "Se konsollen for flere oplysninger."
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

    economy.balance += type === "income"
        ? amount
        : -amount;

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
// VIS KALENDEREN
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
// VIS KUN SALDOEN PÅ FORSIDEN
// ========================================

function renderEconomy() {
    const balanceElement = document.getElementById("moneyBalance");

    if (balanceElement) {
        balanceElement.textContent = formatMoney(economy.balance);
    }
}


// ========================================
// NÆSTE MÅNED
// ========================================

const nextMonthButton = document.getElementById("nextMonthButton");

if (nextMonthButton) {
    nextMonthButton.addEventListener("click", function() {
        const previousCalendar = {
            year: gameCalendar.year,
            month: gameCalendar.month
        };

        const previousEconomy = JSON.parse(JSON.stringify(economy));

        if (gameCalendar.month === 12) {
            gameCalendar.month = 1;
            gameCalendar.year++;
        } else {
            gameCalendar.month++;
        }

        try {
            registerTransaction(
                "income",
                "Løn",
                "Fast månedsløn fra staldarbejde",
                MONTHLY_SALARY
            );

            registerTransaction(
                "expense",
                "Leveomkostninger",
                "Månedens faste leveomkostninger",
                MONTHLY_LIVING_COSTS
            );

            economy.lastIncome = MONTHLY_SALARY;
            economy.lastExpenses = MONTHLY_LIVING_COSTS;
            economy.lastNet = MONTHLY_SALARY - MONTHLY_LIVING_COSTS;

            if (!saveHorses()) {
                gameCalendar = previousCalendar;
                economy = previousEconomy;
                renderCalendar();
                renderEconomy();
                return;
            }

        } catch (error) {
            console.error("Fejl ved bogføring:", error);

            gameCalendar = previousCalendar;
            economy = previousEconomy;

            renderCalendar();
            renderEconomy();

            alert("Månedens økonomi kunne ikke bogføres.");
            return;
        }

        renderCalendar();
        renderEconomy();
        renderHorses();
    });
}


// ========================================
// OPRET HEST
// ========================================

function createHorse(name, breed, sex) {
    const horse = {
        id: "H-" + String(nextHorseId).padStart(6, "0"),
        name: name,
        breed: breed,
        sex: sex,
        birthYear: gameCalendar.year,
        birthMonth: gameCalendar.month
    };

    nextHorseId++;
    horses.push(horse);

    return horse;
}


// ========================================
// VIS HESTEOVERSIGTEN
// ========================================

function renderHorses() {
    const horseCards = document.getElementById("horseCards");
    const horseCount = document.getElementById("horseCount");
    const emptyMessage = document.getElementById("emptyMessage");

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
// HESTEFORMULAR
// ========================================

function resetForm() {
    editingHorseId = null;

    document.getElementById("horseName").value = "";
    document.getElementById("horseBreed").value = "";
    document.getElementById("horseSex").value = "";

    document.getElementById("horseBreed").disabled = false;
    document.getElementById("horseSex").disabled = false;

    document.getElementById("createHorseButton").textContent = "Opret hest";
    document.getElementById("formHeading").textContent = "Opret ny hest";
    document.getElementById("cancelEditButton").hidden = true;
}

function editHorse(id) {
    const horse = horses.find(function(item) {
        return item.id === id;
    });

    if (!horse) return;

    editingHorseId = id;

    document.getElementById("horseName").value = horse.name;
    document.getElementById("horseBreed").value = horse.breed;
    document.getElementById("horseSex").value = horse.sex;

    document.getElementById("horseBreed").disabled = true;
    document.getElementById("horseSex").disabled = true;

    document.getElementById("createHorseButton").textContent = "Gem navn";
    document.getElementById("formHeading").textContent =
        "Rediger hestens navn";

    document.getElementById("cancelEditButton").hidden = false;

    document.getElementById("createHorse").scrollIntoView({
        behavior: "smooth"
    });
}

const createHorseButton = document.getElementById("createHorseButton");

if (createHorseButton) {
    createHorseButton.addEventListener("click", function() {
        const name = document.getElementById("horseName").value.trim();
        const breed = document.getElementById("horseBreed").value;
        const sex = document.getElementById("horseSex").value;

        if (name === "") {
            alert("Skriv venligst hestens navn.");
            return;
        }

        if (editingHorseId !== null) {
            const horse = horses.find(function(item) {
                return item.id === editingHorseId;
            });

            if (!horse) {
                alert("Hesten blev ikke fundet.");
                resetForm();
                return;
            }

            const oldName = horse.name;
            horse.name = name;

            if (!saveHorses()) {
                horse.name = oldName;
                return;
            }

        } else {
            if (
                breed === "" ||
                (sex !== "Hoppe" && sex !== "Hingst")
            ) {
                alert("Vælg en race og enten hoppe eller hingst.");
                return;
            }

            createHorse(name, breed, sex);

            if (!saveHorses()) {
                horses.pop();
                nextHorseId--;
                return;
            }
        }

        resetForm();
        renderHorses();
    });
}

const cancelEditButton = document.getElementById("cancelEditButton");

if (cancelEditButton) {
    cancelEditButton.addEventListener("click", resetForm);
}


// ========================================
// NULSTIL SPILLET – KUN TIL TEST
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

        // Spillerens ID og navn bevares.
        if (!saveHorses()) {
            horses = previousHorses;
            nextHorseId = previousNextHorseId;
            gameCalendar = previousCalendar;
            economy = previousEconomy;
            return;
        }

        resetForm();
        renderCalendar();
        renderEconomy();
        renderHorses();

        alert("Spillet er nulstillet. Startkapitalen er 30.000 kr.");
    });
}


// ========================================
// VELKOMST PÅ FORSIDEN
// ========================================

function renderPlayer() {
    const heading = document.getElementById("playerHeading");
    const welcomeMessage = document.getElementById("welcomeMessage");

    if (!heading || !welcomeMessage) {
        return;
    }

    try {
        const savedData = localStorage.getItem(STORAGE_KEY);

        if (!savedData) {
            heading.textContent = "Velkommen!";
            welcomeMessage.textContent =
                "Gå til spillerprofilen for at vælge dit spillernavn.";
            return;
        }

        const data = JSON.parse(savedData);
        const name = data.player?.name?.trim();

        if (name) {
            heading.textContent = "Velkommen " + name + "!";
            welcomeMessage.textContent =
                "Dejligt at se dig tilbage i dit hesteunivers.";
        } else {
            heading.textContent = "Velkommen!";
            welcomeMessage.textContent =
                "Gå til spillerprofilen for at vælge dit spillernavn.";
        }
    } catch (error) {
        console.error("Fejl ved indlæsning af spillernavn:", error);
    }
}


// ========================================
// START SPILLET
// ========================================

loadHorses();
renderPlayer();
renderCalendar();
renderEconomy();
renderHorses();
