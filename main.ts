import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { CSS3DRenderer, CSS3DObject } from 'three/addons/renderers/CSS3DRenderer.js';

import type { TranslationMap, Translations, PortfolioData } from './types.js';

// ==========================================================================
// LAZY LOADING TYPES
// ==========================================================================

type GLTFLoaderType = typeof import('three/addons/loaders/GLTFLoader.js').GLTFLoader;

// ==========================================================================
// LAZY LOADING FUNCTIONS
// ==========================================================================

async function loadGLTFLoader(): Promise<GLTFLoaderType> {
    const mod = await import('three/addons/loaders/GLTFLoader.js');
    return mod.GLTFLoader;
}

// ==========================================================================
// LAZY INITIALIZATION
// ==========================================================================
declare global {
    interface Window {
        goToGalleryIndex: (index: number) => void;
        closeGallery: () => void;
        goToCategoryIndex: (index: number) => void;
        openLightbox: (cat: string, id: number) => void;
        closeLightbox: () => void;
        goToBrandHome: () => void;
        jumpToSection: (sectionIndex: number) => void;
    }
    var AudioContext: typeof AudioContext;
    var webkitAudioContext: typeof AudioContext;
}

// Forward declarations for functions assigned to window later
let openLightbox: (cat: string, id: number) => void;
let closeLightbox: () => void;
let jumpToSection: (sectionIndex: number) => void;

// Global state that must be declared early to avoid TDZ
let currentSectionIndex = 0;
let portfolioData: PortfolioData | null = null;

// --- DETECCION DE MOVIL ---
function isMobileViewport(): boolean {
    return window.innerWidth <= 900;
}

// --- SISTEMA DE IDIOMAS (ESPAÑOL / INGLÉS) ---
let currentLang: 'es' | 'en' = 'es';

const translations: Translations = {
    es: {
        title: 'Wilmer Warnes | Portafolio 3D Experiential',
        start_btn: 'Ver portafolio de Wilmer Warnes',
        nav_home: 'Inicio',
        nav_about: 'Sobre Mí',
        nav_projects: 'Proyectos',
        nav_contact: 'Contacto',
        audio_title: 'Centro de Audio Pro',
        audio_status: 'Estado',
        audio_play: 'Reproducir',
        audio_pause: 'Pausar',
        audio_track: 'Pista Actual',
        audio_vol_music: 'Volumen Música',
        audio_vol_sfx: 'Volumen Efectos',
        audio_sfx: 'Efectos UI (SFX)',
        glow_label: 'Brillo Tarjetas',
        instructions:
            'Usa el Mouse para mirar • Scroll o Menú superior para navegar • Clic en los objetos 3D',
        modal_back: 'Volver',
        music_choice_on: '🔊 Con música',
        music_choice_off: '🔇 Sin música',
        loader_lang_label: 'Idioma',
        hero_name: 'Wilmer Warnes',
        hero_role: '3D Generalista, Diseñador Gráfico y Publicista',
        about_role: 'Diseñador Gráfico Jr. & Estudiante de Marketing',
        about_desc:
            'Mi objetivo es formar parte de un equipo artístico en las áreas de cine, animación y publicidad. Mi experiencia es una mezcla de trabajo creativo, diseño gráfico y producción audiovisual, reforzada por mi facilidad para trabajar en equipo y mi compromiso firme por entregar trabajo de calidad.',
        skill_1: 'Branding & Identidad Visual',
        skill_2: 'Modelado 3D / WebGL / Three.js',
        skill_3: 'Estrategia Publicitaria y Copywriting',
        skill_4: 'Edición de Video & Postproducción',
        contact_sub: 'Disponible para proyectos y colaboraciones creativas.',
        social_email: 'Email Directo',
        profile_hero_title: 'Soy<br><span class="grad-text">Wilmer Warnes</span>',
        contact_hero_title: 'Hablemos<br><span class="grad-text">de tu proyecto</span>',
        card_title_3d: 'Proyectos 3D',
        card_title_diseno: 'Diseño Gráfico',
        card_title_edicion: 'Edición de Video',
        card_sub_3d: 'Modelado / Shaders / WebGL',
        card_sub_diseno: 'Branding / Identidad / Posts',
        card_sub_edicion: 'Video / VFX / Postproducción',
        gallery_title_3d: '3D',
        gallery_title_diseno: 'Diseño Gráfico',
        gallery_title_edicion: 'Edición de Video',
        scroll_hint_start: 'Desliza la pantalla para ir a la siguiente sección',
        scroll_hint_mid: 'Desliza la pantalla para avanzar o retroceder',
        scroll_hint_end: 'Desliza la pantalla hacia atrás para volver',
        scroll_hint_desktop_start: 'Haz scroll hacia arriba para avanzar',
        scroll_hint_desktop_end: 'Haz scroll hacia abajo para retroceder',
    },
    en: {
        title: 'Wilmer Warnes | 3D Experiential Portfolio',
        start_btn: 'Explore 3D Experience',
        nav_home: 'Home',
        nav_about: 'About Me',
        nav_projects: 'Projects',
        nav_contact: 'Contact',
        audio_title: 'Pro Audio Center',
        audio_status: 'Status',
        audio_play: 'Play',
        audio_pause: 'Pause',
        audio_track: 'Current Track',
        audio_vol_music: 'Music Volume',
        audio_vol_sfx: 'SFX Volume',
        audio_sfx: 'UI Effects (SFX)',
        glow_label: 'Card Glow',
        instructions: 'Use Mouse to look • Scroll or Top Menu to navigate • Click 3D objects',
        scroll_hint_desktop_start: 'Scroll up to advance',
        scroll_hint_desktop_end: 'Scroll down to go back',
        modal_back: 'Back',
        music_choice_on: '🔊 With music',
        music_choice_off: '🔇 Without music',
        loader_lang_label: 'Language',
        hero_name: 'Wilmer Warnes',
        hero_role: '3D Generalist, Graphic Designer & Advertiser',
        about_role: 'Jr. Graphic Designer & Marketing Student',
        about_desc:
            'My goal is to be part of an artistic team in the fields of film, animation and advertising. My experience blends creative work, graphic design and audiovisual production, backed by my ease working in a team and my firm commitment to delivering quality work.',
        skill_1: 'Branding & Visual Identity',
        skill_2: '3D Modeling / WebGL / Three.js',
        skill_3: 'Advertising Strategy & Copywriting',
        skill_4: 'Video Editing & Post-Production',
        contact_sub: 'Available for projects and creative collaborations.',
        social_email: 'Direct Email',
        profile_hero_title: 'I\'m<br><span class="grad-text">Wilmer Warnes</span>',
        contact_hero_title: 'Let\'s talk<br><span class="grad-text">about your project</span>',
        card_title_3d: '3D Projects',
        card_title_diseno: 'Graphic Design',
        card_title_edicion: 'Video Editing',
        card_sub_3d: 'Modeling / Shaders / WebGL',
        card_sub_diseno: 'Branding / Identity / Posts',
        card_sub_edicion: 'Video / VFX / Post-production',
        gallery_title_3d: '3D',
        gallery_title_diseno: 'Graphic Design',
        gallery_title_edicion: 'Video Editing',
        scroll_hint_start: 'Swipe the screen to go to the next section',
        scroll_hint_mid: 'Swipe the screen to move forward or back',
        scroll_hint_end: 'Swipe the screen backward to go back',
    },
};

const langToggleBtn = document.getElementById('lang-toggle-btn') as HTMLButtonElement | null;
const loaderLangBtn = document.getElementById('loader-lang-btn') as HTMLButtonElement | null;

function syncLangButtons() {
    const label = currentLang.toUpperCase();
    if (langToggleBtn) langToggleBtn.innerText = label;
    if (loaderLangBtn) loaderLangBtn.innerText = label;
}

function setLanguage(lang) {
    currentLang = lang;
    syncLangButtons();
    updateLanguage();
    updateCardsLanguage();
    updateInfoCardsLanguage();
    updateHeroTextLanguage();
    updateMusicChoiceLabel();
    updateGalleryTitleLanguage();
    updateScrollHintText();
    playSFX('click');
}

langToggleBtn.addEventListener('click', () => {
    setLanguage(currentLang === 'es' ? 'en' : 'es');
});
if (loaderLangBtn) {
    loaderLangBtn.addEventListener('click', () => {
        setLanguage(currentLang === 'es' ? 'en' : 'es');
    });
}

function updateLanguage() {
    const t = translations[currentLang];
    document.querySelectorAll('[data-i18n]').forEach((el) => {
        const key = el.getAttribute('data-i18n');
        if (t[key as keyof TranslationMap]) {
            (el as HTMLElement).innerText = t[key as keyof TranslationMap];
        }
    });
}

// ==========================================================================
// CENTRO DE AUDIO — DOS volumenes independientes:
//   musicVolume -> pistas de la playlist (tracks[])
//   sfxVolume   -> sonidos de interfaz (clicks, navegacion, etc)
// ==========================================================================
let audioCtx: AudioContext | null = null;
let isAudioPlaying = true;
let musicVolume = 0.3;
let sfxVolume = 0.5;
let currentTrackIndex = 0;
let sfxEnabled = true;
let currentAudioElement: HTMLAudioElement | null = null;

const tracks = [
    { name: 'Solarflex Space', src: 'assets/music/01-Solarflex Space.mp3' },
    {
        name: 'Mondamusic Afrobeat afro beat',
        src: 'assets/music/02-Mondamusic Afrobeat afro beat.mp3',
    },
    { name: '9jackjack8 Space flight', src: 'assets/music/03-9jackjack8 Space flight.mp3' },
    { name: 'Vibemode Punk-Rock Heatwave', src: 'assets/music/04-Vibemode Punk-Rock Heatwave.mp3' },
    { name: 'Romanbelov Spirit Blossom', src: 'assets/music/05-Romanbelov Spirit Blossom.mp3' },
    { name: 'Wafflemusic Flute synth', src: 'assets/music/06-Wafflemusic Flute synth.mp3' },
    { name: 'Solarflex Space ambient', src: 'assets/music/07-Solarflex Space ambient.mp3' },
    { name: 'Quietphase slow ambient', src: 'assets/music/08-Quietphase slow ambient.mp3' },
    { name: 'Mondamusic Lofi beats', src: 'assets/music/09-Mondamusic Lofi beats.mp3' },
    { name: 'Atlasaudio Nostalgic piano', src: 'assets/music/10-Atlasaudio Nostalgic piano.mp3' },
];

const audioMenuToggle = document.getElementById('audio-menu-toggle') as HTMLButtonElement | null;
const audioDropdown = document.getElementById('audio-dropdown') as HTMLDivElement | null;
const masterAudioBtn = document.getElementById('master-audio-btn') as HTMLButtonElement | null;
const prevTrackBtn = document.getElementById('prev-track') as HTMLButtonElement | null;
const nextTrackBtn = document.getElementById('next-track') as HTMLButtonElement | null;
const trackNameDisplay = document.getElementById('track-name-display') as HTMLElement | null;
const musicVolumeSlider = document.getElementById('volume-slider-music') as HTMLInputElement | null;
const sfxVolumeSlider = document.getElementById('volume-slider-sfx') as HTMLInputElement | null;
const sfxToggle = document.getElementById('sfx-toggle') as HTMLInputElement | null;

audioMenuToggle?.addEventListener('click', (e) => {
    e.stopPropagation();
    audioDropdown!.classList.toggle('active');
});
window.addEventListener('click', () => audioDropdown?.classList.remove('active'));
audioDropdown?.addEventListener('click', (e) => e.stopPropagation());

// --- MOBILE: controles idioma + música en un solo desplegable ---
const mobileControlsToggle = document.getElementById('mobile-controls-toggle') as HTMLButtonElement | null;
const hudControlsGroup = document.getElementById('hud-controls-group') as HTMLDivElement | null;
if (mobileControlsToggle && hudControlsGroup) {
    mobileControlsToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = hudControlsGroup.classList.toggle('mobile-open');
        const icon = mobileControlsToggle.querySelector('i');
        if (icon) icon.className = isOpen ? 'fa-solid fa-xmark' : 'fa-solid fa-ellipsis';
        playSFX('click');
    });
    // Cerrar al tocar fuera
    document.addEventListener('click', (e) => {
        if (!isMobileViewport()) return;
        const target = e.target as HTMLElement;
        if (!hudControlsGroup.contains(target) && !mobileControlsToggle.contains(target)) {
            hudControlsGroup.classList.remove('mobile-open');
            const icon = mobileControlsToggle.querySelector('i');
            if (icon) icon.className = 'fa-solid fa-ellipsis';
        }
    });
    window.addEventListener('resize', () => {
        if (!isMobileViewport()) {
            hudControlsGroup.classList.remove('mobile-open');
            const icon = mobileControlsToggle.querySelector('i');
            if (icon) icon.className = 'fa-solid fa-ellipsis';
        }
    });
}

function updateTrackDisplay() {
    if (trackNameDisplay) trackNameDisplay.innerText = tracks[currentTrackIndex].name;
}
updateTrackDisplay();

masterAudioBtn?.addEventListener('click', () => {
    if (!audioCtx)
        audioCtx = new (
            window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        )();
    isAudioPlaying = !isAudioPlaying;
    const t = translations[currentLang];
    if (masterAudioBtn) masterAudioBtn.innerText = isAudioPlaying ? t.audio_pause : t.audio_play;

    if (isAudioPlaying) {
        playCurrentTrack();
    } else {
        stopCurrentTrack();
    }
});

prevTrackBtn?.addEventListener('click', () => {
    stopCurrentTrack();
    currentTrackIndex = (currentTrackIndex - 1 + tracks.length) % tracks.length;
    updateTrackDisplay();
    if (isAudioPlaying) playCurrentTrack();
    playSFX('nav');
});

nextTrackBtn?.addEventListener('click', () => {
    advanceToNextTrack();
    playSFX('nav');
});

function advanceToNextTrack() {
    stopCurrentTrack();
    currentTrackIndex = (currentTrackIndex + 1) % tracks.length;
    updateTrackDisplay();
    if (isAudioPlaying) playCurrentTrack();
}

