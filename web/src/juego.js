/* Escena de juego de Galactic: fondo, guion de oleadas, disparos, colisiones, premios,
   combos, bombas y jefes. El marcador lo pinta la escena HUD (interfaz.js). */

const Bus = new Phaser.Events.EventEmitter();

/** Progreso guardado en el navegador: sectores desbloqueados, estrellas y récords. */
const Progreso = {
    clave: 'galactic-progreso',
    datos: { desbloqueado: 1, estrellas: [0, 0, 0], puntos: [0, 0, 0], record: 0 },
    cargar() {
        try {
            const d = JSON.parse(localStorage.getItem(this.clave));
            if (d) Object.assign(this.datos, d);
        } catch (e) { /* sin almacenamiento */ }
    },
    guardar() {
        try { localStorage.setItem(this.clave, JSON.stringify(this.datos)); } catch (e) { /* sin almacenamiento */ }
    },
    completar(i, estrellas, puntos) {
        const d = this.datos;
        d.desbloqueado = Math.min(SECTORES.length, Math.max(d.desbloqueado, i + 2));
        d.estrellas[i] = Math.max(d.estrellas[i] || 0, estrellas);
        d.puntos[i] = Math.max(d.puntos[i] || 0, puntos);
        this.guardar();
    },
    record(puntos) {
        if (puntos > this.datos.record) { this.datos.record = puntos; this.guardar(); }
    },
};
Progreso.cargar();

function estiloTexto(tam, color = '#ffffff', extra = {}) {
    return Object.assign({
        fontFamily: 'Orbitron, sans-serif', fontSize: tam + 'px', fontStyle: '700', color,
        stroke: '#05060f', strokeThickness: Math.max(3, Math.round(tam / 6)),
    }, extra);
}

const PREMIOS = [['P', 42], ['R', 20], ['S', 10], ['M', 11], ['D', 11], ['B', 6]];
function premioAlAzar() {
    let r = Math.random() * PREMIOS.reduce((a, [, p]) => a + p, 0);
    for (const [l, p] of PREMIOS) { if ((r -= p) < 0) return l; }
    return 'P';
}

class Juego extends Phaser.Scene {
    constructor() { super('Juego'); }

    init(datos) {
        this.indice = (datos && datos.sector) || 0;
        this.def = SECTORES[this.indice];
        // Lo que se arrastra de un sector al siguiente dentro de la misma partida
        this.herencia = (datos && datos.herencia) || null;
    }

    create() {
        this.reloj = 0;
        this.tGuion = 0;
        this.indiceEvento = 0;
        this.lluvias = [];
        this.terminado = false;
        this.jefe = null;
        this.puntos = this.herencia ? this.herencia.puntos : 0;
        this.combo = 0; this.tCombo = 0; this.mejorCombo = 0;
        this.stats = { naves: 0, derribadas: 0, vidasPerdidas: 0 };
        this.pistasVistas = new Set();
        this.lentitud = 1;

        this.crearFondo();
        this.enemigos = this.add.group();
        this.lasers = this.physics.add.group({ classType: Phaser.Physics.Arcade.Image, maxSize: 300, allowGravity: false });
        this.misiles = this.add.group();
        this.balas = this.physics.add.group({ classType: Phaser.Physics.Arcade.Image, maxSize: 700, allowGravity: false });
        this.capsulas = this.physics.add.group({ allowGravity: false });
        this.rayos = [];
        this.crearEfectos();

        const n = this.nave = this.jugador = new Nave(this, ANCHO / 2, ALTO - 110);
        if (this.herencia) Object.assign(n, { vidas: this.herencia.vidas, bombas: this.herencia.bombas });
        // Cada sector empieza como mínimo con su arma inicial, aunque se viniera con menos
        n.arma = Math.max(this.def.armaInicial, this.herencia ? this.herencia.arma : 0);
        n.y = ALTO + 60;
        this.tweens.add({ targets: n, y: ALTO - 110, duration: 900, ease: 'Quad.easeOut' });

        this.physics.add.overlap(this.lasers, this.enemigos, this.impactoLaser, null, this);
        this.physics.add.overlap(this.misiles, this.enemigos, this.impactoMisil, null, this);
        this.physics.add.overlap(n, this.balas, this.impactoBala, null, this);
        this.physics.add.overlap(n, this.enemigos, this.choque, null, this);
        this.physics.add.overlap(n, this.capsulas, this.recoger, null, this);

        this.crearControles();
        this.scene.stop('HUD');
        this.scene.launch('HUD', { sector: this.indice });
        this.alPausar = () => this.pausar();
        Bus.on('pausar', this.alPausar);
        this.events.once('shutdown', () => { Bus.off('pausar', this.alPausar); this.tweens.killAll(); });
        this.cameras.main.fadeIn(600, 0, 0, 0);
        Sonido.musica(this.def.musica);
    }

