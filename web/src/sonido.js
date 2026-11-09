/* Sonido de Galactic con WebAudio: efectos sintetizados, la explosión y la música originales
   del juego (archivos), y temas chiptune generados para el menú, los sectores y los jefes.
   El navegador solo deja sonar audio tras un gesto del jugador (Sonido.iniciar). */
const Sonido = (() => {
    const CLAVE = 'galactic-sonido';
    let activo = true;
    try { activo = localStorage.getItem(CLAVE) !== 'no'; } catch (e) { /* sin almacenamiento */ }

    let ctx = null, maestro = null, busSfx = null, busMusica = null, ruidoBuffer = null, compresor = null;
    const muestras = {};
    let pendiente = null;

    function iniciar() {
        if (ctx) {
            if (ctx.state === 'suspended') ctx.resume();
            return;
        }
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        ctx = new AC();
        compresor = ctx.createDynamicsCompressor();
        compresor.threshold.value = -16; compresor.ratio.value = 4;
        compresor.connect(ctx.destination);
        maestro = ctx.createGain();
        maestro.gain.value = activo ? 1 : 0;
        maestro.connect(compresor);
        busSfx = ctx.createGain(); busSfx.gain.value = 0.5; busSfx.connect(maestro);
        busMusica = ctx.createGain(); busMusica.gain.value = 0.26; busMusica.connect(maestro);
        ruidoBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
        const datos = ruidoBuffer.getChannelData(0);
        for (let i = 0; i < datos.length; i++) datos[i] = Math.random() * 2 - 1;
        cargar('explosion', 'explosion.wav');
        cargar('musica', 'music.ogg');
        if (pendiente) { const p = pendiente; pendiente = null; musica(p); }
    }

    function cargar(nombre, archivo) {
        fetch(archivo).then((r) => r.arrayBuffer()).then((b) => ctx.decodeAudioData(b)).then((buf) => {
            muestras[nombre] = buf;
            if (nombre === 'musica' && actual === 'ogg') { const a = actual; actual = null; musica(a); }
        }).catch(() => { /* sin el archivo, se usa solo lo sintetizado */ });
    }

    function tono({ tipo = 'square', f0 = 440, f1 = f0, dur = 0.12, vol = 0.25, retardo = 0, bus = busSfx }) {
        if (!ctx) return;
        const t = ctx.currentTime + retardo;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = tipo;
        osc.frequency.setValueAtTime(f0, t);
        if (f1 !== f0) osc.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(vol, t + 0.006);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        osc.connect(g); g.connect(bus);
        osc.start(t); osc.stop(t + dur + 0.02);
    }

    function ruido({ dur = 0.15, vol = 0.3, f0 = 2000, f1 = 300, tipo = 'lowpass', retardo = 0 }) {
        if (!ctx) return;
        const t = ctx.currentTime + retardo;
        const src = ctx.createBufferSource();
        src.buffer = ruidoBuffer;
        const filtro = ctx.createBiquadFilter();
        filtro.type = tipo;
        filtro.frequency.setValueAtTime(f0, t);
        filtro.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t + dur);
        const g = ctx.createGain();
        g.gain.setValueAtTime(vol, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        src.connect(filtro); filtro.connect(g); g.connect(busSfx);
        src.start(t, Math.random() * 0.5); src.stop(t + dur + 0.02);
    }

    function muestra(nombre, vol = 0.5, velocidad = 1) {
        const buf = muestras[nombre];
        if (!ctx || !buf) return false;
        const src = ctx.createBufferSource();
        src.buffer = buf;
        src.playbackRate.value = velocidad;
        const g = ctx.createGain();
        g.gain.value = vol;
        src.connect(g); g.connect(busSfx);
        src.start();
        return true;
    }

    const nota = (n) => 440 * Math.pow(2, (n - 69) / 12);

    // Algunos efectos suenan muchas veces por segundo: se limita cuántos caben a la vez
    const ultimo = {};
    const limite = { disparo: 0.06, impacto: 0.045, explosion: 0.05, misil: 0.08 };

    const EFECTOS = {
        disparo: () => tono({ tipo: 'square', f0: 1400, f1: 520, dur: 0.07, vol: 0.035 }),
        misil: () => { tono({ tipo: 'sawtooth', f0: 300, f1: 700, dur: 0.12, vol: 0.03 }); ruido({ dur: 0.1, vol: 0.04, f0: 3000, f1: 800, tipo: 'bandpass' }); },
        impacto: () => tono({ tipo: 'square', f0: 260, f1: 120, dur: 0.05, vol: 0.06 }),
        explosion: () => { if (!muestra('explosion', 0.32, 1.1 + Math.random() * 0.25)) ruido({ dur: 0.3, vol: 0.3, f0: 1500, f1: 80 }); },
        explosionGrande: () => { muestra('explosion', 0.6, 0.7); ruido({ dur: 0.7, vol: 0.35, f0: 900, f1: 40 }); tono({ tipo: 'sine', f0: 120, f1: 30, dur: 0.6, vol: 0.4 }); },
        meteorito: () => ruido({ dur: 0.18, vol: 0.18, f0: 1200, f1: 150 }),
        poder: () => [64, 67, 71, 76, 79, 83].forEach((n, i) => tono({ tipo: 'triangle', f0: nota(n + 12), dur: 0.12, vol: 0.12, retardo: i * 0.045 })),
        moneda: () => { tono({ f0: nota(88), dur: 0.05, vol: 0.06 }); tono({ f0: nota(95), dur: 0.12, vol: 0.06, retardo: 0.05 }); },
        reparar: () => [60, 64, 67, 72].forEach((n, i) => tono({ tipo: 'sine', f0: nota(n + 12), dur: 0.18, vol: 0.16, retardo: i * 0.06 })),
        escudo: () => { tono({ tipo: 'sine', f0: 900, f1: 300, dur: 0.3, vol: 0.18 }); ruido({ dur: 0.25, vol: 0.1, f0: 7000, f1: 1500, tipo: 'highpass' }); },
        dano: () => { tono({ tipo: 'sawtooth', f0: 320, f1: 60, dur: 0.3, vol: 0.2 }); ruido({ dur: 0.2, vol: 0.22, f0: 2500, f1: 200 }); },
        muerte: () => { muestra('explosion', 0.7, 0.55); tono({ tipo: 'sawtooth', f0: 600, f1: 40, dur: 1.1, vol: 0.2 }); },
        bomba: () => { ruido({ dur: 1.2, vol: 0.45, f0: 3000, f1: 50 }); tono({ tipo: 'sine', f0: 200, f1: 25, dur: 1.2, vol: 0.5 }); },
        alerta: () => [0, 0.45, 0.9].forEach((r) => { tono({ tipo: 'square', f0: 880, f1: 440, dur: 0.38, vol: 0.12, retardo: r }); }),
        carga: () => tono({ tipo: 'sawtooth', f0: 120, f1: 900, dur: 0.9, vol: 0.08 }),
        rayo: () => { ruido({ dur: 1.0, vol: 0.2, f0: 5000, f1: 2000, tipo: 'bandpass' }); tono({ tipo: 'sawtooth', f0: 90, f1: 80, dur: 1.0, vol: 0.12 }); },
        jefeGolpe: () => tono({ tipo: 'square', f0: 180, f1: 90, dur: 0.06, vol: 0.06 }),
        menu: () => tono({ f0: nota(84), dur: 0.05, vol: 0.07 }),
        elegir: () => { tono({ f0: nota(79), dur: 0.06, vol: 0.09 }); tono({ f0: nota(86), dur: 0.12, vol: 0.09, retardo: 0.06 }); },
        estrella: () => [79, 84, 91].forEach((n, i) => tono({ tipo: 'triangle', f0: nota(n), dur: 0.25, vol: 0.16, retardo: i * 0.05 })),
        victoria: () => [72, 76, 79, 84, 79, 84, 88].forEach((n, i) => tono({ f0: nota(n), dur: i === 6 ? 0.6 : 0.14, vol: 0.12, retardo: i * 0.13 })),
        combo: () => tono({ tipo: 'triangle', f0: nota(91), f1: nota(96), dur: 0.08, vol: 0.06 }),
    };

    function sfx(nombre) {
        if (!ctx || !activo) return;
        const t = ctx.currentTime;
        if (limite[nombre] && ultimo[nombre] && t - ultimo[nombre] < limite[nombre]) return;
        ultimo[nombre] = t;
        const f = EFECTOS[nombre];
        if (f) f();
    }

    /* ---------- Música: secuenciador de semicorcheas (bajo, arpegio, melodía) ---------- */
    const ACORDES = { M: [0, 4, 7, 12], m: [0, 3, 7, 12], sus: [0, 5, 7, 12] };
    const CANCIONES = {
        menu: { bpm: 96, acordes: [[45, 'm'], [41, 'M'], [43, 'M'], [40, 'm']],
            melodia: [76, null, null, 74, 72, null, 71, null, 72, null, 74, null, 76, null, null, null,
                      77, null, 76, null, 74, null, 72, null, 71, null, null, null, null, null, null, null] },
        nebulosa: { bpm: 140, acordes: [[50, 'm'], [46, 'M'], [48, 'M'], [45, 'm']],
            melodia: [74, null, 77, null, 81, null, 77, null, 79, null, 77, 76, 74, null, null, null,
                      72, null, 74, null, 76, null, 77, null, 76, null, 74, null, 73, null, null, null] },
        nucleo: { bpm: 150, acordes: [[40, 'm'], [43, 'M'], [38, 'M'], [45, 'm']],
            melodia: [64, 67, 71, null, 72, null, 71, 67, 64, null, 62, null, 64, null, null, null,
                      67, 71, 74, null, 76, null, 74, 71, 72, null, 71, null, 67, null, null, null] },
        jefe: { bpm: 164, acordes: [[40, 'm'], [40, 'm'], [36, 'M'], [38, 'M']],
            melodia: [76, 76, null, 79, 76, null, 74, 76, null, 71, null, 72, 74, null, 71, null,
                      72, 72, null, 76, 74, null, 72, 71, null, 67, null, 69, 71, null, 74, null] },
        fin: { bpm: 104, acordes: [[48, 'M'], [43, 'M'], [45, 'm'], [41, 'M']],
            melodia: [79, null, 84, null, 88, null, 84, null, 83, null, 79, null, 81, null, null, null,
                      84, null, 83, null, 81, null, 79, null, 81, null, null, null, null, null, null, null] },
    };

    let actual = null, temporizador = null, paso = 0, proxima = 0, fuenteOgg = null;

    function programar() {
        const c = CANCIONES[actual];
        if (!c || !ctx) return;
        const dur = 60 / c.bpm / 4;
        while (proxima < ctx.currentTime + 0.12) {
            const compas = Math.floor(paso / 16) % c.acordes.length;
            const p = paso % 16;
            const [raiz, tipo] = c.acordes[compas];
            const tonos = ACORDES[tipo];
            const t0 = proxima - ctx.currentTime;
            if (p % 2 === 0) tono({ tipo: 'triangle', f0: nota(raiz - 12 + (p % 8 === 4 ? 7 : 0)), dur: dur * 1.8, vol: 0.3, retardo: t0, bus: busMusica });
            tono({ tipo: 'square', f0: nota(raiz + 12 + tonos[p % 4]), dur: dur * 0.85, vol: 0.03, retardo: t0, bus: busMusica });
            if (p % 4 === 0) { // bombo suave
                tono({ tipo: 'sine', f0: 150, f1: 45, dur: 0.12, vol: 0.25, retardo: t0, bus: busMusica });
            }
            if (p % 8 === 4) ruido2(t0);
            const m = c.melodia[paso % c.melodia.length];
            if (m) tono({ tipo: 'square', f0: nota(m), dur: dur * 1.8, vol: 0.06, retardo: t0, bus: busMusica });
            proxima += dur;
            paso++;
        }
    }

    // Caja en el bus de música
    function ruido2(retardo) {
        const t = ctx.currentTime + retardo;
        const src = ctx.createBufferSource();
        src.buffer = ruidoBuffer;
        const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 1800;
        const g = ctx.createGain(); g.gain.setValueAtTime(0.12, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
        src.connect(f); f.connect(g); g.connect(busMusica);
        src.start(t, Math.random() * 0.5); src.stop(t + 0.12);
    }

    function musica(nombre) {
        if (!ctx) { pendiente = nombre; return; }
        if (actual === nombre) return;
        parar();
        actual = nombre;
        if (nombre === 'ogg') {
            const buf = muestras.musica;
            if (!buf) return; // se reproducirá al terminar de cargar
            fuenteOgg = ctx.createBufferSource();
            fuenteOgg.buffer = buf;
            fuenteOgg.loop = true;
            fuenteOgg.connect(busMusica);
            fuenteOgg.start();
            return;
        }
        paso = 0;
        proxima = ctx.currentTime + 0.05;
        temporizador = setInterval(programar, 30);
    }

    function parar() {
        if (temporizador) clearInterval(temporizador);
        temporizador = null;
        if (fuenteOgg) { try { fuenteOgg.stop(); } catch (e) { /* ya parada */ } fuenteOgg = null; }
        actual = null;
    }

    function alternar() {
        activo = !activo;
        try { localStorage.setItem(CLAVE, activo ? 'si' : 'no'); } catch (e) { /* sin almacenamiento */ }
        if (maestro) maestro.gain.setTargetAtTime(activo ? 1 : 0, ctx.currentTime, 0.02);
        return activo;
    }

    document.addEventListener('visibilitychange', () => {
        if (!ctx) return;
        if (document.hidden) ctx.suspend(); else ctx.resume();
    });

    return {
        iniciar, sfx, musica, parar, alternar,
        get activo() { return activo; },
        atenuar(seg) {
            if (!busMusica) return;
            const t = ctx.currentTime;
            busMusica.gain.cancelScheduledValues(t);
            busMusica.gain.setValueAtTime(0.05, t);
            busMusica.gain.linearRampToValueAtTime(0.26, t + seg);
        },
    };
})();
