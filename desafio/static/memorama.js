let seleccionadas = [];
let puntos = 0;

document.querySelectorAll('.item').forEach(card => {
    card.addEventListener('click', () => {
        if (card.classList.contains('match') || card.classList.contains('flipped')) return;

        card.classList.add('flipped');
        seleccionadas.push(card);

        if (seleccionadas.length === 2) {
            const [c1, c2] = seleccionadas;
            if (c1.dataset.id === c2.dataset.id && c1.dataset.tipo !== c2.dataset.tipo) {
                c1.classList.add('match');
                c2.classList.add('match');
                puntos += 10;
            } else {
                setTimeout(() => {
                    c1.classList.remove('flipped');
                    c2.classList.remove('flipped');
                }, 1000);
            }
            seleccionadas = [];
        }
    });
});
