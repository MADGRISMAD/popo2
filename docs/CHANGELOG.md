# Changelog

## v0.2.0 — Diorama de papel (gran actualización gráfica)

### Dirección artística
- Rediseño completo a estética de **diorama de papel recortado** sobre mesa.
- Nueva paleta cálida (cremas, cartón, dorado, rosa coral, verde papel).
- Texturas de papel/pasto/cartón generadas proceduralmente y cacheadas (`render/paperTexture.js`).
- Sombras desplazadas tipo "pieza de papel" en todos los elementos.

### Parque
- Capas con profundidad: pasto → caminos → flores → cerca → árboles (ordenados por Y) → zona crianza → platos → visitantes → popó → perros.
- Caminos curvos como cartulina (3 capas: sombra, borde oscuro, cara superior).
- Árboles construidos con 3 círculos overlapping recortados, con flores opcionales.
- Cerca decorativa inferior estilo papel.
- Flores con tallo y pétalos animados con leve oscilación.
- Zona de crianza como cojín rosa con corazones flotantes y aura pulsante.
- Platos con sombra, capa cartón, cara brillante, comida con bolitas y etiqueta sticker.
- Visitantes dibujados como muñequitos de papel.

### Perros
- Silueta distinta por raza (proporciones, orejas, cola): point/flop/big/fluff, curl/long/short/puff/thin.
- Animaciones: caminar con squash & stretch, cola que se mueve, parpadeo periódico, dirección facial según target, bobbing en reposo, sacudida en pelea.
- Halo de rareza para Legendario / Mítico / Cósmico.
- Bigotes blancos para veteranos.
- Iconos sticker de estado (corazón si feliz, hueso si hambriento, ZZZ si descansa, 💥 si pelea).
- Barra de embarazo con gradiente rosa.

### Popó
- Sticker cómico de papel (3 capas, highlights, sombra elíptica).
- Animación de aparición con overshoot (rebote).
- Vibración cuando el cursor está cerca.
- Popó dorada con halo pulsante, sparkles giratorios y carita sutil.
- Aura de cursor visible cuando hay popó cerca.
- Partículas en cada popó recolectada (estrellas doradas para golden, círculos marrón para normal).
- Estela hacia el cursor cuando hay combo activo.

### Sistema de partículas
- Pool central reutilizable (`render/particles.js`) con cap absoluto.
- Helpers: `burst`, `confetti`, `sparkle`, `trail`, `feverFloat`.
- Densidad ajustable por opciones + multiplicador por calidad gráfica.
- Confeti masivo al activar Fiebre del Parque y al nacer un cachorro.
- Partículas suaves flotando hacia arriba durante la fiebre.

### UI
- Panel izquierdo / derecho como tarjetas de papel ligeramente rotadas.
- Topbar como tira de papel con stats tipo chip.
- Botones estilo sticker con borde oscuro inferior, rebote al click, hover con desplazamiento.
- Tooltips como tarjetas de papel con animación de overshoot.
- Modales con borde grueso, sombra de papel y header con dashed-divider.
- Toasts como notas adhesivas rotadas con icono grande.
- Tabs como separadores de álbum.
- Misión y mini-objetivo con sticker decorativo en esquina (★ rosa, ◆ menta).
- Cartas con rotación leve, foil para legendarias y gradiente animado para cósmicas.
- Sobres como objetos físicos con solapa, sello de cera y profundidad.
- Combo flotante grande en el centro del parque, color cambia con el nivel.

### HUD
- Overlay de Fiebre del Parque (degradado cálido pulsante encima del parque).
- Combo flotante grande con color por nivel (blanco → verde → azul → morado → dorado → rosa).

### Menú principal
- Canvas con diorama animado de fondo (perros caminando, árboles, camino, flores, popó).
- Logo grande con foil multi-color y rotación leve animada.
- Botones grandes tipo sticker.

### Opciones nuevas
- Calidad visual: baja / media / alta.
- Densidad de partículas independiente.
- Sacudidas de pantalla on/off.
- Reducir animaciones.

### Audio
- Nuevos sonidos sintetizados: `paperSlide`, `stickerPop`, `confetti`.

### Compatibilidad
- 100% sin librerías externas, sin CDN, sin assets externos.
- Save format intacto (sin bump de versión).

---

## v0.1.0 — Reescritura modular

- Conversión completa del prototipo monolítico a estructura modular ES6.
- Separación estricta `data / systems / render` + módulos core.
- Capa `platformAdapter.js` lista para Steam (logros, stats, cloud, fullscreen).
- Pantalla de carga, menú principal, opciones funcionales.
- Game loop con delta time y soporte de pausa.
- Save versionado con migración por casos.
- Sistema de sobres con apertura x1 y x10 con animaciones por oleadas y resumen.
- Sistema de crianza con embarazo, sin huevos.
- Calidades genéticas y traits con herencia.
- Eventos globales aleatorios.
- Logros como toasts.
- Misión principal lineal + mini objetivo rotativo.
- Renombre Canino (prestigio) con bonus permanentes.
- Audio sintetizado con Web Audio API (sin sonidos externos).
