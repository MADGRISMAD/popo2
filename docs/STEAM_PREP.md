# Popó Park · Steam Preparation

Este documento describe cómo está preparado el proyecto para una futura publicación en Steam, sin haber integrado todavía el SDK oficial.

## Decisiones de arquitectura

- **HTML + CSS + JS puro**, sin frameworks ni librerías externas. Esto evita dependencias frágiles, parches breaking de terceros y problemas de compatibilidad con builds offline.
- **Módulos ES6** servidos desde un servidor estático: cualquier wrapper de escritorio (Tauri, Electron, Neutralino, Web2Executable) puede empaquetarlo tal cual.
- **Sin imágenes externas, sin sonidos externos, sin CDN**. Todo se genera con Canvas, CSS o Web Audio API.
- **Sin scroll global**. Pantalla 16:9 escalada, listo para fullscreen.

## Empaquetado en el futuro

Las opciones recomendadas, ordenadas por sencillez/peso:

| Wrapper       | Peso aprox. | Notas |
|---------------|------------|-------|
| **Tauri**     | ~3–10 MB   | Ideal: ligero, Rust como host, fácil integrar bindings de Steamworks. |
| **Neutralino**| ~3–5 MB    | Aún más ligero, comunidad pequeña. |
| **Electron**  | ~80 MB     | Muy estable, tooling maduro. |
| **NW.js**     | ~80 MB     | Similar a Electron. |

Se recomienda Tauri por peso y por facilidad de FFI con la SDK de Steam (`steamworks` crate de Rust).

## Capa `platformAdapter.js`

Toda la persistencia, logros y estadísticas pasan por una sola capa:

```js
platform.unlockAchievement(id)
platform.setStat(id, value)
platform.incStat(id, delta)
platform.getStat(id, fallback)
platform.saveToCloud(key, data)
platform.loadFromCloud(key)
platform.saveLocal(key, data)
platform.loadLocal(key)
platform.toggleFullscreen()
platform.isFullscreen()
platform.isSteamAvailable()
platform.getLanguage()
platform.quit()
```

### Sustitución a Steam

Cuando se publique:

1. Cambia `platformAdapter.js` por una versión que invoque a Steamworks vía el wrapper.
2. `unlockAchievement` → `Steamworks.SetAchievement(id)` + `StoreStats()`.
3. `setStat`/`incStat` → `Steamworks.SetStat`.
4. `saveToCloud`/`loadFromCloud` → `Steam Remote Storage` (`FileWrite` / `FileRead`).
5. `toggleFullscreen` → API del wrapper (Tauri/Electron) o pantalla nativa.
6. `quit` → API del wrapper.

Ningún sistema del juego importa Steam directamente. Todo pasa por `platform.*`.

## Listo para Steam Cloud

`saveManager.js` ya:

- Versionada (`saveVersion`).
- Migración por casos.
- Llama a `platform.saveToCloud` automáticamente cada save manual.

Sólo cambia la implementación interna de `saveToCloud` para apuntar a Steam Remote Storage.

## Listo para Steam Achievements

Ver `js/data/achievements.js`. Cada logro tiene un **ID único** que coincide con la convención típica de Steam (`ACH_*`). En el panel de desarrollador de Steam, declara cada uno con el mismo `id`.

`achievementSystem.update()` notifica a `platform.unlockAchievement(id)` automáticamente.

## Listo para Steam Stats

`platform.setStat(id, value)` y `platform.incStat(id, delta)` ya están abstraídos. Hoy guardan en localStorage. Los stats relevantes (popó total, sobres abiertos, etc.) viven en `state.stats` y son trivialmente exportables.

## Listo para Fullscreen

`platform.toggleFullscreen()` usa la Fullscreen API. Tecla `F11`. En Tauri/Electron se sustituye por la API nativa.

## Listo para idiomas

`state.options.language` está abstraído. Hoy hay un campo en Opciones, lista para añadir un sistema `i18n.t(key)` en una única ubicación. Las cadenas viven en data files; se pueden mover a JSON externos al añadir traducciones.

## Listo para controles

El input pasa por `inputManager.js`. Mañana, para soporte de mando:

- Añadir un módulo `gamepadAdapter.js` que escuche `Gamepad API` y convierta a eventos virtuales (mover cursor del parque, abrir tabs, etc.).
- Mantener la misma estructura de eventos `onParkMove`, `onParkClick`, `onKey`.

## Por qué no hay librerías externas

- Sin librerías, no hay supply-chain risk (ataques tipo `event-stream`, etc.).
- Sin librerías, los builds offline funcionan siempre.
- Sin librerías, el peso del juego es mínimo (≈ 200 KB de código).
- Sin librerías, la integración con Steamworks no entra en conflicto con módulos de terceros.

## Checklist final antes de publicar

- [ ] Reemplazar `platformAdapter.js` por la versión Steamworks.
- [ ] Empaquetar con Tauri (recomendado) o Electron.
- [ ] Subir build a depot de Steam.
- [ ] Declarar logros y stats en partner.steamgames.com con los IDs de `achievements.js`.
- [ ] Activar Steam Cloud apuntando al `SAVE_KEY`.
- [ ] Tests offline / fullscreen / resize.
- [ ] Tests cierre forzado / save al cerrar (`beforeunload` ya invoca `save()`).
