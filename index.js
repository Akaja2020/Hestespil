
const STORAGE_KEY = "hestespil_horses_v1";

const STARTING_BALANCE = 30000;
const MONTHLY_SALARY = 20000;
const MONTHLY_LIVING_COSTS = 7500;

let horses = [];
let nextHorseId = 1;
let editingHorseId = null;

let gameCalendar = {
    year: 1,
    month: 1
};

let economy = {
    balance: STARTING_BALANCE,
    lastIncome: 0,
    lastExpenses: 0,
    lastNet: 0
};

const MONTH_NAMES = [
    "Januar", "Februar", "Marts", "April",
    "Maj", "Juni", "Juli", "August",
    "September", "Oktober", "November", "December"
];


// ========================================
// ÅRSTID
// ========================================

function getSeason(month) {
    if (month === 12 || month <= 2) return "Vinter";
    if (month >= 3 && month <= 5) return "Forår";
    if (month >= 6 && month <= 8) return "Sommer";
    return "Efterår";
}


// ========================================
// HESTENS ALDER
// ========================================

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
    const yearText = age.years + " år";
    const monthText = age.months +
        (age.months === 1 ? " måned" : " måneder");

    return yearText + " og " + monthText;
}


// ========================================
// PENGEFORMAT
// ========================================

function formatMoney(amount) {
    return amount.toLocaleString("da-DK") + " kr.";
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

            nextHorseId = data.nextHorseId || 1;

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

            // Indlæs økonomien, hvis den allerede findes.
            // Gamle gemte spil får startkapital én gang.
            if (
                data.economy &&
                Number.isFinite(data.economy.balance)
            ) {
                economy = {
                    balance: data.economy.balance,
                    lastIncome: Number(data.economy.lastIncome) || 0,
                    lastExpenses: Number(data.economy.lastExpenses) || 0,
                    lastNet: Number(data.economy.lastNet) || 0
                };
            }
        }

        // Find næste ledige heste-ID.
        horses.forEach(function(horse) {
            if (typeof horse.id === "string") {
                const number = Number(horse.id.slice(2));

                if (number >= nextHorseId) {
                    nextHorseId = number + 1;
                }
            }
        });

        // Giv gamle heste en fødselsdato.
        horses.forEach(function(horse) {
            if (
                !Number.isInteger(horse.birthYear) ||
                !Number.isInteger(horse.birthMonth)
            ) {
                const oldAge = Math.max(
                    0,
                    Number(horse.age) || 0
                );

                horse.birthYear = Math.max(
                    1,
                    gameCalendar.year - oldAge
                );

                horse.birthMonth = gameCalendar.month;
            }
        });

        // Gem uden at fjerne eksisterende heste eller kalender.
        if (!saveHorses()) {
            throw new Error("Spillet kunne ikke gemmes.");
        }

    } catch (error) {
        alert(
            "Spillet kunne ikke indlæses eller gemmes. " +
            "Undlad at nulstille spillet, og kontrollér lageret."
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
                economy: economy
            })
        );

        return true;

    } catch (error) {
        alert("Spillet kunne ikke gemmes i browserens lager.");
        return false;
    }
}


// ========================================
// VIS KALENDEREN
// ========================================

function renderCalendar() {
    document.getElementById("calendarYear").textContent =
        "År " + gameCalendar.year;

    document.getElementById("calendarMonth").textContent =
        MONTH_NAMES[gameCalendar.month - 1];

    document.getElementById("calendarSeason").textContent =
        getSeason(gameCalendar.month);
}


// ========================================
// VIS ØKONOMIEN
// ========================================

function renderEconomy() {
    document.getElementById("moneyBalance").textContent =
        formatMoney(economy.balance);

    document.getElementById("monthlySalary").textContent =
        formatMoney(MONTHLY_SALARY);

    document.getElementById("livingCosts").textContent =
        formatMoney(MONTHLY_LIVING_COSTS);

    document.getElementById("monthlyNet").textContent =
        (economy.lastNet > 0 ? "+" : "") +
        formatMoney(economy.lastNet);

    document.getElementById("lastIncome").textContent =
        formatMoney(economy.lastIncome);

    document.getElementById("lastExpenses").textContent =
        formatMoney(economy.lastExpenses);
}


// ========================================
// NÆSTE MÅNED OG MÅNEDLIG ØKONOMI
// ========================================

document
    .getElementById("nextMonthButton")
    .addEventListener("click", function() {

        const previousCalendar = {
            year: gameCalendar.year,
            month: gameCalendar.month
        };

        const previousEconomy = { ...economy };

        // Gå én måned frem.
        if (gameCalendar.month === 12) {
            gameCalendar.month = 1;
            gameCalendar.year++;
        } else {
            gameCalendar.month++;
        }

        // Bogfør månedens løn og leveomkostninger.
        economy.lastIncome = MONTHLY_SALARY;
        economy.lastExpenses = MONTHLY_LIVING_COSTS;
        economy.lastNet = MONTHLY_SALARY - MONTHLY_LIVING_COSTS;

        economy.balance += economy.lastNet;

        // Rul ændringerne tilbage, hvis gemningen fejler.
        if (!saveHorses()) {
            gameCalendar = previousCalendar;
            economy = previousEconomy;
            renderCalendar();
            renderEconomy();
            return;
        }

        renderCalendar();
        renderEconomy();
        renderHorses();
    });


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

    horseCards.replaceChildren();

    horseCount.textContent =
        horses.length +
        (horses.length === 1 ? " hest" : " heste");

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

        card.appendChild(name);
        card.appendChild(id);
        card.appendChild(info);
        card.appendChild(openButton);

        horseCards.appendChild(card);
    });
}


// ========================================
// NULSTIL FORMULAR
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


// ========================================
// REDIGER HESTENS NAVN
// ========================================

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


// ========================================
// OPRET HEST ELLER GEM NAVN
// ========================================

document
    .getElementById("createHorseButton")
    .addEventListener("click", function() {

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

            const horse = createHorse(name, breed, sex);

            if (!saveHorses()) {
                horses.pop();
                nextHorseId--;
                return;
            }
        }

        resetForm();
        renderHorses();
    });


// ========================================
// ANNULLER REDIGERING
// ========================================

document
    .getElementById("cancelEditButton")
    .addEventListener("click", resetForm);


// ========================================
// NULSTIL SPILLET – KUN TIL TEST
// ========================================

document
    .getElementById("resetGameButton")
    .addEventListener("click", function() {

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
            lastNet: 0
        };

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


// ========================================
// START SPILLET
// ========================================

loadHorses();
renderCalendar();
renderEconomy();
renderHorses();