    /* ------------------------------------------------------------------ fondo */

    crearFondo() {
        const f = this.def.fondo;
        // Solo dentro del campo: los paneles laterales tapan el resto (y así se pinta la mitad)
        const x0 = CAMPO.x0, w = CAMPO.w;
        this.fondoBase = this.add.image(x0, 0, 'degradado').setOrigin(0).setDisplaySize(w, ALTO).setTint(f.tinte).setDepth(-50);
        this.neb1 = this.add.tileSprite(x0, 0, w, ALTO, 'nebulosa').setOrigin(0).setTint(f.nebulosa).setAlpha(0.55).setBlendMode('ADD').setDepth(-45);
        this.neb2 = this.add.tileSprite(x0, 0, w, ALTO, 'nebulosa').setOrigin(0).setTint(f.nebulosa2).setAlpha(0.35).setBlendMode('ADD').setDepth(-44).setTileScale(1.4);
        this.planeta = this.add.image(CAMPO.x0 + 470, -160, f.planeta).setDepth(-42).setAlpha(0.9);
        this.capasEstrellas = ['estrellas1', 'estrellas2', 'estrellas3'].map((k, i) => this.add.tileSprite(x0, 0, w, ALTO, k).setOrigin(0).setDepth(-40 + i));
        this.velFondo = f.velocidad;
    }

    moverFondo(dt) {
        const v = this.velFondo * this.lentitud * (this.warp ? 8 : 1);
        this.neb1.tilePositionY -= 14 * v * dt;
        this.neb2.tilePositionY -= 22 * v * dt;
        this.capasEstrellas.forEach((c, i) => { c.tilePositionY -= [30, 70, 150][i] * v * dt; });
        this.planeta.y += 9 * v * dt;
        if (this.planeta.y > ALTO + 260) this.planeta.y = -260;
    }

    crearEfectos() {
        this.emChispas = this.add.particles(0, 0, 'chispa', {
            lifespan: 320, speed: { min: 80, max: 260 }, scale: { start: 0.9, end: 0 }, blendMode: 'ADD', emitting: false,
        }).setDepth(30);
        this.emFuego = this.add.particles(0, 0, 'humo', {
            lifespan: { min: 300, max: 700 }, speed: { min: 30, max: 220 }, scale: { start: 1.6, end: 0 }, alpha: { start: 0.9, end: 0 },
            tint: [0xffd23f, 0xff8a3d, 0xff4f3d, 0xffffff], blendMode: 'ADD', emitting: false,
        }).setDepth(29);
        this.emHumo = this.add.particles(0, 0, 'humo', {
            lifespan: { min: 600, max: 1200 }, speed: { min: 10, max: 70 }, scale: { start: 1.2, end: 2.6 }, alpha: { start: 0.35, end: 0 },
            tint: 0x6b7080, emitting: false,
        }).setDepth(28);
        this.emEsquirlas = this.add.particles(0, 0, 'esquirla', {
            lifespan: { min: 500, max: 1000 }, speed: { min: 120, max: 340 }, rotate: { start: 0, end: 720 }, scale: { start: 1, end: 0.4 },
            emitting: false,
        }).setDepth(29);
        this.emEstela = this.add.particles(0, 0, 'humo', {
            lifespan: 260, scale: { start: 0.7, end: 0 }, alpha: { start: 0.7, end: 0 }, blendMode: 'ADD', emitting: false,
        }).setDepth(9);
        this.emBrillo = this.add.particles(0, 0, 'px', {
            lifespan: 500, speed: { min: 40, max: 160 }, scale: { start: 1.3, end: 0 }, blendMode: 'ADD', emitting: false, tint: 0xfff2a0,
        }).setDepth(31);
    }

    /* ------------------------------------------------------------------ controles */

