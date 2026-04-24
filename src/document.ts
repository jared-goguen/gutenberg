import { esc } from "./blocks/types.js";
import { renderSidebar, type SiteNav } from "./site-nav.js";

// ── Showcase JS modules ───────────────────────────────────────
// Each module is self-contained, progressively enhanced (absent = no effect),
// and respects prefers-reduced-motion. Injected conditionally based on spec flags.

/**
 * Animated stat counters: numbers count up from 0 to data-target on scroll-in.
 * Uses IntersectionObserver + requestAnimationFrame. Duration adapts to value magnitude.
 * Falls back to static display without JS (numbers are already in the HTML).
 */
const COUNTER_SCRIPT = `<script>
(function(){
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var els=document.querySelectorAll('[data-counter]');
  if(!els.length) return;
  function animate(el){
    var raw=el.getAttribute('data-counter');
    var suffix=raw.replace(/^[\\d.]+/,'');
    var target=parseFloat(raw);
    if(isNaN(target)){el.textContent=raw;return;}
    var isInt=target===Math.floor(target);
    var dur=Math.min(1500,Math.max(800,target*10));
    var start=performance.now();
    function tick(now){
      var p=Math.min((now-start)/dur,1);
      var ease=1-Math.pow(1-p,3);
      var v=ease*target;
      el.textContent=(isInt?Math.round(v):v.toFixed(1))+suffix;
      if(p<1)requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  var io=new IntersectionObserver(function(es){
    es.forEach(function(e){
      if(e.isIntersecting){animate(e.target);io.unobserve(e.target);}
    });
  },{threshold:0.3});
  els.forEach(function(el){io.observe(el);});
})();
</script>`;

/**
 * Particles canvas: ambient floating letterforms in the hero area.
 * Three depth tiers (far / mid / near) with size, speed, and opacity scaled
 * to create parallax depth. Mouse proximity gently repels nearby letters.
 * Each glyph slowly breathes opacity. Serif font — movable type aesthetic.
 * Uses the scheme accent color. Canvas is absolutely positioned
 * inside .gb-hero[data-effect~="particles"].
 */
