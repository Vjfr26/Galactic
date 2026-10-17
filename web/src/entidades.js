/* Nave del jugador, enemigos y jefes de Galactic. Cada entidad decide su movimiento y sus
   disparos en actualizar(dt); la escena (juego.js) gestiona colisiones, premios y efectos. */

const azar = Phaser.Math.FloatBetween;
const entre = Phaser.Math.Between;
const VEL = { normal: 330, precision: 150 };

/* ===================================================================== */
class Nave extends Phaser.Physics.Arcade.Sprite {
    constructor(escena, x, y) {
        super(escena, x, y, 'player');
        escena.add.existing(this);
        escena.physics.add.existing(this);
        this.escena = escena;
        this.setScale(0.55).setDepth(20);
        // Núcleo pequeño (radio ~9 px en pantalla): en un juego con tantas balas, así es justo
        this.body.setCircle(16, 41, 44);
        this.escudo = 100; this.vidas = 3; this.bombas = 2;
        this.arma = 1; this.cadencia = 0; this.tMisil = 0; this.tDron = 0;
        this.poderes = { M: 0, D: 0 }; this.burbuja = 0;
        this.invuln = 0; this.muerto = false; this.precision = false; this.inclinacion = 0;
        this.nucleo = escena.add.image(x, y, 'nucleo').setDepth(22).setVisible(false).setBlendMode('ADD');
        this.vBurbuja = escena.add.image(x, y, 'burbuja').setDepth(21).setVisible(false).setScale(0.75);
        this.drones = [0, 1].map(() => escena.add.image(x, y, 'dron').setDepth(19).setVisible(false));
        // Llama del motor
        this.llama = escena.add.particles(0, 0, 'humo', {
            follow: this, followOffset: { x: 0, y: 28 }, speedY: { min: 160, max: 260 }, speedX: { min: -18, max: 18 },
            lifespan: { min: 120, max: 220 }, scale: { start: 0.65, end: 0 }, alpha: { start: 0.9, end: 0 },
            tint: [0xff4fd8, 0xffb0f0, 0xff8a3d], blendMode: 'ADD', frequency: 16,
        }).setDepth(18);
    }

    actualizar(dt, c) {
        this.invuln = Math.max(0, this.invuln - dt);
        for (const k of ['M', 'D']) this.poderes[k] = Math.max(0, this.poderes[k] - dt);
        if (this.muerto) { this.body.setVelocity(0, 0); return; }
        this.setAlpha(this.invuln > 0 ? (Math.floor(this.invuln * 14) % 2 ? 0.3 : 1) : 1);

        // Movimiento: teclado (8 direcciones) o arrastre táctil (la nave sigue al dedo)
        this.precision = c.precision;
        const vel = this.precision ? VEL.precision : VEL.normal;
        let vx = 0, vy = 0;
        if (c.objetivo) {
            const dx = c.objetivo.x - this.x, dy = c.objetivo.y - this.y;
            const d = Math.hypot(dx, dy);
            const v = Math.min(d / dt, 900);
            if (d > 1) { vx = (dx / d) * v; vy = (dy / d) * v; }
        } else {
            const ex = (c.der ? 1 : 0) - (c.izq ? 1 : 0), ey = (c.abajo ? 1 : 0) - (c.arriba ? 1 : 0);
            const n = Math.hypot(ex, ey) || 1;
            vx = (ex / n) * vel; vy = (ey / n) * vel;
        }
        this.body.setVelocity(vx, vy);
        // Límites del campo
        const m = 26;
        if ((this.x < CAMPO.x0 + m && vx < 0) || (this.x > CAMPO.x1 - m && vx > 0)) this.body.setVelocityX(0);
        if ((this.y < 70 && vy < 0) || (this.y > ALTO - 40 && vy > 0)) this.body.setVelocityY(0);
        this.x = Phaser.Math.Clamp(this.x, CAMPO.x0 + m, CAMPO.x1 - m);
        this.y = Phaser.Math.Clamp(this.y, 70, ALTO - 40);
        // Inclinación al moverse de lado
        this.inclinacion = Phaser.Math.Linear(this.inclinacion, Phaser.Math.Clamp(vx / VEL.normal, -1, 1) * 0.22, 1 - Math.exp(-dt * 10));
        this.setRotation(this.inclinacion);

        // Disparo
        this.cadencia -= dt;
        if (c.disparar && this.cadencia <= 0) {
            this.cadencia = 0.085;
            this.disparar();
        }
        if ((this.poderes.M > 0 || this.arma >= 5) && c.disparar) {
            this.tMisil -= dt;
            if (this.tMisil <= 0) {
                this.tMisil = this.poderes.M > 0 ? 0.38 : 0.7;
                for (const s of [-1, 1]) this.escena.lanzarMisil(this.x + s * 16, this.y - 4, s);
                Sonido.sfx('misil');
            }
        }

        // Accesorios
        this.nucleo.setPosition(this.x, this.y + 3).setVisible(this.precision);
        this.vBurbuja.setVisible(this.burbuja > 0).setPosition(this.x, this.y).setAlpha(0.55 + Math.sin(this.escena.reloj * 6) * 0.2);
        const conDrones = this.poderes.D > 0;
        this.drones.forEach((d, i) => {
            const s = i ? 1 : -1;
            const tx = this.x + s * (this.precision ? 30 : 48), ty = this.y + 14 + Math.sin(this.escena.reloj * 4 + i * 3) * 4;
            d.setVisible(conDrones).setPosition(Phaser.Math.Linear(d.x, tx, 0.25), Phaser.Math.Linear(d.y, ty, 0.25)).setAlpha(this.poderes.D < 2 ? (Math.floor(this.poderes.D * 8) % 2 ? 0.3 : 1) : 1);
            d.rotation += dt * 4;
        });
        if (conDrones && c.disparar) {
            this.tDron -= dt;
            if (this.tDron <= 0) {
                this.tDron = 0.16;
                for (const d of this.drones) this.escena.laser(d.x, d.y - 10, 0, 'laser_dron', 0.7);
            }
        }
    }