    crearControles() {
        this.teclas = this.input.keyboard.addKeys('LEFT,RIGHT,UP,DOWN,A,D,W,S,SPACE,Z,J,X,K,SHIFT,P,ESC,M');
        // Pulsaciones apuntadas al llegar el evento: JustDown de Phaser pierde las que se sueltan
        // antes del siguiente fotograma (toques rápidos o equipos lentos)
        this.pulsos = new Set();
        this.input.keyboard.on('keydown', (ev) => { Sonido.iniciar(); if (!ev.repeat) this.pulsos.add(ev.keyCode); });
        // Táctil: la nave se mueve lo mismo que el dedo (no salta a donde se toca)
        this.dedo = null;
        this.input.on('pointerdown', (p) => {
            Sonido.iniciar();
            if (!TouchControls.enabled || p.x < CAMPO.x0 - 60 || p.x > CAMPO.x1 + 60) return;
            this.dedo = { id: p.id, x: p.x, y: p.y, nx: this.nave.x, ny: this.nave.y };
        });
        this.input.on('pointermove', (p) => {
            if (!this.dedo || p.id !== this.dedo.id) return;
            this.dedo.tx = this.dedo.nx + (p.x - this.dedo.x) * 1.25;
            this.dedo.ty = this.dedo.ny + (p.y - this.dedo.y) * 1.25;
        });
        const soltar = (p) => { if (this.dedo && p.id === this.dedo.id) this.dedo = null; };
        this.input.on('pointerup', soltar);
        this.input.on('pointerupoutside', soltar);
    }

    leerControles() {
        const k = this.teclas;
        const p = this.pulsos;
        const pulsada = (...ts) => ts.some((t) => p.has(t.keyCode));
        const d = this.dedo;
        return {
            izq: k.LEFT.isDown || k.A.isDown,
            der: k.RIGHT.isDown || k.D.isDown,
            arriba: k.UP.isDown || k.W.isDown,
            abajo: k.DOWN.isDown || k.S.isDown,
            disparar: k.SPACE.isDown || k.Z.isDown || k.J.isDown || !!d,
            precision: k.SHIFT.isDown,
            objetivo: d && d.tx !== undefined ? { x: d.tx, y: d.ty } : null,
            bomba: pulsada(k.X, k.K) || TouchControls.consume('bomba'),
            pausa: pulsada(k.P, k.ESC),
            sonido: pulsada(k.M),
        };
    }

    /* ------------------------------------------------------------------ bucle */

    update(t, dtReal) {
        const dt = Math.min(dtReal, 50) / 1000 * this.lentitud;
        this.reloj += dt;
        const c = this.leerControles();
        this.pulsos.clear();
        if (c.pausa && !this.terminado) { this.pausar(); return; }
        if (c.sonido) Bus.emit('hud:sonido', Sonido.alternar());

        this.moverFondo(dt);
        const n = this.nave;
        n.actualizar(dt, this.terminado ? { disparar: false } : c);
        if (c.bomba && !this.terminado) this.bomba();

        if (!this.terminado) {
            this.tGuion += dt;
            this.avanzarGuion();
        }
        this.lluvia(dt);
        for (const e of [...this.enemigos.getChildren()]) if (e.active) e.actualizar(dt);
        this.actualizarMisiles(dt);
        this.actualizarCapsulas(dt);
        this.limpiarProyectiles();
        for (const r of this.rayos) r.actualizar();

        if (this.tCombo > 0) {
            this.tCombo -= dt;
            if (this.tCombo <= 0) this.combo = 0;
        }
    }

    /* ------------------------------------------------------------------ guion */

    avanzarGuion() {
        const ev = this.def.eventos;
        while (this.indiceEvento < ev.length && ev[this.indiceEvento].t <= this.tGuion) {
            this.ejecutar(ev[this.indiceEvento++]);
        }
    }

    ejecutar(e) {
        const xCampo = (f) => CAMPO.x0 + 40 + f * (CAMPO.w - 80);
        if (e.pista) {
            if (e.pista === 'precision' && TouchControls.enabled) return;
            Bus.emit('hud:pista', pista(e.pista));
        } else if (e.lluvia) {
            this.lluvias.push({ fin: this.tGuion + e.dur, ritmo: e.ritmo, grandes: e.grandes, acumulado: 0 });
        } else if (e.formacion) {
            this.formacion(e);
        } else if (e.nave) {
            this.anadirEnemigo(new NaveEnemiga(this, xCampo(e.x), -40, e.tipo, e.ruta || 'baja'));
        } else if (e.minas) {
            for (let i = 0; i < e.n; i++) this.anadirEnemigo(new NaveEnemiga(this, xCampo((i + 0.5) / e.n + Phaser.Math.FloatBetween(-0.05, 0.05)), -30 - (i % 2) * 70, 'mina'));
        } else if (e.carguero) {
            this.anadirEnemigo(new NaveEnemiga(this, xCampo(e.x), -60, 'carguero'));
        } else if (e.jefe) {
            this.llegaJefe();
        }
    }