musicVolumeSlider?.addEventListener('input', (e) => {
    musicVolume = parseFloat((e.target as HTMLInputElement).value);
    if (currentAudioElement) currentAudioElement.volume = musicVolume;
});
sfxVolumeSlider?.addEventListener('input', (e) => {
    sfxVolume = parseFloat((e.target as HTMLInputElement).value);
    playSFX('tick');
});

sfxToggle?.addEventListener('change', (e) => {
    sfxEnabled = (e.target as HTMLInputElement).checked;
});

let consecutivePlaybackErrors = 0;

function playCurrentTrack() {
    const track = tracks[currentTrackIndex];
    currentAudioElement = new Audio(encodeURI(track.src));
    currentAudioElement.volume = musicVolume;
    currentAudioElement.play().catch((err) => console.log('Audio autoplay restricted:', err));

    currentAudioElement.onended = () => {
        consecutivePlaybackErrors = 0;
        if (isAudioPlaying) {
            advanceToNextTrack();
        }
    };

    currentAudioElement.onerror = () => {
        console.warn(
            '[Audio] No se pudo reproducir "' +
                track.name +
                '" → ' +
                track.src +
                '. Revisa que el archivo exista con ese nombre EXACTO (mayusculas/minusculas incluidas) en assets/music/. Saltando a la siguiente pista...'
        );
        consecutivePlaybackErrors++;
        if (isAudioPlaying && consecutivePlaybackErrors < tracks.length) {
            advanceToNextTrack();
        } else if (consecutivePlaybackErrors >= tracks.length) {
            console.warn(
                '[Audio] Ninguna pista de la playlist pudo reproducirse. Revisa la carpeta assets/music/ en el hosting.'
            );
        }
    };
}

function stopCurrentTrack() {
    if (currentAudioElement) {
        currentAudioElement.onended = null;
        currentAudioElement.onerror = null;
        currentAudioElement.pause();
        currentAudioElement = null;
    }
}

function playNoiseBurst(duration, filterFreq, gainValue) {
    const bufferSize = audioCtx.sampleRate * duration;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);

    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = filterFreq;
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(gainValue, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);
    noise.start();
}

const SFX_PRESETS = {
    click: {
        start: 720,
        end: 240,
        dur: 0.11,
        wave: 'sine',
        noise: true,
        noiseFreq: 3200,
        level: 1.0,
    },
    nav: { start: 520, end: 780, dur: 0.13, wave: 'triangle', noise: false, level: 0.9 },
    open: {
        start: 300,
        end: 900,
        dur: 0.22,
        wave: 'sine',
        noise: true,
        noiseFreq: 1800,
        level: 1.0,
    },
    close: { start: 500, end: 180, dur: 0.16, wave: 'sine', noise: false, level: 0.8 },
    tick: { start: 900, end: 700, dur: 0.05, wave: 'sine', noise: false, level: 0.5 },
};

function playSFX(presetName) {
    if (!sfxEnabled || !audioCtx) return;
    const p = SFX_PRESETS[presetName] || SFX_PRESETS.click;

    const osc = audioCtx.createOscillator();
    const filter = audioCtx.createBiquadFilter();
    const gain = audioCtx.createGain();

    osc.type = p.wave;
    osc.frequency.setValueAtTime(p.start, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(Math.max(p.end, 20), audioCtx.currentTime + p.dur);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(4000, audioCtx.currentTime);

    const level = sfxVolume * 0.5 * p.level;
    gain.gain.setValueAtTime(level, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + p.dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + p.dur);

    if (p.noise) playNoiseBurst(p.dur * 0.6, p.noiseFreq, sfxVolume * 0.18);
}

// --- LOADER — relleno simple que sube ---
let progress = 0;
const loader = document.getElementById('loader') as HTMLDivElement | null;
const startBtn = document.getElementById('start-btn') as HTMLButtonElement | null;
const fillWrap = document.getElementById('fillWrap') as HTMLDivElement | null;
const percentEl = document.getElementById('percent') as HTMLDivElement | null;
const loaderOptions = document.querySelector('.loader-options') as HTMLDivElement | null;

const interval = setInterval(() => {
    progress += Math.random() * 25;
    const pct = Math.min(progress, 100);
    if (fillWrap) fillWrap.style.height = pct + '%';
    if (percentEl) percentEl.textContent = 'CARGANDO ' + Math.floor(pct) + '%';

    if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        if (fillWrap) { fillWrap.style.height = '100%'; fillWrap.classList.add('filled'); }
        if (percentEl) percentEl.classList.add('on-black');
        setTimeout(() => {
            if (percentEl) (percentEl as HTMLElement).style.opacity = '0';
            if (loaderOptions) loaderOptions.classList.add('on-black');
            if (startBtn) { startBtn.style.display = 'block'; requestAnimationFrame(() => startBtn.classList.add('visible')); }
            if (loaderOptions) { loaderOptions.style.display = 'flex'; requestAnimationFrame(() => loaderOptions.classList.add('visible')); }
        }, 500);
    }
}, 200);

let wantsMusicOnStart = true;
const musicChoiceBtn = document.getElementById('music-choice-btn') as HTMLButtonElement | null;

function updateMusicChoiceLabel() {
    if (musicChoiceBtn) {
        musicChoiceBtn.classList.toggle('is-on', wantsMusicOnStart);
        musicChoiceBtn.setAttribute('aria-checked', wantsMusicOnStart ? 'true' : 'false');
    }
}
musicChoiceBtn?.addEventListener('click', () => {
    wantsMusicOnStart = !wantsMusicOnStart;
    updateMusicChoiceLabel();
    // No playSFX here - audio context not initialized yet on loader
});
updateMusicChoiceLabel();

// ==========================================================================
// HINT DE SCROLL — Móvil (centro) + Desktop (esquina inf. der. con ratón)
// ==========================================================================
const scrollHintStyleEl = document.createElement('style');
scrollHintStyleEl.textContent = `
.scroll-hint {
    position: fixed;
    left: 50%;
    bottom: 56px;
    transform: translateX(-50%);
    z-index: 15;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    color: rgba(255,255,255,0.6);
    text-align: center;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.7s ease;
}
.scroll-hint.active {
    animation: scrollHintBlink 1.8s ease-in-out infinite;
}
.scroll-hint-icon {
    width: 20px;
    height: 20px;
    stroke: rgba(255,255,255,0.65);
}
.scroll-hint span {
    font-size: 0.68rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1.5px;
}
@keyframes scrollHintBlink {
    0%, 100% { opacity: 0.22; }
    50% { opacity: 0.75; }
}
@media (max-width: 900px) {
    .scroll-hint { bottom: 92px; }
}

/* === Desktop scroll hint (centrado abajo, texto izq + mouse der) === */
.scroll-hint-desktop {
    position: fixed;
    left: 50%;
    bottom: 40px;
    transform: translateX(-50%) translateY(20px);
    z-index: 15;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: 16px;
    color: rgba(255,255,255,0.85);
    text-align: left;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.6s ease, transform 0.6s ease;
}
.scroll-hint-desktop.active {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
}
.scroll-hint-desktop-text {
    font-size: 0.62rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    line-height: 1.3;
    max-width: 280px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.scroll-hint-desktop-mouse {
    width: 44px;
    height: 54px;
    position: relative;
    flex-shrink: 0;
}
.scroll-hint-desktop-mouse svg {
    width: 100%;
    height: 100%;
    display: block;
}
@media (max-width: 900px) {
    .scroll-hint-desktop { display: none; }
}

/* Animaciones de la ruedita del ratón */
@keyframes wheelScrollUp {
    0%, 100% { transform: translateY(0); opacity: 1; }
    50% { transform: translateY(-8px); opacity: 0.4; }
}
@keyframes wheelScrollDown {
    0%, 100% { transform: translateY(0); opacity: 1; }
    50% { transform: translateY(8px); opacity: 0.4; }
}
`;
document.head.appendChild(scrollHintStyleEl);

// MÓVIL (centro) — ya existente
const scrollHintEl = document.createElement('div');
scrollHintEl.className = 'scroll-hint';
scrollHintEl.id = 'scroll-hint';
scrollHintEl.innerHTML = `
    <svg class="scroll-hint-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 15 12 9 18 15"></polyline></svg>
    <span id="scroll-hint-text"></span>
`;
document.body.appendChild(scrollHintEl);
const scrollHintTextEl = scrollHintEl.querySelector('#scroll-hint-text');

// DESKTOP (esquina inf. der. con ratón)
const scrollHintDesktopEl = document.createElement('div');
scrollHintDesktopEl.className = 'scroll-hint-desktop';
scrollHintDesktopEl.id = 'scroll-hint-desktop';
scrollHintDesktopEl.innerHTML = `
    <span class="scroll-hint-desktop-text" id="scroll-hint-desktop-text"></span>
    <div class="scroll-hint-desktop-mouse" id="scroll-hint-desktop-mouse">
        <svg viewBox="0 0 48 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <!-- Cuerpo del ratón (blanco) -->
            <path d="M24 2 C11.79 2 2 11.79 2 24 C2 36.21 11.79 46 24 46 C36.21 46 46 36.21 46 24 C46 11.79 36.21 2 24 2 Z" fill="white"/>
            <!-- Ruedita (roja) - se animará con CSS -->
            <circle class="scroll-wheel" cx="24" cy="16" r="6" fill="#ff3333"/>
            <!-- Línea divisoria botones -->
            <path d="M24 8 L24 24" stroke="rgba(0,0,0,0.2)" stroke-width="1.5"/>
        </svg>
    </div>
`;
document.body.appendChild(scrollHintDesktopEl);
const scrollHintDesktopTextEl = scrollHintDesktopEl.querySelector('#scroll-hint-desktop-text');
const scrollWheelEl = scrollHintDesktopEl.querySelector('.scroll-wheel');

function scrollHintTextForSection(sectionIndex) {
    const t = translations[currentLang];
    if (sectionIndex === 0) return t.scroll_hint_start;
    if (sectionIndex === SECTIONS.length - 1) return t.scroll_hint_end;
    return t.scroll_hint_mid;
}
function scrollHintDesktopTextForSection(sectionIndex) {
    const t = translations[currentLang];
    if (sectionIndex === 0) return t.scroll_hint_desktop_start;
    if (sectionIndex === SECTIONS.length - 1) return t.scroll_hint_desktop_end;
    return '';
}
function updateScrollHintText() {
    (scrollHintTextEl as HTMLElement).innerText = scrollHintTextForSection(currentSectionIndex);
    (scrollHintDesktopTextEl as HTMLElement).innerText = scrollHintDesktopTextForSection(currentSectionIndex);
    // Animar ruedita: arriba en inicio, abajo en contacto
    const wheel = scrollWheelEl as HTMLElement | null;
    if (wheel) {
        if (currentSectionIndex === 0) {
            wheel.style.animation = 'wheelScrollUp 1.2s ease-in-out infinite';
        } else if (currentSectionIndex === SECTIONS.length - 1) {
            wheel.style.animation = 'wheelScrollDown 1.2s ease-in-out infinite';
        } else {
            wheel.style.animation = 'none';
        }
    }
}

let scrollHintTimeout = null;
function showScrollHint() {
    updateScrollHintText();
    if (scrollHintTimeout) clearTimeout(scrollHintTimeout);
    scrollHintEl.classList.add('active');
    scrollHintTimeout = setTimeout(() => {
        scrollHintEl.classList.remove('active');
    }, 3000);
}
function hideScrollHint() {
    if (scrollHintTimeout) clearTimeout(scrollHintTimeout);
    scrollHintEl.classList.remove('active');
}
function showScrollHintDesktop() {
    updateScrollHintText();
    if (scrollHintTimeout) clearTimeout(scrollHintTimeout);
    scrollHintDesktopEl.classList.add('active');
    scrollHintTimeout = setTimeout(() => {
        scrollHintDesktopEl.classList.remove('active');
    }, 4000);
}
function hideScrollHintDesktop() {
    if (scrollHintTimeout) clearTimeout(scrollHintTimeout);
    scrollHintDesktopEl.classList.remove('active');
}
function updateScrollHintVisibility() {
    if (experienceStarted) {
        if (isMobileViewport()) {
            showScrollHint();
            hideScrollHintDesktop();
        } else {
            hideScrollHint();
            // Solo mostrar en Inicio (0) y Contacto (última)
            if (currentSectionIndex === 0 || currentSectionIndex === SECTIONS.length - 1) {
                showScrollHintDesktop();
            } else {
                hideScrollHintDesktop();
            }
        }
    } else {
        hideScrollHint();
        hideScrollHintDesktop();
    }
}

// ==========================================================================
// RESALTADO DE SECCION ACTIVA EN EL HEADER
// ==========================================================================
function updateActiveNavHighlight() {
    document.querySelectorAll('.nav-shortcut').forEach((btn) => {
        const idx = parseInt((btn as HTMLElement).dataset.sectionIndex || '0', 10);
        btn.classList.toggle('active', idx === currentSectionIndex);
    });
}

let experienceStarted = false;

loadPortfolioData();

startBtn?.addEventListener('click', () => {
    experienceStarted = true;
    if (loader) loader.style.opacity = '0';
    setTimeout(() => {
        if (loader) loader.style.display = 'none';
    }, 800);

    if (!audioCtx)
        audioCtx = new (
            window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        )();

    isAudioPlaying = wantsMusicOnStart;
    const t = translations[currentLang];
    if (masterAudioBtn) masterAudioBtn.innerText = isAudioPlaying ? t.audio_pause : t.audio_play;
    if (isAudioPlaying) {
        playCurrentTrack();
    }

    updateActiveNavHighlight();
    updateScrollHintVisibility();
    updateCategorySwitchVisibility();
});

// --- THREE.JS SCENE SETUP ---
const canvas = document.getElementById('webgl-canvas') as HTMLCanvasElement | null;
const scene = new THREE.Scene();