    /** Patrón de disparo según el nivel del arma (1 a 5). */
    disparar() {
        const x = this.x, y = this.y - 30, e = this.escena;
        const g = Phaser.Math.DegToRad;
        // En precisión los disparos se concentran hacia delante
        const k = this.precision ? 0.45 : 1;
        switch (this.arma) {
            case 1: e.laser(x, y, 0); break;
            case 2: e.laser(x - 8, y, 0); e.laser(x + 8, y, 0); break;
            case 3: e.laser(x, y - 4, 0); e.laser(x - 12, y + 4, -g(7) * k); e.laser(x + 12, y + 4, g(7) * k); break;
            case 4:
                e.laser(x - 7, y - 2, 0); e.laser(x + 7, y - 2, 0);
                e.laser(x - 16, y + 6, -g(8) * k); e.laser(x + 16, y + 6, g(8) * k);
                e.laser(x - 22, y + 12, -g(17) * k); e.laser(x + 22, y + 12, g(17) * k);
                break;
            default:
                e.laser(x, y - 6, 0); e.laser(x - 9, y, -g(4) * k); e.laser(x + 9, y, g(4) * k);
                e.laser(x - 18, y + 6, -g(10) * k); e.laser(x + 18, y + 6, g(10) * k);
                e.laser(x - 24, y + 12, -g(18) * k); e.laser(x + 24, y + 12, g(18) * k);
        }
        Sonido.sfx('disparo');
    }

    /** Devuelve true si el golpe hizo daño de verdad. */
    herir(dano) {
        if (this.invuln > 0 || this.muerto) return false;
        if (this.burbuja > 0) {
            this.burbuja--;
            this.invuln = 0.5;
            this.escena.efectoBurbuja(this.x, this.y, this.burbuja === 0);
            return false;
        }
        this.escudo -= dano;
        this.invuln = 0.9;
        Bus.emit('hud:escudo', Math.max(0, this.escudo));
        this.escena.efectoDanio(this);
        if (this.escudo <= 0) this.perderVida();
        return true;
    }

    perderVida() {
        this.muerto = true;
        this.vidas--;
        this.setVisible(false);
        this.body.enable = false;
        this.llama.stop();
        this.nucleo.setVisible(false); this.vBurbuja.setVisible(false);
        this.drones.forEach((d) => d.setVisible(false));
        this.poderes = { M: 0, D: 0 };
        this.arma = Math.max(1, this.arma - 1);
        this.escena.alPerderVida(this);
    }

    reaparecer() {
        this.muerto = false;
        this.escudo = 100; this.burbuja = 0; this.invuln = 2.6;
        this.bombas = Math.max(this.bombas, 2);
        this.setPosition(ANCHO / 2, ALTO + 40).setVisible(true);
        this.body.enable = true;
        this.body.reset(ANCHO / 2, ALTO + 40);
        this.escena.tweens.add({ targets: this, y: ALTO - 110, duration: 700, ease: 'Quad.easeOut' });
        this.llama.start();
        Bus.emit('hud:todo');
    }
}

/* ===================================================================== */
class Enemigo extends Phaser.Physics.Arcade.Sprite {
    constructor(escena, x, y, tex, o) {
        super(escena, x, y, tex, 0);
        escena.add.existing(this);
        escena.physics.add.existing(this);
        this.escena = escena;
        this.tipo = o.tipo;
        this.vida = this.vidaMax = o.vida;
        this.puntos = o.puntos;
        this.color = o.color || 0xffffff;
        this.tamExplosion = o.tamExplosion || 1;
        this.premio = o.premio || 0;
        this.dano = o.dano || 25;
        this.cuenta = o.cuenta !== false; // cuenta para el porcentaje de enemigos del sector
        this.t = 0; this.vivo = true; this.entro = false; this.invulnT = 0;
        this.setDepth(o.prof || 10);
        const r = o.radio || Math.min(this.width, this.height) * 0.38;
        this.body.setCircle(r, this.width / 2 - r, this.height / 2 - r);
    }

