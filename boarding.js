
document.addEventListener("DOMContentLoaded", function () {
  const STORAGE_KEY = "hestespil_boarding_v1";
  const STABLE_STORAGE_KEY = "hestespil_stable_horses_v1";
  const GAME_STORAGE_KEY = "hestespil_horses_v1";
  const PENDING_LEASE_KEY = "hestespil_pending_lease_horse_v1";

  const MONTHLY_RENT = 2000;
  const status = document.getElementById("boardingStatus");
  const cards = document.querySelectorAll(".boarding-card");
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
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  }

  function money(amount) {
    return Number(amount || 0).toLocaleString("da-DK") + " kr.";
  }

  function getPendingLease() {
    return readJSON(PENDING_LEASE_KEY);
  }

  function getChoice() {
    return readJSON(STORAGE_KEY);
  }

  function setStatus(message) {
    if (status) status.textContent = message;
  }

  function getHorseFromStable(horseId) {
    const horses = readJSON(STABLE_STORAGE_KEY);
    if (!Array.isArray(horses)) return null;

    return horses.find(function (horse) {
      return horse && horse.id === horseId;
    }) || null;
  }

  function getHorseName(horse) {
    return horse.name || horse.id || "Den valgte hest";
  }

  function render() {
    const choice = getChoice();
    const pending = getPendingLease();
    const horse = pending ? getHorseFromStable(pending.horseId) : null;
    const canLease = isLeaseFlow && pending && horse && !processing;

    cards.forEach(function (card, index) {
      const button = card.querySelector("button");
      const farm = farms[index];

      if (!button || !farm) return;

      button.disabled = !canLease;
      button.textContent =
        choice && choice.id === farm.id
          ? "Valgt gård ✓"
          : "Vælg gård";

      card.classList.toggle(
        "boarding-selected",
        Boolean(choice && choice.id === farm.id)
      );
    });

    if (!isLeaseFlow) {
      setStatus(
        "Vælg først en hest i stalden, hvis du vil leje den. " +
        "Det koster ikke noget at besøge eller vælge en gård."
      );
      return;
    }

    if (!pending) {
      setStatus(
        "Du mangler at vælge en hest. Gå tilbage til stalden og vælg en hest først."
      );
      return;
    }

    if (!horse) {
      setStatus(
        "Den valgte hest findes ikke længere i stalden. Gå tilbage og vælg en hest igen."
      );
      return;
    }

    if (choice) {
      setStatus(
        "Du er ved at leje " + getHorseName(horse) +
        ". Valgt opstaldning: " + choice.name + " (" +
        money(choice.price) + " pr. måned). " +
        "Leje koster " + money(MONTHLY_RENT) +
        " pr. måned. Der trækkes først penge, når du bekræfter lejen."
      );
    } else {
      setStatus(
        "Du er ved at leje " + getHorseName(horse) +
        ". Vælg en gård. Leje koster " + money(MONTHLY_RENT) +
        " pr. måned, og opstaldning kommer oveni. " +
        "Der trækkes ikke penge, før du bekræfter lejen."
      );
    }
  }

  function chooseFarm(farm) {
    if (processing) return;

    if (!isLeaseFlow) {
      setStatus(
        "Vælg først en hest i stalden. Gården koster ikke noget at vælge alene."
      );
      return;
    }

    const pending = getPendingLease();
    if (!pending || !pending.horseId) {
      setStatus("Vælg først en hest i stalden.");
      return;
    }

    const horse = getHorseFromStable(pending.horseId);
    if (!horse) {
      setStatus("Hesten blev ikke fundet i stalden. Gå tilbage og vælg den igen.");
      return;
    }

    const game = readJSON(GAME_STORAGE_KEY);
    if (!game || !Array.isArray(game.horses)) {
      setStatus("Spildata kunne ikke læses. Ingen betaling er gennemført.");
      return;
    }

    if (
      game.horses.some(function (item) {
        return item && item.id === pending.horseId;
      })
    ) {
      setStatus("Denne hest er allerede registreret i spillet.");
      return;
    }

    const balance = Number(game.money);
    if (!Number.isFinite(balance)) {
      setStatus("Spillets saldo kunne ikke læses. Ingen betaling er gennemført.");
      return;
    }

    const total = MONTHLY_RENT + farm.price;

    if (balance < total) {
      setStatus(
        "Du har ikke nok penge til første måneds leje og opstaldning. " +
        "Du skal bruge " + money(total) + ". Din saldo er " + money(balance) + "."
      );
      return;
    }

    const confirmed = window.confirm(
      "Vil du leje " + getHorseName(horse) + " og opstalde den på " +
      farm.name + "?\n\n" +
      "Leje første måned: " + money(MONTHLY_RENT) + "\n" +
      "Opstaldning første måned: " + money(farm.price) + "\n" +
      "I alt nu: " + money(total) + "\n\n" +
      "Der trækkes først penge, hvis du bekræfter."
    );

    if (!confirmed) return;

    if (typeof window.leaseHorse !== "function") {
      setStatus(
        "Lejesystemet blev ikke indlæst. Ingen betaling er gennemført. " +
        "Kontrollér script-rækkefølgen i boarding.html."
      );
      return;
    }

    processing = true;
    cards.forEach(function (card) {
      const button = card.querySelector("button");
      if (button) button.disabled = true;
    });

    try {
      // Betalingen og flytningen af hesten udføres kun i stable.js.
      window.leaseHorse(pending.horseId, farm.id);
    } catch (error) {
      processing = false;
      setStatus(
        "Lejen kunne ikke startes. Kontrollér spillets data, før du prøver igen."
      );
      render();
    }
  }

  cards.forEach(function (card, index) {
    const button = card.querySelector("button");
    const farm = farms[index];

    if (!button || !farm) return;

    button.addEventListener("click", function () {
      chooseFarm(farm);
    });
  });

  render();
});