    formacion(e) {
        const xCampo = (f) => CAMPO.x0 + 40 + f * (CAMPO.w - 80);
        for (let i = 0; i < e.n; i++) {
            let x, y, retardo = 0;
            if (e.ruta === 'barridoI' || e.ruta === 'barridoD') {
                // En fila india desde una esquina
                x = e.ruta === 'barridoI' ? CAMPO.x0 - 30 : CAMPO.x1 + 30;
                y = -20; retardo = i * 0.32;
            } else if (e.forma === 'v') {
                const k = i - (e.n - 1) / 2;
                x = xCampo(e.x) + k * 46; y = -40 - Math.abs(k) * 36;
            } else if (e.forma === 'columna') {
                x = xCampo(e.x); y = -40; retardo = i * 0.45;
            } else {
                x = xCampo(e.x) + (i - (e.n - 1) / 2) * 56; y = -40;
            }
            x = Phaser.Math.Clamp(x, CAMPO.x0 - 40, CAMPO.x1 + 40);
            this.anadirEnemigo(new NaveEnemiga(this, x, y, e.tipo, e.ruta, retardo));
        }
    }

    lluvia(dt) {
        for (const l of this.lluvias) {
            if (this.tGuion > l.fin) continue;
            l.acumulado += l.ritmo * dt;
            while (l.acumulado >= 1) {
                l.acumulado--;
                const r = Math.random();
                const tam = r < l.grandes ? 'grande' : r < l.grandes + 0.45 ? 'medio' : 'peque';
                const m = new Meteorito(this, Phaser.Math.Between(CAMPO.x0 + 30, CAMPO.x1 - 30), -60, tam, Phaser.Math.FloatBetween(-50, 50), Phaser.Math.FloatBetween(110, 210) * (tam === 'grande' ? 0.75 : 1));
                this.anadirEnemigo(m);
            }
        }
        this.lluvias = this.lluvias.filter((l) => this.tGuion <= l.fin);
    }

    anadirEnemigo(e) {
        this.enemigos.add(e);
        if (e.vel0) e.body.setVelocity(e.vel0[0], e.vel0[1]);
        if (e.cuenta && e.tipo !== 'jefe') this.stats.naves++;
        return e;
    }

    /* ------------------------------------------------------------------ disparos */

    laser(x, y, ang, tex = 'laser', dano = 1) {
        const l = this.lasers.get(x, y, tex);
        if (!l) return;
        l.setActive(true).setVisible(true).setTexture(tex).setRotation(ang).setDepth(15).setBlendMode('ADD').setAlpha(1);
        l.body.enable = true;
        l.body.reset(x, y);
        l.body.setSize(6, 18);
        l.dano = dano;
        this.physics.velocityFromRotation(ang - Math.PI / 2, 980, l.body.velocity);
    }

    lanzarMisil(x, y, lado) {
        const m = this.physics.add.image(x, y, 'misil').setDepth(15);
        m.body.setSize(8, 16);
        m.ang = -Math.PI / 2 + lado * 0.6;
        m.vel = 260;
        m.vida = 2.4;
        this.misiles.add(m);
    }

    actualizarMisiles(dt) {
        for (const m of [...this.misiles.getChildren()]) {
            m.vida -= dt;
            // Persigue al enemigo vivo más cercano que esté en pantalla
            let mejor = null, dmin = 1e9;
            for (const e of this.enemigos.getChildren()) {
                if (!e.active || !e.vivo || !e.visible || e.y < 0 || e.y > ALTO) continue;
                const d = Phaser.Math.Distance.Squared(m.x, m.y, e.x, e.y);
                if (d < dmin) { dmin = d; mejor = e; }
            }
            if (mejor) {
                const objetivo = Phaser.Math.Angle.Between(m.x, m.y, mejor.x, mejor.y);
                m.ang = Phaser.Math.Angle.RotateTo(m.ang, objetivo, 5.5 * dt);
            }
            m.vel = Math.min(620, m.vel + 900 * dt);
            m.setRotation(m.ang + Math.PI / 2);
            this.physics.velocityFromRotation(m.ang, m.vel, m.body.velocity);
            if (Math.random() < 0.7) this.estela(m.x - Math.cos(m.ang) * 10, m.y - Math.sin(m.ang) * 10, 0xff9a3d);
            if (m.vida <= 0 || m.y < -40 || m.y > ALTO + 40 || m.x < CAMPO.x0 - 40 || m.x > CAMPO.x1 + 40) m.destroy();
        }
    }