const PARTICLES_SCRIPT = `<script>
(function(){
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var c=document.querySelector('.gb-hero-particles');
  if(!c)return;
  var ctx=c.getContext('2d');
  if(!ctx)return;
  var accent=getComputedStyle(document.documentElement).getPropertyValue('--gb-accent').trim()||'rgb(225,114,37)';
  function resize(){c.width=c.offsetWidth;c.height=c.offsetHeight;N=computeParticleCount();initParticles();}
  resize();window.addEventListener('resize',resize);
  var mx=-9e3,my=-9e3;
  var hero=c.parentElement;
  hero.addEventListener('mousemove',function(e){var r=c.getBoundingClientRect();mx=e.clientX-r.left;my=e.clientY-r.top;});
  hero.addEventListener('mouseleave',function(){mx=-9e3;my=-9e3;});
  var gl=c.dataset.glyphs||'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz\u00A7\u00B6\u2020\u2021\u0026';
  var isEmoji=/\\p{Emoji_Presentation}/u.test(gl);
  
  /* Compute particle count based on viewport area and device capability. */
  function computeParticleCount(){
    var area=c.width*c.height;
    /* Scale: ~1 particle per 15k pixels. Mobile ~20, desktop ~65, 4K ~90. */
    var base=Math.max(20,Math.min(90,Math.round(area/15000)));
    /* Cap on low-end devices: halve if 2 or fewer CPU cores. */
    var cores=navigator.hardwareConcurrency||4;
    if(cores<=2)base=Math.ceil(base/2);
    return base;
  }
  
  var lt=[],N=computeParticleCount();
  function initParticles(){
    lt=[];
    for(var i=0;i<N;i++){
      var tier=i<Math.ceil(N*0.33)?0:i<Math.ceil(N*0.67)?1:2;
      var szB=[9,15,24][tier],szR=[5,10,14][tier];
      var spd=[0.35,0.65,1.0][tier];
      var aB=[0.03,0.07,0.12][tier],aR=[0.05,0.10,0.14][tier];
      var a0=Math.random()*aR+aB;
      lt.push({x:Math.random()*c.width,y:Math.random()*c.height,ch:gl[Math.floor(Math.random()*gl.length)],sz:Math.random()*szR+szB,vx:(Math.random()-0.5)*0.3*spd,vy:(-Math.random()*0.35-0.08)*spd,a0:a0,a:a0,rot:(Math.random()-0.5)*0.7,vr:(Math.random()-0.5)*0.002,ph:Math.random()*6.28,t:tier});
    }
  }
  initParticles();
  var t=0;
  function draw(){
    t+=0.016;
    ctx.clearRect(0,0,c.width,c.height);
    for(var i=0;i<N;i++){
      var d=lt[i];
      d.a=d.a0*(0.8+0.2*Math.sin(t*0.7+d.ph));
      if(mx>-9e2){
        var dx=d.x-mx,dy=d.y-my,dist=Math.sqrt(dx*dx+dy*dy);
        var rad=[60,100,140][d.t];
        if(dist<rad&&dist>0){
          var f=[0.25,0.5,0.9][d.t]*(1-dist/rad);
          d.x+=dx/dist*f;d.y+=dy/dist*f;
        }
      }
      d.x+=d.vx;d.y+=d.vy;d.rot+=d.vr;
      if(d.y<-50){d.y=c.height+50;d.x=Math.random()*c.width;}
      if(d.x<-50)d.x=c.width+50;if(d.x>c.width+50)d.x=-50;
      ctx.save();
      ctx.translate(d.x,d.y);
      ctx.rotate(d.rot);
      ctx.font=d.sz+'px '+(isEmoji?"'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif":'Georgia,Garamond,serif');
      if(!isEmoji)ctx.fillStyle=accent.replace('rgb','rgba').replace(')',','+d.a+')');
      ctx.globalAlpha=isEmoji?d.a*3:1;
      ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillText(d.ch,0,0);
      ctx.globalAlpha=1;
      ctx.restore();
    }
    requestAnimationFrame(draw);
  }
  draw();
})();
</script>`;

/**
 * Word/line reveal: text materializes progressively on scroll.
 * Wraps words/lines in spans with staggered animation delays.
 * Triggered by IntersectionObserver adding a reveal class.
 */
const REVEAL_SCRIPT = `<script>
(function(){
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.querySelectorAll('[data-reveal]').forEach(function(el){
    var mode=el.getAttribute('data-reveal');
    var html=el.innerHTML;
    if(mode==='words'){
      var i=0;
      el.innerHTML=html.replace(/(<[^>]+>)|([^<\\s]+)/g,function(m,tag,word){
        if(tag)return tag;
        return '<span class="gb-reveal-unit" style="animation-delay:'+(i++*0.04)+'s">'+word+'</span>';
      });
    }else if(mode==='lines'){
      var ps=el.querySelectorAll('p');
      ps.forEach(function(p,j){p.classList.add('gb-reveal-unit');p.style.animationDelay=j*0.12+'s';});
    }
  });
  var io=new IntersectionObserver(function(es){
    es.forEach(function(e){
      if(e.isIntersecting){e.target.classList.add('gb-revealing');io.unobserve(e.target);}
    });
  },{threshold:0.15});
  document.querySelectorAll('[data-reveal]').forEach(function(el){io.observe(el);});
})();
</script>`;

/**
 * Title stomp: typewriter effect via setTimeout sequence.
 * Letters start visible. JS hides them, then reveals each one in with
 * staggered delays. Cursor blinks using Web Animations API. If JS fails
 * or reduced-motion is on, text stays visible and cursor is hidden.
 */