    herir(d) {
        if (!this.vivo || this.invulnT > 0) return false;
        this.vida -= d;
        // Las naves grandes aguantan muchos disparos seguidos: destello más espaciado
        if (this.vidaMax >= 20) this.destello(240, 30); else this.destello();
        if (this.vida <= 0) this.morir();
        return true;
    }

    /** Destello blanco al recibir un golpe, como mucho cada 110 ms: bajo fuego continuo, si no,
        la nave se vería blanca todo el rato. */
    destello(cada = 110, dura = 40) {
        const ahora = this.escena.time.now;
        if (this.ultimoDestello && ahora - this.ultimoDestello < cada) return;
        this.ultimoDestello = ahora;
        this.setTintFill(0xffffff);
        this.escena.time.delayedCall(dura, () => this.active && this.restaurarTinte());
    }

    restaurarTinte() { this.clearTint(); }

    morir() {
        if (!this.vivo) return;
        this.vivo = false;
        this.escena.alMorir(this);
        this.destroy();
    }

    /** Sale de la pantalla sin morir. */
    escapar() {
        this.vivo = false;
        this.destroy();
    }

    fuera(margen = 80) {
        return this.y > ALTO + margen || this.y < -margen * 3 || this.x < CAMPO.x0 - margen * 2 || this.x > CAMPO.x1 + margen * 2;
    }

    actualizar(dt) {
        this.t += dt;
        if (!this.entro && this.y > 0 && this.y < ALTO && this.x > CAMPO.x0 && this.x < CAMPO.x1) this.entro = true;
        if (this.entro && this.fuera()) this.escapar();
        else if (this.t > 40) this.escapar();
    }
}

/* ---------- Meteoritos (gráficos originales): se parten en trozos más pequeños ---------- */
const METEORITOS = {
    grande: { tex: ['meteorGrey_big1', 'meteorGrey_big2', 'meteorGrey_big3', 'meteorGrey_big4'], vida: 7, puntos: 50, dano: 25, hijo: 'medio' },
    medio: { tex: ['meteorGrey_med1', 'meteorGrey_med2'], vida: 3, puntos: 30, dano: 15, hijo: 'peque' },
    peque: { tex: ['meteorGrey_small1', 'meteorGrey_small2'], vida: 1, puntos: 20, dano: 10, hijo: null },
};

class Meteorito extends Enemigo {
    constructor(escena, x, y, tam, vx, vy) {
        const d = METEORITOS[tam];
        super(escena, x, y, Phaser.Utils.Array.GetRandom(d.tex), { tipo: 'meteorito', vida: d.vida, puntos: d.puntos, color: 0xb8c0cc, dano: d.dano, cuenta: false, tamExplosion: tam === 'grande' ? 1 : tam === 'medio' ? 0.6 : 0.35, prof: 8 });
        this.tam = tam;
        this.giro = azar(-2, 2);
        this.body.setVelocity(vx, vy);
        this.vel0 = [vx, vy];
        this.setRotation(azar(0, 6.28));
    }

    actualizar(dt) {
        super.actualizar(dt);
        this.rotation += this.giro * dt;
    }

    morir() {
        if (!this.vivo) return;
        const hijo = METEORITOS[this.tam].hijo;
        if (hijo) {
            for (const s of [-1, 1]) {
                const m = new Meteorito(this.escena, this.x + s * 10, this.y, hijo, this.body.velocity.x + s * azar(60, 120), this.body.velocity.y * 0.8 + azar(-20, 30));
                m.entro = true;
                this.escena.anadirEnemigo(m);
            }
        }
        Sonido.sfx('meteorito');
        super.morir();
    }
}

/* ---------- Naves enemigas ---------- */
const TIPOS = {
    explorador: { vida: 2, puntos: 100, color: 0x7ff3ff, premio: 0.07, tamExplosion: 0.55, dano: 20 },
    caza: { vida: 9, puntos: 300, color: 0xff4fd8, premio: 0.28, tamExplosion: 0.8, dano: 25 },
    kamikaze: { vida: 4, puntos: 200, color: 0xff5a3d, premio: 0.1, tamExplosion: 0.7, dano: 30 },
    canonera: { vida: 45, puntos: 800, color: 0x7dff8a, premio: 0.6, tamExplosion: 1.3, dano: 30, radio: 34 },
    escudado: { vida: 8, puntos: 500, color: 0xb14dff, premio: 0.35, tamExplosion: 0.9, dano: 25 },
    mina: { vida: 4, puntos: 150, color: 0xff3b4f, premio: 0.05, tamExplosion: 0.6, dano: 25, radio: 12 },
    carguero: { vida: 22, puntos: 600, color: 0xffb35c, premio: 0, tamExplosion: 1.2, dano: 20, radio: 32 },
};

