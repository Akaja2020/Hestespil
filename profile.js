"use strict";
const STORAGE_KEY = "hestespil_horses_v1";
let savedData = {};
let horses = [];
let currentHorse = null;
let gameCalendar = { year: 1, month: 1 };
const MONTH_NAMES = [
    "Januar", "Februar", "Marts", "April", "Maj", "Juni",
    "Juli", "August", "September", "Oktober", "November", "December"
];
function calculateAge(horse) {
    const birthYear = Number(horse.birthYear);
    const birthMonth = Number(horse.birthMonth);
    if (
        !Number.isInteger(birthYear) ||
        !Number.isInteger(birthMonth) ||
        birthMonth < 1 ||
        birthMonth > 12
    ) {
        return null;
    }
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
    if (!age) return "Ikke registreret";
    const yearsText = age.years + " år";
    const monthsText = age.months +
        (age.months === 1 ? " måned" : " måneder");
    return yearsText + " og " + monthsText;
}
function formatMoney(value) {
    if (
        value === null ||
        value === undefined ||
        value === "" ||
        !Number.isFinite(Number(value))
    ) {
        return "Ikke registreret";
    }
    return Number(value).toLocaleString("da-DK") + " kr.";
}
function setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
}
function displayValue(value, fallback = "Ikke registreret") {
    if (value === null || value === undefined || value === "") {
        return fallback;
    }
    return String(value);
}
function showError(message) {
    const errorBox = document.getElementById("profileError");
    const content = document.getElementById("profileContent");
    if (errorBox) {
        errorBox.textContent = message;
        errorBox.hidden = false;
    }
    if (content) content.hidden = true;
}
function showStatus(message) {
    setText("profileStatus", message);
}
function loadGameData() {
    try {
        const rawData = localStorage.getItem(STORAGE_KEY);
        if (rawData === null) {
            showError(
                "Der blev ikke fundet et gemt spil. Gå til forsiden først."
            );
            return false;
        }
        const data = JSON.parse(rawData);
        if (!data || typeof data !== "object" || Array.isArray(data)) {
            showError("Spillets gemte data kunne ikke læses.");
            return false;
        }
        if (!Array.isArray(data.horses)) {
            showError("Hestelisten kunne ikke læses. Data er ikke ændret.");
            return false;
        }
        savedData = data;
        horses = data.horses;
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
            gameCalendar = { year: 1, month: 1 };
        }
        return true;
    } catch (error) {
        console.error("Fejl ved indlæsning af hesteprofil:", error);
        showError("Hestens profil kunne ikke indlæses.");
        return false;
    }
}
function saveHorseField(fieldName) {
    try {
        const rawData = localStorage.getItem(STORAGE_KEY);
        if (rawData === null) {
            showStatus("Det gemte spil blev ikke fundet. Intet blev ændret.");
            return false;
        }
        const latestData = JSON.parse(rawData);
        if (
            !latestData ||
            typeof latestData !== "object" ||
            !Array.isArray(latestData.horses)
        ) {
            showStatus("Spillets data kunne ikke læses. Intet blev ændret.");
            return false;
        }
        const horseIndex = latestData.horses.findIndex(
            horse => horse && horse.id === currentHorse.id
        );
        if (horseIndex === -1) {
            showStatus("Hesten findes ikke længere i det gemte spil.");
            return false;
        }
        /*
         * Opdater kun det felt, spilleren har ændret.
         * Alle andre hesteoplysninger og spildata bevares.
         */
        latestData.horses[horseIndex][fieldName] =
            currentHorse[fieldName];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(latestData));
        savedData = latestData;
        horses = latestData.horses;
        currentHorse = latestData.horses[horseIndex];
        return true;
    } catch (error) {
        console.error("Fejl ved gemning af hesteprofil:", error);
        showStatus("Ændringerne kunne ikke gemmes.");
        return false;
    }
}
function findCurrentHorse() {
    const parameters = new URLSearchParams(window.location.search);
    const horseId = parameters.get("id");
    if (!horseId) return null;
    return horses.find(horse => horse && horse.id === horseId) || null;
}
function renderProfile() {
    if (!currentHorse) {
        showError(
            "Hesten blev ikke fundet. Gå tilbage til hesteoversigten."
        );
        return;
    }
    const errorBox = document.getElementById("profileError");
    const content = document.getElementById("profileContent");
    if (errorBox) errorBox.hidden = true;
    if (content) content.hidden = false;
    setText("profileName", "Profil for " + (currentHorse.name || "hesten"));
    setText("profileId", displayValue(currentHorse.id));
    setText(
        "profileSubtitle",
        displayValue(currentHorse.breed) + " · " +
        displayValue(currentHorse.sex)
    );
    setText("profileBreed", displayValue(currentHorse.breed));
    setText("profileSex", displayValue(currentHorse.sex));
    setText("profileAge", formatAge(currentHorse));
    const birthYear = Number(currentHorse.birthYear);
    const birthMonth = Number(currentHorse.birthMonth);
    const birthDate =
        currentHorse.birthYear !== undefined &&
        currentHorse.birthYear !== null &&
        currentHorse.birthYear !== "" &&
        currentHorse.birthMonth !== undefined &&
        currentHorse.birthMonth !== null &&
        currentHorse.birthMonth !== "" &&
        Number.isInteger(birthYear) &&
        Number.isInteger(birthMonth) &&
        birthMonth >= 1 &&
        birthMonth <= 12
            ? MONTH_NAMES[birthMonth - 1] + " år " + birthYear
            : "Ikke registreret";
    setText("profileBirthDate", birthDate);
    setText("profileBreeder", displayValue(currentHorse.breeder));
    setText(
        "profileOwner",
        displayValue(
            currentHorse.ownerName || savedData.player?.name,
            "Ikke registreret"
        )
    );
    // Udseende og personlighed.
    setText("profileColor", displayValue(currentHorse.color));
    setText("profileMarkings", displayValue(currentHorse.markings));
    setText("profileManeTail", displayValue(currentHorse.maneTailColor));
    setText(
        "profileHeight",
        currentHorse.heightCm
            ? currentHorse.heightCm + " cm"
            : "Ikke registreret"
    );
    setText("profilePersonality", displayValue(currentHorse.personality));
    setText("profileTemperament", displayValue(currentHorse.temperament));
    // Kendt genetik og spillerens gæt holdes adskilt.
    setText(
        "profileKnownGenetics",
        displayValue(
            currentHorse.genetics,
            "Ingen genetiske oplysninger registreret."
        )
    );
    setText(
        "profileGeneticGuesses",
        displayValue(currentHorse.geneticGuesses, "Ingen gæt registreret.")
    );
    // Stamtavle og avl.
    setText("profileFather", displayValue(currentHorse.fatherName));
    setText("profileMother", displayValue(currentHorse.motherName));
    const offspringCount = Array.isArray(currentHorse.offspringIds)
        ? currentHorse.offspringIds.length
        : 0;
    setText("profileOffspring", offspringCount + " registreret");
    setText(
        "profileApproval",
        displayValue(currentHorse.breedingApproval, "Ikke opnået")
    );
    setText(
        "profileAssociation",
        displayValue(currentHorse.breedingAssociation)
    );
    // Sport og resultater.
    setText(
        "profileCompetitionLevel",
        displayValue(currentHorse.competitionLevel, "Ikke startet")
    );
    setText("profileStarts", displayValue(currentHorse.competitionStarts, "0"));
    setText("profileWins", displayValue(currentHorse.competitionWins, "0"));
    setText(
        "profileBestResult",
        displayValue(currentHorse.bestCompetitionResult, "Ingen resultater")
    );
    // Økonomi og udstyr.
    setText("profilePurchasePrice", formatMoney(currentHorse.purchasePrice));
    setText(
        "profileMarketValue",
        currentHorse.marketValue === undefined
            ? "Ikke beregnet"
            : formatMoney(currentHorse.marketValue)
    );
    setText("profileInsurance", displayValue(currentHorse.insurance));
    setText("profileEquipment", displayValue(currentHorse.equipment));
    // Sundhed og historik.
    setText("profileHealth", displayValue(currentHorse.healthStatus));
    setText(
        "profileInjuries",
        displayValue(currentHorse.injuries, "Ingen registreret")
    );
    setText("profileLastActivity", displayValue(currentHorse.lastActivity));
    renderHistory();
    document.title =
        displayValue(currentHorse.name, "Hesteprofil") + " | Hestespillet";
}
function renderHistory() {
    const list = document.getElementById("profileHistory");
    if (!list) return;
    list.replaceChildren();
    const history = Array.isArray(currentHorse.history)
        ? currentHorse.history
        : [];
    if (history.length === 0) {
        const item = document.createElement("li");
        item.textContent = "Ingen begivenheder registreret.";
        list.appendChild(item);
        return;
    }
    history.forEach(event => {
        const item = document.createElement("li");
        if (typeof event === "string") {
            item.textContent = event;
        } else if (event && typeof event === "object") {
            const date = event.date ? event.date + " – " : "";
            item.textContent =
                date + displayValue(event.description, "Begivenhed");
        } else {
            item.textContent = "Begivenhed";
        }
        list.appendChild(item);
    });
}
function openNameEditor() {
    if (!currentHorse) return;
    const input = document.getElementById("editName");
    const form = document.getElementById("editProfileSection");
    if (!input || !form) return;
    input.value = currentHorse.name || "";
    form.hidden = false;
    form.scrollIntoView({ behavior: "smooth", block: "center" });
}
function saveName(event) {
    event.preventDefault();
    if (!currentHorse) return;
    const input = document.getElementById("editName");
    if (!input) return;
    const name = input.value.trim();
    if (!name) {
        alert("Skriv venligst hestens navn.");
        return;
    }
    const oldName = currentHorse.name;
    currentHorse.name = name;
    if (!saveHorseField("name")) {
        currentHorse.name = oldName;
        return;
    }
    document.getElementById("editProfileSection").hidden = true;
    renderProfile();
    showStatus("Hestens navn er gemt.");
}
function openGeneticsEditor() {
    if (!currentHorse) return;
    const input = document.getElementById("editGenetics");
    const form = document.getElementById("editGeneticsSection");
    if (!input || !form) return;
    input.value =
        typeof currentHorse.geneticGuesses === "string"
            ? currentHorse.geneticGuesses
            : "";
    form.hidden = false;
    form.scrollIntoView({ behavior: "smooth", block: "center" });
}
function saveGeneticGuesses(event) {
    event.preventDefault();
    if (!currentHorse) return;
    const input = document.getElementById("editGenetics");
    if (!input) return;
    const guesses = input.value.trim();
    const oldGuesses = currentHorse.geneticGuesses;
    currentHorse.geneticGuesses = guesses;
    if (!saveHorseField("geneticGuesses")) {
        currentHorse.geneticGuesses = oldGuesses;
        return;
    }
    document.getElementById("editGeneticsSection").hidden = true;
    renderProfile();
    showStatus("Dine genetiske gæt er gemt.");
}
function connectButton(id, handler) {
    const button = document.getElementById(id);
    if (button) button.addEventListener("click", handler);
}
function connectForm(id, handler) {
    const form = document.getElementById(id);
    if (form) form.addEventListener("submit", handler);
}
connectButton("editProfileButton", openNameEditor);
connectForm("editProfileSection", saveName);
connectButton("cancelProfileEditButton", function () {
    const form = document.getElementById("editProfileSection");
    if (form) form.hidden = true;
});
connectButton("editGeneticsButton", openGeneticsEditor);
connectForm("editGeneticsSection", saveGeneticGuesses);
connectButton("cancelGeneticsButton", function () {
    const form = document.getElementById("editGeneticsSection");
    if (form) form.hidden = true;
});
if (loadGameData()) {
    currentHorse = findCurrentHorse();
    renderProfile();
}