const STOMP_SCRIPT = `<script>
(function(){
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var title=document.querySelector('.gb-hero[data-size="full"] .gb-hero-title');
  if(!title) return;
  var letters=title.querySelectorAll('.gb-hero-letter');
  if(!letters.length) return;
  var accent=getComputedStyle(document.documentElement).getPropertyValue('--gb-accent').trim()||'rgb(225,114,37)';
  var i,n=letters.length;

  /* Blinking cursor — absolute-positioned, advances with each letter */
  title.style.position='relative';
  var cur=document.createElement('span');
  cur.setAttribute('aria-hidden','true');
  cur.style.cssText='position:absolute;width:0.06em;background:'+accent+';top:0.08em;bottom:0.12em;pointer-events:none;transition:left 0.06s;';
  title.appendChild(cur);
  var blink=cur.animate([{opacity:1},{opacity:0}],{duration:530,iterations:Infinity,direction:'alternate'});

  /* Position cursor at left edge of first letter */
  var tRect=title.getBoundingClientRect();
  cur.style.left=(letters[0].getBoundingClientRect().left-tRect.left)+'px';

  /* Hide all letters */
  for(i=0;i<n;i++) letters[i].style.opacity='0';

  /* Type each letter in with duration budget: total 2.5s, initial 400ms, rest per-char */
  var totalBudget=2500,initialDelay=400;
  var perCharDelay=Math.max(40,Math.min(200,(totalBudget-initialDelay)/n));
  for(i=0;i<n;i++)(function(el,idx,delay){
    setTimeout(function(){
      el.style.opacity='';
      /* Solid cursor during typing, resumes blink after last letter */
      cur.style.opacity='1';
      blink.pause();
      var r=el.getBoundingClientRect();
      cur.style.left=(r.right-tRect.left+1)+'px';
      if(idx===n-1) setTimeout(function(){cur.style.opacity='';blink.play();},350);
    },delay);
  })(letters[i],i,initialDelay+i*perCharDelay);
})();
</script>`;

/**
 * Minimal JS for scroll-triggered entrance animations + nav active state.
 * Sets data-animate on body (CSS hides blocks only when this is present),
 * then IntersectionObserver reveals blocks as they enter the viewport.
 * A second observer tracks section labels and highlights the active nav link.
 * Respects prefers-reduced-motion — skips everything if set.
 */
const ENTRANCE_SCRIPT = `<script>
(function(){
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var blocks=document.querySelectorAll('.gb-block,.gb-closing');
  /* Snapshot blocks already in viewport before hiding (hash nav, back button, short pages) */
  var vh=window.innerHeight;var visible=[];
  blocks.forEach(function(b){var r=b.getBoundingClientRect();if(r.top<vh&&r.bottom>0)visible.push(b);});
  document.body.dataset.animate='';
  /* Immediately reveal pre-visible blocks — same JS task, no invisible paint frame */
  visible.forEach(function(b){b.classList.add('gb-visible');});
  var io=new IntersectionObserver(function(es){
    es.forEach(function(e){
      if(e.isIntersecting){e.target.classList.add('gb-visible');io.unobserve(e.target);}
    });
  },{threshold:0.08,rootMargin:'0px 0px -30px 0px'});
  blocks.forEach(function(b){if(!b.classList.contains('gb-visible'))io.observe(b);});

  /* Nav active state: track sections + headings */
  var nav=document.querySelector('.gb-page-nav');
  var trackable=document.querySelectorAll('.gb-section-label[id],.gb-heading[id]');
  if(!trackable.length) return;
  /* Build heading→section map by DOM order */
  var sMap={};var cSec=null;
  trackable.forEach(function(el){
    if(el.classList.contains('gb-section-label')){cSec=el.id;}
    else if(cSec){sMap[el.id]=cSec;}
  });
  var nio=new IntersectionObserver(function(es){
    es.forEach(function(e){
      if(!e.isIntersecting) return;
      var id=e.target.id;
      var secId=sMap[id]||id;
      /* Page nav pills */
      if(nav)nav.querySelectorAll('.gb-page-nav-link').forEach(function(a){
        var h=a.getAttribute('href').slice(1);
        var isActive=h===id;
        a.classList.toggle('gb-nav-active',isActive);
        if(isActive)a.setAttribute('aria-current','true');else a.removeAttribute('aria-current');
        a.classList.toggle('gb-nav-section-active',h===secId&&id!==secId);
      });
      /* Silent hash sync — gated by data-hash-sync on body */
      if(id&&history.replaceState&&document.body.dataset.hashSync!==undefined){
        history.replaceState(null,'','#'+id);
      }
    });
  },{threshold:0.3,rootMargin:'-10% 0px -60% 0px'});
  trackable.forEach(function(l){nio.observe(l);});
})();
</script>`;