class NaveEnemiga extends Enemigo {
    constructor(escena, x, y, tipo, ruta, retardo = 0) {
        super(escena, x, y, tipo, { tipo, ...TIPOS[tipo] });
        this.ruta = ruta;
        this.x0 = x; this.y0 = y;
        this.retardo = retardo;
        this.dificultad = escena.indice; // 0, 1, 2
        this.tDisparo = azar(1, 2.2);
        this.fase = 'entra';
        if (tipo === 'mina') { this.play('mina_parpadea'); this.giro = azar(-1.5, 1.5); }
        if (tipo === 'escudado') {
            this.escudo = 10;
            this.aro = escena.add.image(x, y, 'aro').setDepth(11).setScale(0.75);
        }
        if (retardo > 0) { this.setVisible(false); this.body.enable = false; }
    }

    actualizar(dt) {
        if (this.retardo > 0) {
            this.retardo -= dt;
            if (this.retardo > 0) return;
            this.setVisible(true); this.body.enable = true;
        }
        super.actualizar(dt);
        if (!this.active) return;
        const t = this.t, j = this.escena.jugador;
        switch (this.tipo) {
            case 'explorador': this.moverRuta(dt, 150); this.dispararCada(dt, this.dificultad === 0 ? 0 : 3.4, () => this.escena.bala(this.x, this.y + 14, this.escena.apuntar(this.x, this.y), 190, 'bala_cian')); break;
            case 'caza': this.pararYDisparar(dt, 150 + (this.x0 % 3) * 20, 7, 1.5, () => this.escena.abanico(this.x, this.y + 20, this.dificultad >= 2 ? 5 : 3, 0.28, 210, 'bala_rosa')); break;
            case 'kamikaze': this.embestir(dt); break;
            case 'canonera': this.pararYDisparar(dt, 170, 13, 2.1, () => {
                this.escena.anillo(this.x, this.y, this.dificultad >= 2 ? 16 : 12, 150, 'bala_verde', t);
                this.escena.time.delayedCall(500, () => this.active && this.escena.abanico(this.x, this.y + 30, 2, 0.12, 230, 'bala_verde'));
            }); break;
            case 'escudado': this.pararYDisparar(dt, 150, 8, 2.2, () => {
                for (let i = 0; i < 3; i++) this.escena.time.delayedCall(i * 120, () => this.active && this.escena.bala(this.x, this.y + 20, this.escena.apuntar(this.x, this.y), 240, 'bala_rosa'));
            }); break;
            case 'mina':
                this.y += (50 + this.dificultad * 10) * dt; this.x = this.x0 + Math.sin(t * 0.9) * 24; this.rotation += this.giro * dt;
                if (!j.muerto && Phaser.Math.Distance.Between(this.x, this.y, j.x, j.y) < 70 && !this.armada) {
                    this.armada = true;
                    this.setTint(0xff3b4f);
                    this.escena.time.delayedCall(550, () => this.active && this.morir());
                }
                break;
            case 'carguero': this.y += 42 * dt; this.x = this.x0 + Math.sin(t * 0.6) * 30; break;
        }
        if (this.aro) {
            this.aro.setPosition(this.x, this.y).setRotation(t);
            if (!this.active) this.aro.destroy();
        }
    }

    /** Movimiento por la ruta asignada (formaciones). */
    moverRuta(dt, v) {
        const t = this.t;
        switch (this.ruta) {
            case 'seno': this.y += v * 0.8 * dt; this.x = this.x0 + Math.sin(t * 2.2) * 90; break;
            case 'barridoI':
            case 'barridoD': {
                const s = this.ruta === 'barridoI' ? 1 : -1;
                this.x = this.x0 + s * 230 * t;
                this.y = this.y0 + 330 * t - 62 * t * t;
                this.rotation = Math.atan2(330 - 124 * t, s * 230) - Math.PI / 2;
                break;
            }
            default: this.y += v * dt; this.x = this.x0 + Math.sin(t * 1.6 + this.y0) * 14;
        }
    }

    dispararCada(dt, cada, fn) {
        if (!cada || this.y < 20 || this.y > ALTO * 0.7) return;
        this.tDisparo -= dt;
        if (this.tDisparo <= 0) { this.tDisparo = cada * azar(0.8, 1.3); fn(); }
    }