// ==========================================================================
// FONDO — parametrizado para poder cambiarlo en caliente (ver selector de
// "Fondo (prueba)" en el menu de audio, BACKGROUND_PRESETS mas abajo).
// ==========================================================================
function createGalaxyBackgroundTexture(colors?: string[]) {
    // Mantenemos textura CUADRADA en ambos (mobile 512, desktop 1024) para gradiente circular perfecto.
    // Cambiar a rectangular en móvil estiraba el degradado y dejaba bordes claros a los lados.
    const isMobile = isMobileViewport();
    const size = isMobile ? 512 : 1024;
    const c = document.createElement('canvas');
    c.width = size;
    c.height = size;
    const ctx = c.getContext('2d')!;
    const center = size / 2;
    const grad = ctx.createRadialGradient(center, center, 0, center, center, size / 2);
    // COLORES SEPARADOS: edita SOLO MOBILE_* para probar sin tocar desktop
    const MOBILE_C0 = '#050608'; const DESKTOP_C0 = '#212d3b';
    const MOBILE_C1 = '#f11606'; const DESKTOP_C1 = '#152035';
    const MOBILE_C2 = '#020305'; const DESKTOP_C2 = '#0e1520';
    const MOBILE_C3 = '#eb190a'; const DESKTOP_C3 = '#080c15';
    const MOBILE_C4 = '#010102'; const DESKTOP_C4 = '#04060a';
    const c0 = (colors && colors[0]) || (isMobile ? MOBILE_C0 : DESKTOP_C0);
    const c1 = (colors && colors[1]) || (isMobile ? MOBILE_C1 : DESKTOP_C1);
    const c2 = (colors && colors[2]) || (isMobile ? MOBILE_C2 : DESKTOP_C2);
    const c3 = (colors && colors[3]) || (isMobile ? MOBILE_C3 : DESKTOP_C3);
    const c4 = (colors && colors[4]) || (isMobile ? MOBILE_C4 : DESKTOP_C4);
    if (isMobile) {
        // MÓVIL: solo 3 paradas → halo más definido y menos cálculo
        grad.addColorStop(0.01, c0);
        grad.addColorStop(0.40, c2);
        grad.addColorStop(1.00, c4);
    } else {
        grad.addColorStop(0.00, c0);
        grad.addColorStop(0.25, c1);
        grad.addColorStop(0.50, c2);
        grad.addColorStop(0.75, c3);
        grad.addColorStop(1.00, c4);
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, c.width, c.height);
    const texture = new THREE.CanvasTexture(c);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    return texture;
}
scene.background = createGalaxyBackgroundTexture();

const FOG_DENSITY = 0.02;
scene.fog = new THREE.FogExp2(0x0d0c1c, FOG_DENSITY);

const DESKTOP_FOV = 48;
const MOBILE_FOV = 66;

const camera = new THREE.PerspectiveCamera(
    isMobileViewport() ? MOBILE_FOV : DESKTOP_FOV,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

const INITIAL_CAMERA_Z = 7;
camera.position.set(0, 2, INITIAL_CAMERA_Z);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: !isMobileViewport() });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(isMobileViewport() ? 1 : Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;

const css3dRenderer = new CSS3DRenderer();
css3dRenderer.setSize(window.innerWidth, window.innerHeight);
const css3dLayerEl = document.getElementById('css3d-layer') as HTMLDivElement | null;
css3dLayerEl?.appendChild(css3dRenderer.domElement);
const cssScene = new THREE.Scene();

const pmremGenerator = new THREE.PMREMGenerator(renderer);
if (!isMobileViewport()) {
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
}

const DOF_APERTURE = 0.0008;
const DOF_MAXBLUR = 0.0006;
const DOF_FOCUS_SMOOTH = 0.0008;

let composer, bokehPass;
if (!isMobileViewport()) {
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    bokehPass = new BokehPass(scene, camera, {
        focus: 7,
        aperture: DOF_APERTURE,
        maxblur: DOF_MAXBLUR,
    });
    composer.addPass(bokehPass);
}
let currentFocusDistance = 7;

const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 2.2);
dirLight.position.set(10, 30, 20);
scene.add(dirLight);

// Dos texturas de sprite para las particulas de fondo (estrellas):
// "soft" = punto redondo suave (el look de siempre), "crystal" = destello
// tipo cristal/diamante (prueba pedida). Se generan una sola vez.
function createSoftStarTexture() {
    const size = 64;
    const c = document.createElement('canvas');
    c.width = size;
    c.height = size;
    const ctx = c.getContext('2d')!;
    const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.4, 'rgba(255,255,255,0.7)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    return new THREE.CanvasTexture(c);
}
function createCrystalStarTexture() {
    const size = 64;
    const c = document.createElement('canvas');
    c.width = size;
    c.height = size;
    const ctx = c.getContext('2d')!;
    const cx = size / 2,
        cy = size / 2;
    ctx.translate(cx, cy);
    // Destello de 4 puntas (tipo cristal/diamante), con un nucleo suave
    // detras para que no se vea demasiado duro/geometrico.
    const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, size / 2.2);
    glow.addColorStop(0, 'rgba(255,255,255,0.9)');
    glow.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(-cx, -cy, size, size);
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = '#ffffff';
    const spike = (len, width) => {
        ctx.beginPath();
        ctx.moveTo(0, -len);
        ctx.lineTo(width, 0);
        ctx.lineTo(0, len);
        ctx.lineTo(-width, 0);
        ctx.closePath();
        ctx.fill();
    };
    spike(size / 2.1, size / 16);
    ctx.rotate(Math.PI / 2);
    spike(size / 2.1, size / 16);
    return new THREE.CanvasTexture(c);
}
const STAR_TEXTURES = { soft: createSoftStarTexture(), crystal: createCrystalStarTexture() };

function buildStarfield() {
    const STAR_COUNT = isMobileViewport() ? 1200 : 3200;
    const positions = new Float32Array(STAR_COUNT * 3);
    for (let i = 0; i < STAR_COUNT; i++) {
        const radius = 50 + Math.random() * 220;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);
        positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = radius * Math.cos(phi) - 34;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 1.6,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.8,
        depthWrite: false,
        map: STAR_TEXTURES.soft,
        blending: THREE.AdditiveBlending,
    });
    const stars = new THREE.Points(geo, mat);
    stars.raycast = () => {};
    scene.add(stars);
    return stars;
}
const starfield = buildStarfield();

function createNebulaSpriteTexture(colorA: string) {
    const size = 256;
    const c = document.createElement('canvas');
    c.width = size;
    c.height = size;
    const ctx = c.getContext('2d')!;
    const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grad.addColorStop(0, colorA);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    return new THREE.CanvasTexture(c);
}
function buildNebulaClouds(specs?: { pos: number[]; color: string; size: number }[]) {
    const list = specs || [
        { pos: [-45, 22, -6], color: 'rgba(130,70,210,0.30)', size: 95 },
        { pos: [50, -8, -38], color: 'rgba(0,200,220,0.20)', size: 115 },
        { pos: [-35, 12, -72], color: 'rgba(255,0,120,0.15)', size: 100 },
        { pos: [25, 28, -104], color: 'rgba(70,90,255,0.24)', size: 125 },
    ];
    const sprites = [];
    list.forEach((s) => {
        const tex = createNebulaSpriteTexture(s.color);
        const mat = new THREE.SpriteMaterial({
            map: tex,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
        });
        const sprite = new THREE.Sprite(mat);
        sprite.position.set(s.pos[0], s.pos[1], s.pos[2]);
        sprite.scale.set(s.size, s.size, 1);
        sprite.raycast = () => {};
        scene.add(sprite);
        sprites.push(sprite);
    });
    return sprites;
}
let nebulaSprites = buildNebulaClouds();

// ==========================================================================
// SELECTOR DE FONDO — SOLO DE PRUEBA, se puede borrar entero mas adelante
// (este bloque + el HTML del selector en index.html + su llamada en
// wireBackgroundSelector() mas abajo). Cambia: el gradiente de fondo, el
// color/densidad de la niebla, las nubes de color (nebula) y la forma de
// las particulas de fondo (punto suave / destello cristal).
// ==========================================================================
const BACKGROUND_PRESETS = [
    {
        id: 'original',
        label: 'Original (Nebulosa)',
        bg: ['#171331', '#0d0c1c', '#050508'],
        fogColor: 0x0d0c1c,
        fogDensity: 0.075,
        nebula: [
            { pos: [-45, 22, -6], color: 'rgba(130,70,210,0.30)', size: 95 },
            { pos: [50, -8, -38], color: 'rgba(0,200,220,0.20)', size: 115 },
            { pos: [-35, 12, -72], color: 'rgba(255,0,120,0.15)', size: 100 },
            { pos: [25, 28, -104], color: 'rgba(70,90,255,0.24)', size: 125 },
        ],
        starColor: 0xffffff,
        starOpacity: 0.8,
        starShape: 'soft',
    },
    {
        id: 'azul-noche',
        label: 'Azul Noche (Referencia)',
        // Inspirado en la referencia que mandaste: azul profundo casi
        // negro con un resplandor central mas intenso.
        bg: ['#0c1c4e', '#050b24', '#01030a'],
        fogColor: 0x050b24,
        fogDensity: 0.09,
        nebula: [
            { pos: [0, 6, -20], color: 'rgba(60,110,255,0.32)', size: 130 },
            { pos: [-40, 18, -60], color: 'rgba(120,60,200,0.18)', size: 110 },
            { pos: [45, -10, -80], color: 'rgba(60,150,255,0.16)', size: 120 },
        ],
        starColor: 0xbfd4ff,
        starOpacity: 0.75,
        starShape: 'soft',
    },
    {
        id: 'aurora',
        label: 'Aurora Boreal',
        bg: ['#0a2a2c', '#061417', '#020506'],
        fogColor: 0x061417,
        fogDensity: 0.08,
        nebula: [
            { pos: [-30, 20, -30], color: 'rgba(0,230,180,0.28)', size: 120 },
            { pos: [35, 5, -70], color: 'rgba(80,255,160,0.18)', size: 130 },
            { pos: [-10, -15, -100], color: 'rgba(0,150,255,0.16)', size: 110 },
        ],
        starColor: 0xd8fff0,
        starOpacity: 0.8,
        starShape: 'crystal',
    },
    {
        id: 'ambar',
        label: 'Ámbar Cálido',
        bg: ['#2c1408', '#160a05', '#080302'],
        fogColor: 0x160a05,
        fogDensity: 0.085,
        nebula: [
            { pos: [-30, 15, -30], color: 'rgba(255,140,40,0.28)', size: 110 },
            { pos: [40, -10, -70], color: 'rgba(255,80,60,0.18)', size: 120 },
            { pos: [0, 25, -100], color: 'rgba(255,200,80,0.14)', size: 100 },
        ],
        starColor: 0xffe0b0,
        starOpacity: 0.78,
        starShape: 'soft',
    },
    {
        id: 'monocromo',
        label: 'Monocromo Estudio',
        // Fondo casi neutro, minimalista, para que resalte mas el objeto
        // de vidrio/particulas y las cards — sin color de por medio.
        bg: ['#1a1a1e', '#0c0c0e', '#040405'],
        fogColor: 0x0c0c0e,
        fogDensity: 0.07,
        nebula: [
            { pos: [0, 10, -40], color: 'rgba(255,255,255,0.10)', size: 140 },
            { pos: [-40, -10, -90], color: 'rgba(255,255,255,0.06)', size: 120 },
        ],
        starColor: 0xffffff,
        starOpacity: 0.7,
        starShape: 'soft',
    },
    {
        id: 'cristal',
        label: 'Cristal (particulas)',
        // Mismo fondo que "Original" pero con las particulas de fondo en
        // forma de destello/cristal en vez de punto suave — para comparar
        // solo el cambio de forma de particula.
        bg: ['#171331', '#0d0c1c', '#050508'],
        fogColor: 0x0d0c1c,
        fogDensity: 0.075,
        nebula: [
            { pos: [-45, 22, -6], color: 'rgba(130,70,210,0.30)', size: 95 },
            { pos: [50, -8, -38], color: 'rgba(0,200,220,0.20)', size: 115 },
            { pos: [-35, 12, -72], color: 'rgba(255,0,120,0.15)', size: 100 },
            { pos: [25, 28, -104], color: 'rgba(70,90,255,0.24)', size: 125 },
        ],
        starColor: 0xffffff,
        starOpacity: 0.9,
        starShape: 'crystal',
    },
];

function applyBackgroundPreset(preset: any) {
    // Fondo (gradiente radial)
    if (scene.background && 'dispose' in scene.background)
        (scene.background as THREE.Texture).dispose();
    scene.background = createGalaxyBackgroundTexture(preset.bg);

    // Niebla
    scene.fog = new THREE.FogExp2(preset.fogColor, preset.fogDensity);

    // Nubes de color (nebula) — se destruyen las viejas y se arman nuevas
    nebulaSprites.forEach((sprite) => {
        scene.remove(sprite);
        sprite.material.map?.dispose();
        sprite.material.dispose();
    });
    nebulaSprites = buildNebulaClouds(preset.nebula);

    // Particulas de fondo (estrellas): color/opacidad/forma
    starfield.material.color.set(preset.starColor);
    starfield.material.opacity = preset.starOpacity;
    starfield.material.map = STAR_TEXTURES[preset.starShape] || STAR_TEXTURES.soft;
    starfield.material.needsUpdate = true;
}

// Conecta las flechas del selector "Fondo (prueba)" en el menu de audio.
// Al borrar la feature: borrar este bloque, el llamado wireBackgroundSelector()
// de mas abajo, y el <div> del selector en index.html (buscar "SOLO DE PRUEBA").
let bgPresetIndex = 0;
function wireBackgroundSelector() {
    const bgPrevBtn = document.getElementById('bg-prev');
    const bgNextBtn = document.getElementById('bg-next');
    const bgNameDisplay = document.getElementById('bg-name-display');
    if (!bgPrevBtn || !bgNextBtn || !bgNameDisplay) return;

    function updateBgNameDisplay() {
        bgNameDisplay.innerText = BACKGROUND_PRESETS[bgPresetIndex].label;
    }
    function goToBgPreset(index) {
        bgPresetIndex =
            ((index % BACKGROUND_PRESETS.length) + BACKGROUND_PRESETS.length) %
            BACKGROUND_PRESETS.length;
        applyBackgroundPreset(BACKGROUND_PRESETS[bgPresetIndex]);
        updateBgNameDisplay();
        playSFX('nav');
    }
    bgPrevBtn.addEventListener('click', () => goToBgPreset(bgPresetIndex - 1));
    bgNextBtn.addEventListener('click', () => goToBgPreset(bgPresetIndex + 1));
    updateBgNameDisplay();
}
wireBackgroundSelector();

