# Guía Portafolio Automático

## Idea
Solo crea una carpeta `XX_Nombre` dentro de la categoría y el código genera la card automáticamente. El número `XX` define el orden y el ID mostrado.

## Estructura
```
public/assets/Portafolio/
  3d_projects/        → categoría "3d"
  graphic_design/     → categoría "diseno"
  video_editing/      → categoría "edicion"

  3d_projects/
    01_LittleTurtle/
      meta.json
      cover/cover.webp (+ cover.jpg fallback)
      00_header.png
      01_hero.png
      02_grid_01.png ... 02_grid_04.png
      03_header2.png
      04_row_a_embed.txt
      04_row_b.mp4
      05_header3.png
      06_video.mp4
      07_embed.txt
      08_video.mp4
```

## Ejemplo Tobey ya reordenado
`public/assets/Portafolio/3d_projects/02_Tobey/` es el modelo. Copia esa carpeta, renómbrala a `01_LittleTurtle` y reemplaza archivos.

## meta.json
```json
{
  "title": "LittleTurtle",
  "desc": "modeling, texturing, rigging, animation...",
  "order": 1
}
```
Si no existe, usa el nombre de la carpeta. `order` opcional (si no, toma el `XX`).

## Nomenclatura de archivos (ordenado alfabéticamente)
- `00_`, `01_`, `02_`... → orden de aparición.
- `*_grid_*` → se agrupan en un `grid` 2×2. Ej: `02_grid_01.png` + `02_grid_02.png` + `02_grid_03.png` + `02_grid_04.png` = 1 bloque grid.
- `*_row_a_*` + `*_row_b_*` con mismo prefijo → `video-row` paralelo. Ej: `04_row_a_embed.txt` + `04_row_b.mp4`. Para `f1l/f2r` usa `_a/_b` (más claro). Si son 3-4 en fila, añade `_row_c`, `_row_d`.
- `*_embed.txt` → Vimeo. Contenido del `.txt` = HTML del iframe (como te da Vimeo). Se hace `fetch()` al abrir → si actualizas el txt, se ve al instante.
- `*.mp4` suelto → `video` full-width con `loop muted controls`.
- `*.png|jpg|webp` suelto → `image` full-bleed sin margen (tight).

## Cover
`cover/cover.webp` 800×1050 WebP 85% (<80KB) + `cover/cover.jpg` fallback. Si no hay, la primera imagen del proyecto se usa.

## Flujo para añadir proyecto
1. Duplica `02_Tobey/` → `01_LittleTurtle/` (o `03_Nuevo`)
2. Edita `meta.json` (título/desc)
3. Reemplaza imágenes/videos manteniendo nombres `00_`, `01_`...
4. Ejecuta: `npm run generate` (o `node generatePortfolio.js`)
5. `npm run build` y `git push`

## Qué hace el generador
`generatePortfolio.js` escanea `public/assets/Portafolio/**`, agrupa por las reglas anteriores y escribe `public/portfolioData.json` y `gallery` (3 imgs). Respeta `XX` como `id` y ordena ascendente, por eso `02_Tobey` aparece como Proyecto 02. Si creas `01_LittleTurtle`, aparecerá antes.

## Tipos soportados en `main.ts:2526`
`image`, `grid`, `video`, `embed`, `embed-txt`, `video-row`, `text`, `gif`. Cualquier `mp4` vertical se respeta (`height:auto`, no recorte).