    /** Baja hasta una altura, se queda disparando un rato y se va por arriba. */
    pararYDisparar(dt, alto, estancia, cada, fn) {
        if (this.fase === 'entra') {
            this.y += (alto + 60 - this.y) * Math.min(1, dt * 2.2);
            if (this.y > alto - 4) { this.fase = 'ataca'; this.tFase = 0; }
        } else if (this.fase === 'ataca') {
            this.tFase += dt;
            this.x = this.x0 + Math.sin(this.tFase * 0.9) * 50;
            this.dispararCada(dt, cada, fn);
            if (this.tFase > estancia) this.fase = 'sale';
        } else {
            this.y -= 140 * dt;
        }
    }

    /** Kamikaze: baja, avisa parpadeando y se lanza hacia el jugador. */
    embestir(dt) {
        const j = this.escena.jugador;
        if (this.fase === 'entra') {
            this.y += 170 * dt;
            this.x = this.x0 + Math.sin(this.t * 3) * 10;
            if (this.y > 110 + (this.x0 % 60)) { this.fase = 'apunta'; this.tFase = 0; }
        } else if (this.fase === 'apunta') {
            this.tFase += dt;
            this.setTint(Math.floor(this.tFase * 16) % 2 ? 0xff3b3b : 0xffffff);
            this.rotation = Phaser.Math.Angle.Between(this.x, this.y, j.x, j.y) - Math.PI / 2;
            if (this.tFase > 0.45) {
                this.clearTint();
                this.fase = 'carga';
                const a = Phaser.Math.Angle.Between(this.x, this.y, j.x, j.y);
                this.dirX = Math.cos(a); this.dirY = Math.sin(a);
                this.velCarga = 160;
            }
        } else {
            this.velCarga = Math.min(520, this.velCarga + 900 * dt);
            this.x += this.dirX * this.velCarga * dt;
            this.y += this.dirY * this.velCarga * dt;
            if (Math.random() < 0.6) this.escena.estela(this.x - this.dirX * 18, this.y - this.dirY * 18, 0xff8a3d);
        }
    }

    herir(d) {
        if (this.tipo === 'escudado' && this.escudo > 0) {
            this.escudo -= d;
            this.aro.setAlpha(0.35 + 0.65 * Math.max(0, this.escudo) / 10);
            Sonido.sfx('impacto');
            if (this.escudo <= 0) {
                this.escena.chispas(this.x, this.y, 0xd9a0ff, 16);
                this.escena.anilloExpansivo(this.x, this.y, 0xb14dff, 1.3);
                Sonido.sfx('escudo');
                this.aro.destroy();
                this.aro = null;
            }
            return true;
        }
        return super.herir(d);
    }

    restaurarTinte() {
        if (this.armada) this.setTint(0xff3b4f); else this.clearTint();
    }

    morir() {
        if (!this.vivo) return;
        if (this.tipo === 'mina') this.escena.anillo(this.x, this.y, 10 + this.dificultad * 2, 170, 'bala_naranja', azar(0, 1));
        if (this.tipo === 'carguero') {
            this.escena.soltar(this.x - 14, this.y, 'P');
            this.escena.soltar(this.x + 14, this.y, Phaser.Utils.Array.GetRandom(['R', 'S', 'M', 'D', 'B']));
        }
        if (this.aro) this.aro.destroy();
        super.morir();
    }

    escapar() {
        if (this.aro) this.aro.destroy();
        super.escapar();
    }
}

/* ===================================================================== */
/* Jefes: una vida grande con fases según lo que les queda. Atacan por ciclos. */
class Jefe extends Enemigo {
    constructor(escena, tex, o) {
        super(escena, ANCHO / 2, -o.alto, tex, { tipo: 'jefe', vida: o.vida, puntos: o.puntos, color: o.color, tamExplosion: 2.5, dano: 35, cuenta: true, prof: 9, radio: o.radio });
        this.nombre = o.nombre;
        this.altoParada = o.parada;
        this.fase = 0; this.entrando = true; this.invulnT = 99;
        this.tAtaque = 1.5; this.ciclo = 0; this.piezas = [];
        Bus.emit('hud:jefe', this.nombre, 1);
    }

    get proporcion() { return Math.max(0, this.vida / this.vidaMax); }

    actualizar(dt) {
        this.t += dt;
        if (!this.vivo) return;
        if (this.entrando) {
            this.y += (this.altoParada - this.y) * Math.min(1, dt * 1.2);
            if (Math.abs(this.y - this.altoParada) < 3) { this.entrando = false; this.invulnT = 0; this.t = 0; }
            this.moverPiezas();
            return;
        }
        this.invulnT = Math.max(0, this.invulnT - dt);
        const fase = this.calcularFase();
        if (fase !== this.fase) {
            this.fase = fase;
            this.alCambiarFase(fase);
            this.escena.temblor(400, 0.012);
            Sonido.sfx('explosionGrande');
        }
        this.mover(dt);
        this.moverPiezas();
        this.tAtaque -= dt;
        if (this.tAtaque <= 0) {
            this.tAtaque = this.atacar(this.ciclo++) || 2;
        }
    }