/**
 * Inline SVG favicon — theme-specific icon using the accent color.
 * Each stylesheet gets a distinct shape that reflects its design philosophy.
 * Encoded as a data URI so no external file is needed.
 */
function faviconTag(accent: string, stylesheet?: string): string {
  const svg = faviconSvg(accent, stylesheet);
  const encoded = Buffer.from(svg).toString("base64");
  return `<link rel="icon" type="image/svg+xml" href="data:image/svg+xml;base64,${encoded}">`;
}

function faviconSvg(accent: string, stylesheet?: string): string {
  const ns = `xmlns="http://www.w3.org/2000/svg"`;
  switch (stylesheet) {
    // Ink: single dot — a drop of ink on paper. Minimalist monograph mark.
    case "ink":
      return `<svg ${ns} viewBox="0 0 32 32"><circle cx="16" cy="16" r="10" fill="${accent}"/></svg>`;

    // Wire: crosshair — precision targeting, engineering schematic reference point.
    case "wire":
      return `<svg ${ns} viewBox="0 0 32 32">
<line x1="16" y1="4" x2="16" y2="28" stroke="${accent}" stroke-width="1.5"/>
<line x1="4" y1="16" x2="28" y2="16" stroke="${accent}" stroke-width="1.5"/>
<circle cx="16" cy="16" r="6" fill="none" stroke="${accent}" stroke-width="1.5"/>
<circle cx="16" cy="16" r="2" fill="${accent}"/>
</svg>`;

    // Mono: solid square — brutalist, geometric, no curves. The grid cell.
    case "mono":
      return `<svg ${ns} viewBox="0 0 32 32"><rect x="4" y="4" width="24" height="24" fill="${accent}"/></svg>`;

    // Classic (cloudflare, reactor, default): network topology — three connected nodes.
    default:
      return `<svg ${ns} viewBox="0 0 32 32">
<line x1="8" y1="24" x2="24" y2="24" stroke="${accent}" stroke-width="2" opacity="0.5"/>
<line x1="8" y1="24" x2="16" y2="8" stroke="${accent}" stroke-width="2" opacity="0.5"/>
<line x1="24" y1="24" x2="16" y2="8" stroke="${accent}" stroke-width="2" opacity="0.5"/>
<circle cx="16" cy="8" r="5" fill="${accent}"/>
<circle cx="8" cy="24" r="5" fill="${accent}"/>
<circle cx="24" cy="24" r="5" fill="${accent}"/>
</svg>`;
  }
}

export interface DocumentOptions {
  title: string;
  stylesheet: string;
  body: string;
  density: string;
  separation: string;
  emphasis: string;
  shadow: string;
  /** Optional description for OG meta tags */
  description?: string;
  /** Optional canonical URL */
  url?: string;
  /** Accent color for the favicon. If set, an inline SVG favicon is generated. */
  accentColor?: string;
  /** Stylesheet name — used to select the theme-specific favicon shape. */
  faviconStyle?: string;

  /** Enable subtle film-grain noise texture over the page. CSS-only via SVG feTurbulence. */
  texture?: boolean;
  /** Whether particles JS is needed. */
  heroParticles?: boolean;
  /** Pre-rendered full-viewport hero HTML. Renders before the layout grid. */
  heroHtml?: string;
  /** Site navigation tree — when present, renders a sidebar with grid layout. */
  siteNav?: SiteNav;
  /** URL path of the current page. Drives sidebar active state. */
  currentPath?: string;
  /** Pre-rendered prev/next page footer. */
  pageFooterHtml?: string;
  /** Pre-rendered breadcrumb trail HTML. */
  breadcrumbsHtml?: string;
  /** JSON-LD structured data for breadcrumbs. */
  breadcrumbsJsonLd?: string;
  /** Enable view transitions (cross-page morphing). Default: hasSidebar. */
  viewTransitions?: boolean;
  /** Enable reading progress bar. Default: true. */
  progressBar?: boolean;
  /** Enable hash sync in scroll spy. Default: true. */
  hashSync?: boolean;
  /** External font stylesheet URL (e.g. Google Fonts). Injected as <link> in head. */
  fontUrl?: string;
  /** Enable edit mode — wraps body in <form>, adds submit button, injects edit CSS. */
  editMode?: boolean;
  /** URL for an "Edit" link rendered as a floating button. Shown in view mode only (not edit mode). */
  editLink?: string;
}

