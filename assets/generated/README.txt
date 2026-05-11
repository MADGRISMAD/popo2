assets/generated/
=================

Esta carpeta está reservada para assets que el juego genere y cachee
en el futuro (sprites pre-rasterizados, atlas de partículas, lookup
tables de paletas por raza, etc.).

Hoy el juego no necesita ningún asset binario externo: todo se genera
en runtime con Canvas, CSS o Web Audio API. Esta carpeta existe para
mantener la convención del proyecto y para que el adaptador de Steam
pueda apuntar aquí en el futuro sin reorganizar el árbol.

NO COMMITEAR archivos pesados aquí. Los assets generados deben poder
recrearse desde código.