    calcularFase() { return this.proporcion > 0.5 ? 0 : 1; }
    alCambiarFase() {}
    mover(dt) { this.x = ANCHO / 2 + Math.sin(this.t * 0.45) * 140; }
    moverPiezas() {}

    herir(d) {
        if (this.entrando || !this.vivo) return false;
        this.vida -= d;
        // Un jefe recibe golpes sin parar: destello breve y espaciado para que no parpadee
        this.destello(280, 30);
        Sonido.sfx('jefeGolpe');
        Bus.emit('hud:jefe', this.nombre, this.proporcion);
        if (this.vida <= 0) {
            this.vivo = false;
            this.body.enable = false;
            this.escena.derrotarJefe(this);
        }
        return true;
    }

    restaurarTinte() { this.clearTint(); if (this.fase >= 2 || (this.furia && this.fase >= 1)) this.setTint(0xff9a9a); }
}

/* ---------- Jefe 1: Coloso de Roca ---------- */
class Coloso extends Jefe {
    constructor(escena) {
        super(escena, 'coloso', { vida: 700, puntos: 6000, color: 0x7ff3ff, alto: 230, parada: 170, radio: 105, nombre: TXT.jefes[0] });
        this.nucleo = escena.add.image(this.x, this.y, 'coloso_nucleo').setDepth(10);
        this.cristales = [-1, 1].map((s) => escena.add.image(this.x + s * 120, this.y + 70, 'coloso_cristal').setDepth(10));
        this.piezas = [this.nucleo, ...this.cristales];
    }

    moverPiezas() {
        const pulso = 1 + Math.sin(this.t * 5) * 0.06;
        this.nucleo.setPosition(this.x, this.y + 3).setScale(pulso);
        this.cristales.forEach((c, i) => c.setPosition(this.x + (i ? 118 : -118), this.y + 66 + Math.sin(this.t * 2 + i) * 4));
        this.rotation = Math.sin(this.t * 0.6) * 0.05;
    }

    alCambiarFase() {
        this.nucleo.setTint(0xff9a9a);
        this.cristales.forEach((c) => c.setTint(0xffb0b0));
    }

    atacar(ciclo) {
        const e = this.escena;
        const f = this.fase;
        switch (ciclo % 4) {
            case 0: e.anillo(this.x, this.y, f ? 22 : 16, f ? 175 : 145, 'bala_cian', this.t); if (f) e.time.delayedCall(350, () => this.vivo && e.anillo(this.x, this.y, 22, 175, 'bala_cian', this.t + 0.14)); return f ? 1.6 : 2.1;
            case 1:
                for (let i = 0; i < (f ? 4 : 3); i++) {
                    e.time.delayedCall(i * 280, () => {
                        if (!this.vivo) return;
                        const j = e.jugador, a = Phaser.Math.Angle.Between(this.x, this.y + 60, j.x, j.y) + azar(-0.25, 0.25);
                        const m = new Meteorito(e, this.x, this.y + 70, 'medio', Math.cos(a) * 190, Math.sin(a) * 190);
                        m.entro = true; m.puntos = 10;
                        e.anadirEnemigo(m);
                    });
                }
                return 1.8;
            case 2: for (const c of this.cristales) e.abanico(c.x, c.y + 24, f ? 5 : 3, 0.22, 220, 'bala_rosa'); return 1.7;
            default:
                if (!f) { for (const c of this.cristales) e.abanico(c.x, c.y + 24, 3, 0.3, 200, 'bala_cian'); return 1.6; }
                // Fase 2: espiral desde el núcleo
                for (let i = 0; i < 28; i++) e.time.delayedCall(i * 70, () => this.vivo && e.bala(this.x, this.y, this.t * 4 + i * 0.5, 190, 'bala_naranja'));
                return 2.6;
        }
    }

    destroy(fromScene) { this.piezas?.forEach((p) => p.destroy()); super.destroy(fromScene); }
}

/* ---------- Jefe 2: Acorazado Hidra ---------- */
class Torreta extends Enemigo {
    constructor(escena, jefe, lado) {
        super(escena, jefe.x + lado * 140, jefe.y + 20, 'hidra_torreta', { tipo: 'torreta', vida: 160, puntos: 1500, color: 0xff3b5c, tamExplosion: 1.2, cuenta: false, prof: 11, radio: 22 });
        this.jefe = jefe; this.lado = lado; this.tDisparo = azar(1, 2);
        this.setOrigin(0.5, 0.43);
    }