    /** Phaser invierte el orden de los objetos cuando el segundo es un grupo sin física: se ordenan aquí. */
    static ordenar(a, b) { return a.vivo !== undefined ? [b, a] : [a, b]; }

    impactoLaser(a, b) {
        const [l, e] = Juego.ordenar(a, b);
        if (!l.active || !e.vivo || !e.visible) return;
        if (e.herir(l.dano)) {
            this.emChispas.setParticleTint(e.color);
            this.emChispas.explode(2, l.x, l.y);
            Sonido.sfx('impacto');
        }
        l.disableBody(true, true);
    }

    impactoMisil(a, b) {
        const [m, e] = Juego.ordenar(a, b);
        if (!m.active || !e.vivo || !e.visible) return;
        e.herir(2.5);
        this.explosion(m.x, m.y, 0.35, 0xff9a3d);
        m.destroy();
    }

    /* Balas enemigas */
    bala(x, y, ang, vel, tex = 'bala_naranja', dano = 12) {
        if (this.terminado) return;
        const b = this.balas.get(x, y, tex);
        if (!b) return;
        b.setActive(true).setVisible(true).setTexture(tex).setDepth(16).setBlendMode('ADD').setScale(tex === 'aguja' ? 1 : 1.05);
        b.body.enable = true;
        b.body.reset(x, y);
        b.body.setCircle(tex === 'aguja' ? 4 : 5, tex === 'aguja' ? 1 : 5, tex === 'aguja' ? 9 : 5);
        b.setRotation(tex === 'aguja' ? ang - Math.PI / 2 : 0);
        b.dano = tex === 'aguja' ? 10 : dano;
        this.physics.velocityFromRotation(ang, vel, b.body.velocity);
    }

    apuntar(x, y) {
        const j = this.nave;
        return Phaser.Math.Angle.Between(x, y, j.x, j.y);
    }

    abanico(x, y, n, sep, vel, tex) {
        const base = this.apuntar(x, y);
        for (let i = 0; i < n; i++) this.bala(x, y, base + (i - (n - 1) / 2) * sep, vel, tex);
    }

    anillo(x, y, n, vel, tex, desfase = 0) {
        for (let i = 0; i < n; i++) this.bala(x, y, desfase + (i / n) * Math.PI * 2, vel, tex);
    }

    limpiarProyectiles() {
        for (const l of this.lasers.getChildren()) {
            if (l.active && (l.y < -30 || l.x < CAMPO.x0 - 30 || l.x > CAMPO.x1 + 30)) l.disableBody(true, true);
        }
        for (const b of this.balas.getChildren()) {
            if (b.active && (b.y > ALTO + 30 || b.y < -40 || b.x < CAMPO.x0 - 30 || b.x > CAMPO.x1 + 30)) b.disableBody(true, true);
        }
    }

    /** Haz de energía de un jefe: hace daño a la nave mientras esté encima. */
    crearRayo(x, y, ancho) {
        const img = this.add.image(x, y, 'rayo').setOrigin(0.5, 0).setDepth(14).setBlendMode('ADD');
        img.setDisplaySize(ancho, ALTO - y + 20);
        const nucleo = this.add.rectangle(x, y, ancho * 0.25, ALTO - y + 20, 0xffffff, 0.9).setOrigin(0.5, 0).setDepth(14);
        const brillo = this.add.image(x, y, 'brillo').setDepth(15).setScale(1.6).setTint(0xff4fd8).setBlendMode('ADD');
        img.scaleX = 0.1;
        this.tweens.add({ targets: img, displayWidth: ancho, duration: 120 });
        const rayo = {
            x, y, ancho, activo: true,
            mover: (nx, ny) => { rayo.x = nx; rayo.y = ny; img.setPosition(nx, ny); nucleo.setPosition(nx, ny); brillo.setPosition(nx, ny); },
            apagar: () => {
                rayo.activo = false;
                this.tweens.add({ targets: [img, nucleo, brillo], alpha: 0, duration: 160, onComplete: () => { img.destroy(); nucleo.destroy(); brillo.destroy(); } });
                this.rayos = this.rayos.filter((r) => r !== rayo);
            },
            actualizar: () => {
                nucleo.width = rayo.ancho * (0.2 + Math.random() * 0.1);
                const n = this.nave;
                if (rayo.activo && !n.muerto && Math.abs(n.x - rayo.x) < rayo.ancho / 2 - 4 && n.y > rayo.y) n.herir(18);
                if (Math.random() < 0.5) { this.emChispas.setParticleTint(0xff4fd8); this.emChispas.explode(1, rayo.x + Phaser.Math.Between(-10, 10), ALTO - 10); }
            },
        };
        this.rayos.push(rayo);
        return rayo;
    }

