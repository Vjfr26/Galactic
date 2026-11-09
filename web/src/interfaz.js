/* Interfaz de Galactic: menú, selección de sector, marcador (paneles laterales), pausa,
   resumen de sector, fin de partida y pantalla final. */

const CIAN = '#7ff3ff', ROSA = '#ff4fd8', ORO = '#ffd23f';

/** Lista de opciones navegable con teclado (↑ ↓ ← → ENTER) y con ratón o dedo. */
function crearMenu(escena, x, y, opciones, opts = {}) {
    const sep = opts.separacion ?? 50;
    const tam = opts.tam || 24;
    let sel = 0;
    const items = opciones.map((op, i) => {
        const t = escena.add.text(x, y + i * sep, op.texto, estiloTexto(tam, '#dfe8ff')).setOrigin(0.5).setDepth(60)
            .setInteractive({ useHandCursor: true });
        t.on('pointerover', () => { if (sel !== i) { sel = i; pintar(); Sonido.sfx('menu'); } });
        t.on('pointerdown', () => { Sonido.iniciar(); elegir(i); });
        return t;
    });
    const marcaI = escena.add.text(0, 0, '▸', estiloTexto(tam, ROSA)).setOrigin(0.5).setDepth(60);
    const marcaD = escena.add.text(0, 0, '◂', estiloTexto(tam, ROSA)).setOrigin(0.5).setDepth(60);
    escena.tweens.add({ targets: [marcaI, marcaD], alpha: 0.35, duration: 420, yoyo: true, repeat: -1 });
    function pintar() {
        items.forEach((t, i) => t.setColor(i === sel ? CIAN : '#dfe8ff').setScale(i === sel ? 1.08 : 1));
        const t = items[sel];
        marcaI.setPosition(t.x - t.displayWidth / 2 - 22, t.y);
        marcaD.setPosition(t.x + t.displayWidth / 2 + 22, t.y);
    }
    function elegir(i) { sel = i; pintar(); Sonido.sfx('elegir'); opciones[i].accion(items[i]); }
    const teclado = escena.input.keyboard;
    const antes = () => { sel = (sel + items.length - 1) % items.length; pintar(); Sonido.sfx('menu'); };
    const despues = () => { sel = (sel + 1) % items.length; pintar(); Sonido.sfx('menu'); };
    const ok = () => { Sonido.iniciar(); elegir(sel); };
    const teclas = { UP: antes, W: antes, LEFT: antes, A: antes, DOWN: despues, S: despues, RIGHT: despues, D: despues, ENTER: ok, SPACE: ok };
    for (const [k, f] of Object.entries(teclas)) teclado.on('keydown-' + k, f);
    pintar();
    return {
        items,
        destruir() {
            for (const [k, f] of Object.entries(teclas)) teclado.off('keydown-' + k, f);
            items.forEach((t) => t.destroy());
            marcaI.destroy(); marcaD.destroy();
        },
        setTexto(i, texto) { items[i].setText(texto); pintar(); },
        recolocar() { pintar(); },
    };
}

function panel(escena, x, y, w, h) {
    return escena.add.nineslice(x, y, 'panel', 0, w, h, 14, 14, 14, 14).setDepth(55);
}

