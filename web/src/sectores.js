/* Los tres sectores de Galactic: cada uno es un guion de oleadas por tiempo (segundos) que
   termina con un jefe. El motor (juego.js) lee los eventos en orden.

   Posiciones x en fracción del campo de juego (0 = borde izquierdo, 1 = borde derecho).
   Eventos:
     lluvia:     meteoritos durante `dur` s, `ritmo` por segundo, `grandes` = probabilidad de los grandes
     formacion:  `tipo` de nave, `forma` (v, linea, columna), `n`, `x`, `ruta` (baja, seno, barridoI, barridoD)
     nave:       una nave suelta de `tipo` en `x` (con `ruta` opcional)
     minas:      `n` minas repartidas
     carguero:   carguero en `x` (siempre suelta premios)
     pista:      consejo en pantalla (`clave`)
     jefe:       llega el jefe del sector (con aviso previo)
*/
const ANCHO = 1280;
const ALTO = 720;
const CAMPO = { x0: 320, x1: 960, w: 640 };

const SECTORES = [
    {
        clave: 'orion', musica: 'ogg', armaInicial: 1,
        fondo: { tinte: 0xffffff, nebulosa: 0x3aa0ff, nebulosa2: 0x7ff3ff, planeta: 'planeta1', velocidad: 1 },
        jefe: 'coloso',
        eventos: [
            { t: 0, pista: 'mover' },
            { t: 0.5, lluvia: true, dur: 22, ritmo: 1.1, grandes: 0.15 },
            { t: 4, pista: 'disparar' },
            { t: 9, pista: 'precision' },
            { t: 12, carguero: true, x: 0.5 },
            { t: 13, pista: 'poder' },
            { t: 20, formacion: true, tipo: 'explorador', forma: 'v', n: 5, x: 0.5, ruta: 'baja' },
            { t: 26, formacion: true, tipo: 'explorador', forma: 'linea', n: 6, x: 0, ruta: 'barridoI' },
            { t: 31, formacion: true, tipo: 'explorador', forma: 'linea', n: 6, x: 1, ruta: 'barridoD' },
            { t: 35, carguero: true, x: 0.3 },
            { t: 36, pista: 'carguero' },
            { t: 38, lluvia: true, dur: 16, ritmo: 0.7, grandes: 0.2 },
            { t: 40, nave: true, tipo: 'caza', x: 0.3 }, { t: 40.5, nave: true, tipo: 'caza', x: 0.7 },
            { t: 46, formacion: true, tipo: 'explorador', forma: 'columna', n: 4, x: 0.25, ruta: 'seno' },
            { t: 46, formacion: true, tipo: 'explorador', forma: 'columna', n: 4, x: 0.75, ruta: 'seno' },
            { t: 52, minas: true, n: 4 },
            { t: 55, pista: 'bomba' },
            { t: 58, nave: true, tipo: 'caza', x: 0.2 }, { t: 58.5, nave: true, tipo: 'caza', x: 0.5 }, { t: 59, nave: true, tipo: 'caza', x: 0.8 },
            { t: 60, formacion: true, tipo: 'explorador', forma: 'v', n: 5, x: 0.5, ruta: 'baja' },
            { t: 66, lluvia: true, dur: 9, ritmo: 1.8, grandes: 0.35 },
            { t: 70, carguero: true, x: 0.7 },
            { t: 78, formacion: true, tipo: 'explorador', forma: 'linea', n: 5, x: 0, ruta: 'barridoI' },
            { t: 79, formacion: true, tipo: 'explorador', forma: 'linea', n: 5, x: 1, ruta: 'barridoD' },
            { t: 80, nave: true, tipo: 'caza', x: 0.35 }, { t: 80.5, nave: true, tipo: 'caza', x: 0.65 },
            { t: 87, minas: true, n: 5 },
            { t: 88, formacion: true, tipo: 'explorador', forma: 'v', n: 7, x: 0.5, ruta: 'baja' },
            { t: 95, nave: true, tipo: 'caza', x: 0.2 }, { t: 95, nave: true, tipo: 'caza', x: 0.5 }, { t: 95, nave: true, tipo: 'caza', x: 0.8 },
            { t: 103, jefe: true },
        ],
    },
    {
        clave: 'carmesi', musica: 'nebulosa', armaInicial: 2,
        fondo: { tinte: 0xff9aa8, nebulosa: 0xff3b6e, nebulosa2: 0xc04dff, planeta: 'planeta2', velocidad: 1.15 },
        jefe: 'hidra',
        eventos: [
            { t: 0.5, lluvia: true, dur: 10, ritmo: 0.8, grandes: 0.2 },
            { t: 3, nave: true, tipo: 'caza', x: 0.3 }, { t: 3.5, nave: true, tipo: 'caza', x: 0.7 },
            { t: 9, nave: true, tipo: 'kamikaze', x: 0.2 }, { t: 9.4, nave: true, tipo: 'kamikaze', x: 0.5 }, { t: 9.8, nave: true, tipo: 'kamikaze', x: 0.8 },
            { t: 14, formacion: true, tipo: 'explorador', forma: 'v', n: 7, x: 0.5, ruta: 'baja' },
            { t: 18, carguero: true, x: 0.5 },
            { t: 22, nave: true, tipo: 'canonera', x: 0.5 },
            { t: 28, nave: true, tipo: 'kamikaze', x: 0.15 }, { t: 28.3, nave: true, tipo: 'kamikaze', x: 0.4 },
            { t: 28.6, nave: true, tipo: 'kamikaze', x: 0.6 }, { t: 28.9, nave: true, tipo: 'kamikaze', x: 0.85 },
            { t: 32, formacion: true, tipo: 'explorador', forma: 'linea', n: 6, x: 0, ruta: 'barridoI' },
            { t: 33, formacion: true, tipo: 'explorador', forma: 'linea', n: 6, x: 1, ruta: 'barridoD' },
            { t: 38, minas: true, n: 5 },
            { t: 42, nave: true, tipo: 'caza', x: 0.2 }, { t: 42, nave: true, tipo: 'caza', x: 0.5 }, { t: 42, nave: true, tipo: 'caza', x: 0.8 },
            { t: 44, nave: true, tipo: 'kamikaze', x: 0.35 }, { t: 44.4, nave: true, tipo: 'kamikaze', x: 0.65 },
            { t: 50, carguero: true, x: 0.3 },
            { t: 54, nave: true, tipo: 'canonera', x: 0.28 }, { t: 55, nave: true, tipo: 'canonera', x: 0.72 },
            { t: 62, formacion: true, tipo: 'explorador', forma: 'columna', n: 5, x: 0.3, ruta: 'seno' },
            { t: 62, formacion: true, tipo: 'explorador', forma: 'columna', n: 5, x: 0.7, ruta: 'seno' },
            { t: 64, formacion: true, tipo: 'kamikaze', forma: 'linea', n: 6, x: 0.5, ruta: 'baja' },
            { t: 70, lluvia: true, dur: 8, ritmo: 1.6, grandes: 0.3 },
            { t: 72, nave: true, tipo: 'caza', x: 0.5 },
            { t: 80, carguero: true, x: 0.7 },
            { t: 84, nave: true, tipo: 'caza', x: 0.15 }, { t: 84, nave: true, tipo: 'caza', x: 0.38 },
            { t: 84, nave: true, tipo: 'caza', x: 0.62 }, { t: 84, nave: true, tipo: 'caza', x: 0.85 },
            { t: 92, nave: true, tipo: 'canonera', x: 0.5 },
            { t: 93, nave: true, tipo: 'kamikaze', x: 0.2 }, { t: 93.5, nave: true, tipo: 'kamikaze', x: 0.8 },
            { t: 102, jefe: true },
        ],
    },
    {
        clave: 'nucleo', musica: 'nucleo', armaInicial: 3,
        fondo: { tinte: 0xb6a8ff, nebulosa: 0x6b2fc2, nebulosa2: 0xff4fd8, planeta: 'planeta3', velocidad: 1.3 },
        jefe: 'nodriza',
        eventos: [
            { t: 2, nave: true, tipo: 'escudado', x: 0.35 }, { t: 2.5, nave: true, tipo: 'escudado', x: 0.65 },
            { t: 8, formacion: true, tipo: 'kamikaze', forma: 'linea', n: 4, x: 0.5, ruta: 'baja' },
            { t: 9, formacion: true, tipo: 'explorador', forma: 'v', n: 7, x: 0.5, ruta: 'baja' },
            { t: 14, carguero: true, x: 0.5 },
            { t: 18, nave: true, tipo: 'canonera', x: 0.28 }, { t: 18.5, nave: true, tipo: 'canonera', x: 0.72 },
            { t: 24, minas: true, n: 6 },
            { t: 25, formacion: true, tipo: 'explorador', forma: 'linea', n: 6, x: 0, ruta: 'barridoI' },
            { t: 30, nave: true, tipo: 'escudado', x: 0.2 }, { t: 30.4, nave: true, tipo: 'escudado', x: 0.5 }, { t: 30.8, nave: true, tipo: 'escudado', x: 0.8 },
            { t: 36, nave: true, tipo: 'caza', x: 0.15 }, { t: 36, nave: true, tipo: 'caza', x: 0.38 },
            { t: 36, nave: true, tipo: 'caza', x: 0.62 }, { t: 36, nave: true, tipo: 'caza', x: 0.85 },
            { t: 42, carguero: true, x: 0.3 },
            { t: 44, formacion: true, tipo: 'kamikaze', forma: 'v', n: 8, x: 0.5, ruta: 'baja' },
            { t: 52, nave: true, tipo: 'canonera', x: 0.5 },
            { t: 53, nave: true, tipo: 'escudado', x: 0.25 }, { t: 53.5, nave: true, tipo: 'escudado', x: 0.75 },
            { t: 60, lluvia: true, dur: 8, ritmo: 1.6, grandes: 0.35 },
            { t: 61, formacion: true, tipo: 'explorador', forma: 'linea', n: 6, x: 1, ruta: 'barridoD' },
            { t: 68, carguero: true, x: 0.7 },
            { t: 72, nave: true, tipo: 'caza', x: 0.2 }, { t: 72, nave: true, tipo: 'caza', x: 0.5 }, { t: 72, nave: true, tipo: 'caza', x: 0.8 },
            { t: 73, nave: true, tipo: 'escudado', x: 0.35 }, { t: 73.5, nave: true, tipo: 'escudado', x: 0.65 },
            { t: 80, nave: true, tipo: 'canonera', x: 0.28 }, { t: 80.5, nave: true, tipo: 'canonera', x: 0.72 },
            { t: 82, minas: true, n: 5 },
            { t: 90, formacion: true, tipo: 'kamikaze', forma: 'linea', n: 6, x: 0.5, ruta: 'baja' },
            { t: 91, formacion: true, tipo: 'explorador', forma: 'v', n: 7, x: 0.3, ruta: 'baja' },
            { t: 92, formacion: true, tipo: 'explorador', forma: 'v', n: 7, x: 0.7, ruta: 'baja' },
            { t: 101, jefe: true },
        ],
    },
];

/** Duración del guion de un sector (hasta la llegada del jefe), para la barra de progreso. */
function duracionSector(i) {
    return SECTORES[i].eventos.find((e) => e.jefe).t;
}