    /* ------------------------------------------------------------------ colisiones */

    impactoBala(n, b) {
        if (!b.active) return;
        if (n.herir(b.dano)) this.romperCombo();
        else if (n.burbuja >= 0 && n.invuln > 0) { /* bloqueada */ }
        b.disableBody(true, true);
    }

    choque(n, e) {
        if (!e.vivo || !e.visible || n.muerto) return;
        if (n.herir(e.dano)) this.romperCombo();
        if (e.tipo !== 'jefe' && e.tipo !== 'torreta') e.herir(e.tipo === 'kamikaze' ? 99 : 10);
    }

    romperCombo() {
        if (this.combo > 4) Bus.emit('hud:comboRoto');
        this.combo = 0; this.tCombo = 0;
    }

    /* ------------------------------------------------------------------ puntos y premios */

    get multiplicador() { return Math.min(8, 1 + Math.floor(this.combo / 6)); }

    alMorir(e) {
        if (e.cuenta) this.stats.derribadas++;
        if (e.tipo !== 'meteorito') {
            this.combo++;
            this.tCombo = 2.2;
            this.mejorCombo = Math.max(this.mejorCombo, this.combo);
            if (this.combo % 6 === 0 && this.multiplicador > 1) { Sonido.sfx('combo'); Bus.emit('hud:multiplicador', this.multiplicador); }
        }
        const pts = e.puntos * (e.tipo === 'meteorito' ? 1 : this.multiplicador);
        this.sumar(pts, e.x, e.y);
        this.explosion(e.x, e.y, e.tamExplosion, e.color);
        if (e.premio && Math.random() < e.premio) this.soltar(e.x, e.y, premioAlAzar());
    }

    sumar(pts, x, y) {
        this.puntos += pts;
        if (x !== undefined) {
            const mult = this.multiplicador > 1 && pts >= 100;
            const t = this.add.text(x, y, '+' + pts, estiloTexto(mult ? 15 : 12, mult ? '#ffd23f' : '#ffffff')).setOrigin(0.5).setDepth(40);
            this.tweens.add({ targets: t, y: y - 34, alpha: 0, duration: 750, ease: 'Quad.easeOut', onComplete: () => t.destroy() });
        }
    }

    soltar(x, y, letra) {
        const c = this.capsulas.create(Phaser.Math.Clamp(x, CAMPO.x0 + 20, CAMPO.x1 - 20), y, 'capsula_' + letra).setDepth(17);
        c.letra = letra;
        c.t = 0;
        c.x0 = c.x;
        c.body.setCircle(14, 3, 3);
        c.brillo = this.add.image(c.x, c.y, 'brillo').setTint(Phaser.Display.Color.HexStringToColor(Arte.CAPSULAS[letra][0]).color).setBlendMode('ADD').setScale(0.9).setDepth(16);
    }

    actualizarCapsulas(dt) {
        const n = this.nave;
        for (const c of [...this.capsulas.getChildren()]) {
            c.t += dt;
            const d = Phaser.Math.Distance.Between(c.x, c.y, n.x, n.y);
            if (!n.muerto && d < 110) {
                // Imán: se acercan solas cuando la nave está cerca
                const a = Phaser.Math.Angle.Between(c.x, c.y, n.x, n.y);
                c.x += Math.cos(a) * 420 * dt; c.y += Math.sin(a) * 420 * dt;
            } else {
                c.y += 75 * dt;
                c.x = c.x0 + Math.sin(c.t * 2.5) * 22;
            }
            c.setScale(1 + Math.sin(c.t * 6) * 0.08);
            c.brillo.setPosition(c.x, c.y).setAlpha(0.6 + Math.sin(c.t * 6) * 0.3);
            if (c.y > ALTO + 30) { c.brillo.destroy(); c.destroy(); }
        }
    }

