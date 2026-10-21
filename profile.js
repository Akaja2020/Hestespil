
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

    return age.years + (age.years === 1 ? " år" : " år") +
        " og " + age.months +
        (age.months === 1 ? " måned" : " måneder");
}

function formatMoney(value) {
    if (value === null || value === undefined ||
        value === "" || !Number.isFinite(Number(value))) {
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
    errorBox.textContent = message;
    errorBox.hidden = false;
    document.getElementById("profileContent").hidden = true;
}

function showStatus(message) {
    setText("profileStatus", message);
}

function loadGameData() {
    try {
        const rawData = localStorage.getItem(STORAGE_KEY);

        if (rawData === null) {
            showError("Der blev ikke fundet et gemt spil. Gå til forsiden først.");
            return false;
        }

        savedData = JSON.parse(rawData);

        if (!savedData || typeof savedData !== "object") {
            showError("Spillets gemte data kunne ikke læses.");
            return false;
        }

        horses = Array.isArray(savedData.horses)
            ? savedData.horses
            : [];

        if (
            savedData.calendar &&
            Number.isInteger(savedData.calendar.year) &&
            Number.isInteger(savedData.calendar.month) &&
            savedData.calendar.year >= 1 &&
            savedData.calendar.month >= 1 &&
            savedData.calendar.month <= 12
        ) {
            gameCalendar = {
                year: savedData.calendar.year,
                month: savedData.calendar.month
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

function saveGameData() {
    try {
        // Genindlæs den seneste datapakke, så andre data bevares.
        const rawData = localStorage.getItem(STORAGE_KEY);

        if (rawData === null) {
            showError("Det gemte spil blev ikke fundet. Intet blev ændret.");
            return false;
        }

        const latestData = JSON.parse(rawData);

        if (!latestData || typeof latestData !== "object") {
            showError("Spillets data kunne ikke læses. Intet blev ændret.");
            return false;
        }

        const latestHorses = Array.isArray(latestData.horses)
            ? latestData.horses
            : [];

        const horseIndex = latestHorses.findIndex(
            horse => horse.id === currentHorse.id
        );

        if (horseIndex === -1) {
            showError("Hesten findes ikke længere i det gemte spil.");
            return false;
        }

        // Opdater kun denne hests oplysninger.
        latestHorses[horseIndex] = currentHorse;
        latestData.horses = latestHorses;

        // Bevar økonomi, spiller, kalender, ID-tællere og øvrige felter.
        localStorage.setItem(STORAGE_KEY, JSON.stringify(latestData));

        savedData = latestData;
        horses = latestHorses;

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

    return horses.find(horse => horse.id === horseId) || null;
}

function renderProfile() {
    if (!currentHorse) {
        showError("Hesten blev ikke fundet. Gå tilbage til hesteoversigten.");
        return;
    }

    document.getElementById("profileError").hidden = true;
    document.getElementById("profileContent").hidden = false;

    setText("profileName", currentHorse.name);
    setText("profileId", currentHorse.id);
    setText("profileSubtitle",
        displayValue(currentHorse.breed) + " · " +
        displayValue(currentHorse.sex));

    setText("profileBreed", displayValue(currentHorse.breed));
    setText("profileSex", displayValue(currentHorse.sex));
    setText("profileAge", formatAge(currentHorse));

    const birthDate = Number.isInteger(currentHorse.birthYear) &&
        Number.isInteger(currentHorse.birthMonth) &&
        currentHorse.birthMonth >= 1 &&
        currentHorse.birthMonth <= 12
        ? MONTH_NAMES[currentHorse.birthMonth - 1] +
          " år " + currentHorse.birthYear
        : "Ikke registreret";

    setText("profileBirthDate", birthDate);
    setText("profileBreeder", displayValue(currentHorse.breeder));
    setText("profileOwner", displayValue(
        currentHorse.ownerName || savedData.player?.name,
        "Ikke registreret"
    ));

    // Udseende: vis kun faktiske data, hvis de findes.
    setText("profileColor", displayValue(currentHorse.color));
    setText("profileMarkings", displayValue(currentHorse.markings));
    setText("profileManeTail", displayValue(currentHorse.maneTailColor));
    setText("profileHeight",
        currentHorse.heightCm
            ? currentHorse.heightCm + " cm"
            : "Ikke registreret");
    setText("profilePersonality", displayValue(currentHorse.personality));
    setText("profileTemperament", displayValue(currentHorse.temperament));

    // Genetik: kendte data og spillerens gæt vises separat.
    setText("profileKnownGenetics",
        displayValue(currentHorse.genetics, "Ingen genetiske oplysninger registreret."));

    setText("profileGeneticGuesses",
        displayValue(currentHorse.geneticGuesses, "Ingen gæt registreret."));

    // Stamtavle og avl.
    setText("profileFather", displayValue(currentHorse.fatherName));
    setText("profileMother", displayValue(currentHorse.motherName));

    const offspringCount = Array.isArray(currentHorse.offspringIds)
        ? currentHorse.offspringIds.length
        : 0;

    setText("profileOffspring", offspringCount + " registreret");
    setText("profileApproval", displayValue(currentHorse.breedingApproval, "Ikke opnået"));
    setText("profileAssociation", displayValue(currentHorse.breedingAssociation));

    // Sport: vis ikke resultater, som spillet endnu ikke registrerer.
    setText("profileCompetitionLevel",
        displayValue(currentHorse.competitionLevel, "Ikke startet"));
    setText("profileStarts", displayValue(currentHorse.competitionStarts, "0"));
    setText("profileWins", displayValue(currentHorse.competitionWins, "0"));
    setText("profileBestResult",
        displayValue(currentHorse.bestCompetitionResult, "Ingen resultater"));

    // Økonomi.
    setText("profilePurchasePrice", formatMoney(currentHorse.purchasePrice));
    setText("profileMarketValue",
        currentHorse.marketValue === undefined
            ? "Ikke beregnet"
            : formatMoney(currentHorse.marketValue));
    setText("profileInsurance", displayValue(currentHorse.insurance));
    setText("profileEquipment", displayValue(currentHorse.equipment));

    // Sundhed og historik.
    setText("profileHealth", displayValue(currentHorse.healthStatus));
    setText("profileInjuries", displayValue(currentHorse.injuries, "Ingen registreret"));
    setText("profileLastActivity", displayValue(currentHorse.lastActivity));

    renderHistory();

    document.title = currentHorse.name + " | Hestespillet";
}

function renderHistory() {
    const list = document.getElementById("profileHistory");
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
        } else {
            const date = event.date ? event.date + " – " : "";
            item.textContent = date + displayValue(event.description, "Begivenhed");
        }

        list.appendChild(item);
    });
}

function openNameEditor() {
    document.getElementById("editName").value = currentHorse.name;
    document.getElementById("editProfileSection").hidden = false;
    document.getElementById("editProfileSection").scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}

function saveName(event) {
    event.preventDefault();

    const name = document.getElementById("editName").value.trim();

    if (!name) {
        alert("Skriv venligst hestens navn.");
        return;
    }

    const oldName = currentHorse.name;
    currentHorse.name = name;

    if (!saveGameData()) {
        currentHorse.name = oldName;
        return;
    }

    document.getElementById("editProfileSection").hidden = true;
    renderProfile();
    showStatus("Hestens navn er gemt.");
}

function openGeneticsEditor() {
    document.getElementById("editGenetics").value =
        typeof currentHorse.geneticGuesses === "string"
            ? currentHorse.geneticGuesses
            : "";

    document.getElementById("editGeneticsSection").hidden = false;
    document.getElementById("editGeneticsSection").scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}

function saveGeneticGuesses(event) {
    event.preventDefault();

    const guesses = document.getElementById("editGenetics").value.trim();
    const oldGuesses = currentHorse.geneticGuesses;

    currentHorse.geneticGuesses = guesses;

    if (!saveGameData()) {
        currentHorse.geneticGuesses = oldGuesses;
        return;
    }

    document.getElementById("editGeneticsSection").hidden = true;
    renderProfile();
    showStatus("Dine genetiske gæt er gemt.");
}

document.getElementById("editProfileButton").addEventListener(
    "click", openNameEditor
);

document.getElementById("editProfileSection").addEventListener(
    "submit", saveName
);

document.getElementById("cancelProfileEditButton").addEventListener(
    "click", function() {
        document.getElementById("editProfileSection").hidden = true;
    }
);

document.getElementById("editGeneticsButton").addEventListener(
    "click", openGeneticsEditor
);

document.getElementById("editGeneticsSection").addEventListener(
    "submit", saveGeneticGuesses
);

document.getElementById("cancelGeneticsButton").addEventListener(
    "click", function() {
        document.getElementById("editGeneticsSection").hidden = true;
    }
);

if (loadGameData()) {
    currentHorse = findCurrentHorse();
    renderProfile();
}
