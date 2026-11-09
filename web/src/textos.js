/* Textos de Galactic en los tres idiomas del portafolio. El idioma sale del mismo
   localStorage que usa la web (mismo origen), o del navegador. */
const IDIOMA = (() => {
    try {
        const guardado = localStorage.getItem('language');
        if (['es', 'en', 'pt'].includes(guardado)) return guardado;
    } catch (e) { /* sin almacenamiento */ }
    const nav = (navigator.language || 'en').slice(0, 2);
    return ['es', 'pt'].includes(nav) ? nav : 'en';
})();

const TEXTOS = {
    es: {
        lema: 'La flota imperial avanza hacia la Tierra. Eres la última nave.',
        jugar: 'Jugar', continuar: 'Continuar', sectores: 'Sectores', controles: 'Controles',
        sonidoSi: 'Sonido: sí', sonidoNo: 'Sonido: no', volver: 'Volver', bloqueado: 'Bloqueado',
        pulsa: 'Pulsa ENTER o haz clic', toca: 'Toca para empezar', cargando: 'Cargando…',
        sector: 'Sector',
        nombres: ['Cinturón de Orión', 'Nebulosa Carmesí', 'Núcleo Imperial'],
        jefes: ['COLOSO DE ROCA', 'ACORAZADO HIDRA', 'MADRE NODRIZA'],
        listaControles: [
            ['FLECHAS  /  WASD', 'Mover la nave'],
            ['ESPACIO  /  Z  /  J', 'Disparar (mantén pulsado)'],
            ['MAYÚS', 'Precisión: lento y con el núcleo visible'],
            ['X  /  K', 'Bomba: limpia la pantalla'],
            ['P  /  ESC', 'Pausa'],
            ['M', 'Sonido'],
            ['Táctil', 'Arrastra para mover · dispara sola · ✸ bomba'],
        ],
        pistas: {
            mover: 'Muévete con las flechas o WASD',
            disparar: 'Mantén ESPACIO para disparar',
            precision: 'Mantén MAYÚS para moverte con precisión: solo el núcleo brillante recibe golpes',
            bomba: 'X lanza una bomba que limpia la pantalla',
            poder: 'Recoge las cápsulas P para mejorar tu arma',
            carguero: 'Los cargueros naranjas siempre llevan premio',
        },
        pistasTactil: {
            mover: 'Arrastra el dedo para mover la nave',
            disparar: 'Mientras tocas, la nave dispara sola',
            precision: 'Solo el núcleo brillante de la nave recibe golpes',
            bomba: 'Toca ✸ para lanzar una bomba que limpia la pantalla',
        },
        poderes: {
            P: 'Arma mejorada', R: '+35 de escudo', S: 'Burbuja: aguanta 3 golpes', M: 'Misiles teledirigidos',
            D: 'Drones de apoyo', B: '+1 bomba', max: 'Arma al máximo · +500',
        },
        alerta: '¡ALERTA!', jefeAproxima: 'Nave enemiga de gran tamaño',
        completado: '¡Sector despejado!',
        enemigos: 'Enemigos', mejorCombo: 'Mejor combo', vidas: 'Vidas perdidas', tiempo: 'Tiempo', puntos: 'Puntos',
        estrellas: ['Despejar el sector', 'Sin perder vidas', '80 % de enemigos'],
        siguiente: 'Siguiente sector', menu: 'Menú', reintentar: 'Repetir sector', verFinal: 'Continuar',
        pausa: 'Pausa', reanudar: 'Continuar', reiniciar: 'Reiniciar sector', salir: 'Menú principal',
        finPartida: 'NAVE DESTRUIDA', reintentarSector: 'Reintentar sector',
        finTitulo: '¡La Tierra está a salvo!',
        finTexto: 'La Madre Nodriza ha caído y la flota imperial se retira.',
        totalPuntos: 'Puntos totales', totalEstrellas: 'Estrellas', gracias: 'Gracias por jugar',
        creditos: 'Juego: Victor Fernandes · Meteoritos: Kenney (CC0) · Fuente: Orbitron',
        hud: {
            puntos: 'PUNTOS', record: 'RÉCORD', combo: 'COMBO', progreso: 'SECTOR', escudo: 'ESCUDO',
            vidas: 'VIDAS', bombas: 'BOMBAS', arma: 'ARMA', poderes: 'PODERES',
        },
        vidaMenos: 'Nave perdida', vidaFinal: '¡Última nave!',
    },
    en: {
        lema: 'The imperial fleet is heading for Earth. You are the last ship.',
        jugar: 'Play', continuar: 'Continue', sectores: 'Sectors', controles: 'Controls',
        sonidoSi: 'Sound: on', sonidoNo: 'Sound: off', volver: 'Back', bloqueado: 'Locked',
        pulsa: 'Press ENTER or click', toca: 'Tap to start', cargando: 'Loading…',
        sector: 'Sector',
        nombres: ['Orion Belt', 'Crimson Nebula', 'Imperial Core'],
        jefes: ['ROCK COLOSSUS', 'HYDRA DREADNOUGHT', 'MOTHERSHIP'],
        listaControles: [
            ['ARROWS  /  WASD', 'Move the ship'],
            ['SPACE  /  Z  /  J', 'Fire (hold)'],
            ['SHIFT', 'Focus: slow, with the core visible'],
            ['X  /  K', 'Bomb: clears the screen'],
            ['P  /  ESC', 'Pause'],
            ['M', 'Sound'],
            ['Touch', 'Drag to move · auto-fire · ✸ bomb'],
        ],
        pistas: {
            mover: 'Move with the arrow keys or WASD',
            disparar: 'Hold SPACE to fire',
            precision: 'Hold SHIFT to move precisely: only the glowing core can be hit',
            bomba: 'X drops a bomb that clears the screen',
            poder: 'Collect P capsules to upgrade your weapon',
            carguero: 'Orange cargo ships always carry a reward',
        },
        pistasTactil: {
            mover: 'Drag your finger to move the ship',
            disparar: 'While you touch, the ship fires on its own',
            precision: 'Only the glowing core of the ship can be hit',
            bomba: 'Tap ✸ to drop a bomb that clears the screen',
        },
        poderes: {
            P: 'Weapon upgraded', R: '+35 shield', S: 'Bubble: blocks 3 hits', M: 'Homing missiles',
            D: 'Support drones', B: '+1 bomb', max: 'Weapon maxed · +500',
        },
        alerta: 'WARNING!', jefeAproxima: 'Huge enemy ship approaching',
        completado: 'Sector cleared!',
        enemigos: 'Enemies', mejorCombo: 'Best combo', vidas: 'Lives lost', tiempo: 'Time', puntos: 'Score',
        estrellas: ['Clear the sector', 'No lives lost', '80% of enemies'],
        siguiente: 'Next sector', menu: 'Menu', reintentar: 'Replay sector', verFinal: 'Continue',
        pausa: 'Paused', reanudar: 'Resume', reiniciar: 'Restart sector', salir: 'Main menu',
        finPartida: 'SHIP DESTROYED', reintentarSector: 'Retry sector',
        finTitulo: 'Earth is safe!',
        finTexto: 'The Mothership has fallen and the imperial fleet retreats.',
        totalPuntos: 'Total score', totalEstrellas: 'Stars', gracias: 'Thanks for playing',
        creditos: 'Game: Victor Fernandes · Meteors: Kenney (CC0) · Font: Orbitron',
        hud: {
            puntos: 'SCORE', record: 'HI-SCORE', combo: 'COMBO', progreso: 'SECTOR', escudo: 'SHIELD',
            vidas: 'LIVES', bombas: 'BOMBS', arma: 'WEAPON', poderes: 'POWERS',
        },
        vidaMenos: 'Ship lost', vidaFinal: 'Last ship!',
    },
    pt: {
        lema: 'A frota imperial avança para a Terra. És a última nave.',
        jugar: 'Jogar', continuar: 'Continuar', sectores: 'Setores', controles: 'Controlos',
        sonidoSi: 'Som: sim', sonidoNo: 'Som: não', volver: 'Voltar', bloqueado: 'Bloqueado',
        pulsa: 'Prime ENTER ou clica', toca: 'Toca para começar', cargando: 'A carregar…',
        sector: 'Setor',
        nombres: ['Cintura de Orion', 'Nebulosa Carmesim', 'Núcleo Imperial'],
        jefes: ['COLOSSO DE ROCHA', 'COURAÇADO HIDRA', 'NAVE-MÃE'],
        listaControles: [
            ['SETAS  /  WASD', 'Mover a nave'],
            ['ESPAÇO  /  Z  /  J', 'Disparar (mantém premido)'],
            ['SHIFT', 'Precisão: lento e com o núcleo visível'],
            ['X  /  K', 'Bomba: limpa o ecrã'],
            ['P  /  ESC', 'Pausa'],
            ['M', 'Som'],
            ['Tátil', 'Arrasta para mover · dispara sozinha · ✸ bomba'],
        ],
        pistas: {
            mover: 'Move-te com as setas ou WASD',
            disparar: 'Mantém ESPAÇO para disparar',
            precision: 'Mantém SHIFT para te moveres com precisão: só o núcleo brilhante é atingido',
            bomba: 'X lança uma bomba que limpa o ecrã',
            poder: 'Apanha as cápsulas P para melhorar a arma',
            carguero: 'Os cargueiros laranja trazem sempre um prémio',
        },
        pistasTactil: {
            mover: 'Arrasta o dedo para mover a nave',
            disparar: 'Enquanto tocas, a nave dispara sozinha',
            precision: 'Só o núcleo brilhante da nave é atingido',
            bomba: 'Toca em ✸ para lançar uma bomba que limpa o ecrã',
        },
        poderes: {
            P: 'Arma melhorada', R: '+35 de escudo', S: 'Bolha: aguenta 3 golpes', M: 'Mísseis teleguiados',
            D: 'Drones de apoio', B: '+1 bomba', max: 'Arma no máximo · +500',
        },
        alerta: 'ALERTA!', jefeAproxima: 'Nave inimiga de grande porte',
        completado: 'Setor limpo!',
        enemigos: 'Inimigos', mejorCombo: 'Melhor combo', vidas: 'Vidas perdidas', tiempo: 'Tempo', puntos: 'Pontos',
        estrellas: ['Limpar o setor', 'Sem perder vidas', '80% dos inimigos'],
        siguiente: 'Setor seguinte', menu: 'Menu', reintentar: 'Repetir setor', verFinal: 'Continuar',
        pausa: 'Pausa', reanudar: 'Continuar', reiniciar: 'Reiniciar setor', salir: 'Menu principal',
        finPartida: 'NAVE DESTRUÍDA', reintentarSector: 'Tentar de novo',
        finTitulo: 'A Terra está a salvo!',
        finTexto: 'A Nave-Mãe caiu e a frota imperial retira-se.',
        totalPuntos: 'Pontos totais', totalEstrellas: 'Estrelas', gracias: 'Obrigado por jogares',
        creditos: 'Jogo: Victor Fernandes · Meteoritos: Kenney (CC0) · Fonte: Orbitron',
        hud: {
            puntos: 'PONTOS', record: 'RECORDE', combo: 'COMBO', progreso: 'SETOR', escudo: 'ESCUDO',
            vidas: 'VIDAS', bombas: 'BOMBAS', arma: 'ARMA', poderes: 'PODERES',
        },
        vidaMenos: 'Nave perdida', vidaFinal: 'Última nave!',
    },
};

const TXT = TEXTOS[IDIOMA];

/** Pista de tutorial adaptada a teclado o pantalla táctil. */
function pista(clave) {
    if (TouchControls.enabled && TXT.pistasTactil[clave]) return TXT.pistasTactil[clave];
    return TXT.pistas[clave];
}
