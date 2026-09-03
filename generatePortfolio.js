import fs from 'fs';
import path from 'path';

const ROOT = 'public/assets/Portafolio';
const OUTPUT = 'public/portfolioData.json';

function categoryKey(folderName) {
  const n = folderName.toLowerCase();
  if (n.includes('3d')) return '3d';
  if (n.includes('disen') || n.includes('graphic') || n.includes('branding')) return 'diseno';
  if (n.includes('edicion') || n.includes('edici') || n.includes('video') || n.includes('edici')) return 'edicion';
  return n;
}
function categoryTitle(key) {
  if (key === '3d') return 'Dimensión 3D & Shaders';
  if (key === 'diseno') return 'Posts & Branding Gráfico';
  if (key === 'edicion') return 'Video & Animación 2D';
  return key;
}

function readMeta(projectPath, folderName) {
  const metaPath = path.join(projectPath, 'meta.json');
  const fallbackName = folderName.replace(/^\d+_/, '');
  let meta = { title: fallbackName, desc: '', title_en: '', desc_en: '' };
  if (fs.existsSync(metaPath)) {
    try {
      const raw = fs.readFileSync(metaPath, 'utf-8').replace(/^\uFEFF/, '');
      const j = JSON.parse(raw);
      // Soporta title/desc como string o como {es,en}
      if (j.title && typeof j.title === 'object') {
        meta.title = j.title.es || j.title.en || fallbackName;
        meta.title_en = j.title.en || j.title.es || fallbackName;
      } else {
        meta.title = j.title || fallbackName;
        meta.title_en = j.title_en || j.title || fallbackName;
      }
      if (j.desc && typeof j.desc === 'object') {
        meta.desc = j.desc.es || j.desc.en || '';
        meta.desc_en = j.desc.en || j.desc.es || '';
      } else {
        meta.desc = j.desc || '';
        meta.desc_en = j.desc_en || j.desc || '';
      }
      if (j.order !== undefined) meta.order = j.order;
    } catch (e) { console.warn('meta.json parse error', metaPath, e.message); }
  }
  return meta;
}

function findCover(projectPath, projectRel) {
  const candidates = [
    'cover/cover.webp',
    'cover/cover.jpg',
    'cover/cover.jpeg',
    'cover/cover.png',
    'TobeyCover/TobeyCover_1x.webp',
    'cover.webp',
    'cover.jpg',
  ];
  for (const c of candidates) {
    if (fs.existsSync(path.join(projectPath, c))) {
      return path.join(projectRel, c).replace(/\\/g, '/');
    }
  }
  // fallback: first image in project root
  const files = fs.readdirSync(projectPath).filter(f => /\.(webp|jpg|png|jpeg)$/i.test(f) && !f.includes('grid') && !f.includes('row'));
  if (files.length) return path.join(projectRel, files[0]).replace(/\\/g, '/');
  return '';
}

