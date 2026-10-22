const STORAGE_KEY = "hestespil_horses_v1";
const horseGrid = document.getElementById("horseGrid");
const horseCount = document.getElementById("horseCount");
const horseMessage = document.getElementById("horseMessage");
function createTextElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    element.textContent = text;
    return element;
}
function getHorseValue(horse, keys, fallback = "Ikke angivet") {
    for (const key of keys) {
        const value = horse[key];
        if (value !== undefined && value !== null && String(value).trim() !== "") {
            return String(value);
        }
    }
    return fallback;
}
function renderHorses() {
    horseGrid.replaceChildren();
    horseMessage.textContent = "";
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (!savedData) {
        horseCount.textContent = "Hestene kunne ikke indlæses.";
        horseMessage.textContent =
            "Der blev ikke fundet gemte spildata. Gå til forsiden og kontrollér spillet.";
        return;
    }
    let gameData;
    try {
        gameData = JSON.parse(savedData);
    } catch (error) {
        horseCount.textContent = "Hestene kunne ikke indlæses.";
        horseMessage.textContent =
            "De gemte data kunne ikke læses. Ingen data er blevet ændret.";
        console.error("Fejl ved indlæsning af heste:", error);
        return;
    }
    if (!gameData || !Array.isArray(gameData.horses)) {
        horseCount.textContent = "Hestene kunne ikke indlæses.";
        horseMessage.textContent =
            "Spillets hestedata har et uventet format. Ingen data er blevet ændret.";
        return;
    }
    const horses = gameData.horses;
    horseCount.textContent =
        horses.length === 1
            ? "Du har 1 hest i stalden."
            : `Du har ${horses.length} heste i stalden.`;
    if (horses.length === 0) {
        horseMessage.textContent =
            "Du har endnu ingen heste. Gå til forsiden for at komme i gang.";
        return;
    }
    horses.forEach(function (horse) {
        const card = document.createElement("article");
        card.className = "horse-card";
        const image = document.createElement("img");
        image.className = "horse-card-image";
        image.src = "Horse-illustration.JPEG";
        image.alt = "Illustration af en hest";
        image.loading = "lazy";
        const details = document.createElement("div");
        details.className = "horse-card-content";
        const name = createTextElement(
            "h2",
            "horse-card-title",
            getHorseValue(horse, ["name", "horseName"], "Hest uden navn")
        );
        const breed = createTextElement(
            "p",
            "horse-card-detail",
            "Race: " + getHorseValue(horse, ["breed", "race"])
        );
        const gender = createTextElement(
            "p",
            "horse-card-detail",
            "Køn: " + getHorseValue(horse, ["gender", "sex"])
        );
        const profileLink = document.createElement("a");
        profileLink.className = "button";
        profileLink.href = "profile.html?id=" + encodeURIComponent(horse.id);
        profileLink.textContent = "Åbn hesteprofil";
        details.append(name, breed, gender, profileLink);
        card.append(image, details);
        horseGrid.appendChild(card);
    });
}
renderHorses();