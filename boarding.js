
/*
 * Opstaldningsgårde – valg og gemt gård.
 * Månedlig betaling kobles til spillets månedsskifte.
 */

document.addEventListener("DOMContentLoaded", function () {
  const status = document.getElementById("boardingStatus");
  const cards = document.querySelectorAll(".boarding-card");

  const STORAGE_KEY = "hestespil_boarding_v1";

  const farms = [
    { id: "enggaarden", name: "Enggården", price: 1500 },
    { id: "skovly", name: "Skovly", price: 2500 },
    { id: "hojgaard", name: "Højgård Ridecenter", price: 3000 }
  ];

  function getChoice() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  }

  function render() {
    const choice = getChoice();

    cards.forEach(function (card, index) {
      const button = card.querySelector("button");
      const farm = farms[index];

      if (!button || !farm) return;

      button.disabled = false;
      button.textContent =
        choice && choice.id === farm.id ? "Valgt gård ✓" : "Vælg gård";

      card.classList.toggle(
        "boarding-selected",
        Boolean(choice && choice.id === farm.id)
      );
    });

    if (status) {
      status.textContent = choice
        ? "Du har valgt " + choice.name + ". Opstaldning koster " +
          choice.price.toLocaleString("da-DK") +
          " kr. pr. måned. Betaling håndteres ved månedsskift."
        : "Du har endnu ikke valgt en opstaldningsgård.";
    }
  }

  cards.forEach(function (card, index) {
    const button = card.querySelector("button");
    const farm = farms[index];

    if (!button || !farm) return;

    button.addEventListener("click", function () {
      const previous = getChoice();

      const choice = {
        id: farm.id,
        name: farm.name,
        price: farm.price,
        changedAt: new Date().toISOString(),
        pending: Boolean(previous && previous.id !== farm.id)
      };

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(choice));
        render();
      } catch (error) {
        if (status) {
          status.textContent =
            "Gården kunne ikke gemmes. Kontrollér browserens lagerplads.";
        }
      }
    });
  });

  render();
});