// ==========================================================================
// OBJETO DE PARTICULAS - SECCION INICIO
// ==========================================================================
const PARTICLE_COUNT = isMobileViewport() ? 1200 : 3200;
const PARTICLE_SOURCE_GEOMETRY = new THREE.TorusKnotGeometry(1.1, 0.36, 220, 24);

const PARTICLE_SIZE = 3.2;
const PARTICLE_RADIUS = 1.7;
const PARTICLE_STRENGTH = 16;
const PARTICLE_SWIRL = 0.85;
const PARTICLE_SPRING = 55;
const PARTICLE_DAMPING = 6;

function sampleSurfacePoints(geometry, count) {
    const geo = geometry.index ? geometry.toNonIndexed() : geometry;
    const pos = geo.getAttribute('position');
    const triCount = Math.floor(pos.count / 3);

    const areas = new Float32Array(triCount);
    const a = new THREE.Vector3(),
        b = new THREE.Vector3(),
        c = new THREE.Vector3();
    const ab = new THREE.Vector3(),
        ac = new THREE.Vector3();
    let total = 0;
    for (let t = 0; t < triCount; t++) {
        a.fromBufferAttribute(pos, t * 3);
        b.fromBufferAttribute(pos, t * 3 + 1);
        c.fromBufferAttribute(pos, t * 3 + 2);
        ab.subVectors(b, a);
        ac.subVectors(c, a);
        total += ab.cross(ac).length() * 0.5;
        areas[t] = total;
    }

    const points = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        const r = Math.random() * total;
        let lo = 0,
            hi = triCount - 1;
        while (lo < hi) {
            const mid = (lo + hi) >> 1;
            if (areas[mid] < r) lo = mid + 1;
            else hi = mid;
        }
        a.fromBufferAttribute(pos, lo * 3);
        b.fromBufferAttribute(pos, lo * 3 + 1);
        c.fromBufferAttribute(pos, lo * 3 + 2);
        let u = Math.random(),
            v = Math.random();
        if (u + v > 1) {
            u = 1 - u;
            v = 1 - v;
        }
        const w = 1 - u - v;
        points[i * 3] = a.x * w + b.x * u + c.x * v;
        points[i * 3 + 1] = a.y * w + b.y * u + c.y * v;
        points[i * 3 + 2] = a.z * w + b.z * u + c.z * v;
    }
    return points;
}

const particleVertexShader = `
    attribute float aSeed;
    uniform float uTime;
    uniform float uPixelRatio;
    uniform float uSize;
    varying float vGlow;
    void main() {
        vec3 p = position;
        float t = uTime + aSeed * 41.0;
        p += 0.015 * vec3(sin(t * 1.6 + aSeed * 11.0), cos(t * 1.3 + aSeed * 7.0), sin(t * 2.1 + aSeed * 5.0));
        vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = uSize * uPixelRatio * (10.0 / -mvPosition.z);
        vGlow = 0.6 + 0.4 * sin(t * 2.4);
        gl_Position = projectionMatrix * mvPosition;
    }
`;

const particleFragmentShader = `
    precision mediump float;
    varying float vGlow;
    uniform vec3 uColorCore;
    uniform vec3 uColorEdge;
    void main() {
        vec2 c = gl_PointCoord - 0.5;
        float d = dot(c, c);
        float alpha = smoothstep(0.25, 0.0, d) * vGlow;
        if (alpha < 0.02) discard;
        vec3 color = mix(uColorCore, uColorEdge, clamp(d * 3.2, 0.0, 1.0));
        gl_FragColor = vec4(color, alpha);
    }
`;

let particlePoints = null;
let particleHomes = null;
let particleVelocities = null;
let particleMaterial = null;

function buildParticleObject() {
    const homePositions = sampleSurfacePoints(PARTICLE_SOURCE_GEOMETRY, PARTICLE_COUNT);
    const livePositions = homePositions.slice();
    const seeds = new Float32Array(PARTICLE_COUNT);
    for (let i = 0; i < PARTICLE_COUNT; i++) seeds[i] = Math.random();

    const geometry = new THREE.BufferGeometry();
    const positionAttr = new THREE.BufferAttribute(livePositions, 3);
    positionAttr.setUsage(THREE.DynamicDrawUsage);
    geometry.setAttribute('position', positionAttr);
    geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));

    particleMaterial = new THREE.ShaderMaterial({
        vertexShader: particleVertexShader,
        fragmentShader: particleFragmentShader,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
            uTime: { value: 0 },
            uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
            uSize: { value: PARTICLE_SIZE },
            uColorCore: { value: new THREE.Color(0xffffff) },
            uColorEdge: { value: new THREE.Color(0x00ffff) },
        },
    });

    particlePoints = new THREE.Points(geometry, particleMaterial);
    particlePoints.raycast = () => {};
    particleHomes = homePositions;
    particleVelocities = new Float32Array(PARTICLE_COUNT * 3);
    return particlePoints;
}

const PARTICLE_SOURCE_GLB = 'assets/models/mi-logo.glb';
const PARTICLE_TARGET_SIZE = 4.5;

function sampleGroupSurfacePoints(group, count) {
    group.updateMatrixWorld(true);
    const buckets = [];
    let totalArea = 0;
    const a = new THREE.Vector3(),
        b = new THREE.Vector3(),
        c = new THREE.Vector3();
    const ab = new THREE.Vector3(),
        ac = new THREE.Vector3();

    group.traverse((node) => {
        if (!node.isMesh) return;
        const geo = node.geometry.index ? node.geometry.toNonIndexed() : node.geometry;
        const pos = geo.getAttribute('position');
        const triCount = Math.floor(pos.count / 3);
        if (triCount === 0) return;

        const areas = new Float32Array(triCount);
        let bucketArea = 0;
        for (let t = 0; t < triCount; t++) {
            a.fromBufferAttribute(pos, t * 3).applyMatrix4(node.matrixWorld);
            b.fromBufferAttribute(pos, t * 3 + 1).applyMatrix4(node.matrixWorld);
            c.fromBufferAttribute(pos, t * 3 + 2).applyMatrix4(node.matrixWorld);
            ab.subVectors(b, a);
            ac.subVectors(c, a);
            bucketArea += ab.cross(ac).length() * 0.5;
            areas[t] = bucketArea;
        }
        if (bucketArea > 0) {
            totalArea += bucketArea;
            buckets.push({
                pos,
                matrix: node.matrixWorld.clone(),
                areas,
                triCount,
                cumulative: totalArea,
            });
        }
    });

    const points = new Float32Array(count * 3);
    if (buckets.length === 0 || totalArea === 0) return points;

    for (let i = 0; i < count; i++) {
        const r = Math.random() * totalArea;
        let bucket = buckets[buckets.length - 1];
        for (let bi = 0; bi < buckets.length; bi++) {
            if (r <= buckets[bi].cumulative) {
                bucket = buckets[bi];
                break;
            }
        }
        const localR = Math.random() * bucket.areas[bucket.triCount - 1];
        let lo = 0,
            hi = bucket.triCount - 1;
        while (lo < hi) {
            const mid = (lo + hi) >> 1;
            if (bucket.areas[mid] < localR) lo = mid + 1;
            else hi = mid;
        }
        a.fromBufferAttribute(bucket.pos, lo * 3).applyMatrix4(bucket.matrix);
        b.fromBufferAttribute(bucket.pos, lo * 3 + 1).applyMatrix4(bucket.matrix);
        c.fromBufferAttribute(bucket.pos, lo * 3 + 2).applyMatrix4(bucket.matrix);
        let u = Math.random(),
            v = Math.random();
        if (u + v > 1) {
            u = 1 - u;
            v = 1 - v;
        }
        const w = 1 - u - v;
        points[i * 3] = a.x * w + b.x * u + c.x * v;
        points[i * 3 + 1] = a.y * w + b.y * u + c.y * v;
        points[i * 3 + 2] = a.z * w + b.z * u + c.z * v;
    }
    return points;
}

function normalizePoints(points, targetSize) {
    let minX = Infinity,
        minY = Infinity,
        minZ = Infinity;
    let maxX = -Infinity,
        maxY = -Infinity,
        maxZ = -Infinity;
    for (let i = 0; i < points.length; i += 3) {
        minX = Math.min(minX, points[i]);
        maxX = Math.max(maxX, points[i]);
        minY = Math.min(minY, points[i + 1]);
        maxY = Math.max(maxY, points[i + 1]);
        minZ = Math.min(minZ, points[i + 2]);
        maxZ = Math.max(maxZ, points[i + 2]);
    }
    const cx = (minX + maxX) / 2,
        cy = (minY + maxY) / 2,
        cz = (minZ + maxZ) / 2;
    const size = Math.max(maxX - minX, maxY - minY, maxZ - minZ, 1e-4);
    const scale = targetSize / size;
    for (let i = 0; i < points.length; i += 3) {
        points[i] = (points[i] - cx) * scale;
        points[i + 1] = (points[i + 1] - cy) * scale;
        points[i + 2] = (points[i + 2] - cz) * scale;
    }
}

function applyNewParticleHomes(newHomes) {
    particleHomes = newHomes;
    const posAttr = particlePoints.geometry.getAttribute('position');
    posAttr.array.set(newHomes);
    posAttr.needsUpdate = true;
    particleVelocities.fill(0);
}

async function loadParticleObjectFromGLB(url: string) {
    const mod = await import('three/addons/loaders/GLTFLoader.js');
    const GLTFLoaderClass = mod.GLTFLoader;
    const glbLoader = new GLTFLoaderClass();
    glbLoader.load(
        url,
        (gltf) => {
            const newHomes = sampleGroupSurfacePoints(gltf.scene, PARTICLE_COUNT);
            normalizePoints(newHomes, PARTICLE_TARGET_SIZE);
            applyNewParticleHomes(newHomes);
        },
        undefined,
        (error) => {
            console.warn(
                'No se pudo cargar el .glb de particulas, se mantiene la figura de prueba:',
                error
            );
        }
    );
}

const particlePointerPlane = new THREE.Plane();
const particlePointerWorld = new THREE.Vector3();
const particlePointerLocal = new THREE.Vector3();
const particleCamDir = new THREE.Vector3();
const particleGroupWorldPos = new THREE.Vector3();

function updateParticlePhysics(delta, time) {
    if (!particlePoints) return;
    const posAttr = particlePoints.geometry.getAttribute('position');
    const arr = posAttr.array;
    const home = particleHomes;
    const vel = particleVelocities;

    let pushing = false;
    if (experienceStarted && currentSectionIndex === 0 && !isMobileViewport()) {
        camera.getWorldDirection(particleCamDir);
        logoGroup.getWorldPosition(particleGroupWorldPos);
        particlePointerPlane.setFromNormalAndCoplanarPoint(particleCamDir, particleGroupWorldPos);
        raycaster.setFromCamera(mouse, camera);
        if (raycaster.ray.intersectPlane(particlePointerPlane, particlePointerWorld)) {
            logoGroup.worldToLocal(particlePointerLocal.copy(particlePointerWorld));
            pushing = true;
        }
    }

    const decay = Math.exp(-PARTICLE_DAMPING * delta);
    const r2 = PARTICLE_RADIUS * PARTICLE_RADIUS;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
        const ix = i * 3,
            iy = ix + 1,
            iz = ix + 2;
        let vx = vel[ix],
            vy = vel[iy],
            vz = vel[iz];

        if (pushing) {
            const dx = arr[ix] - particlePointerLocal.x;
            const dy = arr[iy] - particlePointerLocal.y;
            const dz = arr[iz] - particlePointerLocal.z;
            const dist2 = dx * dx + dy * dy + dz * dz;
            if (dist2 < r2 && dist2 > 0.0001) {
                const dist = Math.sqrt(dist2);
                const nx = dx / dist,
                    ny = dy / dist,
                    nz = dz / dist;
                const fall = 1 - dist / PARTICLE_RADIUS;
                const f = fall * fall * delta;
                const tx = -ny,
                    ty = nx,
                    tz = 0;
                vx += (nx + tx * PARTICLE_SWIRL) * PARTICLE_STRENGTH * f;
                vy += (ny + ty * PARTICLE_SWIRL) * PARTICLE_STRENGTH * f;
                vz += (nz + tz * PARTICLE_SWIRL) * PARTICLE_STRENGTH * f;
            }
        }

        vx += (home[ix] - arr[ix]) * PARTICLE_SPRING * delta;
        vy += (home[iy] - arr[iy]) * PARTICLE_SPRING * delta;
        vz += (home[iz] - arr[iz]) * PARTICLE_SPRING * delta;

        vx *= decay;
        vy *= decay;
        vz *= decay;

        arr[ix] += vx * delta;
        arr[iy] += vy * delta;
        arr[iz] += vz * delta;

        vel[ix] = vx;
        vel[iy] = vy;
        vel[iz] = vz;
    }

    posAttr.needsUpdate = true;
    particleMaterial.uniforms.uTime.value = time;
}

// ==========================================================================
// Seccion INICIO — logo de particulas + texto hero, AHORA con el MISMO
// layout lado-a-lado (texto izquierda / logo derecha) en escritorio Y en
// movil, solo reescalado y con menos separacion en movil para que ambos
// quepan comodos en una pantalla angosta (ver updateHeroLayout).
// ==========================================================================
const HERO_TEXT_OBJECT_X_DESKTOP = -2.75;
const HERO_LOGO_OBJECT_X_DESKTOP = 2.75;
const HERO_OBJECT_Y_DESKTOP = 1;
const HERO_LOGO_SCALE_DESKTOP = 1;
const HERO_TEXT_SCALE_DESKTOP = 0.0092;

// MOVIL: ya NO lado a lado — logo arriba centrado, nombre + franja + rol
// (en una sola linea) centrados debajo, todo en una misma columna.
const HERO_LOGO_Y_MOBILE = 1.95;
const HERO_TEXT_Y_MOBILE = -0.55;
const HERO_LOGO_SCALE_MOBILE = 0.68;
const HERO_TEXT_SCALE_MOBILE = 0.0078;

