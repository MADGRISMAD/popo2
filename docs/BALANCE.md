# Popó Park · Balance

Todos los valores numéricos clave viven en `js/config.js` y en `js/data/*.js`. Cualquier cambio aquí debe reflejarse ahí.

## Recursos iniciales

| Recurso          | Valor |
|------------------|-------|
| Popó             | 50    |
| Sobre Comida     | 1     |
| Sobre Perros     | 1     |
| Sobre Legendario | 0     |
| Capacidad parque | 6     |
| Platos           | 2     |

## Combo y Fiebre

| Variable               | Valor      |
|------------------------|------------|
| Decay del combo        | 1.5 s      |
| Paso de combo          | +0.05      |
| Combo máx              | x5.0       |
| Medidor de fiebre máx  | 100        |
| Ganancia por pick      | 1.4        |
| Decay por segundo      | 1.2        |
| Duración de la fiebre  | 12 s       |
| Multiplicador en fiebre| x2.0       |

## Producción

`producción base × rareza × calidad × edad × happy × hunger × traits × prestigio`

| Edad     | Multiplicador |
|----------|--------------|
| Bebé     | 0.20         |
| Joven    | 0.60         |
| Adulto   | 1.00         |
| Veterano | 0.85         |

## Calidades genéticas

| Calidad | Multiplicador |
|---------|---------------|
| Gris    | 1.00          |
| Verde   | 1.10          |
| Azul    | 1.25          |
| Morado  | 1.45          |
| Dorado  | 1.75          |
| Rojo    | 2.10          |
| Cósmico | 2.75          |

## Crianza

| Variable                  | Valor      |
|---------------------------|------------|
| Felicidad mínima          | 60         |
| Hambre mínima             | 40 (>40)   |
| Tiempo base de embarazo   | 120 s      |
| Tiempo mínimo             | 45 s       |
| Reposo madre tras parir   | 20 s       |
| Reposo macho post crianza | 10 s       |

### Tablas de herencia (calidad)

- Padres iguales → 70% misma · 22% +1 · 7% +2 · 1% +3.
- Padres diferentes con dif 1–2 → 62% peor · 28% mejor · 8% +1 sobre mejor · 2% +2.
- Padres con dif ≥ 3 → 80% peor · 14% peor+1 · 5% peor+2 · 1% mejor.

### Tablas de herencia (rareza)

- 85% peor de los dos · 12% peor+1 · 3% peor+2.

## Costos crecientes

Mejoras de perro: `cost = base × 1.55^lvl` (production), 1.6–1.7 para otras.

Sobres: `food=30 · dog=80 · legend=250` (popó). Eventos pueden bajar a 70%.

## Prestigio

`puntos = floor(cbrt(popó_total / 1000))`. Cada punto +5% producción, +4% valor de pick, +2% suerte.
