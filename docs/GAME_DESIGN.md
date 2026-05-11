# Popó Park · Game Design Document

## Pitch

Popó Park es un idle de gestión de un parque canino donde el jugador colecciona perros, mejora el parque, equilibra alimentación y crianza, y obtiene popós (la moneda) que le permiten escalar.

## Pilares de diseño

1. **Loop satisfactorio cada 3 segundos**: hover sobre popó → moneda → combo → fiebre.
2. **Loop adictivo cada 5 minutos**: ahorrar popó → comprar sobre → abrir x10 → conseguir un perro nuevo → activar perro → más producción.
3. **Loop de progresión cada 30 minutos**: completar misión → desbloquear sistema → mejorar parque → aumentar capacidad.
4. **Loop de prestigio cada N horas**: Renombre Canino → bonus permanentes → comenzar más fuerte.

## Loops de juego

### Loop A — Recolección
- Perros generan popó.
- Popó aparece en el parque.
- Jugador recolecta con cursor.
- Combo aumenta valor.
- Combo llena medidor de Fiebre.
- Fiebre del Parque dobla valor por 12s.

### Loop B — Sobres
- Popó → comprar sobre.
- Apertura x1 o x10 con animación.
- Recompensas: perros, comida, mejoras, automatizaciones, cartas genéticas.

### Loop C — Crianza
- Macho + Hembra adultos → Zona de Crianza.
- Hembra embarazada queda inhabilitada (sistema no juicio).
- Tras el tiempo de embarazo, nace bebé directamente en el parque.
- Bebé crece a joven, luego adulto, luego veterano.

### Loop D — Misiones
- Misión principal lineal: una sola activa.
- Mini objetivo rotativo: aleatorio cada vez que se completa.
- Logros disparados como pop-ups.

### Loop E — Eventos globales
- Aparecen aleatoriamente (cada 1.5–3 min).
- Duran 45–90s.
- Modifican producción, hambre, suerte dorada, etc.

## Filosofía

- Las acciones aburridas se automatizan poco a poco.
- Las decisiones interesantes (qué criar, qué activar, qué mejorar) son del jugador.
- Nunca se pierde progreso real; el prestigio devuelve más de lo que se "borra".
- Visualmente debe ser premium incluso al inicio.