const logoGroup = new THREE.Group();
logoGroup.position.set(HERO_LOGO_OBJECT_X_DESKTOP, HERO_OBJECT_Y_DESKTOP, 0);
logoGroup.add(buildParticleObject());
scene.add(logoGroup);
if (PARTICLE_SOURCE_GLB) loadParticleObjectFromGLB(PARTICLE_SOURCE_GLB);

let heroLogoBaseY = HERO_OBJECT_Y_DESKTOP;
let heroTextBaseY = HERO_OBJECT_Y_DESKTOP;

// ==========================================================================
// TEXTO HERO — nombre + rol, viven en el mundo 3D (CSS3D) igual que las
// demas cards, al lado izquierdo del logo de particulas. Sin fondo/caja,
// solo tipografia flotando en la escena; no son clicables.
// ==========================================================================
function heroTextInnerHTML() {
    const t = translations[currentLang];
    return `
        <span class="hero-name">${t.hero_name}</span>
        <span class="hero-role">${t.hero_role}</span>`;
}

const heroTextEl = document.createElement('div');
heroTextEl.className = 'hero-text';
heroTextEl.innerHTML = heroTextInnerHTML();
const heroTextObject = new CSS3DObject(heroTextEl);
heroTextObject.scale.set(HERO_TEXT_SCALE_DESKTOP, HERO_TEXT_SCALE_DESKTOP, HERO_TEXT_SCALE_DESKTOP);
heroTextObject.position.set(HERO_TEXT_OBJECT_X_DESKTOP, HERO_OBJECT_Y_DESKTOP, 0);
cssScene.add(heroTextObject);

function updateHeroTextLanguage() {
    heroTextEl.innerHTML = heroTextInnerHTML();
}

// Recalcula posicion/escala del logo + texto hero segun el viewport actual.
// ESCRITORIO: lado a lado (texto izquierda, logo derecha), como siempre.
// MOVIL: apilado y centrado — logo arriba, nombre + rol (una sola linea)
// centrados debajo, ambos sobre el eje X=0.
function updateHeroLayout() {
    const mobile = isMobileViewport();

    const logoScale = mobile ? HERO_LOGO_SCALE_MOBILE : HERO_LOGO_SCALE_DESKTOP;
    heroLogoBaseY = mobile ? HERO_LOGO_Y_MOBILE : HERO_OBJECT_Y_DESKTOP;
    logoGroup.position.set(mobile ? 0 : HERO_LOGO_OBJECT_X_DESKTOP, heroLogoBaseY, 0);
    logoGroup.scale.set(logoScale, logoScale, logoScale);

    const textScale = mobile ? HERO_TEXT_SCALE_MOBILE : HERO_TEXT_SCALE_DESKTOP;
    heroTextBaseY = mobile ? HERO_TEXT_Y_MOBILE : HERO_OBJECT_Y_DESKTOP;
    heroTextObject.scale.set(textScale, textScale, textScale);
    heroTextObject.position.set(mobile ? 0 : HERO_TEXT_OBJECT_X_DESKTOP, heroTextBaseY, 0);
    heroTextEl.classList.toggle('hero-text-centered', mobile);
}
updateHeroLayout();

// ==========================================================================
// INFO CARDS — Perfil y Contacto
// ==========================================================================
const ABOUT_OBJECT_Z = -16;
const CONTACT_OBJECT_Z = -68;
const INFO_CARD_SCALE_DESKTOP = 0.0125;
// La card vertical de movil es 360x620 (ver .info-card-vertical en
// style.css) en vez de 620x380, asi que necesita su propia escala.
const INFO_CARD_SCALE_MOBILE = 0.0125;

const PROFILE_CARD_IMAGE = 'https://picsum.photos/seed/wilmer-perfil-card/700/700';
const CONTACT_CARD_IMAGE = 'https://picsum.photos/seed/wilmer-contacto-card/700/700';

function infoCardInnerHTML(type) {
    const t = translations[currentLang];
    if (type === 'about') {
        return `
            <div class="info-card-media"><img src="${PROFILE_CARD_IMAGE}" alt="Wilmer Warnes" draggable="false"></div>
            <div class="info-card-body">
                <span class="info-card-eyebrow">${t.about_role}</span>
                <h3 class="info-card-title">${t.profile_hero_title}</h3>
                <p class="info-card-bio">${t.about_desc}</p>
                <div class="info-card-tags">
                    <span>${t.skill_1}</span><span>${t.skill_2}</span><span>${t.skill_3}</span><span>${t.skill_4}</span>
                </div>
            </div>`;
    }
    return `
        <div class="info-card-media"><img src="${CONTACT_CARD_IMAGE}" alt="Contacto Wilmer Warnes" draggable="false"></div>
        <div class="info-card-body">
            <span class="info-card-eyebrow">${t.contact_sub}</span>
            <h3 class="info-card-title">${t.contact_hero_title}</h3>
            <div class="info-card-links">
                <a href="https://artstation.com" target="_blank" rel="noopener" title="ArtStation"><i class="fa-brands fa-artstation"></i></a>
                <a href="https://behance.net" target="_blank" rel="noopener" title="Behance"><i class="fa-brands fa-behance"></i></a>
                <a href="mailto:contacto@wilmerwarnes.com" title="${t.social_email}"><i class="fa-solid fa-envelope"></i></a>
                <a href="https://instagram.com" target="_blank" rel="noopener" title="Instagram"><i class="fa-brands fa-instagram"></i></a>
                <a href="https://tiktok.com" target="_blank" rel="noopener" title="TikTok"><i class="fa-brands fa-tiktok"></i></a>
                <a href="https://youtube.com" target="_blank" rel="noopener" title="YouTube"><i class="fa-brands fa-youtube"></i></a>
            </div>
        </div>`;
}

const infoCardObjects: Record<'about' | 'contact', any> = {} as Record<'about' | 'contact', any>;
['about', 'contact'].forEach((type) => {
    const el = document.createElement('div');
    el.className = 'info-card';
    el.innerHTML = infoCardInnerHTML(type);
    const obj = new CSS3DObject(el);
    obj.scale.set(INFO_CARD_SCALE_DESKTOP, INFO_CARD_SCALE_DESKTOP, INFO_CARD_SCALE_DESKTOP);
    obj.position.set(0, 1, type === 'about' ? ABOUT_OBJECT_Z : CONTACT_OBJECT_Z);
    cssScene.add(obj);
    infoCardObjects[type] = obj;
});

let hoveringContactCard = false;
infoCardObjects.contact.element.addEventListener('mouseenter', () => {
    hoveringContactCard = true;
});
infoCardObjects.contact.element.addEventListener('mouseleave', () => {
    hoveringContactCard = false;
});

function updateInfoCardsLanguage() {
    ['about', 'contact'].forEach((type) => {
        infoCardObjects[type].element.innerHTML = infoCardInnerHTML(type);
    });
}

// Reescala las info-cards (Perfil / Contacto) para el viewport actual.
// El div interno (620x380, imagen izq + texto der) NO cambia de tamaño en
// CSS: se escala entero via Three.js, asi que la proporcion queda igual
// que en escritorio, solo mas chico.
function applyResponsiveInfoCards() {
    const mobile = isMobileViewport();
    const scale = mobile ? INFO_CARD_SCALE_MOBILE : INFO_CARD_SCALE_DESKTOP;
    ['about', 'contact'].forEach((type) => {
        const obj = infoCardObjects[type];
        if (obj) {
            obj.scale.set(scale, scale, scale);
            obj.element.classList.toggle('info-card-vertical', mobile);
        }
    });
}
applyResponsiveInfoCards();

const infoCardParallax = {
    about: { x: 0, y: 0 },
    contact: { x: 0, y: 0 },
};
const INFO_PARALLAX_MAX = 16;
const INFO_PARALLAX_EASE = 0.06;

function updateInfoCardVisual(type, alpha) {
    const obj = infoCardObjects[type];
    obj.element.style.opacity = alpha.toFixed(3);
    obj.element.style.pointerEvents = alpha < 0.05 ? 'none' : 'auto';

    const p = infoCardParallax[type];
    const targetX = alpha > 0.05 ? mouseX * INFO_PARALLAX_MAX : 0;
    const targetY = alpha > 0.05 ? -mouseY * INFO_PARALLAX_MAX : 0;
    p.x += (targetX - p.x) * INFO_PARALLAX_EASE;
    p.y += (targetY - p.y) * INFO_PARALLAX_EASE;

    if (alpha > 0.02) {
        const img = obj.element.querySelector('.info-card-media img');
        if (img) img.style.transform = `translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px)`;
    }
}

// ==========================================================================
// APARTADO PROYECTOS — cards HTML/CSS3D (selector de categoria: 3D / Diseño
// / Edicion). En movil se ven las 3 en modo "mazo/coverflow" (centro grande,
// costados asomando mas chicos y atenuados), igual patron visual que la
// galeria de cada categoria, y se cambia con flechas/swipe (ver
// categoryCenterIndex, goToCategoryIndex, layoutCategoryCardsMobile).
// ==========================================================================
const PROJECTS_SPREAD_X_DESKTOP = 4.4;
const PROJECT_CARD_SCALE_DESKTOP = 0.011;
const PROJECT_CARD_SCALE_MOBILE = 0.0098;

// Separacion, escala y atenuacion de las cards laterales del mazo movil.
const CATEGORY_SPACING_X_MOBILE = 1.55;
const CATEGORY_SIDE_SCALE_MULT_MOBILE = 0.76;
const CATEGORY_ROTATION_STEP_MOBILE = 0.42;
const CATEGORY_MAX_ROTATION_MOBILE = 0.85;
const CATEGORY_SIDE_ALPHA_MOBILE = 0.5;

function projectCardScale() {
    return isMobileViewport() ? PROJECT_CARD_SCALE_MOBILE : PROJECT_CARD_SCALE_DESKTOP;
}

let categoryCenterIndex = 0;
// Rotacion Y "base" de cada card por el coverflow movil (el bamboleo de
// animate() se suma encima de esto, no lo reemplaza — ver mas abajo).
const categoryCardBaseRotY: Record<string, number> = {};

const GALLERY_TITLE_KEYS: Record<string, string> = {
    '3d': 'gallery_title_3d',
    diseno: 'gallery_title_diseno',
    edicion: 'gallery_title_edicion',
};

async function loadPortfolioData(): Promise<void> {
    const base = (import.meta as any).env?.BASE_URL || '/';
    const urls = [`${base}portfolioData.json`, 'portfolioData.json', './portfolioData.json', '/portfolioData.json'];
    let lastErr: any = null;
    for (const url of urls) {
        try {
            console.log('[loadPortfolioData] fetching', url);
            const res = await fetch(url);
            if (!res.ok) { lastErr = new Error(`Failed ${url}: ${res.status}`); continue; }
            const text = await res.text();
            // Si devuelve HTML (fallback de SPA), no es JSON
            if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
                lastErr = new Error(`Got HTML not JSON from ${url}`);
                continue;
            }
            portfolioData = JSON.parse(text) as PortfolioData;
            console.log('[loadPortfolioData] OK from', url, 'keys:', portfolioData ? Object.keys(portfolioData) : null);
            if (portfolioData && portfolioData['3d']) {
                initProjectCards();
                return;
            }
        } catch (e) { lastErr = e; console.warn('[loadPortfolioData] fail', url, e); }
    }
    console.error('[loadPortfolioData] all urls failed', lastErr);
    // Fallback mínimo para que no quede null y las cards se creen
    if (!portfolioData) {
        portfolioData = { '3d': { title: '3D', projects: [] }, diseno: { title: 'Diseño', projects: [] }, edicion: { title: 'Edición', projects: [] } } as any;
        initProjectCards();
    }
}

function galleryTitleForCategory(category: string): string {
    const t = translations[currentLang];
    const key = GALLERY_TITLE_KEYS[category];
    return key && t[key as keyof TranslationMap]
        ? t[key as keyof TranslationMap]
        : portfolioData?.[category as keyof PortfolioData]?.title || '';
}

function updateGalleryTitleLanguage() {
    if (!galleryCategory) return;
    const titleEl = document.getElementById('gallery-title');
    if (titleEl) titleEl.innerText = galleryTitleForCategory(galleryCategory);
}

// "slot" en vez de una x fija: en escritorio la posicion real es
// slot * PROJECTS_SPREAD_X_DESKTOP (lado a lado); en movil todas quedan
// en x=0 y se recalcula con applyResponsiveProjectCards() en cada resize.
const CARD_CATEGORIES = [
    { key: '3d', titleKey: 'card_title_3d', subKey: 'card_sub_3d', badge: '01', slot: -1 },
    {
        key: 'diseno',
        titleKey: 'card_title_diseno',
        subKey: 'card_sub_diseno',
        badge: '02',
        slot: 0,
    },
    {
        key: 'edicion',
        titleKey: 'card_title_edicion',
        subKey: 'card_sub_edicion',
        badge: '03',
        slot: 1,
    },
];
const CARD_IMAGE_INTERVAL_MS = 3200;

const projectCardInstances = [];