function formatoTiempo(seg) {
    const m = Math.floor(seg / 60), s = Math.floor(seg % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
}

function formatoPuntos(n) { return String(Math.floor(n)).padStart(7, '0'); }

/** Fondo animado de espacio para el menú y las pantallas finales. */
function fondoEspacio(escena, tinte = 0xffffff, nebulosa = 0x3aa0ff, planeta = 'planeta1') {
    const capas = {
        base: escena.add.image(0, 0, 'degradado').setOrigin(0).setDisplaySize(ANCHO, ALTO).setTint(tinte),
        neb: escena.add.tileSprite(0, 0, ANCHO, ALTO, 'nebulosa').setOrigin(0).setTint(nebulosa).setAlpha(0.6).setBlendMode('ADD'),
        neb2: escena.add.tileSprite(0, 0, ANCHO, ALTO, 'nebulosa').setOrigin(0).setTint(0xff4fd8).setAlpha(0.25).setBlendMode('ADD').setTileScale(1.5),
        planeta: escena.add.image(ANCHO * 0.82, ALTO * 0.3, planeta).setScale(1.3),
        estrellas: ['estrellas1', 'estrellas2', 'estrellas3'].map((k) => escena.add.tileSprite(0, 0, ANCHO, ALTO, k).setOrigin(0)),
    };
    return (dt) => {
        capas.neb.tilePositionY -= 12 * dt;
        capas.neb2.tilePositionY -= 20 * dt;
        capas.estrellas.forEach((c, i) => { c.tilePositionY -= [25, 60, 130][i] * dt; });
        capas.planeta.y += 3 * dt;
    };
}

/* ===================================================================== */
class Menu extends Phaser.Scene {
    constructor() { super('Menu'); }

    create() {
        this.scene.stop('HUD');
        this.cameras.main.fadeIn(700, 0, 0, 0);
        this.moverFondo = fondoEspacio(this);
        // Naves de fondo cruzando
        this.time.addEvent({
            delay: 1800, loop: true, callback: () => {
                const tipo = Phaser.Utils.Array.GetRandom(['explorador', 'caza', 'kamikaze']);
                const x = Phaser.Math.Between(80, ANCHO - 80);
                const n = this.add.image(x, -40, tipo).setAlpha(0.55).setScale(0.8);
                this.tweens.add({ targets: n, y: ALTO + 60, x: x + Phaser.Math.Between(-120, 120), duration: Phaser.Math.Between(5000, 8000), onComplete: () => n.destroy() });
            },
        });
        // Nave del jugador flotando, con su llama
        const nave = this.nave = this.add.image(ANCHO / 2, ALTO - 104, 'player').setScale(0.7).setDepth(5);
        this.add.particles(0, 0, 'humo', {
            follow: nave, followOffset: { x: 0, y: 38 }, speedY: { min: 160, max: 260 }, speedX: { min: -20, max: 20 },
            lifespan: { min: 140, max: 260 }, scale: { start: 0.8, end: 0 }, alpha: { start: 0.9, end: 0 },
            tint: [0xff4fd8, 0xffb0f0, 0xff8a3d], blendMode: 'ADD', frequency: 14,
        }).setDepth(4);
        this.tweens.add({ targets: nave, y: ALTO - 116, x: ANCHO / 2 + 14, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

        // Título con resplandor
        // Margen alrededor del texto: sin él, el resplandor se corta en un rectángulo
        const brillo = this.add.text(ANCHO / 2, 110, 'GALACTIC', estiloTexto(96, ROSA, { strokeThickness: 0 })).setOrigin(0.5).setAlpha(0.5).setBlendMode('ADD').setPadding(48);
        brillo.setShadow(0, 0, ROSA, 34, false, true);
        const titulo = this.add.text(ANCHO / 2, 110, 'GALACTIC', estiloTexto(96, '#ffffff', { strokeThickness: 10, stroke: '#2a0a3a' })).setOrigin(0.5).setPadding(40);
        titulo.setShadow(0, 0, CIAN, 22, true, false);
        this.tweens.add({ targets: [titulo, brillo], scale: 1.03, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        this.add.text(ANCHO / 2, 176, TXT.lema, estiloTexto(17, '#cfe6ff', { fontStyle: '500' })).setOrigin(0.5);
        if (Progreso.datos.record) this.add.text(ANCHO / 2, 206, `${TXT.hud.record}  ${formatoPuntos(Progreso.datos.record)}`, estiloTexto(14, ORO)).setOrigin(0.5);

        this.mostrarPrincipal();
        Sonido.musica('menu');
        this.input.keyboard.on('keydown', () => Sonido.iniciar());
        this.input.on('pointerdown', () => Sonido.iniciar());
    }

    update(t, dt) { this.moverFondo(dt / 1000); }

    limpiarSub() {
        if (this.menu) this.menu.destruir();
        this.menu = null;
        (this.sub || []).forEach((o) => o.destroy());
        this.sub = [];
    }

    mostrarPrincipal() {
        this.limpiarSub();
        const d = Progreso.datos;
        const hayProgreso = d.desbloqueado > 1 || d.estrellas.some((e) => e > 0);
        this.sub = [panel(this, ANCHO / 2, 368, 380, 250)];
        this.menu = crearMenu(this, ANCHO / 2, 290, [
            { texto: hayProgreso ? TXT.continuar : TXT.jugar, accion: () => this.empezar(hayProgreso ? d.desbloqueado - 1 : 0) },
            { texto: TXT.sectores, accion: () => this.mostrarSectores() },
            { texto: TXT.controles, accion: () => this.mostrarControles() },
            { texto: Sonido.activo ? TXT.sonidoSi : TXT.sonidoNo, accion: () => this.menu.setTexto(3, Sonido.alternar() ? TXT.sonidoSi : TXT.sonidoNo) },
        ], { separacion: 52, tam: 24 });
        this.sub.push(this.add.text(ANCHO / 2, 510, TouchControls.enabled ? TXT.toca : TXT.pulsa, estiloTexto(13, '#9fb6d9', { fontStyle: '500' })).setOrigin(0.5).setDepth(60));
    }

    mostrarSectores() {
        this.limpiarSub();
        const d = Progreso.datos;
        this.sub = [];
        SECTORES.forEach((s, i) => {
            const x = ANCHO / 2 + (i - 1) * 300, y = 380;
            const abierto = i < d.desbloqueado;
            const tarjeta = panel(this, x, y, 270, 250).setAlpha(abierto ? 1 : 0.55);
            const pl = this.add.image(x, y - 50, s.fondo.planeta).setScale(0.55).setDepth(56).setTint(abierto ? 0xffffff : 0x444455);
            this.sub.push(tarjeta, pl,
                this.add.text(x, y + 26, `${TXT.sector} ${i + 1}`.toUpperCase(), estiloTexto(14, ROSA)).setOrigin(0.5).setDepth(56),
                this.add.text(x, y + 52, TXT.nombres[i], estiloTexto(18, '#ffffff')).setOrigin(0.5).setDepth(56));
            if (abierto) {
                for (let k = 0; k < 3; k++) this.sub.push(this.add.image(x - 34 + k * 34, y + 88, 'estrella', k < d.estrellas[i] ? 0 : 1).setScale(0.7).setDepth(56));
                if (d.puntos[i]) this.sub.push(this.add.text(x, y + 114, formatoPuntos(d.puntos[i]), estiloTexto(12, ORO)).setOrigin(0.5).setDepth(56));
                tarjeta.setInteractive({ useHandCursor: true }).on('pointerdown', () => { Sonido.iniciar(); Sonido.sfx('elegir'); this.empezar(i); });
            } else {
                this.sub.push(this.add.image(x, y - 50, 'iconos', 3).setScale(1.6).setDepth(57));
                this.sub.push(this.add.text(x, y + 92, TXT.bloqueado, estiloTexto(13, '#7f8aa6')).setOrigin(0.5).setDepth(56));
            }
        });
        this.menu = crearMenu(this, ANCHO / 2, 538, [
            ...SECTORES.slice(0, d.desbloqueado).map((s, i) => ({ texto: `${TXT.sector} ${i + 1}`, accion: () => this.empezar(i) })),
            { texto: TXT.volver, accion: () => this.mostrarPrincipal() },
        ], { separacion: 0, tam: 18 });
        const n = this.menu.items.length;
        this.menu.items.forEach((t, i) => t.setPosition(ANCHO / 2 + (i - (n - 1) / 2) * 190, 538));
        this.menu.recolocar();
    }

    mostrarControles() {
        this.limpiarSub();
        this.sub = [panel(this, ANCHO / 2, 402, 760, 336)];
        TXT.listaControles.forEach(([tecla, accion], i) => {
            this.sub.push(this.add.text(ANCHO / 2 - 30, 268 + i * 34, tecla, estiloTexto(15, CIAN)).setOrigin(1, 0.5).setDepth(56));
            this.sub.push(this.add.text(ANCHO / 2 - 10, 268 + i * 34, accion, estiloTexto(15, '#e6eeff', { fontStyle: '500' })).setOrigin(0, 0.5).setDepth(56));
        });
        this.menu = crearMenu(this, ANCHO / 2, 534, [{ texto: TXT.volver, accion: () => this.mostrarPrincipal() }], { tam: 20 });
    }

    empezar(sector) {
        if (this.saliendo) return;
        this.saliendo = true;
        Sonido.iniciar();
        this.cameras.main.fadeOut(450, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Juego', { sector }));
    }
}

/* ===================================================================== */
/* Marcador: dos paneles laterales con todo el estado, y avisos sobre el campo de juego. */
class HUD extends Phaser.Scene {
    constructor() { super('HUD'); }

    create(datos) {
        this.indice = datos.sector;
        const juego = this.juego = this.scene.get('Juego');
        // Viñeta de daño solo sobre el campo
        this.vineta = this.add.rectangle(CAMPO.x0, 0, CAMPO.w, ALTO, 0xff2040, 0).setOrigin(0);
        this.vineta.setStrokeStyle(26, 0xff2040, 0.0);

        // Paneles y marco del campo
        // Fondo de los paneles: estrellas quietas y el cristal encima
        for (const x of [0, CAMPO.x1]) {
            this.add.image(x, 0, 'degradado').setOrigin(0).setDisplaySize(320, ALTO).setTint(0x8090c0).setDepth(-1);
            this.add.tileSprite(x, 0, 320, ALTO, 'estrellas1').setOrigin(0).setDepth(-1).setAlpha(0.6);
        }
        panel(this, 160, ALTO / 2, 320, ALTO).setDepth(0);
        panel(this, ANCHO - 160, ALTO / 2, 320, ALTO).setDepth(0);
        const marco = this.add.graphics().setDepth(1);
        marco.lineStyle(2, 0x7ff3ff, 0.55);
        marco.lineBetween(CAMPO.x0, 0, CAMPO.x0, ALTO); marco.lineBetween(CAMPO.x1, 0, CAMPO.x1, ALTO);
        marco.lineStyle(8, 0x7ff3ff, 0.08);
        marco.lineBetween(CAMPO.x0, 0, CAMPO.x0, ALTO); marco.lineBetween(CAMPO.x1, 0, CAMPO.x1, ALTO);

        const etiqueta = (x, y, s, color = '#8fa3c7') => this.add.text(x, y, s, estiloTexto(13, color, { strokeThickness: 0 })).setOrigin(0, 0.5).setDepth(2);
        // --- Panel izquierdo
        const t = this.add.text(160, 54, 'GALACTIC', estiloTexto(34, '#ffffff', { strokeThickness: 5, stroke: '#2a0a3a' })).setOrigin(0.5).setDepth(2).setPadding(24);
        t.setShadow(0, 0, ROSA, 16, true, false);
        this.add.text(160, 90, `${TXT.sector} ${this.indice + 1} · ${TXT.nombres[this.indice]}`, estiloTexto(12, CIAN, { strokeThickness: 0, fontStyle: '500' })).setOrigin(0.5).setDepth(2);
        etiqueta(34, 150, TXT.hud.puntos);
        this.tPuntos = this.add.text(34, 182, '0', estiloTexto(32, '#ffffff', { strokeThickness: 0 })).setOrigin(0, 0.5).setDepth(2);
        etiqueta(34, 230, TXT.hud.record);
        this.tRecord = this.add.text(34, 256, formatoPuntos(Progreso.datos.record), estiloTexto(18, ORO, { strokeThickness: 0 })).setOrigin(0, 0.5).setDepth(2);
        etiqueta(34, 318, TXT.hud.combo);
        this.tCombo = this.add.text(34, 356, 'x1', estiloTexto(38, ROSA, { strokeThickness: 0 })).setOrigin(0, 0.5).setDepth(2);
        this.tCadena = this.add.text(286, 356, '', estiloTexto(14, '#dfe8ff', { strokeThickness: 0 })).setOrigin(1, 0.5).setDepth(2);
        this.add.rectangle(34, 392, 252, 6, 0x2a3150).setOrigin(0, 0.5).setDepth(2);
        this.barraCombo = this.add.rectangle(34, 392, 252, 6, 0xff4fd8).setOrigin(0, 0.5).setDepth(3);
        etiqueta(34, 450, TXT.hud.progreso);
        this.add.rectangle(34, 480, 228, 10, 0x2a3150).setOrigin(0, 0.5).setDepth(2);
        this.barraProgreso = this.add.rectangle(34, 480, 228, 10, 0x7ff3ff).setOrigin(0, 0.5).setDepth(3);
        this.add.image(278, 480, 'kamikaze').setScale(0.5).setDepth(3);
        if (!TouchControls.enabled) {
            this.add.text(160, 610, TXT.listaControles.slice(0, 4).map(([k, v]) => `${k}  ${v}`).join('\n'), estiloTexto(10, '#7f8aa6', { strokeThickness: 0, fontStyle: '500', align: 'center', lineSpacing: 6 })).setOrigin(0.5).setDepth(2);
        }

        // --- Panel derecho
        const xd = CAMPO.x1 + 34;
        etiqueta(xd, 54, TXT.hud.escudo);
        this.add.rectangle(xd, 84, 252, 18, 0x2a3150).setOrigin(0, 0.5).setDepth(2).setStrokeStyle(1, 0x7ff3ff, 0.4);
        this.barraEscudo = this.add.rectangle(xd + 2, 84, 248, 14, 0x7dff8a).setOrigin(0, 0.5).setDepth(3);
        this.tEscudo = this.add.text(xd + 252, 54, '100', estiloTexto(13, '#ffffff', { strokeThickness: 0 })).setOrigin(1, 0.5).setDepth(2);
        etiqueta(xd, 140, TXT.hud.vidas);
        this.iconosVidas = [];
        etiqueta(xd, 222, TXT.hud.bombas);
        this.iconosBombas = [];
        etiqueta(xd, 304, TXT.hud.arma);
        this.pipsArma = [0, 1, 2, 3, 4].map((i) => this.add.rectangle(xd + i * 51, 336, 44, 14, 0x2a3150).setOrigin(0, 0.5).setDepth(2));
        etiqueta(xd, 394, TXT.hud.poderes);
        this.filasPoder = ['S', 'M', 'D'].map((l, i) => {
            const y = 430 + i * 44;
            const icono = this.add.image(xd + 14, y, 'capsula_' + l).setScale(0.85).setDepth(2);
            const fondo = this.add.rectangle(xd + 40, y, 210, 8, 0x2a3150).setOrigin(0, 0.5).setDepth(2);
            const barra = this.add.rectangle(xd + 40, y, 210, 8, Phaser.Display.Color.HexStringToColor(Arte.CAPSULAS[l][0]).color).setOrigin(0, 0.5).setDepth(3);
            return { l, icono, fondo, barra };
        });
        const boton = (x, frame, accion) => this.add.image(x, ALTO - 44, 'iconos', frame).setDepth(2).setInteractive({ useHandCursor: true })
            .on('pointerdown', (p, lx, ly, ev) => { ev.stopPropagation(); accion(); });
        this.botonSonido = boton(ANCHO - 96, Sonido.activo ? 1 : 2, () => Bus.emit('hud:sonido', Sonido.alternar()));
        boton(ANCHO - 48, 0, () => Bus.emit('pausar'));

        // --- Barra del jefe (arriba del campo)
        this.barraJefe = this.add.container(ANCHO / 2, 30).setVisible(false).setDepth(5);
        this.tJefe = this.add.text(0, -2, '', estiloTexto(13, '#ff9ab0', { strokeThickness: 3 })).setOrigin(0.5, 1);
        this.rellenoJefe = this.add.rectangle(-280, 10, 560, 10, 0xff3b5c).setOrigin(0, 0.5);
        this.barraJefe.add([this.tJefe, this.add.rectangle(0, 10, 566, 16, 0x05060f).setStrokeStyle(2, 0xff4fd8, 0.8), this.rellenoJefe]);

        this.mostrarTitulo();
        this.actualizarTodo();
        const escuchar = {
            'hud:todo': () => this.actualizarTodo(),
            'hud:escudo': () => this.actualizarTodo(),
            'hud:poder': (l, texto) => this.anuncio(l, texto),
            'hud:pista': (texto) => this.pista(texto),
            'hud:aviso': (a, b, ms) => this.aviso(a, b, ms),
            'hud:alerta': () => this.alerta(),
            'hud:jefe': (nombre, p) => this.actualizarJefe(nombre, p),
            'hud:sonido': (activo) => this.botonSonido.setFrame(activo ? 1 : 2),
            'hud:danio': () => this.danio(),
            'hud:multiplicador': (m) => this.tweens.add({ targets: this.tCombo, scale: 1.5, duration: 120, yoyo: true }),
            'hud:comboRoto': () => this.tweens.add({ targets: this.tCombo, alpha: 0.2, duration: 80, yoyo: true, repeat: 2 }),
        };
        for (const [ev, fn] of Object.entries(escuchar)) Bus.on(ev, fn);
        this.events.once('shutdown', () => { for (const [ev, fn] of Object.entries(escuchar)) Bus.off(ev, fn); });
    }

    update() {
        const j = this.juego;
        if (!j || !j.nave) return;
        this.tPuntos.setText(formatoPuntos(j.puntos));
        if (j.puntos > Progreso.datos.record) this.tRecord.setText(formatoPuntos(j.puntos));
        this.tCombo.setText('x' + j.multiplicador);
        this.tCadena.setText(j.combo ? `${j.combo}` : '');
        this.barraCombo.width = 252 * Math.max(0, j.tCombo / 2.2);
        this.barraProgreso.width = 228 * Math.min(1, j.tGuion / duracionSector(this.indice));
        const n = j.nave;
        for (const f of this.filasPoder) {
            const resto = f.l === 'S' ? n.burbuja / 3 : n.poderes[f.l] / (f.l === 'M' ? 12 : 15);
            f.barra.width = 210 * Math.max(0, resto);
            const on = resto > 0;
            f.icono.setAlpha(on ? 1 : 0.25); f.fondo.setAlpha(on ? 1 : 0.4);
        }
    }

    actualizarTodo() {
        const n = this.juego.nave;
        if (!n) return;
        const e = Math.max(0, n.escudo);
        this.barraEscudo.width = 248 * e / 100;
        this.barraEscudo.setFillStyle(e > 60 ? 0x7dff8a : e > 30 ? 0xffd23f : 0xff3b5c);
        this.tEscudo.setText(String(Math.ceil(e)));
        const xd = CAMPO.x1 + 34;
        this.iconosVidas.forEach((i) => i.destroy());
        this.iconosVidas = Array.from({ length: Math.max(0, n.vidas) }, (_, i) => this.add.image(xd + 18 + i * 42, 176, 'player').setScale(0.28).setDepth(2));
        this.iconosBombas.forEach((i) => i.destroy());
        this.iconosBombas = Array.from({ length: n.bombas }, (_, i) => this.add.image(xd + 16 + i * 40, 258, 'iconos', 4).setDepth(2));
        this.pipsArma.forEach((p, i) => p.setFillStyle(i < n.arma ? 0xffd23f : 0x2a3150));
    }

    mostrarTitulo() {
        const c = this.add.container(ANCHO / 2, ALTO / 2 - 60).setAlpha(0).setDepth(10);
        c.add([
            this.add.text(0, -34, `${TXT.sector} ${this.indice + 1}`.toUpperCase(), estiloTexto(20, ROSA)).setOrigin(0.5),
            this.add.text(0, 10, TXT.nombres[this.indice], estiloTexto(40, '#ffffff', { strokeThickness: 7 })).setOrigin(0.5),
        ]);
        this.tweens.chain({
            targets: c,
            tweens: [{ alpha: 1, y: ALTO / 2 - 70, duration: 600, delay: 300 }, { alpha: 0, y: ALTO / 2 - 90, duration: 600, delay: 1800 }],
            onComplete: () => c.destroy(),
        });
    }

    /** Pistas en cola bajo la barra del jefe: no se pisan unas a otras. */
    pista(texto) {
        this.cola = this.cola || [];
        this.cola.push(texto);
        if (!this.pistaActiva) this.siguientePista();
    }

    siguientePista() {
        const texto = this.cola.shift();
        if (!texto) { this.pistaActiva = false; return; }
        this.pistaActiva = true;
        const t = this.add.text(0, 0, texto, estiloTexto(14, '#ffffff', { strokeThickness: 0, fontStyle: '500', wordWrap: { width: 520 }, align: 'center' })).setOrigin(0.5);
        const fondo = this.add.rectangle(0, 0, Math.min(580, t.width + 40), t.height + 18, 0x05060f, 0.8).setStrokeStyle(1.5, 0x7ff3ff, 0.7);
        const c = this.add.container(ANCHO / 2, 92, [fondo, t]).setAlpha(0).setDepth(8);
        this.tweens.chain({
            targets: c,
            tweens: [{ alpha: 1, y: 98, duration: 260 }, { alpha: 0, duration: 320, delay: this.cola.length ? 2600 : 3600 }],
            onComplete: () => { c.destroy(); this.siguientePista(); },
        });
    }

    anuncio(letra, texto) {
        const color = Arte.CAPSULAS[letra][0];
        const t = this.add.text(ANCHO / 2, ALTO - 150, texto.toUpperCase(), estiloTexto(20, color, { strokeThickness: 5 })).setOrigin(0.5).setDepth(9).setScale(0.6).setAlpha(0);
        this.tweens.chain({
            targets: t,
            tweens: [{ alpha: 1, scale: 1, duration: 200, ease: 'Back.easeOut' }, { alpha: 0, y: ALTO - 190, duration: 500, delay: 900 }],
            onComplete: () => t.destroy(),
        });
        this.actualizarTodo();
    }

    aviso(titulo, sub, ms = 1600) {
        if (this.cAviso) this.cAviso.destroy();
        const c = this.cAviso = this.add.container(ANCHO / 2, ALTO / 2 - 60).setScale(0.6).setAlpha(0).setDepth(10);
        c.add(this.add.text(0, 0, titulo, estiloTexto(36, '#ffffff', { strokeThickness: 7 })).setOrigin(0.5));
        if (sub) c.add(this.add.text(0, 42, sub, estiloTexto(16, CIAN)).setOrigin(0.5));
        this.tweens.chain({
            targets: c,
            tweens: [{ alpha: 1, scale: 1, duration: 260, ease: 'Back.easeOut' }, { alpha: 0, duration: 400, delay: ms }],
            onComplete: () => c.destroy(),
        });
    }

    /** Aviso de jefe: franjas rojas y texto parpadeante sobre el campo. */
    alerta() {
        const c = this.add.container(ANCHO / 2, ALTO / 2 - 40).setDepth(10);
        const fondo = this.add.rectangle(0, 0, CAMPO.w, 120, 0x400010, 0.75);
        const franjas = this.add.graphics();
        franjas.fillStyle(0xff2a4a, 0.85);
        for (let i = -8; i < 9; i++) {
            franjas.fillTriangle(i * 40 - 10, -70, i * 40 + 10, -70, i * 40 - 10, -58);
            franjas.fillRect(i * 40 - 10, -70, 20, 8);
            franjas.fillRect(i * 40 - 10, 62, 20, 8);
        }
        const t = this.add.text(0, -10, TXT.alerta, estiloTexto(46, '#ff3b5c', { strokeThickness: 6 })).setOrigin(0.5);
        const s = this.add.text(0, 34, TXT.jefeAproxima.toUpperCase(), estiloTexto(14, '#ffd0d8', { strokeThickness: 3 })).setOrigin(0.5);
        c.add([fondo, franjas, t, s]);
        c.setScale(1, 0);
        this.tweens.add({ targets: c, scaleY: 1, duration: 220 });
        this.tweens.add({ targets: t, alpha: 0.2, duration: 180, yoyo: true, repeat: 7 });
        this.tweens.add({ targets: c, scaleY: 0, duration: 220, delay: 2500, onComplete: () => c.destroy() });
    }

    actualizarJefe(nombre, p) {
        if (nombre === null) { this.tweens.add({ targets: this.barraJefe, alpha: 0, duration: 400, onComplete: () => this.barraJefe.setVisible(false) }); return; }
        if (!this.barraJefe.visible) {
            this.barraJefe.setVisible(true).setAlpha(0);
            this.tweens.add({ targets: this.barraJefe, alpha: 1, duration: 300 });
        }
        this.tJefe.setText(nombre);
        this.rellenoJefe.width = 560 * p;
        this.rellenoJefe.setFillStyle(p > 0.66 ? 0xff3b5c : p > 0.33 ? 0xff8a3d : 0xffd23f);
    }

    danio() {
        this.vineta.setStrokeStyle(26, 0xff2040, 0.55);
        this.tweens.killTweensOf(this.vineta);
        const o = { a: 0.55 };
        this.tweens.add({ targets: o, a: 0, duration: 450, onUpdate: () => this.vineta.setStrokeStyle(26, 0xff2040, o.a) });
        this.actualizarTodo();
    }
}

/* ===================================================================== */
class Pausa extends Phaser.Scene {
    constructor() { super('Pausa'); }

    create(d) {
        this.add.rectangle(0, 0, ANCHO, ALTO, 0x02030a, 0.62).setOrigin(0);
        panel(this, ANCHO / 2, ALTO / 2, 420, 300);
        this.add.text(ANCHO / 2, ALTO / 2 - 100, TXT.pausa.toUpperCase(), estiloTexto(32, CIAN)).setOrigin(0.5).setDepth(60);
        const reanudar = () => { this.scene.stop(); this.scene.resume('Juego'); };
        this.menu = crearMenu(this, ANCHO / 2, ALTO / 2 - 30, [
            { texto: TXT.reanudar, accion: reanudar },
            { texto: TXT.reiniciar, accion: () => { this.scene.stop('Juego'); this.scene.start('Juego', { sector: d.sector }); } },
            { texto: TXT.salir, accion: () => { this.scene.stop('Juego'); this.scene.stop('HUD'); this.scene.start('Menu'); } },
        ], { separacion: 54, tam: 22 });
        this.input.keyboard.on('keydown-P', reanudar);
        this.input.keyboard.on('keydown-ESC', reanudar);
    }
}

/* ===================================================================== */
class Resumen extends Phaser.Scene {
    constructor() { super('Resumen'); }

    create(d) {
        this.add.rectangle(0, 0, ANCHO, ALTO, 0x02030a, 0.55).setOrigin(0);
        const p = panel(this, ANCHO / 2, ALTO / 2 + 10, 620, 520).setScale(0.5).setAlpha(0);
        this.tweens.add({ targets: p, scale: 1, alpha: 1, duration: 320, ease: 'Back.easeOut' });
        const t = (x, y, s, tam, color, origen = 0.5) => this.add.text(x, y, s, estiloTexto(tam, color)).setOrigin(origen, 0.5).setDepth(60);
        t(ANCHO / 2, 128, TXT.completado.toUpperCase(), 30, CIAN);
        t(ANCHO / 2, 166, `${TXT.sector} ${d.sector + 1} · ${TXT.nombres[d.sector]}`, 15, '#dfe8ff');
        d.estrellas.forEach((ok, i) => {
            const x = ANCHO / 2 + (i - 1) * 120;
            const e = this.add.image(x, 232, 'estrella', ok ? 0 : 1).setScale(0).setDepth(60);
            const et = t(x, 280, TXT.estrellas[i], 11, ok ? '#ffffff' : '#7f8aa6');
            et.setWordWrapWidth(110).setAlign('center').setAlpha(0);
            this.tweens.add({ targets: e, scale: 1.6, duration: 380, delay: 450 + i * 380, ease: 'Back.easeOut', onStart: () => ok && Sonido.sfx('estrella') });
            this.tweens.add({ targets: et, alpha: 1, duration: 300, delay: 450 + i * 380 });
        });
        const filas = [
            [TXT.enemigos, `${Math.round(d.ratio * 100)} %`],
            [TXT.mejorCombo, String(d.mejorCombo)],
            [TXT.vidas, String(d.vidasPerdidas)],
            [TXT.tiempo, formatoTiempo(d.tiempo)],
        ];
        filas.forEach(([k, v], i) => { t(ANCHO / 2 - 230, 334 + i * 32, k, 15, '#9fb6d9', 0); t(ANCHO / 2 + 230, 334 + i * 32, v, 15, '#ffffff', 1); });
        t(ANCHO / 2 - 230, 476, TXT.puntos, 20, ORO, 0);
        const total = t(ANCHO / 2 + 230, 476, '0', 24, ORO, 1);
        const cont = { n: 0 };
        this.tweens.add({ targets: cont, n: d.puntos, duration: 1200, delay: 1500, onUpdate: () => total.setText(formatoPuntos(cont.n)) });
        const ultimo = d.sector >= SECTORES.length - 1;
        this.time.delayedCall(900, () => {
            this.menu = crearMenu(this, ANCHO / 2, 548, [
                ultimo ? { texto: TXT.verFinal, accion: () => this.irA('Final', { puntos: d.puntos }) }
                    : { texto: TXT.siguiente, accion: () => this.irA('Juego', { sector: d.sector + 1, herencia: d.herencia }) },
                { texto: TXT.reintentar, accion: () => this.irA('Juego', { sector: d.sector }) },
                { texto: TXT.menu, accion: () => this.irA('Menu') },
            ], { separacion: 0, tam: 17 });
            const n = this.menu.items.length;
            this.menu.items.forEach((it, i) => it.setPosition(ANCHO / 2 + (i - (n - 1) / 2) * 200, 548));
            this.menu.recolocar();
        });
    }

    irA(escena, datos) {
        this.scene.stop('Juego');
        this.scene.stop('HUD');
        this.scene.start(escena, datos);
    }
}

/* ===================================================================== */
class FinPartida extends Phaser.Scene {
    constructor() { super('FinPartida'); }

    create(d) {
        this.add.rectangle(0, 0, ANCHO, ALTO, 0x12020a, 0.65).setOrigin(0);
        panel(this, ANCHO / 2, ALTO / 2, 500, 320);
        const tit = this.add.text(ANCHO / 2, ALTO / 2 - 104, TXT.finPartida, estiloTexto(34, '#ff3b5c', { strokeThickness: 6 })).setOrigin(0.5).setDepth(60);
        this.tweens.add({ targets: tit, alpha: 0.5, duration: 500, yoyo: true, repeat: -1 });
        this.add.text(ANCHO / 2, ALTO / 2 - 50, formatoPuntos(d.puntos), estiloTexto(26, ORO)).setOrigin(0.5).setDepth(60);
        Sonido.musica('menu');
        this.menu = crearMenu(this, ANCHO / 2, ALTO / 2 + 20, [
            { texto: TXT.reintentarSector, accion: () => this.irA('Juego', { sector: d.sector }) },
            { texto: TXT.salir, accion: () => this.irA('Menu') },
        ], { separacion: 54, tam: 22 });
    }

    irA(escena, datos) {
        this.scene.stop('Juego');
        this.scene.stop('HUD');
        this.scene.start(escena, datos);
    }
}

/* ===================================================================== */
class Final extends Phaser.Scene {
    constructor() { super('Final'); }

    create(d) {
        this.cameras.main.fadeIn(900, 0, 0, 0);
        this.moverFondo = fondoEspacio(this, 0xffffff, 0x7ff3ff, 'planeta1');
        const nave = this.add.image(ANCHO / 2, ALTO - 130, 'player').setScale(0.8);
        this.tweens.add({ targets: nave, y: ALTO - 150, duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        const fuegos = this.add.particles(0, 0, 'chispa', { lifespan: { min: 700, max: 1300 }, speed: { min: 60, max: 280 }, gravityY: 120, scale: { start: 0.9, end: 0 }, blendMode: 'ADD', emitting: false });
        this.time.addEvent({
            delay: 600, loop: true, callback: () => {
                fuegos.setParticleTint(Phaser.Utils.Array.GetRandom([0xffd23f, 0xff4fd8, 0x7ff3ff, 0x7dff8a, 0xc08cff]));
                fuegos.explode(46, Phaser.Math.Between(200, ANCHO - 200), Phaser.Math.Between(90, 300));
                Sonido.sfx('explosion');
            },
        });
        // Los puntos se acumulan de un sector al siguiente: el total es el de la partida
        const total = d && d.puntos ? d.puntos : Progreso.datos.record;
        const estrellas = Progreso.datos.estrellas.reduce((a, b) => a + b, 0);
        const t = (y, s, tam, color) => this.add.text(ANCHO / 2, y, s, estiloTexto(tam, color)).setOrigin(0.5);
        const tit = t(110, TXT.finTitulo, 46, '#ffffff').setScale(0.4).setAlpha(0).setPadding(30);
        tit.setShadow(0, 0, CIAN, 20, true, false);
        this.tweens.add({ targets: tit, scale: 1, alpha: 1, duration: 800, ease: 'Back.easeOut' });
        t(170, TXT.finTexto, 17, '#cfe6ff');
        t(232, `${TXT.totalPuntos}: ${formatoPuntos(total)}`, 22, ORO);
        t(270, `${TXT.totalEstrellas}: ${estrellas} / ${SECTORES.length * 3}`, 18, '#ffffff');
        t(320, TXT.gracias, 18, CIAN);
        t(ALTO - 22, TXT.creditos, 11, '#9fb6d9');
        Sonido.musica('fin');
        this.time.delayedCall(1300, () => {
            this.menu = crearMenu(this, ANCHO / 2, 384, [{ texto: TXT.menu, accion: () => this.scene.start('Menu') }], { tam: 22 });
        });
    }

    update(tt, dt) { this.moverFondo(dt / 1000); }
}
