
(function () {
    'use strict';

    const KEY = 'hestespil_boarding_v1';

    const STABLES = {
        enggaarden: {
            id: 'enggaarden',
            name: 'Enggården',
            price: 1500
        },
        skovly: {
            id: 'skovly',
            name: 'Skovly',
            price: 2500
        },
        hoejgaard: {
            id: 'hoejgaard',
            name: 'Højgård Ridecenter',
            price: 3000
        }
    };

    const money = n => Number(n).toLocaleString('da-DK') + ' kr.';

    function read() {
        try {
            const x = JSON.parse(localStorage.getItem(KEY) || 'null');
            return x && STABLES[x.id] ? x : null;
        } catch (e) {
            return null;
        }
    }

    function render() {
        const current = read();

        document.querySelectorAll('.boarding-card').forEach(card => {
            const chosen = current && card.dataset.stable === current.id;
            card.classList.toggle('selected', !!chosen);

            const button = card.querySelector('button');

            if (button) {
                button.textContent = chosen
                    ? 'Valgt opstaldning'
                    : 'Vælg ' + STABLES[card.dataset.stable].name;

                button.disabled = !!chosen;
            }
        });

        const title = document.getElementById('currentBoardingTitle');
        const desc = document.getElementById('currentBoardingText');
        const status = document.getElementById('boardingStatus');
        const price = document.getElementById('budgetBoarding');
        const remaining = document.getElementById('budgetRemaining');

        if (!current) {
            title.textContent = 'Du har ikke valgt opstaldning endnu';
            desc.textContent = 'Vælg et af de tre opstaldningssteder nedenfor.';
            status.textContent = 'Vælg dit opstaldningssted. Dit valg gemmes i denne browser.';
            price.textContent = 'Ikke valgt';
            remaining.textContent = 'Afhænger af dit valg';
            return;
        }

        const stable = STABLES[current.id];
        const shown = current.pendingId
            ? STABLES[current.pendingId]
            : stable;

        title.textContent = current.pendingId
            ? 'Næste måned: ' + shown.name
            : stable.name;

        desc.textContent = 'Opstaldning koster ' + money(shown.price) + ' pr. måned inkl. foder.';

        status.textContent = current.pendingId
            ? 'Dit nuværende sted er ' + stable.name +
              '. Skiftet til ' + shown.name +
              ' træder i kraft ved næste månedsskifte.'
            : 'Dit nuværende valg er ' + stable.name +
              '. Et eventuelt skift træder i kraft ved næste månedsskifte.';

        price.textContent = '− ' + money(shown.price);

        remaining.textContent = money(
            20000 - 7500 - 4000 - shown.price
        );
    }

    function choose(id) {
        if (!STABLES[id]) return;

        const current = read();

        if (current && current.id === id && !current.pendingId) {
            return;
        }

        const chosen = current
            ? {
                ...current,
                pendingId: id,
                pendingName: STABLES[id].name,
                pendingPrice: STABLES[id].price,
                changedAt: Date.now()
            }
            : {
                id: id,
                name: STABLES[id].name,
                price: STABLES[id].price,
                changedAt: Date.now()
            };

        try {
            localStorage.setItem(KEY, JSON.stringify(chosen));

            document.getElementById('boardingStatus').textContent =
                'Valget er gemt. ' + STABLES[id].name +
                ' gælder fra næste månedsskifte, hvor månedsprisen bogføres.';

            render();
        } catch (e) {
            document.getElementById('boardingStatus').textContent =
                'Valget kunne ikke gemmes i browseren. Prøv igen.';
        }
    }

    document.querySelectorAll('[data-choose]').forEach(button => {
        button.addEventListener('click', () => {
            choose(button.dataset.choose);
        });
    });

    render();
})();