function buildCardElement(catSpec) {
    const t = translations[currentLang];
    const catData = (portfolioData as any)?.[catSpec.key];
    if (!catData || !catData.projects || catData.projects.length === 0) {
        console.error('[buildCardElement] Category data not found for:', catSpec.key, 'Available:', portfolioData ? Object.keys(portfolioData as any) : 'null', 'catData:', catData);
        const el = document.createElement('div');
        el.className = 'proj-card';
        el.innerHTML = '<div class="pc-inner">Cargando...</div>';
        return el;
    }
    const el = document.createElement('div');
    el.className = 'proj-card';
    el.innerHTML = `
        <div class="pc-inner">
            <img class="pc-img pc-active" src="${catData.projects[0].img}" alt="" draggable="false">
            <img class="pc-img" src="${catData.projects[1] ? catData.projects[1].img : catData.projects[0].img}" alt="" draggable="false">
        </div>
        <span class="pc-badge">${catSpec.badge}</span>
        <div class="pc-arrow"><i class="fa-solid fa-arrow-up-right"></i></div>
        <div class="pc-title">${t[catSpec.titleKey]}<span class="pc-sub">${t[catSpec.subKey]}</span></div>
    `;
    el.style.cursor = 'pointer';
    el.addEventListener('click', (e) => {
        e.stopPropagation();
        if (isMobileViewport()) {
            const idx = CARD_CATEGORIES.findIndex((c) => c.key === catSpec.key);
            if (idx !== categoryCenterIndex) {
                goToCategoryIndex(idx);
                return;
            }
        }
        openProjectsCategory(catSpec.key);
        playSFX('open');
    });

    const imgs = el.querySelectorAll('.pc-img');
    const covers = catData.projects.map((p) => p.img);
    let coverIndex = 1 % covers.length;
    const intervalId = setInterval(() => {
        const showing = el.querySelector('.pc-img.pc-active');
        const hidden = showing === imgs[0] ? imgs[1] : imgs[0];
        (hidden as HTMLImageElement).src = covers[coverIndex];
        requestAnimationFrame(() => {
            hidden.classList.add('pc-active');
            showing.classList.remove('pc-active');
        });
        coverIndex = (coverIndex + 1) % covers.length;
    }, CARD_IMAGE_INTERVAL_MS);

    const instance = { catSpec, el, intervalId };
    projectCardInstances.push(instance);
    return el;
}

function updateCardsLanguage() {
    const t = translations[currentLang];
    projectCardInstances.forEach((inst) => {
        const titleEl = inst.el.querySelector('.pc-title');
        if (titleEl)
            titleEl.innerHTML = `${t[inst.catSpec.titleKey]}<span class="pc-sub">${t[inst.catSpec.subKey]}</span>`;
    });
}

// ==========================================================================
// PROXIES INVISIBLES PARA CLICK EN LAS CARDS DE PROYECTOS (pasada del
// raycast a traves del canvas WebGL cuando el clic no cae justo en el div
// CSS3D). Las cards en si ya son clicables directo via su propio
// listener en buildCardElement, tanto en escritorio como en movil.
// ==========================================================================
const CARD_HIT_WIDTH = 3.9;
const CARD_HIT_HEIGHT = 5.05;
const projectCardsHitGroup = new THREE.Group();
const projectCardHitMeshes = {};

CARD_CATEGORIES.forEach((catSpec) => {
    const hitMat = new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0,
        depthWrite: false,
        depthTest: false,
    });
    const hitMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(CARD_HIT_WIDTH, CARD_HIT_HEIGHT),
        hitMat
    );
    hitMesh.position.set(catSpec.slot * PROJECTS_SPREAD_X_DESKTOP, 1, -42);
    hitMesh.userData = { type: 'project-card', key: catSpec.key };
    hitMesh.raycast = THREE.Mesh.prototype.raycast;
    projectCardsHitGroup.add(hitMesh);
    projectCardHitMeshes[catSpec.key] = hitMesh;
});
scene.add(projectCardsHitGroup);

const cssCardGroups: Record<string, CSS3DObject> = {};
CARD_CATEGORIES.forEach((catSpec) => {
    const cardEl = buildCardElement(catSpec);
    const cssObj = new CSS3DObject(cardEl);
    const scale = projectCardScale();
    cssObj.scale.set(scale, scale, scale);
    cssObj.position.set(catSpec.slot * PROJECTS_SPREAD_X_DESKTOP, 1, -42);
    cssScene.add(cssObj);
    cssCardGroups[catSpec.key] = cssObj;
});
Object.assign(window, { cssCardGroups });

function initProjectCards(): void {
    // Compat: si se llama de nuevo (lazy), recrea
    Object.keys(cssCardGroups).forEach(k => {
        try { cssScene.remove(cssCardGroups[k]); } catch {}
        delete (cssCardGroups as any)[k];
    });
    CARD_CATEGORIES.forEach((catSpec) => {
        const cardEl = buildCardElement(catSpec);
        const cssObj = new CSS3DObject(cardEl);
        const scale = projectCardScale();
        cssObj.scale.set(scale, scale, scale);
        cssObj.position.set(catSpec.slot * PROJECTS_SPREAD_X_DESKTOP, 1, -42);
        cssScene.add(cssObj);
        cssCardGroups[catSpec.key] = cssObj;
    });
    Object.assign(window, { cssCardGroups });
}

// Acomoda las 3 cards de categoria en modo "mazo/coverflow" para MOVIL:
// la activa (categoryCenterIndex) queda al centro y grande, las otras dos
// asoman a los costados mas chicas, giradas y atenuadas — mismo patron
// visual que la galeria de cada categoria. Se llama al cambiar de
// categoria (flechas/swipe) y en cada resize.
function layoutCategoryCardsMobile() {
    const n = CARD_CATEGORIES.length;
    const baseScale = PROJECT_CARD_SCALE_MOBILE;
    CARD_CATEGORIES.forEach((catSpec, i) => {
        let offset = i - categoryCenterIndex;
        if (offset > n / 2) offset -= n;
        if (offset < -n / 2) offset += n;
        const absOffset = Math.abs(offset);

        const x = offset * CATEGORY_SPACING_X_MOBILE;
        const scaleMult = absOffset === 0 ? 1 : CATEGORY_SIDE_SCALE_MULT_MOBILE;
        const scale = baseScale * scaleMult;
        const rotY = THREE.MathUtils.clamp(
            -offset * CATEGORY_ROTATION_STEP_MOBILE,
            -CATEGORY_MAX_ROTATION_MOBILE,
            CATEGORY_MAX_ROTATION_MOBILE
        );
        categoryCardBaseRotY[catSpec.key] = rotY;

        const obj = (window as any).cssCardGroups?.[catSpec.key];
        if (obj) {
            obj.position.x = x;
            obj.position.z = -42 - absOffset * 0.9;
            obj.scale.set(scale, scale, scale);
            // La card de frente (centro) queda siempre con el brillo de
            // "hover" (glow/borde), ya que en tactil no existe el hover
            // real del mouse — asi se nota cual es la activa.
            obj.element.classList.toggle('js-hover', absOffset === 0);
        }
        const hitMesh = projectCardHitMeshes[catSpec.key];
        if (hitMesh) hitMesh.position.x = x;
    });
}

// Reescala/reposiciona las 3 cards de categoria (Proyectos) segun el
// viewport actual. Se llama al iniciar y en cada resize.
function applyResponsiveProjectCards() {
    const mobile = isMobileViewport();
    if (mobile) {
        layoutCategoryCardsMobile();
        return;
    }
    CARD_CATEGORIES.forEach((catSpec) => {
        const x = catSpec.slot * PROJECTS_SPREAD_X_DESKTOP;
        categoryCardBaseRotY[catSpec.key] = 0;
        const obj = (window as any).cssCardGroups?.[catSpec.key];
        if (obj) {
            obj.scale.set(
                PROJECT_CARD_SCALE_DESKTOP,
                PROJECT_CARD_SCALE_DESKTOP,
                PROJECT_CARD_SCALE_DESKTOP
            );
            obj.position.x = x;
            obj.position.z = -42;
            obj.element.classList.remove('js-hover');
        }
        const hitMesh = projectCardHitMeshes[catSpec.key];
        if (hitMesh) hitMesh.position.x = x;
    });
}
applyResponsiveProjectCards();
// Asegurar layout móvil en carga inicial (evita flash de layout desktop en móvil)
requestAnimationFrame(() => {
    applyResponsiveProjectCards();
});

function updateProjectCardsHover(clientX, clientY) {
    if (isMobileViewport()) return;
    const active = experienceStarted && currentSectionIndex === 2 && !galleryOpen;
    CARD_CATEGORIES.forEach((catSpec) => {
        const obj = (window as any).cssCardGroups?.[catSpec.key];
        if (!obj) return;
        const el = obj.element;
        if (!active) {
            el.classList.remove('js-hover');
            return;
        }
        const r = el.getBoundingClientRect();
        const isOver =
            r.width > 0 &&
            clientX >= r.left &&
            clientX <= r.right &&
            clientY >= r.top &&
            clientY <= r.bottom;
        el.classList.toggle('js-hover', isOver);
    });
}

function clearProjectCardsHover() {
    CARD_CATEGORIES.forEach((catSpec) => {
        const obj = (window as any).cssCardGroups?.[catSpec.key];
        if (obj) obj.element.classList.remove('js-hover');
    });
}

// ==========================================================================
// NAVEGACION POR SECCIONES
// ==========================================================================
const SECTIONS = [
    { name: 'inicio', objectZ: 0, offset: 7 },
    { name: 'perfil', objectZ: ABOUT_OBJECT_Z, offset: 8 },
    { name: 'proyectos', objectZ: -42, offset: 9 },
    { name: 'contacto', objectZ: CONTACT_OBJECT_Z, offset: 8 },
];

const MOBILE_OFFSET_MULTIPLIER = 1.4;

function sectionOffset(section) {
    return section.offset * (isMobileViewport() ? MOBILE_OFFSET_MULTIPLIER : 1);
}
function getMaxCameraZ() {
    return SECTIONS[0].objectZ + sectionOffset(SECTIONS[0]);
}
function getMinCameraZ() {
    const last = SECTIONS[SECTIONS.length - 1];
    return last.objectZ + sectionOffset(last);
}

let scrollTargetZ = SECTIONS[0].objectZ + sectionOffset(SECTIONS[0]);

const SCROLL_SENSITIVITY = 0.08;
const SNAP_DELAY_MS = 200;
let snapTimeout = null;

// ==========================================================================
// VISIBILIDAD DE LAS CARDS SEGUN DISTANCIA DE CAMARA
// ==========================================================================
const PROJECTS_OBJECT_Z = -42;
const CARDS_FADE_FULL_DIST = 11;
const CARDS_FADE_ZERO_DIST = 18;
const INFO_CARD_FADE_FULL_DIST = 10;
const INFO_CARD_FADE_ZERO_DIST = 16;
const HERO_OBJECT_Z = 0;
const HERO_FADE_FULL_DIST = 8;
const HERO_FADE_ZERO_DIST = 14;

function computeAlphaForDistance(camZ, objectZ, fullDist, zeroDist) {
    const dist = Math.abs(camZ - objectZ);
    if (dist <= fullDist) return 1;
    if (dist >= zeroDist) return 0;
    return 1 - (dist - fullDist) / (zeroDist - fullDist);
}

// ==========================================================================
// GALERIA 3D DE PROYECTOS (COVERFLOW) — usada en ESCRITORIO Y MOVIL. Al
// entrar a cualquier categoria (3D, Diseño, Edicion) esto reemplaza las
// flechas/puntitos de abajo: quedan solo las flechas a los costados, el
// titulo arriba y el boton "Volver" abajo (gallery-hud, igual que el
// selector principal de secciones).
// ==========================================================================
const GALLERY_OBJECT_Y = -15;
const GALLERY_OBJECT_Z = -42;
const GALLERY_CARD_SCALE_DESKTOP = 0.0105;
const GALLERY_SPACING_X_DESKTOP = 3.5;
const GALLERY_CARD_SCALE_MOBILE = 0.0088;
const GALLERY_SPACING_X_MOBILE = 1.55;
const GALLERY_MAX_ROTATION = 1.05;
const GALLERY_ROTATION_STEP = 0.42;
const GALLERY_SCALE_STEP = 0.2;
const GALLERY_MAX_VISIBLE_OFFSET = 3;

let galleryOpen = false;
let galleryCategory = null;
let galleryCenterIndex = 0;
let galleryCardObjects = [];
let galleryWheelLock = false;
let galleryArrowHovered = false;

const galleryGroup = new THREE.Group();
galleryGroup.position.set(0, GALLERY_OBJECT_Y, GALLERY_OBJECT_Z);
cssScene.add(galleryGroup);

// ==========================================================================
// RESPALDO DE CLICK PARA LA GALERIA (coverflow de un proyecto) — mismo
// patron que ya usan las 3 cards de categoria (projectCardsHitGroup): un
// plano invisible en el mundo WebGL por cada card, para cuando el clic no
// "aterriza" justo en el div CSS3D transformado y termina cayendo sobre el
// <canvas> de fondo. Sin esto, esos clics no abrian el proyecto.
// ==========================================================================
const GALLERY_HIT_WIDTH = 3.4;
const GALLERY_HIT_HEIGHT = 4.6;
const galleryHitGroup = new THREE.Group();
galleryHitGroup.position.set(0, GALLERY_OBJECT_Y, GALLERY_OBJECT_Z);
scene.add(galleryHitGroup);
let galleryHitMeshes = [];

function rebuildGalleryHitMeshes(projects) {
    galleryHitMeshes.forEach((m) => galleryHitGroup.remove(m));
    galleryHitMeshes = projects.map((p, i) => {
        const mat = new THREE.MeshBasicMaterial({
            transparent: true,
            opacity: 0,
            depthWrite: false,
            depthTest: false,
        });
        const mesh = new THREE.Mesh(
            new THREE.PlaneGeometry(GALLERY_HIT_WIDTH, GALLERY_HIT_HEIGHT),
            mat
        );
        mesh.userData = { type: 'gallery-card', index: i, projectId: p.id };
        mesh.raycast = THREE.Mesh.prototype.raycast;
        galleryHitGroup.add(mesh);
        return mesh;
    });
}

function buildGalleryCard(project, index) {
    const el = document.createElement('div');
    el.className = 'gallery-card';
    el.innerHTML = `
        <div class="gc-inner">
            <img class="gc-img" src="${project.img}" alt="${project.name}" draggable="false">
            <div class="gc-overlay">
                <span class="gc-eyebrow">Proyecto 0${project.id}</span>
                <h3 class="gc-title">${project.name}</h3>
                <p class="gc-sub">${project.desc}</p>
            </div>
        </div>
    `;
    el.addEventListener('click', (e) => {
        e.stopPropagation();
        if (index === galleryCenterIndex) {
            openLightbox(galleryCategory, project.id);
        } else {
            goToGalleryIndex(index);
        }
    });
    const obj = new CSS3DObject(el);
    galleryGroup.add(obj);
    return { obj, el, project };
}

