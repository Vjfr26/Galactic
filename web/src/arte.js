/* Arte generado por código para Galactic: enemigos, jefes, balas, cápsulas de poder, fondos y
   piezas de interfaz. Mismo estilo que los gráficos originales (Kenney): formas vectoriales
   planas, casco oscuro metálico, contorno marcado y acentos de neón. */
const Arte = (() => {
    const CONTORNO = '#141826';

    function lienzo(w, h) {
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        return [c, c.getContext('2d')];
    }

    function registrar(escena, clave, canvas, fw, fh) {
        if (escena.textures.exists(clave)) escena.textures.remove(clave);
        const tex = escena.textures.addCanvas(clave, canvas);
        if (fw) {
            let i = 0;
            for (let y = 0; y + fh <= canvas.height; y += fh) for (let x = 0; x + fw <= canvas.width; x += fw) tex.add(i++, 0, x, y, fw, fh);
        }
        return tex;
    }

    /** Polígono simétrico respecto a x = cx: se dan los puntos de la mitad derecha. */
    function simetrico(g, cx, mitad) {
        g.beginPath();
        mitad.forEach(([x, y], i) => (i ? g.lineTo(cx + x, y) : g.moveTo(cx + x, y)));
        for (let i = mitad.length - 1; i >= 0; i--) g.lineTo(cx - mitad[i][0], mitad[i][1]);
        g.closePath();
    }

    function metal(g, x0, y0, x1, y1, claro, oscuro) {
        const gr = g.createLinearGradient(x0, y0, x1, y1);
        gr.addColorStop(0, claro);
        gr.addColorStop(1, oscuro);
        return gr;
    }

    function rellenar(g, estilo, borde = CONTORNO, ancho = 2.5) {
        g.fillStyle = estilo; g.fill();
        g.lineJoin = 'round'; g.lineWidth = ancho; g.strokeStyle = borde; g.stroke();
    }

    function brillo(g, x, y, r, color) {
        const gr = g.createRadialGradient(x, y, 0, x, y, r);
        gr.addColorStop(0, '#ffffff');
        gr.addColorStop(0.35, color);
        gr.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = gr;
        g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    }

    function circulo(g, x, y, r, estilo, borde = CONTORNO, ancho = 2) {
        g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2);
        rellenar(g, estilo, borde, ancho);
    }

    /* ======================= Enemigos (todos miran hacia abajo) ======================= */

    function explorador(escena) {
        const [c, g] = lienzo(44, 44);
        simetrico(g, 22, [[0, 40], [8, 24], [20, 10], [17, 4], [6, 8], [0, 4]]);
        rellenar(g, metal(g, 0, 0, 0, 44, '#5b6478', '#262b3a'));
        simetrico(g, 22, [[0, 32], [5, 22], [0, 14]]);
        rellenar(g, metal(g, 0, 14, 0, 32, '#7ff3ff', '#1aa6c9'), CONTORNO, 1.5);
        g.fillStyle = '#7ff3ff';
        g.fillRect(9, 9, 4, 2); g.fillRect(31, 9, 4, 2);
        registrar(escena, 'explorador', c);
    }

    function caza(escena) {
        const [c, g] = lienzo(60, 56);
        // Alas
        simetrico(g, 30, [[0, 46], [10, 40], [28, 22], [27, 12], [18, 14], [10, 6], [0, 8]]);
        rellenar(g, metal(g, 0, 0, 0, 56, '#6a6f86', '#2a2d3d'));
        // Cabina y cañones
        simetrico(g, 30, [[0, 52], [7, 40], [8, 20], [0, 14]]);
        rellenar(g, metal(g, 0, 14, 0, 52, '#7c8199', '#3a3e52'), CONTORNO, 2);
        g.fillStyle = '#ff4fd8';
        for (const s of [-1, 1]) {
            g.beginPath(); g.moveTo(30 + s * 20, 24); g.lineTo(30 + s * 26, 22); g.lineTo(30 + s * 24, 30); g.closePath(); g.fill();
            g.fillStyle = '#3a3e52'; g.fillRect(30 + s * 16 - 2, 30, 4, 14); g.fillStyle = '#ff4fd8';
        }
        simetrico(g, 30, [[0, 38], [4, 30], [0, 24]]);
        rellenar(g, metal(g, 0, 24, 0, 38, '#ffd0f5', '#ff4fd8'), CONTORNO, 1.5);
        registrar(escena, 'caza', c);
    }

    function kamikaze(escena) {
        const [c, g] = lienzo(46, 50);
        // Púas
        g.beginPath();
        for (let i = 0; i < 12; i++) {
            const a = (i / 12) * Math.PI * 2, r = i % 2 ? 13 : 22;
            g.lineTo(23 + Math.cos(a) * r, 24 + Math.sin(a) * r);
        }
        g.closePath();
        rellenar(g, metal(g, 0, 0, 46, 50, '#ff8a6a', '#a3172a'));
        simetrico(g, 23, [[0, 48], [6, 34], [0, 30]]);
        rellenar(g, '#a3172a', CONTORNO, 2);
        circulo(g, 23, 24, 8, metal(g, 15, 16, 31, 32, '#ffe9a0', '#ff6b3d'));
        g.fillStyle = CONTORNO; g.beginPath(); g.ellipse(23, 26, 2.5, 5, 0, 0, Math.PI * 2); g.fill();
        registrar(escena, 'kamikaze', c);
    }

    function canonera(escena) {
        const [c, g] = lienzo(96, 84);
        simetrico(g, 48, [[0, 80], [16, 74], [38, 60], [44, 40], [40, 18], [26, 8], [0, 6]]);
        rellenar(g, metal(g, 0, 0, 0, 84, '#5f6a62', '#252c28'));
        // Placas
        g.strokeStyle = 'rgba(20,24,38,0.7)'; g.lineWidth = 2;
        g.beginPath(); g.moveTo(14, 40); g.lineTo(82, 40); g.moveTo(22, 60); g.lineTo(74, 60); g.stroke();
        // Luces verdes
        g.fillStyle = '#7dff8a';
        for (const s of [-1, 1]) { g.fillRect(48 + s * 34 - 3, 46, 6, 6); g.fillRect(48 + s * 24 - 2, 66, 4, 4); }
        // Torreta
        circulo(g, 48, 40, 16, metal(g, 32, 24, 64, 56, '#8a968d', '#38413b'));
        g.fillStyle = '#38413b'; g.strokeStyle = CONTORNO; g.lineWidth = 2;
        g.fillRect(44, 48, 8, 22); g.strokeRect(44, 48, 8, 22);
        circulo(g, 48, 40, 6, metal(g, 42, 34, 54, 46, '#d6ffd9', '#3be05a'), CONTORNO, 1.5);
        registrar(escena, 'canonera', c);
    }

    function escudado(escena) {
        const [c, g] = lienzo(64, 60);
        simetrico(g, 32, [[0, 56], [12, 50], [28, 34], [30, 18], [20, 6], [0, 4]]);
        rellenar(g, metal(g, 0, 0, 0, 60, '#6e6386', '#2b2440'));
        simetrico(g, 32, [[0, 46], [10, 36], [12, 20], [0, 12]]);
        rellenar(g, metal(g, 0, 12, 0, 46, '#8a7ba8', '#40355e'), CONTORNO, 2);
        circulo(g, 32, 28, 7, metal(g, 25, 21, 39, 35, '#f1d6ff', '#b14dff'), CONTORNO, 1.5);
        g.fillStyle = '#b14dff';
        for (const s of [-1, 1]) g.fillRect(32 + s * 22 - 2, 22, 4, 12);
        registrar(escena, 'escudado', c);

        // Anillo de escudo (se dibuja encima, se agrieta con los golpes)
        const [c2, g2] = lienzo(96, 96);
        const gr = g2.createRadialGradient(48, 48, 28, 48, 48, 46);
        gr.addColorStop(0, 'rgba(190,120,255,0)');
        gr.addColorStop(0.75, 'rgba(190,120,255,0.25)');
        gr.addColorStop(1, 'rgba(230,200,255,0.85)');
        g2.fillStyle = gr; g2.beginPath(); g2.arc(48, 48, 46, 0, Math.PI * 2); g2.fill();
        g2.strokeStyle = 'rgba(240,220,255,0.9)'; g2.lineWidth = 2; g2.beginPath(); g2.arc(48, 48, 45, 0, Math.PI * 2); g2.stroke();
        registrar(escena, 'aro', c2);
    }

    function mina(escena) {
        const [c, g] = lienzo(76, 38);
        for (let f = 0; f < 2; f++) {
            const ox = f * 38;
            g.strokeStyle = CONTORNO; g.lineWidth = 3;
            for (let i = 0; i < 8; i++) {
                const a = (i / 8) * Math.PI * 2;
                g.beginPath(); g.moveTo(ox + 19 + Math.cos(a) * 10, 19 + Math.sin(a) * 10); g.lineTo(ox + 19 + Math.cos(a) * 17, 19 + Math.sin(a) * 17); g.stroke();
                circulo(g, ox + 19 + Math.cos(a) * 16, 19 + Math.sin(a) * 16, 2.6, '#9aa3b8', CONTORNO, 1.2);
            }
            circulo(g, ox + 19, 19, 11, metal(g, ox + 8, 8, ox + 30, 30, '#8f97ab', '#353b4c'));
            circulo(g, ox + 19, 19, 4.5, f ? '#ff3b4f' : '#5a1520', CONTORNO, 1.5);
            if (f) brillo(g, ox + 19, 19, 9, 'rgba(255,60,80,0.6)');
        }
        registrar(escena, 'mina', c, 38, 38);
    }

    function carguero(escena) {
        const [c, g] = lienzo(104, 74);
        simetrico(g, 52, [[0, 70], [18, 68], [40, 54], [48, 30], [44, 10], [22, 4], [0, 4]]);
        rellenar(g, metal(g, 0, 0, 0, 74, '#6f6a62', '#2e2b27'));
        // Contenedores naranjas
        for (const [x, y] of [[26, 18], [52, 18], [78, 18], [36, 40], [68, 40]]) {
            g.beginPath(); g.rect(x - 11, y - 8, 22, 16);
            rellenar(g, metal(g, x - 11, y - 8, x + 11, y + 8, '#ffb35c', '#d96d16'), CONTORNO, 2);
            g.strokeStyle = 'rgba(80,40,10,0.5)'; g.lineWidth = 1;
            g.beginPath(); g.moveTo(x - 4, y - 7); g.lineTo(x - 4, y + 7); g.moveTo(x + 4, y - 7); g.lineTo(x + 4, y + 7); g.stroke();
        }
        g.fillStyle = '#ffd23f'; g.fillRect(48, 58, 8, 6);
        registrar(escena, 'carguero', c);
    }

    /* ======================= Jefes ======================= */

    function coloso(escena) {
        const [c, g] = lienzo(300, 230);
        // Roca: polígono irregular con caras
        const puntos = [[150, 8], [206, 18], [252, 50], [288, 96], [280, 150], [246, 196], [190, 222], [120, 224], [62, 200], [22, 156], [12, 100], [40, 52], [92, 18]];
        g.beginPath(); puntos.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath();
        rellenar(g, metal(g, 40, 10, 260, 220, '#a7b0be', '#4a5162'), CONTORNO, 4);
        // Caras de roca
        g.fillStyle = 'rgba(30,34,48,0.28)';
        for (const pol of [[[150, 8], [206, 18], [180, 60], [120, 50]], [[252, 50], [288, 96], [240, 110], [220, 70]], [[22, 156], [62, 200], [90, 160], [50, 130]], [[190, 222], [246, 196], [220, 160], [170, 180]]]) {
            g.beginPath(); pol.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.fill();
        }
        // Cráteres
        for (const [x, y, r] of [[80, 80, 14], [220, 140, 18], [110, 180, 10], [250, 90, 8], [60, 140, 9]]) {
            circulo(g, x, y, r, 'rgba(60,66,84,0.55)', 'rgba(30,34,48,0.6)', 2);
        }
        // Grietas brillantes que salen del núcleo
        g.strokeStyle = '#7ff3ff'; g.lineWidth = 3; g.lineCap = 'round';
        for (const [x, y] of [[150, 30], [270, 110], [200, 210], [40, 120], [90, 40]]) {
            g.beginPath(); g.moveTo(150, 118);
            g.lineTo((150 + x) / 2 + 8, (118 + y) / 2 - 6); g.lineTo(x, y); g.stroke();
        }
        // Hueco del núcleo
        circulo(g, 150, 118, 40, '#1d2234', CONTORNO, 4);
        registrar(escena, 'coloso', c);

        // Núcleo de cristal (pieza aparte: brilla y late)
        const [c2, g2] = lienzo(90, 90);
        brillo(g2, 45, 45, 44, 'rgba(80,220,255,0.55)');
        g2.beginPath();
        [[45, 12], [68, 34], [62, 66], [45, 78], [28, 66], [22, 34]].forEach(([x, y], i) => (i ? g2.lineTo(x, y) : g2.moveTo(x, y)));
        g2.closePath();
        rellenar(g2, metal(g2, 22, 12, 68, 78, '#e8fdff', '#1aa6c9'), CONTORNO, 2.5);
        g2.fillStyle = 'rgba(255,255,255,0.7)';
        g2.beginPath(); g2.moveTo(45, 16); g2.lineTo(58, 34); g2.lineTo(45, 30); g2.closePath(); g2.fill();
        registrar(escena, 'coloso_nucleo', c2);

        // Emisor de cristal lateral
        const [c3, g3] = lienzo(44, 60);
        g3.beginPath(); [[22, 2], [40, 22], [34, 56], [10, 56], [4, 22]].forEach(([x, y], i) => (i ? g3.lineTo(x, y) : g3.moveTo(x, y))); g3.closePath();
        rellenar(g3, metal(g3, 4, 2, 40, 56, '#c9f6ff', '#2d7fa6'), CONTORNO, 2.5);
        brillo(g3, 22, 40, 10, 'rgba(120,240,255,0.8)');
        registrar(escena, 'coloso_cristal', c3);
    }

    function hidra(escena) {
        const W = 440, H = 180;
        const [c, g] = lienzo(W, H);
        simetrico(g, W / 2, [[0, 172], [40, 168], [90, 150], [150, 118], [205, 96], [216, 70], [200, 44], [130, 30], [70, 12], [0, 8]]);
        rellenar(g, metal(g, 0, 0, 0, H, '#7a6f80', '#2c2532'), CONTORNO, 4);
        // Franjas rojas
        g.fillStyle = '#ff3b5c';
        for (const s of [-1, 1]) {
            g.beginPath(); g.moveTo(W / 2 + s * 70, 36); g.lineTo(W / 2 + s * 190, 64); g.lineTo(W / 2 + s * 186, 74); g.lineTo(W / 2 + s * 66, 48); g.closePath(); g.fill();
        }
        // Puente central
        simetrico(g, W / 2, [[0, 150], [30, 130], [44, 80], [36, 40], [0, 30]]);
        rellenar(g, metal(g, 0, 30, 0, 150, '#9a90a2', '#4a4152'), CONTORNO, 3);
        g.fillStyle = 'rgba(20,24,38,0.5)';
        for (let i = 0; i < 4; i++) g.fillRect(W / 2 - 24, 52 + i * 18, 48, 4);
        // Boca del cañón principal
        circulo(g, W / 2, 140, 16, '#1d1622', CONTORNO, 3);
        registrar(escena, 'hidra', c);

        const [c2, g2] = lienzo(64, 70);
        circulo(g2, 32, 30, 24, metal(g2, 8, 6, 56, 54, '#a59bb0', '#4a4152'), CONTORNO, 3);
        g2.fillStyle = '#4a4152'; g2.strokeStyle = CONTORNO; g2.lineWidth = 2.5;
        g2.fillRect(24, 40, 7, 28); g2.strokeRect(24, 40, 7, 28);
        g2.fillRect(33, 40, 7, 28); g2.strokeRect(33, 40, 7, 28);
        circulo(g2, 32, 30, 8, metal(g2, 24, 22, 40, 38, '#ffd0d8', '#ff3b5c'), CONTORNO, 2);
        registrar(escena, 'hidra_torreta', c2);
    }

    function nodriza(escena) {
        const W = 540, H = 270;
        const [c, g] = lienzo(W, H);
        // Disco principal
        g.beginPath(); g.ellipse(W / 2, 120, 262, 108, 0, 0, Math.PI * 2);
        rellenar(g, metal(g, 0, 10, 0, 230, '#7d8496', '#262a37'), CONTORNO, 5);
        // Anillo interior
        g.beginPath(); g.ellipse(W / 2, 128, 190, 74, 0, 0, Math.PI * 2);
        rellenar(g, metal(g, 0, 50, 0, 200, '#5b6274', '#1f2330'), CONTORNO, 3);
        // Ventanas de neón alrededor
        for (let i = 0; i < 22; i++) {
            const a = Math.PI * 0.05 + (i / 21) * Math.PI * 0.9;
            const x = W / 2 + Math.cos(a) * 228, y = 120 + Math.sin(a) * 92;
            g.fillStyle = i % 3 ? '#ff4fd8' : '#7ff3ff';
            g.fillRect(x - 3, y - 2, 6, 4);
        }
        // Hangares laterales
        for (const s of [-1, 1]) {
            g.beginPath(); g.rect(W / 2 + s * 150 - 28, 170, 56, 34);
            rellenar(g, '#14161f', CONTORNO, 3);
            g.fillStyle = '#ffd23f'; for (let k = 0; k < 5; k++) g.fillRect(W / 2 + s * 150 - 26 + k * 11, 172, 6, 3);
        }
        // Cañones del borde
        for (const s of [-1, 1]) {
            g.beginPath(); g.rect(W / 2 + s * 236 - 10, 120, 20, 46);
            rellenar(g, metal(g, 0, 120, 0, 166, '#8a90a2', '#3a3e4c'), CONTORNO, 2.5);
        }
        // Cúpula del núcleo (se abre en la segunda fase: el núcleo es una pieza aparte)
        circulo(g, W / 2, 128, 52, '#10121a', CONTORNO, 4);
        registrar(escena, 'nodriza', c);

        const [c2, g2] = lienzo(110, 110);
        brillo(g2, 55, 55, 54, 'rgba(255,79,216,0.55)');
        circulo(g2, 55, 55, 30, metal(g2, 25, 25, 85, 85, '#ffe0f7', '#c21a9a'), CONTORNO, 3);
        circulo(g2, 55, 55, 12, '#ffffff', CONTORNO, 2);
        g2.fillStyle = CONTORNO; g2.beginPath(); g2.ellipse(55, 57, 4, 9, 0, 0, Math.PI * 2); g2.fill();
        registrar(escena, 'nodriza_nucleo', c2);

        // Compuertas de la cúpula (dos mitades)
        const [c3, g3] = lienzo(110, 56);
        g3.beginPath(); g3.arc(55, 56, 52, Math.PI, 0); g3.closePath();
        rellenar(g3, metal(g3, 0, 0, 0, 56, '#9aa1b2', '#4a5062'), CONTORNO, 3);
        g3.strokeStyle = 'rgba(20,24,38,0.6)'; g3.lineWidth = 2;
        for (let i = 1; i < 4; i++) { g3.beginPath(); g3.arc(55, 56, 52 - i * 12, Math.PI, 0); g3.stroke(); }
        registrar(escena, 'nodriza_compuerta', c3);
    }

    /* ======================= Proyectiles, poderes, aliados ======================= */

    function proyectiles(escena) {
        // Láser del jugador: aguja rosa con núcleo blanco
        let [c, g] = lienzo(10, 30);
        const gr = g.createLinearGradient(0, 0, 0, 30);
        gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.5, 'rgba(255,120,220,1)'); gr.addColorStop(1, 'rgba(255,79,216,0)');
        g.fillStyle = gr; g.beginPath(); g.ellipse(5, 14, 4.2, 14, 0, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(5, 10, 1.6, 8, 0, 0, Math.PI * 2); g.fill();
        registrar(escena, 'laser', c);

        // Láser de dron (cian)
        [c, g] = lienzo(8, 22);
        const gr2 = g.createLinearGradient(0, 0, 0, 22);
        gr2.addColorStop(0, '#ffffff'); gr2.addColorStop(0.5, '#7ff3ff'); gr2.addColorStop(1, 'rgba(127,243,255,0)');
        g.fillStyle = gr2; g.beginPath(); g.ellipse(4, 10, 3, 10, 0, 0, Math.PI * 2); g.fill();
        registrar(escena, 'laser_dron', c);

        // Misil teledirigido
        [c, g] = lienzo(12, 26);
        simetrico(g, 6, [[0, 2], [3, 6], [3, 20], [5, 24], [0, 22]]);
        rellenar(g, metal(g, 0, 0, 12, 0, '#ffffff', '#aab3c5'), CONTORNO, 1.5);
        g.fillStyle = '#ff8a3d'; g.fillRect(4, 2, 4, 4);
        registrar(escena, 'misil', c);

        // Balas enemigas: orbes con brillo
        for (const [clave, color] of [['bala_naranja', '#ff9a3d'], ['bala_rosa', '#ff4fd8'], ['bala_cian', '#5fe6ff'], ['bala_verde', '#7dff8a'], ['bala_roja', '#ff3b4f']]) {
            [c, g] = lienzo(20, 20);
            brillo(g, 10, 10, 10, color);
            circulo(g, 10, 10, 4.5, '#ffffff', color, 2);
            registrar(escena, clave, c);
        }
        // Aguja enemiga
        [c, g] = lienzo(10, 26);
        const gr3 = g.createLinearGradient(0, 0, 0, 26);
        gr3.addColorStop(0, 'rgba(255,210,63,0)'); gr3.addColorStop(0.5, '#ffd23f'); gr3.addColorStop(1, '#ffffff');
        g.fillStyle = gr3; g.beginPath(); g.ellipse(5, 13, 3.5, 12, 0, 0, Math.PI * 2); g.fill();
        registrar(escena, 'aguja', c);

        // Rayo del jefe (tira vertical que se estira)
        [c, g] = lienzo(64, 8);
        const gr4 = g.createLinearGradient(0, 0, 64, 0);
        gr4.addColorStop(0, 'rgba(255,79,216,0)'); gr4.addColorStop(0.3, 'rgba(255,79,216,0.8)'); gr4.addColorStop(0.5, '#ffffff');
        gr4.addColorStop(0.7, 'rgba(255,79,216,0.8)'); gr4.addColorStop(1, 'rgba(255,79,216,0)');
        g.fillStyle = gr4; g.fillRect(0, 0, 64, 8);
        registrar(escena, 'rayo', c);
    }

    const CAPSULAS = {
        P: ['#ffd23f', '#b37b00'], R: ['#7dff8a', '#1f9a3a'], S: ['#7ff3ff', '#1a8fb3'],
        M: ['#ff9a3d', '#b34e0d'], D: ['#c08cff', '#6b2fc2'], B: ['#ff5a6e', '#a3172a'],
    };

    function capsulas(escena) {
        for (const [letra, [claro, oscuro]] of Object.entries(CAPSULAS)) {
            const [c, g] = lienzo(34, 34);
            brillo(g, 17, 17, 17, claro + '88');
            g.beginPath(); g.roundRect(5, 5, 24, 24, 8);
            rellenar(g, metal(g, 5, 5, 29, 29, claro, oscuro), CONTORNO, 2);
            g.fillStyle = 'rgba(255,255,255,0.45)'; g.beginPath(); g.roundRect(8, 7, 18, 6, 3); g.fill();
            g.font = '900 15px Orbitron, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
            g.lineWidth = 3; g.strokeStyle = CONTORNO; g.strokeText(letra, 17, 18.5);
            g.fillStyle = '#ffffff'; g.fillText(letra, 17, 18.5);
            registrar(escena, 'capsula_' + letra, c);
        }
    }

    function aliados(escena) {
        // Dron de apoyo
        const [c, g] = lienzo(30, 30);
        brillo(g, 15, 15, 15, 'rgba(192,140,255,0.5)');
        g.beginPath(); [[15, 3], [26, 15], [15, 27], [4, 15]].forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath();
        rellenar(g, metal(g, 4, 3, 26, 27, '#e3d0ff', '#6b2fc2'), CONTORNO, 2);
        circulo(g, 15, 15, 4, '#ffffff', CONTORNO, 1.5);
        registrar(escena, 'dron', c);

        // Burbuja de escudo del jugador
        const [c2, g2] = lienzo(110, 110);
        const gr = g2.createRadialGradient(55, 55, 20, 55, 55, 54);
        gr.addColorStop(0, 'rgba(127,243,255,0)'); gr.addColorStop(0.8, 'rgba(127,243,255,0.18)'); gr.addColorStop(1, 'rgba(200,250,255,0.75)');
        g2.fillStyle = gr; g2.beginPath(); g2.arc(55, 55, 54, 0, Math.PI * 2); g2.fill();
        g2.strokeStyle = 'rgba(255,255,255,0.8)'; g2.lineWidth = 3;
        g2.beginPath(); g2.arc(55, 55, 44, Math.PI * 1.1, Math.PI * 1.4); g2.stroke();
        registrar(escena, 'burbuja', c2);

        // Núcleo visible en modo precisión
        const [c3, g3] = lienzo(20, 20);
        brillo(g3, 10, 10, 10, 'rgba(255,79,216,0.9)');
        circulo(g3, 10, 10, 4, '#ffffff', '#ff4fd8', 2);
        registrar(escena, 'nucleo', c3);
    }

    /* ======================= Efectos y fondo ======================= */

    function efectos(escena) {
        const suave = (clave, tam, paradas) => {
            const [c, g] = lienzo(tam, tam);
            const gr = g.createRadialGradient(tam / 2, tam / 2, 0, tam / 2, tam / 2, tam / 2);
            paradas.forEach(([p, col]) => gr.addColorStop(p, col));
            g.fillStyle = gr; g.fillRect(0, 0, tam, tam);
            registrar(escena, clave, c);
        };
        suave('brillo', 64, [[0, 'rgba(255,255,255,1)'], [0.25, 'rgba(255,255,255,0.55)'], [1, 'rgba(255,255,255,0)']]);
        suave('humo', 24, [[0, 'rgba(255,255,255,0.9)'], [0.6, 'rgba(255,255,255,0.4)'], [1, 'rgba(255,255,255,0)']]);
        let [c, g] = lienzo(4, 4); g.fillStyle = '#fff'; g.fillRect(0, 0, 4, 4); registrar(escena, 'px', c);
        [c, g] = lienzo(12, 12);
        g.fillStyle = '#fff';
        g.beginPath(); g.moveTo(6, 0); g.lineTo(7.2, 4.8); g.lineTo(12, 6); g.lineTo(7.2, 7.2); g.lineTo(6, 12); g.lineTo(4.8, 7.2); g.lineTo(0, 6); g.lineTo(4.8, 4.8); g.closePath(); g.fill();
        registrar(escena, 'chispa', c);
        [c, g] = lienzo(6, 16);
        const gl = g.createLinearGradient(0, 0, 0, 16); gl.addColorStop(0, '#ffffff'); gl.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = gl; g.fillRect(1, 0, 4, 16);
        registrar(escena, 'traza', c);
        [c, g] = lienzo(80, 80);
        g.strokeStyle = '#ffffff'; g.lineWidth = 4;
        g.beginPath(); g.arc(40, 40, 36, 0, Math.PI * 2); g.stroke();
        registrar(escena, 'anillo', c);
        // Esquirlas de metal
        [c, g] = lienzo(10, 10);
        g.beginPath(); g.moveTo(1, 2); g.lineTo(9, 0); g.lineTo(7, 9); g.closePath();
        g.fillStyle = '#ffffff'; g.fill();
        registrar(escena, 'esquirla', c);
    }

    /** Capas de estrellas que se repiten en vertical (tres velocidades). */
    function estrellas(escena) {
        const capas = [['estrellas1', 140, [0.6, 1.2], 0.55], ['estrellas2', 70, [1, 1.8], 0.8], ['estrellas3', 26, [1.6, 2.6], 1]];
        for (const [clave, n, [r0, r1], alfa] of capas) {
            const [c, g] = lienzo(640, 720);
            for (let i = 0; i < n; i++) {
                const x = Math.random() * 640, y = Math.random() * 720, r = r0 + Math.random() * (r1 - r0);
                const tono = Math.random();
                g.fillStyle = tono < 0.15 ? `rgba(255,214,170,${alfa})` : tono < 0.3 ? `rgba(170,210,255,${alfa})` : `rgba(255,255,255,${alfa})`;
                g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
                if (r > 2) { g.fillRect(x - r * 2.2, y - 0.4, r * 4.4, 0.8); g.fillRect(x - 0.4, y - r * 2.2, 0.8, r * 4.4); }
            }
            registrar(escena, clave, c);
        }
    }

    /** Nubes de nebulosa: manchas suaves superpuestas que luego se tiñen por sector. */
    function nebulosa(escena) {
        const [c, g] = lienzo(640, 1024);
        const rnd = (a, b) => a + Math.random() * (b - a);
        for (let i = 0; i < 22; i++) {
            const x = rnd(-60, 700), y = rnd(0, 1024), r = rnd(80, 220);
            // Repetible en las dos direcciones: se pinta también desplazada un ancho y un alto
            const a = rnd(0.08, 0.2);
            for (const dy of [0, -1024, 1024]) for (const dx of [0, -640, 640]) {
                const gr = g.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, r);
                gr.addColorStop(0, `rgba(255,255,255,${a})`);
                gr.addColorStop(1, 'rgba(255,255,255,0)');
                g.fillStyle = gr; g.fillRect(x + dx - r, y + dy - r, r * 2, r * 2);
            }
        }
        registrar(escena, 'nebulosa', c);
    }

    /** Degradado de fondo (azul profundo arriba, casi negro abajo) que se tiñe por sector. */
    function degradado(escena) {
        const [c, g] = lienzo(4, 720);
        const gr = g.createLinearGradient(0, 0, 0, 720);
        gr.addColorStop(0, '#0b1a33'); gr.addColorStop(0.45, '#14305a'); gr.addColorStop(1, '#050a16');
        g.fillStyle = gr; g.fillRect(0, 0, 4, 720);
        registrar(escena, 'degradado', c);
    }

    function planetas(escena) {
        const crear = (clave, tam, claro, oscuro, anillo) => {
            const [c, g] = lienzo(tam * 2, tam * 2);
            const cx = tam, cy = tam, r = tam * 0.55;
            const gr = g.createRadialGradient(cx - r * 0.4, cy - r * 0.4, r * 0.1, cx, cy, r);
            gr.addColorStop(0, claro); gr.addColorStop(1, oscuro);
            if (anillo) {
                g.save(); g.translate(cx, cy); g.rotate(-0.35);
                g.strokeStyle = anillo; g.lineWidth = tam * 0.06;
                g.beginPath(); g.ellipse(0, 0, r * 1.75, r * 0.45, 0, Math.PI, Math.PI * 2); g.stroke();
                g.restore();
            }
            g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill();
            // Bandas
            g.save(); g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.clip();
            g.fillStyle = 'rgba(0,0,0,0.12)';
            for (let i = -3; i < 4; i++) g.fillRect(cx - r, cy + i * r * 0.28, r * 2, r * 0.1);
            // Sombra del terminador
            const sombra = g.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
            sombra.addColorStop(0.45, 'rgba(0,0,0,0)'); sombra.addColorStop(1, 'rgba(0,0,10,0.75)');
            g.fillStyle = sombra; g.fillRect(cx - r, cy - r, r * 2, r * 2);
            g.restore();
            if (anillo) {
                g.save(); g.translate(cx, cy); g.rotate(-0.35);
                g.strokeStyle = anillo; g.lineWidth = tam * 0.06;
                g.beginPath(); g.ellipse(0, 0, r * 1.75, r * 0.45, 0, 0, Math.PI); g.stroke();
                g.restore();
            }
            registrar(escena, clave, c);
        };
        crear('planeta1', 130, '#9fd8ff', '#1d4c8a', 'rgba(200,230,255,0.55)');
        crear('planeta2', 150, '#ffb38a', '#7a1d3a', null);
        crear('planeta3', 170, '#c9b6ff', '#2a1d5a', 'rgba(255,180,240,0.5)');
    }

    /* ======================= Interfaz ======================= */

    function interfaz(escena) {
        // Panel de cristal con borde de neón (NineSlice, esquinas de 14 px)
        let [c, g] = lienzo(64, 64);
        g.fillStyle = 'rgba(8,10,24,0.88)';
        g.beginPath(); g.moveTo(10, 1); g.lineTo(63, 1); g.lineTo(63, 54); g.lineTo(54, 63); g.lineTo(1, 63); g.lineTo(1, 10); g.closePath(); g.fill();
        g.strokeStyle = 'rgba(127,243,255,0.75)'; g.lineWidth = 2; g.stroke();
        g.fillStyle = '#ff4fd8'; g.fillRect(2, 12, 2, 10); g.fillRect(12, 2, 10, 2);
        registrar(escena, 'panel', c);

        // Iconos: pausa, sonido sí, sonido no, candado, bomba
        [c, g] = lienzo(160, 32);
        g.fillStyle = '#ffffff';
        g.fillRect(8, 6, 6, 20); g.fillRect(18, 6, 6, 20);
        const altavoz = (ox) => { g.beginPath(); g.moveTo(ox + 4, 12); g.lineTo(ox + 10, 12); g.lineTo(ox + 18, 5); g.lineTo(ox + 18, 27); g.lineTo(ox + 10, 20); g.lineTo(ox + 4, 20); g.closePath(); g.fill(); };
        altavoz(32);
        g.strokeStyle = '#ffffff'; g.lineWidth = 2.5;
        g.beginPath(); g.arc(50, 16, 6, -0.9, 0.9); g.stroke(); g.beginPath(); g.arc(50, 16, 11, -0.9, 0.9); g.stroke();
        altavoz(64);
        g.strokeStyle = '#ff5a6e'; g.lineWidth = 3;
        g.beginPath(); g.moveTo(84, 10); g.lineTo(94, 22); g.moveTo(94, 10); g.lineTo(84, 22); g.stroke();
        g.fillStyle = '#9aa3b8'; g.fillRect(104, 14, 16, 14);
        g.strokeStyle = '#9aa3b8'; g.lineWidth = 3; g.beginPath(); g.arc(112, 14, 5.5, Math.PI, 0); g.stroke();
        circulo(g, 144, 18, 9, metal(g, 135, 9, 153, 27, '#ff9a8a', '#a3172a'), CONTORNO, 2);
        g.strokeStyle = '#ffd23f'; g.lineWidth = 2; g.beginPath(); g.moveTo(148, 10); g.quadraticCurveTo(152, 4, 156, 6); g.stroke();
        registrar(escena, 'iconos', c, 32, 32);

        // Estrellas del resumen (llena / vacía)
        [c, g] = lienzo(80, 40);
        [['#ffd23f', '#fff1a6'], ['#30344a', '#3d4260']].forEach(([cu, br], f) => {
            g.beginPath();
            for (let i = 0; i < 10; i++) {
                const r = i % 2 ? 7.5 : 18, a = -Math.PI / 2 + i * Math.PI / 5;
                g.lineTo(f * 40 + 20 + Math.cos(a) * r, 21 + Math.sin(a) * r);
            }
            g.closePath();
            rellenar(g, metal(g, f * 40, 3, f * 40 + 40, 39, br, cu), CONTORNO, 2.5);
        });
        registrar(escena, 'estrella', c, 40, 40);
    }

    return {
        CAPSULAS,
        generar(escena) {
            explorador(escena); caza(escena); kamikaze(escena); canonera(escena); escudado(escena); mina(escena); carguero(escena);
            coloso(escena); hidra(escena); nodriza(escena);
            proyectiles(escena); capsulas(escena); aliados(escena);
            efectos(escena); estrellas(escena); nebulosa(escena); degradado(escena); planetas(escena); interfaz(escena);
        },
    };
})();