    actualizar(dt) {
        this.t += dt;
        if (!this.jefe.vivo) { this.morir(); return; }
        this.setPosition(this.jefe.x + this.lado * 140, this.jefe.y + 26);
        if (this.jefe.entrando) return;
        const j = this.escena.jugador;
        this.rotation = Phaser.Math.Angle.Between(this.x, this.y, j.x, j.y) - Math.PI / 2;
        this.tDisparo -= dt;
        if (this.tDisparo <= 0) {
            this.tDisparo = this.jefe.fase ? 1.0 : 1.4;
            this.escena.abanico(this.x, this.y + 10, 3, 0.16, 240, 'bala_roja');
        }
    }

    morir() {
        if (!this.vivo) return;
        this.escena.temblor(250, 0.01);
        super.morir();
    }
}

class Hidra extends Jefe {
    constructor(escena) {
        super(escena, 'hidra', { vida: 1300, puntos: 9000, color: 0xff3b5c, alto: 200, parada: 158, radio: 70, nombre: TXT.jefes[1] });
        // Cuerpo: el puente central y las alas
        this.body.setSize(380, 90).setOffset(30, 40);
        this.body.isCircle = false;
        this.torretas = [-1, 1].map((s) => {
            const t = new Torreta(escena, this, s);
            escena.anadirEnemigo(t);
            return t;
        });
        this.rayos = [];
    }

    calcularFase() { return this.proporcion > 0.5 ? 0 : 1; }
    // Amplitud limitada: con 440 px de ancho, más lejos se metería bajo los paneles laterales
    mover(dt) { if (!this.cargando) this.x = ANCHO / 2 + Math.sin(this.t * 0.4) * 96; }

    atacar(ciclo) {
        const e = this.escena;
        switch (ciclo % 3) {
            case 0: e.abanico(this.x, this.y + 60, this.fase ? 9 : 7, 0.17, 210, 'bala_rosa'); return 1.5;
            case 1: this.rayo(); return 3.4;
            default:
                if (this.fase) {
                    for (const s of [-1, 1]) {
                        const k = new NaveEnemiga(e, this.x + s * 70, this.y + 40, 'kamikaze', 'baja');
                        k.entro = true; k.cuenta = false; k.puntos = 50;
                        e.anadirEnemigo(k);
                    }
                    return 1.8;
                }
                e.anillo(this.x, this.y + 60, 12, 160, 'bala_roja', this.t);
                return 1.6;
        }
    }

    /** Rayo del cañón principal: aviso parpadeante y luego un haz que barre hacia el jugador. */
    rayo() {
        const e = this.escena;
        this.cargando = true;
        Sonido.sfx('carga');
        const aviso = e.add.rectangle(this.x, this.y + 80, 6, ALTO, 0xff4fd8, 0.4).setOrigin(0.5, 0).setDepth(7);
        e.tweens.add({ targets: aviso, alpha: 0.1, duration: 90, yoyo: true, repeat: 4 });
        e.time.delayedCall(950, () => {
            aviso.destroy();
            if (!this.vivo) { this.cargando = false; return; }
            Sonido.sfx('rayo');
            e.temblor(1100, 0.005);
            const haz = e.crearRayo(this.x, this.y + 80, 44);
            const objetivo = e.jugador.x;
            e.tweens.add({
                targets: this, x: Phaser.Math.Clamp(objetivo, ANCHO / 2 - 96, ANCHO / 2 + 96), duration: 1150, ease: 'Sine.easeInOut',
                onUpdate: () => haz.mover(this.x, this.y + 80),
                onComplete: () => { haz.apagar(); this.cargando = false; this.t = Math.asin(Phaser.Math.Clamp((this.x - ANCHO / 2) / 96, -1, 1)) / 0.4; },
            });
        });
    }
}

/* ---------- Jefe 3: Madre Nodriza ---------- */
class Nodriza extends Jefe {
    constructor(escena) {
        super(escena, 'nodriza', { vida: 2200, puntos: 15000, color: 0xff4fd8, alto: 300, parada: 168, radio: 90, nombre: TXT.jefes[2] });
        this.body.setSize(440, 150).setOffset(50, 40);
        this.body.isCircle = false;
        this.nucleo = escena.add.image(this.x, this.y, 'nodriza_nucleo').setDepth(9).setVisible(false);
        // Dos medias cúpulas (la textura es la mitad de arriba girada a cada lado) que se apartan
        this.compuertas = [-1, 1].map((s) => escena.add.image(this.x, this.y, 'nodriza_compuerta').setDepth(10).setOrigin(0.5, 1).setRotation(s * Math.PI / 2));
        this.abierta = 0;
        this.piezas = [this.nucleo, ...this.compuertas];
        this.furia = true;
    }

    calcularFase() { return this.proporcion > 0.66 ? 0 : this.proporcion > 0.33 ? 1 : 2; }

    alCambiarFase(f) {
        if (f === 1) {
            // Se abren las compuertas: el núcleo queda a la vista
            this.nucleo.setVisible(true);
            this.escena.tweens.add({ targets: this, abierta: 1, duration: 900, ease: 'Quad.easeOut' });
        }
        if (f === 2) { this.setTint(0xff9a9a); this.nucleo.setTint(0xff7a7a); }
    }