function layoutGalleryCards() {
    const mobile = isMobileViewport();
    const spacing = mobile ? GALLERY_SPACING_X_MOBILE : GALLERY_SPACING_X_DESKTOP;
    const baseScale = mobile ? GALLERY_CARD_SCALE_MOBILE : GALLERY_CARD_SCALE_DESKTOP;
    const n = galleryCardObjects.length;
    galleryCardObjects.forEach((card, i) => {
        let offset = i - galleryCenterIndex;
        if (offset > n / 2) offset -= n;
        if (offset < -n / 2) offset += n;
        const absOffset = Math.abs(offset);

        const x = offset * spacing;
        const z = -absOffset * 1.5;
        const rotY = THREE.MathUtils.clamp(
            -offset * GALLERY_ROTATION_STEP,
            -GALLERY_MAX_ROTATION,
            GALLERY_MAX_ROTATION
        );
        const scaleMult = Math.max(0.5, 1 - absOffset * GALLERY_SCALE_STEP);

        card.obj.position.set(x, 0, z);
        card.obj.rotation.y = rotY;
        card.obj.scale.set(baseScale * scaleMult, baseScale * scaleMult, baseScale * scaleMult);

        // El plano invisible de respaldo (galeryHitMeshes) se mueve exacto
        // junto con la card visible, para que el raycast del click siempre
        // matchee con lo que se ve en pantalla.
        const hitMesh = galleryHitMeshes[i];
        if (hitMesh) {
            hitMesh.position.set(x, 0, z);
            hitMesh.rotation.y = rotY;
            hitMesh.visible = absOffset <= GALLERY_MAX_VISIBLE_OFFSET;
        }

        const visible = absOffset <= GALLERY_MAX_VISIBLE_OFFSET;
        const alpha = visible ? Math.max(0, 1 - absOffset * 0.28) : 0;
        card.el.style.opacity = alpha.toFixed(3);
        card.el.style.pointerEvents = visible ? 'auto' : 'none';
        card.el.classList.toggle('gc-center', offset === 0);
    });
}

function updateGalleryHoverFromPointer(clientX, clientY) {
    if (!galleryOpen || isMobileViewport()) return;
    galleryCardObjects.forEach((card) => {
        const r = card.el.getBoundingClientRect();
        const isOver =
            r.width > 0 &&
            clientX >= r.left &&
            clientX <= r.right &&
            clientY >= r.top &&
            clientY <= r.bottom;
        card.el.classList.toggle('js-hover', isOver);
    });
}
function clearGalleryHover() {
    galleryCardObjects.forEach((card) => card.el.classList.remove('js-hover'));
}

function goToGalleryIndex(index) {
    const n = galleryCardObjects.length;
    if (n === 0) return;
    galleryCenterIndex = ((index % n) + n) % n;
    layoutGalleryCards();
    playSFX('tick');
}
window.goToGalleryIndex = goToGalleryIndex;

function openGallery(category) {
    galleryCategory = category;
    galleryCenterIndex = 0;

    galleryCardObjects.forEach((c) => galleryGroup.remove(c.obj));
    galleryCardObjects = portfolioData[category].projects.map((p, i) => buildGalleryCard(p, i));
    rebuildGalleryHitMeshes(portfolioData[category].projects);
    layoutGalleryCards();

    galleryOpen = true;
    const galleryTitleEl = document.getElementById('gallery-title');
    const galleryHudEl = document.getElementById('gallery-hud');
    if (galleryTitleEl) galleryTitleEl.innerText = galleryTitleForCategory(category);
    galleryHudEl?.classList.add('active');
    updateCategorySwitchVisibility();
}

function closeGallery() {
    if (!galleryOpen) return;
    galleryOpen = false;
    const galleryHudEl = document.getElementById('gallery-hud');
    galleryHudEl?.classList.remove('active');
    clearGalleryHover();
    galleryCardObjects.forEach((c) => galleryGroup.remove(c.obj));
    galleryCardObjects = [];
    galleryHitMeshes.forEach((m) => galleryHitGroup.remove(m));
    galleryHitMeshes = [];
    playSFX('close');
    updateCategorySwitchVisibility();
}
window.closeGallery = closeGallery;

const galleryPrevBtn = document.getElementById('gallery-prev') as HTMLButtonElement | null;
const galleryNextBtn = document.getElementById('gallery-next') as HTMLButtonElement | null;
if (galleryPrevBtn) {
    galleryPrevBtn.addEventListener('click', () => goToGalleryIndex(galleryCenterIndex - 1));
    galleryPrevBtn.addEventListener('mouseenter', () => {
        galleryArrowHovered = true;
    });
    galleryPrevBtn.addEventListener('mouseleave', () => {
        galleryArrowHovered = false;
    });
}
if (galleryNextBtn) {
    galleryNextBtn.addEventListener('click', () => goToGalleryIndex(galleryCenterIndex + 1));
    galleryNextBtn.addEventListener('mouseenter', () => {
        galleryArrowHovered = true;
    });
    galleryNextBtn.addEventListener('mouseleave', () => {
        galleryArrowHovered = false;
    });
}

function handleGalleryWheel(e) {
    if (galleryWheelLock) return;
    if (Math.abs(e.deltaY) < 6) return;
    galleryWheelLock = true;
    goToGalleryIndex(galleryCenterIndex + (e.deltaY > 0 ? 1 : -1));
    setTimeout(() => {
        galleryWheelLock = false;
    }, 260);
}

// Swipe horizontal: SOLO dentro de la galeria (coverflow de proyectos de
// una categoria) para pasar de proyecto. En el selector de categoria
// (3D / Diseño / Edicion) el cambio es UNICAMENTE con las flechas de los
// costados — asi el swipe vertical para pasar a la siguiente seccion
// (ej. Proyectos -> Contacto) no queda "atrapado" por este gesto.
let horizTouchStartX = null;
window.addEventListener(
    'touchstart',
    (e) => {
        if (!galleryOpen) return;
        horizTouchStartX = e.touches[0].clientX;
    },
    { passive: true }
);
window.addEventListener(
    'touchend',
    (e) => {
        if (!galleryOpen || horizTouchStartX === null) return;
        const endX =
            e.changedTouches && e.changedTouches[0]
                ? e.changedTouches[0].clientX
                : horizTouchStartX;
        const deltaX = horizTouchStartX - endX;
        horizTouchStartX = null;
        if (Math.abs(deltaX) <= 40) return;
        goToGalleryIndex(galleryCenterIndex + (deltaX > 0 ? 1 : -1));
    },
    { passive: true }
);

// ==========================================================================
// Al hacer clic/tap en una categoria (3D / Diseño / Edicion) SIEMPRE se
// abre la galeria coverflow 3D de arriba — igual en escritorio y en movil.
// ==========================================================================
function openProjectsCategory(key) {
    openGallery(key);
}

const PROJECTS_ORDER = ['3d', 'diseno', 'edicion'];

// ==========================================================================
// CAMBIO DE CATEGORIA EN MOVIL (3D / Diseño / Edicion) — mazo/coverflow con
// flechas laterales + swipe (ver layoutCategoryCardsMobile).
// ==========================================================================
function goToCategoryIndex(index) {
    categoryCenterIndex =
        ((index % CARD_CATEGORIES.length) + CARD_CATEGORIES.length) % CARD_CATEGORIES.length;
    layoutCategoryCardsMobile();
    playSFX('tick');
}
window.goToCategoryIndex = goToCategoryIndex;

function updateCategorySwitchVisibility() {
    const nav = document.getElementById('cat-switch-nav');
    if (!nav) return;
    const show =
        isMobileViewport() && experienceStarted && currentSectionIndex === 2 && !galleryOpen;
    nav.classList.toggle('active', show);
}

const catPrevBtn = document.getElementById('cat-prev') as HTMLButtonElement | null;
const catNextBtn = document.getElementById('cat-next') as HTMLButtonElement | null;
if (catPrevBtn)
    catPrevBtn.addEventListener('click', () => goToCategoryIndex(categoryCenterIndex - 1));
if (catNextBtn)
    catNextBtn.addEventListener('click', () => goToCategoryIndex(categoryCenterIndex + 1));

function goToSection(index) {
    index = Math.max(0, Math.min(SECTIONS.length - 1, index));
    if (galleryOpen) closeGallery();
    currentSectionIndex = index;

    const section = SECTIONS[index];
    scrollTargetZ = section.objectZ + sectionOffset(section);

    if (index !== 2) {
        clearProjectCardsHover();
    }

    playSFX('nav');
    updateActiveNavHighlight();
    updateScrollHintVisibility();
    updateCategorySwitchVisibility();
    // FIX móvil: si entramos a Proyectos, fuerza el mazo (corrige el flash desktop del inicio)
    if (isMobileViewport() && index === 2) {
        requestAnimationFrame(() => applyResponsiveProjectCards());
        setTimeout(() => applyResponsiveProjectCards(), 100);
    }
}

function snapToNearestSection() {
    let closestIndex = 0;
    let closestDistance = Infinity;

    SECTIONS.forEach((section, index) => {
        const sectionZ = section.objectZ + sectionOffset(section);
        const distance = Math.abs(scrollTargetZ - sectionZ);
        if (distance < closestDistance) {
            closestDistance = distance;
            closestIndex = index;
        }
    });

    goToSection(closestIndex);
}

window.addEventListener('wheel', (e) => {
    if (!experienceStarted) return;
    if (galleryOpen) {
        handleGalleryWheel(e);
        return;
    }

    scrollTargetZ += e.deltaY * SCROLL_SENSITIVITY;
    scrollTargetZ = Math.max(getMinCameraZ(), Math.min(getMaxCameraZ(), scrollTargetZ));

    if (snapTimeout) clearTimeout(snapTimeout);
    snapTimeout = setTimeout(snapToNearestSection, isMobileViewport() ? 120 : SNAP_DELAY_MS);
});

let touchStartY = null;
// Antes el multiplicador era 2.2 y quedaba MUY sensible: un swipe corto
// saltaba varias secciones de un tiron. Se baja a 0.55, solo afecta al
// gesto tactil (touchmove), el scroll con rueda de mouse en escritorio
// no se toca.
const TOUCH_SCROLL_SENSITIVITY_MULT = 1.2;
window.addEventListener(
    'touchstart',
    (e) => {
        if (!experienceStarted) return;
        touchStartY = e.touches[0].clientY;
    },
    { passive: true }
);
window.addEventListener(
    'touchmove',
    (e) => {
        if (!experienceStarted || touchStartY === null) return;
        if (galleryOpen) return;
        const currentY = e.touches[0].clientY;
        const deltaY = touchStartY - currentY;
        touchStartY = currentY;

        scrollTargetZ += -deltaY * SCROLL_SENSITIVITY * TOUCH_SCROLL_SENSITIVITY_MULT;
        scrollTargetZ = Math.max(getMinCameraZ(), Math.min(getMaxCameraZ(), scrollTargetZ));

        if (snapTimeout) clearTimeout(snapTimeout);
        snapTimeout = setTimeout(snapToNearestSection, isMobileViewport() ? 120 : SNAP_DELAY_MS);
    },
    { passive: true }
);
window.addEventListener('touchend', () => {
    touchStartY = null;
});

window.jumpToSection = jumpToSection = function (sectionIndex) {
    if (!experienceStarted) return;
    if (snapTimeout) clearTimeout(snapTimeout);
    goToSection(sectionIndex);
};

let mouseX = 0,
    mouseY = 0;
const mouse = new THREE.Vector2();
const raycaster = new THREE.Raycaster();

window.addEventListener('pointermove', (e) => {
    mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    mouse.x = mouseX;
    mouse.y = mouseY;
    updateContactLinksHover(e.clientX, e.clientY);
    updateProjectCardsHover(e.clientX, e.clientY);
    updateGalleryHoverFromPointer(e.clientX, e.clientY);
});

function updateContactLinksHover(clientX, clientY) {
    if (!infoCardObjects.contact) return;
    const links = infoCardObjects.contact.element.querySelectorAll('.info-card-links a');
    if (currentSectionIndex !== 3) {
        links.forEach((l) => l.classList.remove('js-hover'));
        return;
    }
    links.forEach((link) => {
        const r = link.getBoundingClientRect();
        const isOver =
            r.width > 0 &&
            clientX >= r.left &&
            clientX <= r.right &&
            clientY >= r.top &&
            clientY <= r.bottom;
        link.classList.toggle('js-hover', isOver);
    });
}

function handleContactLinksFallbackClick(e) {
    if (currentSectionIndex !== 3) return false;
    if (e.target.closest && e.target.closest('.info-card-links')) return false;

    const links = infoCardObjects.contact.element.querySelectorAll('.info-card-links a');
    for (const link of links) {
        const r = link.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        if (
            e.clientX >= r.left &&
            e.clientX <= r.right &&
            e.clientY >= r.top &&
            e.clientY <= r.bottom
        ) {
            const href = link.getAttribute('href');
            if (!href) continue;
            if (href.startsWith('mailto:')) {
                window.location.href = href;
            } else if (link.getAttribute('target') === '_blank') {
                window.open(href, '_blank', 'noopener');
            } else {
                window.location.href = href;
            }
            playSFX('click');
            return true;
        }
    }
    return false;
}

window.addEventListener('click', (e) => {
    if (!experienceStarted) return;

    // RESPALDO: si el clic no "aterrizo" en el div CSS3D de la card (por
    // ejemplo cayo sobre el <canvas> de fondo) y termina en el canvas
    // mientras la galeria esta abierta, se resuelve con un raycast contra
    // los planos invisibles (galleryHitMeshes) en vez de perder el clic.
    if (galleryOpen) {
        if (!canvas || e.target !== canvas) return;
        raycaster.setFromCamera(mouse, camera);
        const hits = raycaster.intersectObjects([galleryHitGroup], true);
        if (hits.length > 0) {
            let obj = hits[0].object;
            while (obj.parent && !obj.userData.type) {
                obj = obj.parent;
            }
            if (obj.userData && obj.userData.type === 'gallery-card') {
                if (obj.userData.index === galleryCenterIndex) {
                    openLightbox(galleryCategory, obj.userData.projectId);
                } else {
                    goToGalleryIndex(obj.userData.index);
                }
            }
        }
        return;
    }

    if (handleContactLinksFallbackClick(e)) return;

    if (!canvas || e.target !== canvas) return;
    if (currentSectionIndex !== 2) return;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects([projectCardsHitGroup], true);
    if (intersects.length > 0) {
        let obj = intersects[0].object;
        while (obj.parent && !obj.userData.type) {
            obj = obj.parent;
        }
        if (obj.userData && obj.userData.type === 'project-card') {
            openProjectsCategory(obj.userData.key);
            playSFX('open');
        }
    }
});

