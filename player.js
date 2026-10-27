// ========================================
// SPILLERPROFIL
// ========================================
const STORAGE_KEY = "hestespil_horses_v1";
const playerIdElement = document.getElementById("playerId");
const playerNameInput = document.getElementById("playerName");
const saveButton = document.getElementById("savePlayerButton");
const message = document.getElementById("playerMessage");
let playerData = null;
function loadPlayer() {
    try {
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (!savedData) {
            playerIdElement.textContent =
                "Spildata blev ikke fundet. Gå til forsiden først.";
            saveButton.disabled = true;
            return;
        }
        const data = JSON.parse(savedData);
        if (!data || typeof data !== "object") {
            throw new Error("Spildata har et ugyldigt format.");
        }
        // Opret spillerdata, hvis de mangler.
        if (!data.player || typeof data.player !== "object") {
            data.player = {
                id: "P-000001",
                name: ""
            };
        }
        // Gendan spiller-ID, hvis det mangler.
        if (
            typeof data.player.id !== "string" ||
            !data.player.id.trim()
        ) {
            data.player.id = "P-000001";
        }
        if (typeof data.player.name !== "string") {
            data.player.name = "";
        }
        // Gem de reparerede data.
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        playerData = data.player;
        playerIdElement.textContent =
            "Spiller-ID: " + playerData.id;
        playerNameInput.value = playerData.name;
        saveButton.disabled = false;
        message.textContent = "";
    } catch (error) {
        console.error("Fejl ved indlæsning af spillerprofil:", error);
        playerIdElement.textContent =
            "Spillerprofilen kunne ikke indlæses.";
        saveButton.disabled = true;
    }
}
function savePlayer() {
    if (!playerData) {
        message.textContent = "Spillerdata blev ikke fundet.";
        return;
    }
    const newName = playerNameInput.value.trim();
    if (!newName) {
        message.textContent = "Skriv et spillernavn først.";
        return;
    }
    if (newName.length > 40) {
        message.textContent = "Navnet må højst være 40 tegn.";
        return;
    }
    try {
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (!savedData) {
            message.textContent =
                "Spillet blev ikke fundet. Gå til forsiden først.";
            return;
        }
        const data = JSON.parse(savedData);
        if (!data.player || data.player.id !== playerData.id) {
            message.textContent =
                "Spillerdata har ændret sig. Genindlæs siden.";
            return;
        }
        data.player.name = newName;
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(data)
        );
        playerData = data.player;
        playerNameInput.value = newName;
        message.textContent = "Spillernavnet er gemt.";
    } catch (error) {
        console.error("Fejl ved gemning af spillerprofil:", error);
        message.textContent = "Spillernavnet kunne ikke gemmes.";
    }
}
playerNameInput.addEventListener("input", function () {
    message.textContent = "";
});
saveButton.addEventListener("click", savePlayer);
loadPlayer();