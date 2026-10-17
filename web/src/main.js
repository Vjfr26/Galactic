/* Punto de entrada: espera a la fuente y arranca Phaser. */
function arrancar() {
    TouchControls.init([{ name: 'bomba', label: '✸', side: 'right', aria: 'Bomb' }]);
    window.juego = new Phaser.Game({
        type: Phaser.AUTO,
        width: ANCHO,
        height: ALTO,
        parent: 'juego',
        backgroundColor: '#03040c',
        scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
        physics: { default: 'arcade', arcade: { gravity: { y: 0 }, debug: new URLSearchParams(location.search).has('debug') } },
        input: { activePointers: 3 },
        scene: [Arranque, Menu, Juego, HUD, Pausa, Resumen, FinPartida, Final],
    });
}

const fuente = new FontFace('Orbitron', 'url(fuente/Orbitron.ttf)', { weight: '400 900' });
fuente.load()
    .then((f) => { document.fonts.add(f); arrancar(); })
    .catch(arrancar);