function buildBlocks(projectPath, projectRel, files) {
  // files: sorted array of filenames (top-level only)
  const blocks = [];
  let i = 0;
  // filter out meta.json and cover folder entries (already not in list)
  const filtered = files.filter(f => !f.startsWith('meta.') && !fs.statSync(path.join(projectPath, f)).isDirectory());
  filtered.sort();
  while (i < filtered.length) {
    const name = filtered[i];
    const full = path.join(projectPath, name);
    const rel = path.join(projectRel, name).replace(/\\/g, '/');
    const ext = path.extname(name).toLowerCase();

    // Grid group: *_grid_*
    if (name.includes('_grid_')) {
      const prefix = name.split('_grid_')[0]; // e.g., "02"
      const group = filtered.filter(f => f.startsWith(prefix + '_grid_'));
      group.sort();
      const images = group.map(g => path.join(projectRel, g).replace(/\\/g, '/'));
      blocks.push({ type: 'grid', images });
      // advance past group
      const idxs = group.map(g => filtered.indexOf(g));
      i = Math.max(...idxs) + 1;
      continue;
    }
    // Row group: *_row_*
    if (name.includes('_row_')) {
      const prefix = name.split('_row_')[0]; // e.g., "04"
      const group = filtered.filter(f => f.startsWith(prefix + '_row_'));
      group.sort();
      const items = group.map(g => {
        const r = path.join(projectRel, g).replace(/\\/g, '/');
        const e = path.extname(g).toLowerCase();
        if (g.endsWith('_embed.txt')) return { type: 'embed-txt', src: r };
        if (e === '.mp4') return { type: 'video', src: r };
        if (e === '.txt' && g.includes('embed')) return { type: 'embed-txt', src: r };
        if (/\.(png|jpg|jpeg|webp)$/i.test(g)) return { type: 'image', src: r };
        return null;
      }).filter(Boolean);
      if (items.length) blocks.push({ type: 'video-row', items });
      const idxs = group.map(g => filtered.indexOf(g));
      i = Math.max(...idxs) + 1;
      continue;
    }
    // PDF
    if (ext === '.pdf') {
      blocks.push({ type: 'pdf', src: rel });
      i++; continue;
    }
    // Single embed-txt
    if (name.endsWith('_embed.txt') || name.endsWith('_insertar.txt') || (name.endsWith('.txt') && name.includes('embed'))) {
      blocks.push({ type: 'embed-txt', src: rel });
      i++; continue;
    }
    // Single video
    if (ext === '.mp4') {
      blocks.push({ type: 'video', src: rel });
      i++; continue;
    }
    // Single image
    if (['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) {
      blocks.push({ type: 'image', src: rel });
      i++; continue;
    }
    i++;
  }
  return blocks;
}

function main() {
  if (!fs.existsSync(ROOT)) {
    console.error('No existe', ROOT);
    process.exit(1);
  }
  let existing = {};
  if (fs.existsSync(OUTPUT)) {
    try { existing = JSON.parse(fs.readFileSync(OUTPUT, 'utf-8')); } catch {}
  }

  const categories = fs.readdirSync(ROOT).filter(f => fs.statSync(path.join(ROOT, f)).isDirectory());
  const output = {};

  for (const catFolder of categories) {
    const catPath = path.join(ROOT, catFolder);
    const key = categoryKey(catFolder);
    const title = categoryTitle(key);
    const projects = [];
    const projectFolders = fs.readdirSync(catPath).filter(f => fs.statSync(path.join(catPath, f)).isDirectory()).sort();
    for (const projFolder of projectFolders) {
      const projPath = path.join(catPath, projFolder);
      const m = projFolder.match(/^(\d+)[-_ ](.+)$/);
      const order = m ? parseInt(m[1], 10) : 999;
      const meta = readMeta(projPath, projFolder);
      const projName = meta.title;
      const projNameEn = meta.title_en || meta.title;
      const projDesc = meta.desc;
      const projDescEn = meta.desc_en || meta.desc;
      const projRel = path.join('assets/Portafolio', catFolder, projFolder).replace(/\\/g, '/');
      const cover = findCover(projPath, projRel);
      const files = fs.readdirSync(projPath);
      const blocks = buildBlocks(projPath, projRel, files);
      // gallery: first 3 images (cover + first images from blocks)
      const gallery = [];
      if (cover) gallery.push(cover);
      for (const b of blocks) {
        if (gallery.length >= 3) break;
        if (b.type === 'image') gallery.push(b.src);
        if (b.type === 'grid' && b.images[0]) gallery.push(b.images[0]);
      }
      while (gallery.length < 1) gallery.push(cover);
      projects.push({ id: order, name: projName, name_en: projNameEn, desc: projDesc, desc_en: projDescEn, img: cover, gallery: gallery.slice(0, 3), blocks, layout: 'tight' });
    }
    projects.sort((a, b) => a.id - b.id);
    // si no hay proyectos escaneados, usa fallback del existing
    if (projects.length === 0 && existing[key]) {
      output[key] = existing[key];
    } else {
      output[key] = { title, projects };
    }
  }

  // Mantener categorías existentes que no tienen carpeta (como diseno/edicion si no hay carpeta)
  for (const k of Object.keys(existing)) {
    if (!output[k] && ['3d','diseno','edicion'].includes(k)) output[k] = existing[k];
  }
  // Limpieza: borrar categorías fantasma vacías
  for (const k of Object.keys(output)) {
    if (!['3d','diseno','edicion'].includes(k)) delete output[k];
  }

  fs.writeFileSync(OUTPUT, JSON.stringify(output, null, 2), 'utf-8');
  console.log('Generado', OUTPUT);
  console.log(JSON.stringify(output, null, 2));
}

main();