    recoger(n, c) {
        if (!c.active || n.muerto) return;
        const l = c.letra;
        let texto = TXT.poderes[l];
        if (l === 'P') {
            if (n.arma >= 5) { this.sumar(500, c.x, c.y - 10); texto = TXT.poderes.max; } else n.arma++;
        } else if (l === 'R') n.escudo = Math.min(100, n.escudo + 35);
        else if (l === 'S') n.burbuja = 3;
        else if (l === 'M') n.poderes.M = 12;
        else if (l === 'D') n.poderes.D = 15;
        else if (l === 'B') n.bombas = Math.min(5, n.bombas + 1);
        Sonido.sfx(l === 'R' ? 'reparar' : 'poder');
        this.emBrillo.explode(16, c.x, c.y);
        this.anilloExpansivo(c.x, c.y, c.brillo.tintTopLeft, 1);
        Bus.emit('hud:poder', l, texto);
        Bus.emit('hud:todo');
        c.brillo.destroy();
        c.destroy();
    }

    /* ------------------------------------------------------------------ bomba */

    bomba() {
        const n = this.nave;
        if (n.muerto || n.bombas <= 0) return;
        n.bombas--;
        n.invuln = Math.max(n.invuln, 1.6);
        Sonido.sfx('bomba');
        Bus.emit('hud:todo');
        this.cameras.main.flash(250, 255, 255, 255);
        this.temblor(500, 0.014);
        for (let i = 0; i < 3; i++) {
            const a = this.add.image(n.x, n.y, 'anillo').setBlendMode('ADD').setDepth(32).setScale(0.2).setTint(i === 1 ? 0xff4fd8 : 0x7ff3ff);
            this.tweens.add({ targets: a, scale: 14, alpha: 0, duration: 750, delay: i * 90, ease: 'Quad.easeOut', onComplete: () => a.destroy() });
        }
        // Las balas enemigas se deshacen en chispas
        for (const b of this.balas.getChildren()) {
            if (!b.active) continue;
            this.emBrillo.explode(1, b.x, b.y);
            b.disableBody(true, true);
        }
        this.time.delayedCall(150, () => {
            for (const e of [...this.enemigos.getChildren()]) {
                if (!e.active || !e.vivo || e.y < -20) continue;
                e.herir(e.tipo === 'jefe' ? e.vidaMax * 0.04 : 30);
            }
        });
    }

    /* ------------------------------------------------------------------ efectos */

    explosion(x, y, escala, color) {
        const s = this.add.sprite(x, y, 'regularExplosion00').setScale(escala * 0.7).setDepth(27).setRotation(Math.random() * 6.28);
        s.play('explota');
        s.once('animationcomplete', () => s.destroy());
        const n = Math.round(10 * escala + 4);
        this.emFuego.explode(n, x, y);
        this.emHumo.explode(Math.round(n / 2), x, y);
        this.emEsquirlas.setParticleTint(color);
        this.emEsquirlas.explode(Math.round(n / 2), x, y);
        if (escala >= 0.8) {
            this.anilloExpansivo(x, y, color, escala * 1.4);
            this.temblor(120 * escala, 0.004 * escala);
        }
        Sonido.sfx(escala >= 1.2 ? 'explosionGrande' : 'explosion');
    }

    anilloExpansivo(x, y, color, escala = 1) {
        const a = this.add.image(x, y, 'anillo').setTint(color).setBlendMode('ADD').setScale(0.15).setDepth(28);
        this.tweens.add({ targets: a, scale: escala, alpha: 0, duration: 420, ease: 'Quad.easeOut', onComplete: () => a.destroy() });
    }

    chispas(x, y, color, n) {
        this.emChispas.setParticleTint(color);
        this.emChispas.explode(n, x, y);
    }

    estela(x, y, color) {
        this.emEstela.setParticleTint(color);
        this.emEstela.emitParticleAt(x, y, 1);
    }

    temblor(ms, intensidad) { this.cameras.main.shake(ms, intensidad); }

    efectoDanio(n) {
        Sonido.sfx('dano');
        this.temblor(200, 0.01);
        Bus.emit('hud:danio');
        this.chispas(n.x, n.y, 0xff5a6e, 12);
    }

    efectoBurbuja(x, y, rota) {
        Sonido.sfx('escudo');
        this.chispas(x, y, 0x7ff3ff, rota ? 20 : 8);
        this.anilloExpansivo(x, y, 0x7ff3ff, rota ? 2 : 1);
        Bus.emit('hud:todo');
    }

    /* ------------------------------------------------------------------ vidas */

