# Changelog

## v0.4.0 — Teatro de papel (estilo Paper Mario)

### Parque
- Nueva vista lateral en perspectiva, con proyección mundo↔pantalla (`render/projection.js`). La lógica y el guardado no cambian.
- Fondo de cartulina: cielo, sol con carita, nubes animadas, colinas con canto, arbolitos piruleta, seto, césped a franjas y camino ondulado.
- Árboles y arbustos como recortes de pie con borde blanco. Platos de perfil, visitantes de papel y zona de crianza como alfombra.
- Todo lo que está de pie se ordena por profundidad.
- Telón rojo y bambalina enmarcando el escenario.

### Perros
- Rediseño completo: figuras de papel de perfil con borde de pegatina, cabeza grande, ojo ovalado, mejillas y collar del color de la rareza.
- Silueta por raza más detalles únicos (corona, antena/visor, tres cabezas, ojos brillantes, estrellas, máscara, manchas de dálmata, pompones).
- Giro de papel al cambiar de dirección (se ve el reverso), saltitos al caminar y respiración en reposo.
- Bocadillos de estado y nube de pelea.
- Retratos para cartas, sobres, crianza y colección (siluetas para lo no descubierto).

### Interfaz
- Paleta nueva: tinta índigo, papel blanco y colores planos saturados.
- Teatro: muro con estrellas, telón y tablas de madera para el registro.
- Paneles, modales, toasts y tooltips como hojas de papel con contorno grueso y sombra dura.
- Títulos en cintas de color y botones tipo comando de batalla.
- Sobres en formato horizontal con contador.
- Los avisos caen sobre el cielo del escenario (máximo 3 a la vez) y ya no tapan los paneles.
- El menú principal es un escenario con perros de papel paseando.
- Popó como pegatina con carita. La dorada y la arcoíris brillan.

## v0.3.0 — Modo adictivo

### Nuevos ganchos
- **Nivel de cuidador** con barra de XP siempre visible. Ganas XP con cada popó, sobre, caja y cachorro. Cada nivel da popó, un giro de ruleta y, cada 3/5/10 niveles, sobres.
- **Ruleta de la Suerte** (🎡 en la barra superior): giros por nivel, recompensa diaria, cajas y uno gratis cada 8 min de juego. Jackpot de 25 min de producción.
- **Caja misteriosa**: cae al parque cada 40–100 s y dura 11 s. Premios: Frenesí x7, lluvia de popó, bolsa de popó, imán gigante, toque dorado, fiebre, giro o sobres.
- **Popó arcoíris** (0,4 %): vale x60, celebración enorme.
- **Recompensa diaria con racha** de 7 días (el día 7 trae un Sobre Legendario). Si faltas un día, pierdes la racha.
- **Ganancias offline** con popup (hasta 4 h).
- **Buffs temporales** visibles en la barra superior con cuenta atrás.

### Game feel
- Combo hasta **x10**, con anillo de tiempo alrededor del cursor, callouts (¡GENIAL!, ¡BRUTAL!, ¡¡POPÓ-DIOS!!) y aviso de combo perdido.
- Cada popó del combo suena una nota más aguda (escala pentatónica).
- Sacudida de pantalla, flash y banners gigantes en momentos importantes (en cola, sin solaparse).
- La Fiebre del Parque ahora trae una lluvia de popó.
- Contador de popó que rueda y rebota; números grandes abreviados (K, M, B…).
- Sobres con cartas boca abajo que brillan del color de su rareza y se voltean una a una; lo mejor sale al final, con temblor de suspense en épicas+. Botón "Abrir otro".
- La tienda ordena por precio, brilla en verde lo que puedes comprar y muestra una barra de "casi lo tienes".
- Contador de sobres sin abrir en la pestaña Sobres.
- El tooltip del perro solo aparece si dejas el cursor quieto encima (ya no tapa el parque al recoger).

### Arreglos
- Las mejoras **Productividad canina**, **Parque feliz** y **Estómago grande** no tenían efecto; ahora funcionan.
- Los mini objetivos de recolectar/doradas se completaban mal (usaban el total de la partida). Ahora cuentan desde que aparecen, escalan en dificultad y pagan más.
- El footer crecía con el log y empujaba el parque.
- Las popós guardadas se normalizan al cargar.
- Los saves antiguos se completan con los valores por defecto de los campos nuevos.

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
