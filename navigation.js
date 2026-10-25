
document.addEventListener("DOMContentLoaded", function () {
    "use strict";

    const currentPage = (
        window.location.pathname.split("/").pop() || "index.html"
    ).toLowerCase();

    const menu = `
        <nav class="main-nav" aria-label="Hovedmenu">
            <a class="nav-brand" href="index.html">🐴 Horsedreams Online</a>

            <div class="nav-links" aria-label="Spillets sektioner">
                <a class="nav-link" href="index.html">Forside</a>

                <details class="nav-dropdown">
                    <summary>Profil</summary>
                    <div class="dropdown-panel">
                        <a href="player.html">Spillerprofil</a>
                        <a href="economy.html">Økonomi</a>
                    </div>
                </details>

                <details class="nav-dropdown">
                    <summary>Marked</summary>
                    <div class="dropdown-panel">
                        <a href="stable.html">Lejehestegården</a>
                        <span class="dropdown-coming">Hestemarked (kommer senere)</span>
                        <span class="dropdown-coming">Udstyr (kommer senere)</span>
                    </div>
                </details>

                <details class="nav-dropdown">
                    <summary>Min gård</summary>
                    <div class="dropdown-panel">
                        <a href="boarding.html">Opstaldningsgårde</a>
                        <a href="horses.html">Hesteoversigt</a>
                        <span class="dropdown-coming">Faciliteter (kommer senere)</span>
                    </div>
                </details>

                <details class="nav-dropdown">
                    <summary>Aktiviteter</summary>
                    <div class="dropdown-panel">
                        <a href="calendar.html">Kalender</a>
                        <span class="dropdown-coming">Konkurrencer (kommer senere)</span>
                        <span class="dropdown-coming">Kåringer (kommer senere)</span>
                    </div>
                </details>

                <details class="nav-dropdown">
                    <summary>Hestesundhed</summary>
                    <div class="dropdown-panel">
                        <span class="dropdown-coming">Dyrlæge (kommer senere)</span>
                        <span class="dropdown-coming">Smed (kommer senere)</span>
                        <span class="dropdown-coming">Sundhed og behandling (kommer senere)</span>
                    </div>
                </details>
            </div>

            <section class="game-time-bar" aria-label="Spillets tid">
                <div class="game-time-current">
                    <span id="gameYear">År 1</span>
                    <strong id="gameMonth">Januar</strong>
                    <span id="gameSeason">Vinter</span>
                </div>
                <button id="nextMonthButton" type="button" disabled>
                    Næste måned
                </button>
                <p id="gameTimeStatus" role="status" aria-live="polite">
                    Spillets tid indlæses …
                </p>
            </section>
        </nav>
    `;

    const existingNav = document.querySelector(".main-nav");

    if (existingNav) {
        existingNav.outerHTML = menu;
    } else {
        document.body.insertAdjacentHTML("afterbegin", menu);
    }

    // Markér den aktuelle side i menuen.
    document.querySelectorAll(".main-nav a.nav-link[href]").forEach(function (link) {
        const targetPage = link.getAttribute("href").toLowerCase();

        if (targetPage === currentPage) {
            link.setAttribute("aria-current", "page");
        }
    });

    // Luk andre undermenuer, når en undermenu åbnes.
    const dropdowns = document.querySelectorAll(".nav-dropdown");

    dropdowns.forEach(function (dropdown) {
        dropdown.addEventListener("toggle", function () {
            if (!dropdown.open) return;

            dropdowns.forEach(function (otherDropdown) {
                if (otherDropdown !== dropdown) {
                    otherDropdown.open = false;
                }
            });
        });
    });
});