/**
 * Edit-mode CSS. Injected when editMode is true.
 *
 * Design: inputs inherit ALL visual styling from their parent block class
 * (font, size, color, weight). A subtle dashed border signals editability.
 * Focus state uses the accent color. The submit button floats fixed.
 */
const EDIT_CSS = `
/* ── Edit mode ────────────────────────────────────────────── */
body[data-edit-mode] .gb-edit-field {
  background: color-mix(in srgb, currentColor 4%, transparent);
  border: 1.5px dashed color-mix(in srgb, currentColor 40%, transparent);
  border-radius: 2px;
  color: inherit;
  font: inherit;
  font-size: inherit;
  font-weight: inherit;
  letter-spacing: inherit;
  text-transform: inherit;
  line-height: inherit;
  width: 100%;
  box-sizing: border-box;
  padding: 0.25em 0.4em;
  margin: 0;
  transition: border-color 0.2s, box-shadow 0.2s;
  resize: none;
}
body[data-edit-mode] .gb-edit-field::placeholder {
  color: color-mix(in srgb, currentColor 30%, transparent);
}
body[data-edit-mode] .gb-edit-field:hover {
  border-color: color-mix(in srgb, currentColor 55%, transparent);
}
body[data-edit-mode] .gb-edit-field:focus {
  border-color: var(--gb-accent);
  outline: none;
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--gb-accent) 30%, transparent);
}
body[data-edit-mode] .gb-edit-textarea {
  min-height: 12em;
  resize: vertical;
  font-family: var(--gb-font-mono, 'SF Mono', 'Fira Code', monospace);
  font-size: 0.875em;
  line-height: 1.6;
  white-space: pre-wrap;
}
body[data-edit-mode] .gb-edit-cell {
  width: 100%;
  text-align: inherit;
  padding: 0.4em 0.6em;
}
/* Hero title input matches the display h1 */
body[data-edit-mode] input.gb-hero-title {
  font-size: inherit;
  font-weight: inherit;
  line-height: inherit;
}
/* Submit button — floating, persistent */
body[data-edit-mode] .gb-edit-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 2rem;
  background: color-mix(in srgb, var(--gb-surface, #0a0a0a) 92%, transparent);
  backdrop-filter: blur(12px);
  border-top: 1px solid color-mix(in srgb, currentColor 10%, transparent);
  z-index: 100;
}
body[data-edit-mode] .gb-edit-bar .gb-edit-status {
  font-size: 0.8125rem;
  color: color-mix(in srgb, currentColor 50%, transparent);
  margin-right: auto;
}
body[data-edit-mode] .gb-edit-submit {
  padding: 0.5rem 1.75rem;
  background: var(--gb-accent);
  color: var(--gb-surface, #0a0a0a);
  border: none;
  border-radius: 4px;
  font: 600 0.875rem/1.4 var(--gb-font-body, system-ui);
  cursor: pointer;
  transition: opacity 0.15s;
}
body[data-edit-mode] .gb-edit-submit:hover {
  opacity: 0.9;
}
/* Give body bottom padding to avoid content hidden behind the edit bar */
body[data-edit-mode] {
  padding-bottom: 4rem;
}

/* ── Tracker edit: rating number input ────────────────────── */
.gb-tracker-input-rating {
  background: transparent;
  border: none;
  border-bottom: 2px solid color-mix(in srgb, var(--tracker-accent) 40%, transparent);
  color: var(--tracker-accent);
  font-size: 2.75rem;
  font-weight: 800;
  line-height: 1;
  text-align: center;
  width: 3ch;
  padding: 0;
  outline: none;
  opacity: calc(0.5 + var(--tracker-intensity, 0) * 0.5);
  -moz-appearance: textfield;
}
.gb-tracker-input-rating::-webkit-inner-spin-button,
.gb-tracker-input-rating::-webkit-outer-spin-button { display: none; }
.gb-tracker-input-rating:focus {
  border-bottom-color: var(--tracker-accent);
  opacity: 1;
}
@media (max-width: 600px) {
  .gb-tracker-input-rating { font-size: 2rem; }
}

/* ── Tracker edit: toggle checkbox as pill ─────────────────── */
.gb-tracker-toggle-switch {
  cursor: pointer;
  user-select: none;
}
.gb-tracker-toggle-switch input[type="checkbox"] {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}
.gb-tracker-toggle-switch .gb-tracker-pill {
  cursor: pointer;
}
.gb-tracker-toggle-switch:hover .gb-tracker-pill {
  box-shadow: 0 0 16px color-mix(in srgb, var(--tracker-accent) 25%, transparent);
}

/* ── Tracker edit: text input ──────────────────────────────── */
.gb-tracker-input-text {
  background: color-mix(in srgb, currentColor 4%, transparent);
  border: 1.5px dashed color-mix(in srgb, currentColor 35%, transparent);
  border-radius: 4px;
  color: inherit;
  font-size: 1.25rem;
  font-weight: 500;
  text-align: center;
  width: 100%;
  max-width: 10rem;
  padding: 0.3em 0.5em;
  outline: none;
  transition: border-color 0.2s;
}
.gb-tracker-input-text:focus {
  border-color: var(--gb-accent);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--gb-accent) 25%, transparent);
}
`;

