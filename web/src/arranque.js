/* Escena de arranque: carga los gráficos originales, genera el arte por código y crea las
   animaciones. Con ?sector=N en la URL se entra directo a ese sector (útil para probar). */
class Arranque extends Phaser.Scene {
    constructor() { super('Arranque'); }

    preload() {
        const barra = this.add.rectangle(ANCHO / 2 - 160, ALTO / 2, 0, 8, 0xff4fd8).setOrigin(0, 0.5);
        this.add.rectangle(ANCHO / 2, ALTO / 2, 324, 16).setStrokeStyle(2, 0x7ff3ff);
        this.add.text(ANCHO / 2, ALTO / 2 - 34, TXT.cargando, estiloTexto(18)).setOrigin(0.5);
        this.load.on('progress', (p) => barra.setSize(320 * p, 8));
        this.load.image('player', 'player.png');
        for (const n of ['big1', 'big2', 'big3', 'big4', 'med1', 'med2', 'small1', 'small2']) this.load.image('meteorGrey_' + n, `meteorGrey_${n}.png`);
        for (let i = 0; i < 9; i++) this.load.image('regularExplosion0' + i, `regularExplosion0${i}.png`);
    }

    create() {
        Arte.generar(this);
        this.anims.create({ key: 'explota', frames: Array.from({ length: 9 }, (_, i) => ({ key: 'regularExplosion0' + i })), frameRate: 22, repeat: 0 });
        this.anims.create({ key: 'mina_parpadea', frames: this.anims.generateFrameNumbers('mina', { frames: [0, 0, 0, 1] }), frameRate: 6, repeat: -1 });
        const sector = parseInt(new URLSearchParams(location.search).get('sector'), 10);
        if (sector >= 1 && sector <= SECTORES.length) this.scene.start('Juego', { sector: sector - 1 });
        else this.scene.start('Menu');
    }
}