// ==========================================================================
// LIGHTBOX / PAGINA DE CASO — estilo Behance. Si el proyecto tiene
// "blocks" (texto, imagen, video, gif, grilla), renderiza esos bloques
// en el orden que los pusiste. Si NO tiene "blocks" (los proyectos viejos
// que solo tienen "gallery"), sigue mostrando el formato simple de antes
// — asi nada se rompe mientras vas migrando cada proyecto.
// ==========================================================================
function renderCaseBlock(block) {
    switch (block.type) {
        case 'text':
            return `<div class="case-block case-block-text"><p>${block.body}</p></div>`;
        case 'image':
            return `<div class="case-block case-block-image"><img src="${block.src}" alt="" loading="lazy" draggable="false"></div>`;
        case 'gif':
            return `<div class="case-block case-block-image case-block-gif"><span class="case-block-tag">GIF</span><img src="${block.src}" alt="" loading="lazy" draggable="false"></div>`;
        case 'video':
            return `<div class="case-block case-block-video"><video src="${block.src}"${block.poster ? ` poster="${block.poster}"` : ''} controls loop playsinline preload="metadata" muted></video></div>`;
        case 'embed':
            return `<div class="case-block case-block-embed"><div style="padding:${block.ratio || '56.25%'} 0 0 0;position:relative;"><iframe src="${block.src}" frameborder="0" allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media" style="position:absolute;top:0;left:0;width:100%;height:100%;" allowfullscreen loading="lazy" title="Video"></iframe></div><script src="https://player.vimeo.com/api/player.js"></script></div>`;
        case 'embed-txt': {
            const esc = (s: string) => s.replace(/"/g, '&quot;');
            return `<div class="case-block case-block-embed" data-embed-txt="${esc(block.src)}"><div style="padding:56.25% 0 0 0;position:relative;"><div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:#0a0a10;color:rgba(255,255,255,0.6);font-size:0.75rem;">Cargando video...</div></div></div>`;
        }
        case 'grid':
            return `<div class="case-block case-block-grid">${block.images.map((src) => `<img src="${src}" alt="" loading="lazy" draggable="false">`).join('')}</div>`;
        case 'video-row':
            return `<div class="case-block case-block-video-row">${(block.items || []).map((item) => {
                if (item.type === 'embed') return `<div class="video-row-item"><div style="padding:${item.ratio || '56.25%'} 0 0 0;position:relative;"><iframe src="${item.src}" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" style="position:absolute;top:0;left:0;width:100%;height:100%;" allowfullscreen loading="lazy"></iframe></div></div>`;
                if (item.type === 'embed-txt') return `<div class="video-row-item" data-embed-txt="${item.src.replace(/"/g, '&quot;')}"><div style="padding:56.25% 0 0 0;position:relative;"><div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:#0a0a10;color:rgba(255,255,255,0.6);font-size:0.75rem;">Cargando video...</div></div></div>`;
                if (item.type === 'video') return `<div class="video-row-item"><video src="${item.src}"${item.poster ? ` poster="${item.poster}"` : ''} controls loop playsinline preload="metadata" muted></video></div>`;
                if (item.type === 'image') return `<div class="video-row-item"><img src="${item.src}" alt="" loading="lazy"></div>`;
                return '';
            }).join('')}</div>`;
        default:
            return '';
    }
}
function renderCaseBlocks(blocks, project) {
    const tight = project && project.name === 'Tobey';
    const cls = tight ? 'case-blocks case-blocks--tight' : 'case-blocks';
    return `<div class="${cls}">${blocks.map(renderCaseBlock).join('')}</div>`;
}
async function hydrateEmbedTxtBlocks(container: HTMLElement) {
    const els = container.querySelectorAll('[data-embed-txt]');
    for (const el of Array.from(els) as HTMLElement[]) {
        const txtPath = el.getAttribute('data-embed-txt');
        if (!txtPath) continue;
        try {
            const res = await fetch(txtPath);
            if (!res.ok) throw new Error(String(res.status));
            const html = await res.text();
            // El txt contiene un div + iframe + script. Lo insertamos directo.
            el.innerHTML = html;
            // Si el html trajo un <script>, forzamos su ejecución
            const scripts = el.querySelectorAll('script');
            scripts.forEach((old) => {
                const s = document.createElement('script');
                if ((old as HTMLScriptElement).src) s.src = (old as HTMLScriptElement).src;
                else s.textContent = old.textContent;
                document.head.appendChild(s);
            });
        } catch (e) {
            console.warn('[embed-txt] fallo al cargar', txtPath, e);
            el.innerHTML = `<div style="padding:16px;background:#1a1a1a;color:#fff;font-size:0.75rem;">No se pudo cargar el video: ${txtPath}</div>`;
        }
    }
}

let lightboxEl = null;
let lightboxCloseBtn = null;

// El boton de cerrar (X) vive AFUERA de .lightbox-overlay (que es el que
// hace scroll), como elemento propio position:fixed en <body>. Antes
// estaba adentro del overlay que scrollea, y en varios navegadores de
// celular un position:fixed anidado dentro de un contenedor con
// overflow-y:auto termina "scrolleando" con el contenido en vez de
// quedarse pegado a la pantalla — por eso se movia. Asi queda siempre fijo.
function ensureLightboxCloseBtn() {
    if (lightboxCloseBtn) return;
    lightboxCloseBtn = document.createElement('button');
    lightboxCloseBtn.className = 'lightbox-close';
    lightboxCloseBtn.setAttribute('aria-label', 'Cerrar');
    lightboxCloseBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
    lightboxCloseBtn.addEventListener('click', () => closeLightbox());
    document.body.appendChild(lightboxCloseBtn);
}

window.openLightbox = openLightbox = function (cat, id) {
    const project = portfolioData[cat].projects.find((p) => p.id === id);
    if (!project) return;

    if (!lightboxEl) {
        lightboxEl = document.createElement('div');
        lightboxEl.id = 'lightbox-overlay';
        lightboxEl.className = 'lightbox-overlay';
        document.body.appendChild(lightboxEl);
        lightboxEl.addEventListener('click', (e) => {
            if (e.target === lightboxEl) closeLightbox();
        });
    }
    ensureLightboxCloseBtn();

    const bodyHTML = project.blocks
        ? renderCaseBlocks(project.blocks, project)
        : `<div class="lb-body"><p>${project.desc}</p></div><div class="lb-gallery">${project.gallery.map((src) => `<img src="${src}" alt="${project.name}" loading="lazy" draggable="false">`).join('')}</div>`;

    const isTight = project.name === 'Tobey';
    const heroHTML = isTight ? '' : `
            <div class="lb-hero">
                <img src="${project.img}" alt="${project.name}" draggable="false">
                <div class="lb-hero-caption">
                    <span class="lb-tag">Proyecto 0${project.id}</span>
                    <h3>${project.name}</h3>
                </div>
            </div>`;
    lightboxEl.innerHTML = `
        <div class="lb-landing ${isTight ? 'lb-landing--tight' : ''}">
            ${heroHTML}
            ${bodyHTML}
        </div>
    `;
    // Hidratar embeds que vienen de archivos .txt (verifica el doc siempre)
    hydrateEmbedTxtBlocks(lightboxEl);

    lightboxEl.classList.add('open');
    lightboxCloseBtn.classList.add('open');
    playSFX('open');
};

window.closeLightbox = closeLightbox = function () {
    if (lightboxEl) lightboxEl.classList.remove('open');
    if (lightboxCloseBtn) lightboxCloseBtn.classList.remove('open');
    playSFX('close');
};

window.goToBrandHome = function () {
    closeGallery();
    closeLightbox();
    jumpToSection(0);
};

const glowSlider = document.getElementById('glow-slider') as HTMLInputElement | null;
glowSlider?.addEventListener('input', (e) => {
    document.documentElement.style.setProperty('--card-glow', (e.target as HTMLInputElement).value);
});

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.fov = isMobileViewport() ? MOBILE_FOV : DESKTOP_FOV;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    if (composer) composer.setSize(window.innerWidth, window.innerHeight);
    css3dRenderer.setSize(window.innerWidth, window.innerHeight);
    if (particleMaterial)
        particleMaterial.uniforms.uPixelRatio.value = isMobileViewport()
            ? 1
            : Math.min(window.devicePixelRatio, 2);
    updateHeroLayout();
    applyResponsiveProjectCards();
    applyResponsiveInfoCards();
    if (galleryOpen) layoutGalleryCards();
    updateCategorySwitchVisibility();
    if (isMobileViewport()) clearProjectCardsHover();
    updateScrollHintVisibility();
    // Recrear fondo en resize para adaptar tamaño mobile/desktop
    if (scene.background && (scene.background as any).dispose) (scene.background as THREE.Texture).dispose();
    scene.background = createGalaxyBackgroundTexture();
});

// --- ANIMACIÓN ---
const clock = new THREE.Clock();
function animate() {
    requestAnimationFrame(animate);
    const delta = Math.min(clock.getDelta(), 1 / 30);
    const time = clock.getElapsedTime();

    if (starfield) starfield.rotation.y = time * 0.006;

    if (experienceStarted) {
        const mobileMode = isMobileViewport();
        const camLerp = mobileMode ? 0.09 : 0.05;
        camera.position.z += (scrollTargetZ - camera.position.z) * camLerp;

        const inGallery3D = galleryOpen;
        if (!hoveringContactCard) {
            const suppressParallax = inGallery3D && galleryArrowHovered;

            let targetX = 0;
            if (!suppressParallax) {
                const base = inGallery3D ? 2.2 : 1.2;
                targetX = mouseX * base * (mobileMode ? 0.7 : 1);
            }
            camera.position.x += (targetX - camera.position.x) * camLerp;

            const yInfluence = suppressParallax ? 0 : mobileMode ? 0.15 : inGallery3D ? 0.15 : 0.6;
            const baseY = inGallery3D ? GALLERY_OBJECT_Y : 2;
            camera.position.y += (baseY + mouseY * yInfluence - camera.position.y) * camLerp;
        }
        const lookAtY = inGallery3D ? GALLERY_OBJECT_Y : 1;
        camera.lookAt(camera.position.x * 0.3, lookAtY, camera.position.z - 8);

        logoGroup.rotation.y = time * 0.35;
        updateParticlePhysics(delta, time);

        heroTextObject.position.y = heroTextBaseY + Math.sin(time * 0.5) * 0.08;
        const heroAlpha = computeAlphaForDistance(
            camera.position.z,
            HERO_OBJECT_Z,
            HERO_FADE_FULL_DIST,
            HERO_FADE_ZERO_DIST
        );
        heroTextEl.style.opacity = heroAlpha.toFixed(3);
        logoGroup.position.y = heroLogoBaseY + Math.sin(time * 0.5) * 0.08;

        CARD_CATEGORIES.forEach((catSpec, i) => {
            const baseY = mobileMode ? 0.55 : 1;
            const bobY = baseY + Math.sin(time * 0.6 + i * 2) * 0.12;
            const obj = (window as any).cssCardGroups?.[catSpec.key];
            if (obj) {
                obj.position.y = bobY;
                const baseRotY = categoryCardBaseRotY[catSpec.key] || 0;
                obj.rotation.y = baseRotY + Math.sin(time * 0.35 + i) * 0.05;
            }
            const hitMesh = projectCardHitMeshes[catSpec.key];
            if (hitMesh) hitMesh.position.y = bobY;
        });

        const projAlpha = galleryOpen
            ? 0
            : computeAlphaForDistance(
                  camera.position.z,
                  PROJECTS_OBJECT_Z,
                  CARDS_FADE_FULL_DIST,
                  CARDS_FADE_ZERO_DIST
              );
        CARD_CATEGORIES.forEach((catSpec, i) => {
            const obj = (window as any).cssCardGroups?.[catSpec.key];
            if (!obj) return;
            // En movil las 3 se ven en modo mazo: la activa a pleno, las
            // otras dos mas atenuadas (asoman a los costados). En
            // escritorio se ven las 3 lado a lado a pleno, como siempre.
            let cardAlpha = projAlpha;
            if (mobileMode) {
                const n = CARD_CATEGORIES.length;
                let offset = i - categoryCenterIndex;
                if (offset > n / 2) offset -= n;
                if (offset < -n / 2) offset += n;
                cardAlpha = projAlpha * (offset === 0 ? 1 : CATEGORY_SIDE_ALPHA_MOBILE);
            }
            obj.element.style.opacity = cardAlpha.toFixed(3);
            obj.element.style.pointerEvents = cardAlpha < 0.04 ? 'none' : 'auto';
        });

        const aboutAlpha = computeAlphaForDistance(
            camera.position.z,
            ABOUT_OBJECT_Z,
            INFO_CARD_FADE_FULL_DIST,
            INFO_CARD_FADE_ZERO_DIST
        );
        const contactAlpha = computeAlphaForDistance(
            camera.position.z,
            CONTACT_OBJECT_Z,
            INFO_CARD_FADE_FULL_DIST,
            INFO_CARD_FADE_ZERO_DIST
        );
        updateInfoCardVisual('about', aboutAlpha);
        updateInfoCardVisual('contact', contactAlpha);

        const activeSection = SECTIONS[currentSectionIndex];
        const targetFocus = Math.abs(camera.position.z - activeSection.objectZ);
        currentFocusDistance += (targetFocus - currentFocusDistance) * DOF_FOCUS_SMOOTH;
        if (bokehPass) bokehPass.uniforms.focus.value = currentFocusDistance;
    }

    if (composer) {
        composer.render(delta);
    } else {
        renderer.render(scene, camera);
    }
    css3dRenderer.render(cssScene, camera);
}
animate();
