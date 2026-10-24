
/*
 * Opstaldningsgårde – præsentationsside.
 * Denne fil ændrer ikke spillets gemte data.
 * Valg af opstaldningsgård og betaling kobles først på,
 * når lejesystemet er bygget.
 */

document.addEventListener("DOMContentLoaded", function () {
  const status = document.getElementById("boardingStatus");

  if (status) {
    status.textContent =
      "Du har endnu ikke valgt en opstaldningsgård. " +
      "Der trækkes ikke penge, og dine gemte spildata ændres ikke.";
  }
});

