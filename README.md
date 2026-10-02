# Popó Park

Idle simulation · card collecting · park management · breeding · casual strategy.
Estética **diorama de papel recortado** (cartulina, stickers, sombras suaves, animaciones juguetonas).

Hecho 100% con **HTML, CSS y JavaScript puro**. Sin frameworks, sin librerías, sin CDN, sin imágenes ni sonidos externos. Todo offline. Pensado para ejecutarse local en navegador y, en el futuro, empaquetarse como juego de escritorio para Steam.

---

## Cómo ejecutarlo en local

El juego usa **módulos ES6**, así que necesitas servirlo con un servidor HTTP simple (no se puede abrir el `index.html` con doble click, porque los `import` requieren `http://`).

### Opción A — Python (la más simple)

```bash
cd popo-park
python -m http.server 8080
```

Abre [http://localhost:8080](http://localhost:8080) en tu navegador.

### Opción B — Node sin instalar nada

```bash
npx --yes http-server -p 8080
```

### Opción C — PHP

```bash
php -S localhost:8080
```

---

## Estructura del proyecto

```
popo-park/
├─ index.html
├─ README.md
├─ css/
│  ├─ base.css         # reset + tipografía + variables
│  ├─ layout.css       # viewport 16:9, columnas, pantallas
│  ├─ ui.css           # botones, tooltips, toasts, modales, tabs
│  ├─ cards.css        # cartas, sobres, recompensas
│  ├─ park.css         # overlays del parque
│  └─ animations.css   # keyframes globales
├─ js/
│  ├─ main.js          # punto de entrada
│  ├─ config.js        # constantes globales
│  ├─ gameState.js     # estado central
│  ├─ gameLoop.js      # rAF con delta time
│  ├─ saveManager.js   # save / load / migración
│  ├─ inputManager.js  # mouse + escalado viewport
│  ├─ audioManager.js  # Web Audio API
│  ├─ uiManager.js     # pantallas y opciones
│  ├─ modalManager.js  # modales y toasts
│  ├─ tooltipManager.js
│  ├─ eventLog.js
│  ├─ platformAdapter.js  # capa Steam-ready
│  ├─ data/            # datos puros (no lógica)
│  ├─ systems/         # lógica de juego
│  └─ render/          # dibujado
├─ assets/
│  └─ generated/       # placeholder para futuros assets generados
└─ docs/
   ├─ GAME_DESIGN.md
   ├─ BALANCE.md
   ├─ STEAM_PREP.md
   └─ CHANGELOG.md
```

---

## Controles

- **Mouse**: pasa el cursor sobre las popós para recolectarlas (combo + Fiebre del Parque).
- **Click**: refuerza la recolección con un radio mayor.
- **ESC**: pausa / cierra modal.
- **F11**: pantalla completa.

---

## Sistemas implementados

- Parque visto desde arriba (Canvas) con perros animados (cuerpo, cabeza, orejas, cola, patas, manchas, sombras).
- Sin emojis para perros activos. Emojis solo como iconos secundarios (popó, comida, sobres, logros).
- Popó física en el parque, recolección por hover, combos, Fiebre del Parque, popós doradas.
- Imán de popó mejorable.
- 3 sobres: Comida, Perros, Legendario · Comprar 1 · Comprar 10 · Apertura individual o x10 con animación, agrupado y resumen.
- Sistema de razas, rarezas, calidades genéticas, traits (positivos / negativos / especiales).
- Crianza con embarazo (sin huevos), bebés que crecen a joven → adulto → veterano.
- Hembra embarazada inhabilitada (no produce, no pelea, no vendible, ocupa espacio, come más).
- Plates de comida: el jugador rellena platos, los perros van solos a comer.
- Misión principal lineal · mini objetivo rotativo · logros como toasts · eventos globales temporales.
- Colección de razas / híbridos / mutaciones con siluetas.
- Renombre Canino (prestigio) con puntos persistentes.
- Nivel de cuidador con XP, ruleta de la suerte, caja misteriosa, popó arcoíris, recompensa diaria con racha, buffs temporales y ganancias offline.
- Guardado local con migración versionada.
- Audio sintetizado (Web Audio API).

---

## Dirección artística — teatro de papel (estilo Paper Mario)

El juego se ve como una obra de teatro hecha de papel recortado:

- **Escenario en perspectiva** (`js/render/projection.js`): la lógica sigue en coordenadas de mundo (vista cenital 1080×720), pero todo se proyecta a una vista lateral. El fondo queda arriba y pequeño, y el frente abajo y grande. El cursor se convierte de vuelta a coordenadas de mundo, así que la recolección no cambia.
- **Fondo de cartulina**: cielo, sol con carita, nubes que se mueven, colinas con canto de cartón, arbolitos piruleta, seto y césped a franjas. Se pre-renderiza una vez.
- **Perros como figuras de papel de perfil** (`js/render/renderDogs.js`): borde blanco de pegatina, cabeza grande, ojo ovalado con brillo, mejillas, collar del color de su rareza y silueta propia por raza (orejas, cola, hocico, máscara, manchas). Detalles especiales: corona del Áurodog, antena y visor del Cyberdog, tres cabezas del Cerbero, ojos brillantes de Fenrir.
- **Giro de papel**: al cambiar de dirección, el perro gira como una hoja y a mitad del giro se ve el reverso blanco. Al caminar va dando saltitos.
- **Bocadillos** sobre los perros (Zz, ♥, 🦴) y **nube de pelea** con estrellas.
- **Retratos generados** con el mismo dibujo para cartas, sobres, crianza y la colección (siluetas para las razas sin descubrir).
- **Todo de pie y ordenado por profundidad**: árboles, arbustos, platos, visitantes, popós y perros.
- **UI de teatro**: muro índigo con estrellas, telón rojo enmarcando el parque y tablas de madera para el registro. Paneles de papel con contorno grueso, cintas de color como títulos y botones tipo comando de batalla con sombra dura.

### Opciones gráficas

En el panel de Opciones puedes ajustar:

- **Calidad visual**: baja / media / alta (afecta densidad de partículas).
- **Densidad de partículas** independiente.
- **Reducir animaciones** (modo accesibilidad).
- **Sacudidas de pantalla** activables / desactivables.
- **Escala de UI**.

### Por qué sin librerías externas

Aunque podrían usarse PixiJS, GSAP o Howler, mantener el proyecto en **HTML/CSS/Canvas 2D puro** garantiza:

- Empaquetado mínimo y predecible para Steam.
- Cero dependencias de versionado o supply-chain.
- Compatibilidad total offline sin CDN.
- Hot-reload trivial para desarrollo.

Toda la calidad visual viene de:

- Texturas procedurales en off-screen canvases (cacheadas).
- Sistema de partículas con pool reutilizable y caps por calidad.
- CSS variables + animaciones con curvas de overshoot.
- Sombras compuestas y gradientes para look papel premium.

---

## Steam readiness

El proyecto está preparado para empaquetarse para Steam (Tauri / Electron / Neutralino) con `js/platformAdapter.js`:

```js
platform.unlockAchievement(id)
platform.setStat(id, value)
platform.saveToCloud(key, data)
platform.loadFromCloud(key)
platform.isSteamAvailable()
platform.toggleFullscreen()
```

Hoy esa capa usa `localStorage` y la API Fullscreen del navegador. Mañana se reemplaza por una implementación de Steamworks sin tocar el resto del juego.

Lee `docs/STEAM_PREP.md` para detalles.