    alPerderVida(n) {
        this.stats.vidasPerdidas++;
        this.romperCombo();
        Sonido.sfx('muerte');
        Sonido.atenuar(2.5);
        this.explosion(n.x, n.y, 1.6, 0xff4fd8);
        this.time.delayedCall(180, () => this.explosion(n.x - 20, n.y + 10, 0.9, 0xff8a3d));
        this.time.delayedCall(320, () => this.explosion(n.x + 18, n.y - 8, 0.9, 0xffd23f));
        this.temblor(600, 0.02);
        Bus.emit('hud:todo');
        // Las balas cercanas desaparecen: reaparecer no debe ser una trampa
        this.time.delayedCall(900, () => { for (const b of this.balas.getChildren()) if (b.active && b.y > ALTO * 0.45) b.disableBody(true, true); });
        if (n.vidas > 0) {
            Bus.emit('hud:aviso', n.vidas === 1 ? TXT.vidaFinal : TXT.vidaMenos, '', 1300);
            this.time.delayedCall(1500, () => n.reaparecer());
        } else {
            this.terminado = true;
            Progreso.record(this.puntos);
            this.time.delayedCall(2200, () => {
                this.scene.pause();
                this.scene.launch('FinPartida', { sector: this.indice, puntos: this.puntos });
            });
        }
    }

    /* ------------------------------------------------------------------ jefe */

    llegaJefe() {
        Sonido.parar();
        Sonido.sfx('alerta');
        Bus.emit('hud:alerta');
        this.time.delayedCall(2900, () => {
            Sonido.musica('jefe');
            this.jefe = new JEFES[this.def.jefe](this);
            this.anadirEnemigo(this.jefe);
        });
    }

    derrotarJefe(j) {
        this.terminado = true;
        this.stats.derribadas++;
        this.stats.naves++;
        Bus.emit('hud:jefe', null);
        Sonido.parar();
        // Cámara lenta mientras estalla
        this.lentitud = 0.35;
        this.tweens.add({ targets: this, lentitud: 1, duration: 2400, ease: 'Quad.easeIn' });
        for (const b of this.balas.getChildren()) if (b.active) { this.emBrillo.explode(1, b.x, b.y); b.disableBody(true, true); }
        for (const e of [...this.enemigos.getChildren()]) if (e !== j && e.active && e.vivo) e.morir();
        for (const r of [...this.rayos]) r.apagar();
        this.time.addEvent({
            delay: 120, repeat: 16, callback: () => {
                const x = j.x + Phaser.Math.Between(-j.displayWidth * 0.4, j.displayWidth * 0.4);
                const y = j.y + Phaser.Math.Between(-j.displayHeight * 0.35, j.displayHeight * 0.35);
                this.explosion(x, y, Phaser.Math.FloatBetween(0.6, 1.3), j.color);
                j.setTintFill(Math.random() < 0.5 ? 0xffffff : 0xff7a7a);
            },
        });
        this.time.delayedCall(2200, () => {
            this.explosion(j.x, j.y, 3, 0xffffff);
            this.emEsquirlas.setParticleTint(j.color);
            this.emEsquirlas.explode(60, j.x, j.y);
            this.anilloExpansivo(j.x, j.y, 0xffffff, 8);
            this.cameras.main.flash(500, 255, 255, 255);
            this.temblor(900, 0.03);
            this.sumar(j.puntos, j.x, j.y);
            j.destroy();
            this.jefe = null;
        });
        this.time.delayedCall(3800, () => {
            Sonido.musica('fin');
            Bus.emit('hud:aviso', TXT.completado, TXT.nombres[this.indice], 2200);
            // Salto al hiperespacio: las estrellas se estiran y la nave sale por arriba
            this.warp = true;
            this.nave.invuln = 99;
            this.tweens.add({ targets: this.nave, y: -120, duration: 1400, delay: 1200, ease: 'Quad.easeIn' });
        });
        this.time.delayedCall(6200, () => this.completarSector());
    }

    completarSector() {
        const s = this.stats;
        const ratio = s.naves ? s.derribadas / s.naves : 1;
        const estrellas = [true, s.vidasPerdidas === 0, ratio >= 0.8];
        Progreso.completar(this.indice, estrellas.filter(Boolean).length, this.puntos);
        Progreso.record(this.puntos);
        Sonido.sfx('victoria');
        this.scene.pause();
        this.scene.launch('Resumen', {
            sector: this.indice, estrellas, puntos: this.puntos, ratio, tiempo: this.reloj, mejorCombo: this.mejorCombo,
            vidasPerdidas: s.vidasPerdidas,
            herencia: { puntos: this.puntos, vidas: Math.max(this.nave.vidas, 1), bombas: Math.max(this.nave.bombas, 2), arma: this.nave.arma },
        });
    }

    pausar() {
        Sonido.sfx('menu');
        this.scene.pause();
        this.scene.launch('Pausa', { sector: this.indice });
    }
}
