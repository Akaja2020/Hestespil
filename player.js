
"use strict";

// ========================================
// SPILLERPROFIL
// ========================================
const STORAGE_KEY = "hestespil_horses_v1";

const playerIdElement = document.getElementById("playerId");
const playerNameInput = document.getElementById("playerName");
const saveButton = document.getElementById("savePlayerButton");
const message = document.getElementById("playerMessage");

let playerData = null;

function showMessage(text) {
    if (message) {
        message.textContent = text;
    }
}

function loadPlayer() {
    try {
        const savedData = localStorage.getItem(STORAGE_KEY);

        if (!savedData) {
            if (playerIdElement) {
                playerIdElement.textContent =
                    "Spildata blev ikke fundet. Gå til forsiden først.";
            }

            if (saveButton) saveButton.disabled = true;
            showMessage("");
            return;
        }

        const data = JSON.parse(savedData);

        if (!data || typeof data !== "object" || Array.isArray(data)) {
            throw new Error("Spildata har et ugyldigt format.");
        }

        // Indlæs kun eksisterende spillerdata.
        // Denne funktion må ikke ændre eller gemme spildata.
        if (
            !data.player ||
            typeof data.player !== "object" ||
            Array.isArray(data.player) ||
            typeof data.player.id !== "string" ||
            !data.player.id.trim() ||
            typeof data.player.name !== "string"
        ) {
            playerData = null;

            if (playerIdElement) {
                playerIdElement.textContent =
                    "Spillerdata mangler eller er ugyldige. " +
                    "Dine gemte data er ikke ændret.";
            }

            if (playerNameInput) playerNameInput.value = "";
            if (saveButton) saveButton.disabled = true;

            showMessage("");
            return;
        }

        playerData = {
            id: data.player.id,
            name: data.player.name
        };

        if (playerIdElement) {
            playerIdElement.textContent =
                "Spiller-ID: " + playerData.id;
        }

        if (playerNameInput) {
            playerNameInput.value = playerData.name;
        }

        if (saveButton) saveButton.disabled = false;

        showMessage("");
    } catch (error) {
        console.error(
            "Fejl ved indlæsning af spillerprofil:",
            error
        );

        playerData = null;

        if (playerIdElement) {
            playerIdElement.textContent =
                "Spillerprofilen kunne ikke indlæses. " +
                "Dine gemte data er ikke ændret.";
        }

        if (saveButton) saveButton.disabled = true;

        showMessage("");
    }
}

function savePlayer() {
    if (!playerData) {
        showMessage("Spillerdata blev ikke fundet. Genindlæs siden.");
        return;
    }

    if (!playerNameInput) {
        showMessage("Feltet til spillernavnet blev ikke fundet.");
        return;
    }

    const newName = playerNameInput.value.trim();

    if (!newName) {
        showMessage("Skriv et spillernavn først.");
        return;
    }

    if (newName.length > 40) {
        showMessage("Navnet må højst være 40 tegn.");
        return;
    }

    try {
        const savedData = localStorage.getItem(STORAGE_KEY);

        if (!savedData) {
            showMessage(
                "Spillet blev ikke fundet. Gå til forsiden først."
            );
            return;
        }

        const data = JSON.parse(savedData);

        if (
            !data ||
            typeof data !== "object" ||
            Array.isArray(data) ||
            !data.player ||
            typeof data.player !== "object" ||
            Array.isArray(data.player) ||
            data.player.id !== playerData.id ||
            typeof data.player.name !== "string"
        ) {
            showMessage(
                "Spillerdata har ændret sig eller er ugyldige. " +
                "Genindlæs siden."
            );
            return;
        }

        // Opdater kun spillerens navn.
        // Alle øvrige gemte spiloplysninger bevares.
        data.player.name = newName;

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(data)
        );

        playerData.name = newName;
        playerNameInput.value = newName;

        showMessage("Spillernavnet er gemt.");
    } catch (error) {
        console.error(
            "Fejl ved gemning af spillerprofil:",
            error
        );

        showMessage("Spillernavnet kunne ikke gemmes.");
    }
}

if (playerNameInput) {
    playerNameInput.addEventListener("input", function () {
        showMessage("");
    });
}

if (saveButton) {
    saveButton.addEventListener("click", savePlayer);
}

loadPlayer();