/** Toggle script — updates pill text and data-active when checkbox changes. Edit mode only. */
const TOGGLE_SCRIPT = `<script>
(function(){
  document.querySelectorAll('.gb-tracker-toggle-switch input[type="checkbox"]').forEach(function(cb){
    cb.addEventListener('change',function(){
      var pill=cb.parentElement.querySelector('.gb-tracker-pill');
      var item=cb.closest('.gb-tracker-toggle');
      pill.textContent=cb.checked?'Yes':'No';
      item.dataset.active=String(cb.checked);
    });
  });
})();
</script>`;

/** Edit link CSS — floating "Edit" button in view mode. */
const EDIT_LINK_CSS = `
.gb-edit-link {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  padding: 0.5rem 1.5rem;
  background: var(--gb-accent);
  color: var(--gb-surface, #0a0a0a);
  text-decoration: none;
  border-radius: 4px;
  font: 600 0.8125rem/1.4 var(--gb-font-body, system-ui);
  letter-spacing: 0.03em;
  text-transform: uppercase;
  box-shadow: 0 4px 12px rgba(0,0,0,0.4);
  z-index: 100;
  transition: opacity 0.15s, transform 0.15s;
}
.gb-edit-link:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}
`;

export function wrapDocument(opts: DocumentOptions): string {
  const ogTags: string[] = [];
  ogTags.push(`<meta property="og:title" content="${esc(opts.title)}">`);
  if (opts.description) {
    ogTags.push(`<meta name="description" content="${esc(opts.description)}">`);
    ogTags.push(`<meta property="og:description" content="${esc(opts.description)}">`);
  }
  ogTags.push(`<meta property="og:type" content="website">`);
  if (opts.url) {
    ogTags.push(`<meta property="og:url" content="${esc(opts.url)}">`);
  }

  const favicon = opts.accentColor ? faviconTag(opts.accentColor, opts.faviconStyle) : "";

  // Collect showcase scripts based on page features
  const showcaseScripts: string[] = [];

  if (opts.heroParticles) showcaseScripts.push(PARTICLES_SCRIPT);
  // Stomp script: triggers letter animation on full-size hero titles
  showcaseScripts.push(STOMP_SCRIPT);
  // Counter script is always included — activates only if data-counter elements exist
  showcaseScripts.push(COUNTER_SCRIPT);
  // Reveal script is always included — activates only if data-reveal elements exist
  showcaseScripts.push(REVEAL_SCRIPT);

  // Layout: sidebar grid or single-column
  const hasSidebar = !!(opts.siteNav && opts.currentPath);
  const layoutAttr = hasSidebar ? ' data-layout="sidebar"' : '';
  const sidebarHtml = hasSidebar
    ? renderSidebar(opts.siteNav!, opts.currentPath!)
    : "";

  // Full hero renders before the layout grid (viewport takeover)
  const heroPrefix = opts.heroHtml ? `${opts.heroHtml}\n` : "";

  // Noise texture: inline SVG filter definition + CSS ::after overlay
  const textureAttr = opts.texture ? ' data-texture' : '';
  const textureSvg = opts.texture
    ? `<svg class="gb-texture-defs" aria-hidden="true"><filter id="gb-noise"><feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter><rect width="100%" height="100%" filter="url(#gb-noise)"/></svg>\n`
    : '';

  // Breadcrumbs: injected at the top of the content area (below hero, above blocks)
  const breadcrumbBlock = opts.breadcrumbsHtml ?? "";

  // Page footer: prev/next links at the bottom of the content area
  const footerBlock = opts.pageFooterHtml ? `\n${opts.pageFooterHtml}` : "";

  const bodyContent = hasSidebar
    ? `${textureSvg}${heroPrefix}<div id="content" class="gb-layout">\n${sidebarHtml}\n<div class="gb-content">\n${breadcrumbBlock}\n${opts.body}${footerBlock}\n</div>\n</div>`
    : `${textureSvg}${heroPrefix}<div id="content"></div>\n${breadcrumbBlock}\n${opts.body}${footerBlock}`;

  // View Transitions API: cross-page morphing for same-origin navigation
  const viewTransitionMeta = (opts.viewTransitions ?? hasSidebar)
    ? `<meta name="view-transition" content="same-origin">`
    : "";

  // JSON-LD breadcrumb structured data
  const jsonLd = opts.breadcrumbsJsonLd ?? "";

  // Reading progress bar (CSS scroll-driven animation)
  const progressBar = (opts.progressBar ?? true)
    ? `<div class="gb-progress-bar" aria-hidden="true"></div>`
    : "";

  // Edit mode: add data attribute, form wrapper, edit bar, and edit CSS
  const editAttr = opts.editMode ? ' data-edit-mode' : '';
  const editCss = opts.editMode ? EDIT_CSS : '';
  const editFormOpen = opts.editMode ? '<form method="POST" class="gb-edit-form">' : '';
  const editFormClose = opts.editMode
    ? `<div class="gb-edit-bar"><span class="gb-edit-status">Editing</span><button type="submit" class="gb-edit-submit">Save</button></div></form>`
    : '';

  // View-mode edit link: floating button to switch to edit mode
  const editLinkHtml = (!opts.editMode && opts.editLink)
    ? `<a class="gb-edit-link" href="${esc(opts.editLink)}">Edit</a>`
    : '';
  const editLinkCss = (!opts.editMode && opts.editLink) ? EDIT_LINK_CSS : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
${viewTransitionMeta}
<title>${esc(opts.title)}</title>
${ogTags.join("\n")}
${favicon}
${opts.fontUrl ? `<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n<link href="${opts.fontUrl}" rel="stylesheet">` : ''}
${jsonLd}
<style>
${opts.stylesheet}
${editCss}
${editLinkCss}
</style>
</head>
<body data-density="${opts.density}" data-separation="${opts.separation}" data-emphasis="${opts.emphasis}" data-shadow="${opts.shadow}"${layoutAttr}${textureAttr}${(opts.hashSync ?? true) ? ' data-hash-sync' : ''}${editAttr}>
${progressBar}
${editFormOpen}
${bodyContent}
${editFormClose}
${editLinkHtml}
${opts.editMode ? TOGGLE_SCRIPT : ''}
${ENTRANCE_SCRIPT}
${showcaseScripts.join("\n")}
</body>
</html>`;
}