    mover() { if (!this.cargando) this.x = ANCHO / 2 + Math.sin(this.t * 0.35) * 46; }

    moverPiezas() {
        const cy = this.y - 135 + 128;
        this.nucleo.setPosition(this.x, cy).setScale(1 + Math.sin(this.t * 6) * 0.05).setRotation(this.t * 0.8);
        this.compuertas.forEach((c, i) => {
            const s = i ? 1 : -1;
            c.setPosition(this.x + s * this.abierta * 62, cy).setScale(1, 1 - this.abierta * 0.3).setAlpha(1 - this.abierta * 0.25);
        });
    }

    atacar(ciclo) {
        const e = this.escena;
        const f = this.fase;
        const hangar = (s) => {
            const n = new NaveEnemiga(e, this.x + s * 150, this.y + 60, 'explorador', 'baja');
            n.entro = true; n.cuenta = false; n.puntos = 50; n.dificultad = 2;
            e.anadirEnemigo(n);
        };
        if (f === 0) {
            switch (ciclo % 3) {
                case 0: hangar(-1); hangar(1); e.time.delayedCall(500, () => { if (this.vivo) { hangar(-1); hangar(1); } }); return 1.8;
                case 1: for (const s of [-1, 1]) for (let i = 0; i < 4; i++) e.time.delayedCall(i * 130, () => this.vivo && e.bala(this.x + s * 236, this.y + 40, e.apuntar(this.x + s * 236, this.y + 40), 280, 'aguja')); return 1.6;
                default: e.anillo(this.x, this.y + 20, 20, 150, 'bala_rosa', this.t); return 1.7;
            }
        }
        if (f === 1) {
            switch (ciclo % 3) {
                case 0: for (let i = 0; i < 36; i++) e.time.delayedCall(i * 55, () => { if (!this.vivo) return; e.bala(this.x, this.y, this.t * 3 + i * 0.42, 185, 'bala_rosa'); e.bala(this.x, this.y, -this.t * 3 - i * 0.42 + Math.PI, 185, 'bala_cian'); }); return 2.7;
                case 1: hangar(-1); hangar(1); for (const s of [-1, 1]) e.abanico(this.x + s * 236, this.y + 40, 3, 0.2, 240, 'aguja'); return 1.6;
                default: e.anillo(this.x, this.y, 24, 160, 'bala_naranja', this.t); e.time.delayedCall(400, () => this.vivo && e.anillo(this.x, this.y, 24, 160, 'bala_naranja', this.t + 0.13)); return 2;
            }
        }
        switch (ciclo % 3) {
            case 0: this.rayosGemelos(); return 3.2;
            case 1: for (let i = 0; i < 30; i++) e.time.delayedCall(i * 60, () => this.vivo && e.bala(this.x, this.y, this.t * 5 + i * 0.6, 210, 'bala_roja')); hangar(-1); hangar(1); return 2.2;
            default: e.abanico(this.x, this.y + 30, 11, 0.13, 230, 'bala_rosa'); e.time.delayedCall(450, () => this.vivo && e.abanico(this.x, this.y + 30, 10, 0.13, 230, 'bala_naranja')); return 1.7;
        }
    }

    /** Fase final: dos rayos desde los cañones del borde que se cierran hacia el centro. */
    rayosGemelos() {
        const e = this.escena;
        this.cargando = true;
        Sonido.sfx('carga');
        const xs = [-1, 1].map((s) => this.x + s * 236);
        const avisos = xs.map((x) => {
            const a = e.add.rectangle(x, this.y + 70, 6, ALTO, 0xff4fd8, 0.4).setOrigin(0.5, 0).setDepth(7);
            e.tweens.add({ targets: a, alpha: 0.1, duration: 90, yoyo: true, repeat: 4 });
            return a;
        });
        e.time.delayedCall(950, () => {
            avisos.forEach((a) => a.destroy());
            if (!this.vivo) { this.cargando = false; return; }
            Sonido.sfx('rayo');
            e.temblor(1300, 0.006);
            const haces = xs.map((x) => e.crearRayo(x, this.y + 70, 36));
            const prog = { k: 0 };
            e.tweens.add({
                targets: prog, k: 1, duration: 1300, ease: 'Sine.easeInOut', yoyo: true,
                onUpdate: () => haces.forEach((h, i) => h.mover(this.x + (i ? 1 : -1) * (236 - prog.k * 150), this.y + 70)),
                onComplete: () => { haces.forEach((h) => h.apagar()); this.cargando = false; },
            });
        });
    }

    destroy(fromScene) { this.piezas?.forEach((p) => p.destroy()); super.destroy(fromScene); }
}

const JEFES = { coloso: Coloso, hidra: Hidra, nodriza: Nodriza };
