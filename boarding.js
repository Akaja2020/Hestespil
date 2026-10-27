"use strict";
document.addEventListener("DOMContentLoaded", function () {
    const STORAGE_KEY = "hestespil_boarding_v1";
    const STABLE_STORAGE_KEY = "hestespil_stable_horses_v1";
    const GAME_STORAGE_KEY = "hestespil_horses_v1";
    const PENDING_LEASE_KEY = "hestespil_pending_lease_horse_v1";
    const MONTHLY_RENT = 2000;
    const status = document.getElementById("boardingStatus");
    const cards = Array.from(
        document.querySelectorAll(".boarding-card")
    );
    const isLeaseFlow =
        new URLSearchParams(window.location.search).get("lease") === "1";
    const farms = [
        { id: "enggaarden", name: "Enggården", price: 1500 },
        { id: "skovly", name: "Skovly", price: 2500 },
        { id: "hojgaard", name: "Højgård Ridecenter", price: 3000 }
    ];
    let processing = false;
    function readJSON(key) {
        try {
            const raw = localStorage.getItem(key);
            return raw === null ? null : JSON.parse(raw);
        } catch (error) {
            console.error("Kunne ikke læse gemte data:", key, error);
            return null;
        }
    }
    function money(amount) {
        const value = Number(amount);
        if (!Number.isFinite(value)) {
            return "ukendt beløb";
        }
        return value.toLocaleString("da-DK") + " kr.";
    }
    function setStatus(message) {
        if (status) {
            status.textContent = message;
        }
    }
    function getPendingLease() {
        return readJSON(PENDING_LEASE_KEY);
    }
    function getChoice() {
        return readJSON(STORAGE_KEY);
    }
    function getFarmById(farmId) {
        return farms.find(function (farm) {
            return farm.id === farmId;
        }) || null;
    }
    function getHorseFromStable(horseId) {
        const horses = readJSON(STABLE_STORAGE_KEY);
        if (!Array.isArray(horses)) {
            return null;
        }
        return horses.find(function (horse) {
            return horse && horse.id === horseId;
        }) || null;
    }
    function getHorseName(horse) {
        return horse && horse.name
            ? horse.name
            : "Den valgte hest";
    }
    function getValidChoice() {
        const choice = getChoice();
        if (!choice || typeof choice.id !== "string") {
            return null;
        }
        const farm = getFarmById(choice.id);
        if (!farm) {
            return null;
        }
        return farm;
    }
    function saveChoice(farm) {
        try {
            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify({
                    id: farm.id,
                    name: farm.name,
                    price: farm.price
                })
            );
            return true;
        } catch (error) {
            console.error("Gårdvalget kunne ikke gemmes:", error);
            setStatus(
                "Gårdvalget kunne ikke gemmes i browseren. " +
                "Ingen betaling er gennemført."
            );
            return false;
        }
    }
    function render() {
        const pending = getPendingLease();
        const horse = pending && pending.horseId
            ? getHorseFromStable(pending.horseId)
            : null;
        const choice = getValidChoice();
        cards.forEach(function (card, index) {
            const button = card.querySelector("button");
            const farm = farms[index];
            if (!button || !farm) {
                return;
            }
            const isSelected = Boolean(
                choice && choice.id === farm.id
            );
            button.disabled = processing;
            button.textContent = isSelected
                ? "Valgt gård ✓"
                : "Vælg gård";
            card.classList.toggle(
                "boarding-selected",
                isSelected
            );
        });
        if (!isLeaseFlow) {
            setStatus(
                choice
                    ? "Dit gemte gårdvalg er " + choice.name +
                      " (" + money(choice.price) + " pr. måned). " +
                      "Du kan vælge en anden gård. " +
                      "Der trækkes ikke penge ved almindeligt gårdvalg."
                    : "Vælg en gård for at gemme dit valg. " +
                      "Det koster ikke noget at vælge eller skifte gård her."
            );
            return;
        }
        if (!pending || !pending.horseId) {
            setStatus(
                "Du mangler at vælge en hest. " +
                "Gå tilbage til lejehestegården og vælg en hest først."
            );
            return;
        }
        if (!horse) {
            setStatus(
                "Den valgte hest blev ikke fundet i udlejningsstalden. " +
                "Ingen betaling er gennemført. Gå tilbage og vælg hesten igen."
            );
            return;
        }
        if (!choice) {
            setStatus(
                "Du er ved at leje " + getHorseName(horse) +
                ". Vælg en gård for at fortsætte. " +
                "Lejen er " + money(MONTHLY_RENT) +
                " pr. måned, og opstaldning kommer oveni. " +
                "Der trækkes ikke penge, før du bekræfter lejen."
            );
            return;
        }
        setStatus(
            "Du er ved at leje " + getHorseName(horse) +
            ". Valgt opstaldning: " + choice.name +
            " (" + money(choice.price) + " pr. måned). " +
            "Leje: " + money(MONTHLY_RENT) +
            " pr. måned. Samlet første betaling: " +
            money(MONTHLY_RENT + choice.price) +
            ". Klik på den valgte gård igen for at bekræfte lejen."
        );
    }
    function chooseFarm(farm) {
        if (processing) {
            return;
        }
        if (!isLeaseFlow) {
            if (!saveChoice(farm)) {
                return;
            }
            render();
            setStatus(
                farm.name + " er valgt. Prisen er " +
                money(farm.price) + " pr. måned. " +
                "Der er ikke trukket penge. " +
                "Du kan ændre gårdvalget når som helst."
            );
            return;
        }
        const pending = getPendingLease();
        if (!pending || !pending.horseId) {
            setStatus(
                "Vælg først en hest i lejehestegården."
            );
            return;
        }
        const horse = getHorseFromStable(pending.horseId);
        if (!horse) {
            setStatus(
                "Hesten blev ikke fundet i udlejningsstalden. " +
                "Ingen betaling er gennemført. Gå tilbage og vælg hesten igen."
            );
            return;
        }
        const game = readJSON(GAME_STORAGE_KEY);
        if (
            !game ||
            !Array.isArray(game.horses) ||
            !game.economy ||
            !Number.isFinite(game.economy.balance)
        ) {
            setStatus(
                "Spildata eller saldo kunne ikke læses korrekt. " +
                "Ingen betaling er gennemført."
            );
            return;
        }
        if (
            game.horses.some(function (item) {
                return item && item.id === pending.horseId;
            })
        ) {
            setStatus(
                "Hesten er allerede registreret i din hesteoversigt. " +
                "Ingen ny betaling er gennemført."
            );
            return;
        }
        if (
            game.horses.some(function (item) {
                return item &&
                    item.rental &&
                    item.rental.active === true;
            })
        ) {
            setStatus(
                "Du har allerede en aktiv lejehest. " +
                "Du kan kun leje én hest ad gangen."
            );
            return;
        }
        const previousChoice = getValidChoice();
        /*
         * Første klik gemmer gårdvalget.
         * Andet klik på samme gård beder om bekræftelse.
         */
        if (!previousChoice || previousChoice.id !== farm.id) {
            if (!saveChoice(farm)) {
                return;
            }
            render();
            setStatus(
                farm.name + " er valgt til " + getHorseName(horse) +
                ". Samlet første betaling er " +
                money(MONTHLY_RENT + farm.price) +
                ". Klik på 'Valgt gård ✓' for at bekræfte lejen."
            );
            return;
        }
        const total = MONTHLY_RENT + farm.price;
        const balance = game.economy.balance;
        if (balance < total) {
            setStatus(
                "Du har ikke nok penge til første måneds leje og opstaldning. " +
                "Du skal bruge " + money(total) +
                ". Din saldo er " + money(balance) +
                ". Ingen betaling er gennemført."
            );
            return;
        }
        const confirmed = window.confirm(
            "Vil du leje " + getHorseName(horse) +
            " og opstalde den på " + farm.name + "?\n\n" +
            "Leje første måned: " + money(MONTHLY_RENT) + "\n" +
            "Opstaldning første måned: " + money(farm.price) + "\n" +
            "Samlet betaling nu: " + money(total) + "\n" +
            "Saldo efter betaling: " + money(balance - total) +
            "\n\nDer trækkes kun penge, hvis du bekræfter."
        );
        if (!confirmed) {
            setStatus(
                "Lejen er ikke gennemført. " +
                "Der er ikke trukket penge. " +
                "Dit gårdvalg er gemt."
            );
            return;
        }
        if (typeof window.leaseHorse !== "function") {
            setStatus(
                "Lejesystemet blev ikke indlæst. " +
                "Ingen betaling er gennemført. " +
                "Kontrollér script-rækkefølgen i boarding.html."
            );
            return;
        }
        processing = true;
        cards.forEach(function (card) {
            const button = card.querySelector("button");
            if (button) {
                button.disabled = true;
            }
        });
        setStatus(
            "Lejen behandles. Vent venligst, og klik ikke igen."
        );
        try {
            /*
             * stable.js håndterer betaling, gemning af hesten
             * og fjernelse af hesten fra udlejningsstalden.
             * boarding.js må ikke trække penge selv.
             */
            window.leaseHorse(pending.horseId, farm.id);
        } catch (error) {
            console.error("Lejen kunne ikke startes:", error);
            processing = false;
            setStatus(
                "Lejen kunne ikke startes. Kontrollér spillets data, " +
                "før du prøver igen."
            );
            render();
        }
    }
    cards.forEach(function (card, index) {
        const button = card.querySelector("button");
        const farm = farms[index];
        if (!button || !farm) {
            return;
        }
        button.addEventListener("click", function () {
            chooseFarm(farm);
        });
    });
    render();
});