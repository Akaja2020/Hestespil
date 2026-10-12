
// profile.js

const STORAGE_KEY = "hestespil_horses_v1";

let horses = [];
let currentHorse = null;

let gameCalendar = {
    year: 1,
    month: 1
};

const MONTH_NAMES = [
    "Januar",
    "Februar",
    "Marts",
    "April",
    "Maj",
    "Juni",
    "Juli",
    "August",
    "September",
    "Oktober",
    "November",
    "December"
];


// ========================================
// BEREGN HESTENS ALDER
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

    const monthText =
        age.months +
        (age.months === 1 ? " måned" : " måneder");

    return age.years + " år og " + monthText;
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

            // Giv ældre heste en fødselsdato.
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
        }

    } catch (error) {
        showError("De gemte heste kunne ikke indlæses.");
        return false;
    }

    return true;
}


// ========================================
// GEM SPILLET
// ========================================

function saveHorses() {
    try {
        const savedData = localStorage.getItem(STORAGE_KEY);
        let nextHorseId = 1;

        if (savedData !== null) {
            const data = JSON.parse(savedData);
            nextHorseId = data.nextHorseId || 1;
        }

        horses.forEach(function(horse) {
            if (typeof horse.id === "string") {
                const number = Number(horse.id.slice(2));

                if (number >= nextHorseId) {
                    nextHorseId = number + 1;
                }
            }
        });

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
                horses: horses,
                nextHorseId: nextHorseId,
                calendar: gameCalendar
            })
        );

        return true;

    } catch (error) {
        showError("Ændringerne kunne ikke gemmes.");
        return false;
    }
}


// ========================================
// FIND HESTEN FRA SIDENS URL
// ========================================

function findCurrentHorse() {
    const parameters = new URLSearchParams(window.location.search);
    const horseId = parameters.get("id");

    if (!horseId) {
        return null;
    }

    return horses.find(function(horse) {
        return horse.id === horseId;
    }) || null;
}


// ========================================
// VIS FEJLBESKED
// ========================================

function showError(message) {
    const errorBox = document.getElementById("profileError");

    errorBox.textContent = message;
    errorBox.hidden = false;
}


// ========================================
// VIS HESTENS PROFIL
// ========================================

function renderProfile() {
    if (!currentHorse) {
        showError(
            "Vi kunne ikke finde hesten. Gå tilbage til hesteoversigten."
        );

        document.getElementById("profileContent").hidden = true;
        return;
    }

    document.getElementById("profileError").hidden = true;
    document.getElementById("profileContent").hidden = false;

    document.getElementById("profileId").textContent =
        currentHorse.id;

    document.getElementById("profileName").textContent =
        currentHorse.name;

    document.getElementById("profileSubtitle").textContent =
        currentHorse.breed + " · " + currentHorse.sex;

    document.getElementById("profileBreed").textContent =
        currentHorse.breed;

    document.getElementById("profileSex").textContent =
        currentHorse.sex;

    document.getElementById("profileAge").textContent =
        formatAge(currentHorse);

    document.getElementById("profileBirthDate").textContent =
        MONTH_NAMES[currentHorse.birthMonth - 1] +
        " år " +
        currentHorse.birthYear;

    document.title = currentHorse.name + " | Hestespillet";
}


// ========================================
// ÅBN REDIGERING AF NAVN
// ========================================

function openProfileEditor() {
    if (!currentHorse) {
        return;
    }

    document.getElementById("editName").value =
        currentHorse.name;

    document.getElementById("editProfileSection").hidden = false;

    document.getElementById("editProfileSection").scrollIntoView({
        behavior: "smooth"
    });
}


// ========================================
// GEM NAVNEÆNDRING
// ========================================

function saveProfileChanges() {
    if (!currentHorse) {
        return;
    }

    const name =
        document.getElementById("editName").value.trim();

    if (name === "") {
        alert("Skriv venligst hestens navn.");
        return;
    }

    const oldName = currentHorse.name;
    currentHorse.name = name;

    if (!saveHorses()) {
        currentHorse.name = oldName;
        return;
    }

    document.getElementById("editProfileSection").hidden = true;
    renderProfile();
}


// ========================================
// FORBIND KNAPPERNE
// ========================================

document
    .getElementById("editProfileButton")
    .addEventListener("click", openProfileEditor);

document
    .getElementById("saveProfileButton")
    .addEventListener("click", saveProfileChanges);

document
    .getElementById("cancelProfileEditButton")
    .addEventListener("click", function() {
        document.getElementById("editProfileSection").hidden = true;
    });


// ========================================
// START PROFILSIDEN
// ========================================

if (loadHorses()) {
    currentHorse = findCurrentHorse();
    renderProfile();
}
