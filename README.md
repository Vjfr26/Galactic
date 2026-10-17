# Galactic

Shooter espacial. Este repositorio tiene dos versiones:

- **Escritorio** (`galactic.py`): la original, en Python con pygame.
- **Navegador** (`web/`): rehecha con [Phaser 3](https://phaser.io). Se puede jugar en mi portafolio: [victorfernandes.vercel.app](https://victorfernandes.vercel.app).

## Versión de escritorio

```bash
pip install pygame
python3 galactic.py
```

Mueve la nave con ← → y dispara con Espacio. Esquiva los meteoritos o destrúyelos; cada choque baja el escudo.

## Versión web (`web/`)

Los navegadores no dejan cargar imágenes desde `file://`, así que hace falta un servidor estático:

```bash
cd web
python3 -m http.server 8000
```

Después abre <http://localhost:8000>. Para empezar en un sector concreto: `?sector=2`.

- **3 sectores**, cada uno con un jefe gigante: el Coloso de Roca, el Acorazado Hidra y la Madre Nodriza.
- **8 tipos de enemigos**, armas que suben hasta el nivel 5, misiles teledirigidos, drones, escudos y bombas.
- **Modo precisión** (Mayús): la nave va más despacio y muestra su núcleo, para esquivar al milímetro.
- Combos de puntos, progreso guardado, música y efectos con WebAudio, y textos en español, inglés y portugués.

| Tecla | Acción |
| --- | --- |
| Flechas / WASD | Mover la nave |
| Espacio / Z / J | Disparar (mantén pulsado) |
| Mayús | Precisión |
| X / K | Bomba |
| P / Esc | Pausa |
| M | Sonido |

En el móvil, arrastra el dedo para mover: la nave dispara sola y ✸ lanza la bomba.

## Créditos

- Código: Victor Fernandes.
- Meteoritos: [Kenney](https://kenney.nl), CC0.
- Fuente Orbitron (versión web): SIL Open Font License (`web/fuente/OFL.txt`).
- Phaser 3: licencia MIT (`web/lib/PHASER-LICENSE.txt`).
