// 舊網址（alanis6v6.github.io）跳過來的人先看到的過場：space.grapefruit 總站的「潮點聚環」載入動畫，原樣搬來（原檔：總站 loader.js）。
//   ① 潮點聚集：散在畫面上的小點像潮水一樣聚成一圈，顏色在圈上流動，圈中央是載入百分比；
//      百分比跟著真的載入走（字型、圖片都到了才到 100），最多等 4 秒，最少 1.4 秒（太快會看不清楚）。
//   ② 到 100% 小點往外散開、淡掉，接著葡萄柚星球在中間落地、切開，停在剖半的那一格。
//   ③ 整片往上滑走，露出網站。
// 開了「減少動態效果」的人：只看靜止的剖半葡萄柚，載好就淡出。
// 跟總站唯一不一樣的地方：
//   · 圈中央原本只有百分比，這裡改成兩行：上面是輪播的波浪文字（五個詞隨機換、不連續重複），下面是百分比。
//   · 總站只在手機第一次開才播；這裡不看螢幕寬度、不看 sessionStorage——每頁 <head> 最前面的小腳本發現網址帶 ?from=gh
//     才會用同步方式載入這支（一般進站完全不會碰到它），同步載入是為了在畫面第一次畫出來之前就蓋上去，不會閃一下原本的頁面。
//   · 跑完用 history.replaceState 把網址上的 from=gh 拿掉。
//   · 日夜配色：總站的 --bg／--ink 兩組，這裡跟著系統的深色模式（prefers-color-scheme）。
(function () {
  var root = document.documentElement;
  if (document.getElementById('ri-loader')) return;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var WORDS = ['加載中', '精心打扮', '包袱款款', '喵喵喵叫', '即將抵達'];
  var WORD_MS = [600, 1000];          // 文字每隔多久換一個（隨機落在這個範圍）
  var WAVE_S = 1.2, WAVE_STEP = .12;  // 波浪一圈幾秒、相鄰兩字差多少秒

  var css = `/* 總站 style.css 的 .loader 原樣（改成 #ri-loader；常駐顯示、不看寬度） */
#ri-loader{--bg:oklch(97.5% 0.014 45);--ink:oklch(26% 0.045 335);--serif:"Noto Serif TC","Songti TC",serif;--latin:"Fraunces","Iowan Old Style",Georgia,serif;
  position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;background:var(--bg);color:var(--ink)}
@media (prefers-color-scheme:dark){#ri-loader{--bg:oklch(17% 0.012 15);--ink:oklch(94% 0.012 40)}}
#ri-loader canvas{position:absolute;inset:0;width:100%;height:100%}
#ri-loader .ld-num{grid-area:1/1;position:relative;display:grid;justify-items:center;gap:6px;font:900 30px/1.1 var(--serif);font-variant-numeric:tabular-nums;transition:opacity .45s,transform .45s}
#ri-loader .ld-word{display:flex;font:900 20px/1.3 var(--serif);letter-spacing:.04em;white-space:pre;min-height:1.3em}
#ri-loader .ld-word span{display:inline-block;animation:ri-wave 1.2s ease-in-out infinite}
@keyframes ri-wave{0%,100%{transform:translateY(2.5px)}50%{transform:translateY(-3.5px)}}
#ri-loader .ld-num.gone{opacity:0;transform:scale(.9)}
#ri-loader .ld-logo{grid-area:1/1;display:grid;justify-items:center;gap:8px;opacity:0;transform:translateY(-4%)}
#ri-loader .ld-logo .gf{width:128px;height:128px}
#ri-loader .ld-logo i{font:italic 600 19px var(--latin);opacity:0;transition:opacity .6s 1.2s}
#ri-loader.logo .ld-logo{opacity:1}
#ri-loader.logo .ld-logo i{opacity:1}
#ri-loader.still .ld-logo i{transition:none}
#ri-loader.out{animation:ri-out .85s cubic-bezier(.6,0,.2,1) forwards;pointer-events:none}
#ri-loader.still .ld-num{display:none}
@keyframes ri-out{to{transform:translateY(-100%)}}
@media (prefers-reduced-motion:reduce){#ri-loader.out{animation:ri-fade .4s forwards}@keyframes ri-fade{to{opacity:0}}#ri-loader .ld-word span{animation:none}}
html.ri-lock,html.ri-lock body{overflow:hidden}
#ri-loader .gf{--T:2.6s}
#ri-loader .gf{overflow:visible}
#ri-loader .gf *{transform-box:view-box}
#ri-loader .gf .face{transform-box:fill-box;transform-origin:50% 50%}
#ri-loader .gf .wedge{transform-origin:70px 80px;filter:drop-shadow(-1.5px -.5px 1.6px rgba(110,40,30,.35))}
#ri-loader .gf .shadow{opacity:.18;transform-origin:44px 90px}
#ri-loader .gf .wshadow{opacity:.16;transform-origin:70px 93px}
#ri-loader .gf .squash{transform-origin:50px 88px}
#ri-loader .gf .sphere,#ri-loader .gf .st,#ri-loader .gf .skin,#ri-loader .gf .wskin,#ri-loader .gf .dust{opacity:0}
#ri-loader .gf.anim .bounce{animation:ri-bounce var(--T) both}
#ri-loader .gf.anim .squash{animation:ri-squash var(--T) both}
#ri-loader .gf.anim .shadow{animation:ri-shadow var(--T) both}
#ri-loader .gf.anim .wshadow{animation:ri-wshadow var(--T) both}
#ri-loader .gf.anim .sphere{opacity:1}
#ri-loader .gf.anim .sphere .planet{animation:ri-sphere var(--T) both}
#ri-loader .gf.anim .halfL{animation:ri-halfL var(--T) both}
#ri-loader .gf.anim .face{animation:ri-face var(--T) both}
#ri-loader .gf.anim .wedge{animation:ri-wedge var(--T) both}
#ri-loader .gf.anim .skin,#ri-loader .gf.anim .wskin{animation:ri-skin var(--T) both}
#ri-loader .gf.anim .dust{animation:ri-dust var(--T) both}
#ri-loader .gf.anim .st{animation:ri-star var(--T) both}
@keyframes ri-bounce{
 0%{transform:translateY(-62px);animation-timing-function:cubic-bezier(.45,0,.9,.6)}
 24%{transform:translateY(0);animation-timing-function:cubic-bezier(.1,.4,.55,1)}
 40%{transform:translateY(-22px);animation-timing-function:cubic-bezier(.45,0,.9,.6)}
 54%{transform:translateY(0);animation-timing-function:cubic-bezier(.1,.4,.55,1)}
 60%{transform:translateY(-4px);animation-timing-function:cubic-bezier(.45,0,.9,.6)}
 65%,100%{transform:translateY(0)}}
@keyframes ri-squash{
 0%{transform:scale(1,1)}21%{transform:scale(.94,1.07)}24%{transform:scale(1.16,.8)}28%{transform:scale(.95,1.06)}33%{transform:scale(1,1)}
 52%{transform:scale(.97,1.03)}54%{transform:scale(1.06,.93)}58%,100%{transform:scale(1,1)}}
@keyframes ri-shadow{
 0%{transform:scale(.35);opacity:.05;animation-timing-function:cubic-bezier(.45,0,.9,.6)}
 24%{transform:scale(1.1);opacity:.25;animation-timing-function:cubic-bezier(.1,.4,.55,1)}
 40%{transform:scale(.72);opacity:.12;animation-timing-function:cubic-bezier(.45,0,.9,.6)}
 54%{transform:scale(1.04);opacity:.22}
 60%{transform:scale(.95);opacity:.2}
 65%,100%{transform:scale(1);opacity:.18}}
@keyframes ri-sphere{0%,25.9%{opacity:1}26%,100%{opacity:0}}
#ri-loader .gf .ringwrap>g{transform-origin:50px 54px}
#ri-loader .gf.anim .ringB,#ri-loader .gf.anim .ringF{animation:ri-ring var(--T) both}
@keyframes ri-ring{0%,23%{opacity:1;transform:scale(1)}24%{opacity:1;transform:scale(1.04)}30%,100%{opacity:0;transform:scale(1.45)}}
@keyframes ri-halfL{0%,25.9%{opacity:0}26%,100%{opacity:1}}
@keyframes ri-face{0%,26%{transform:scaleX(.05);animation-timing-function:cubic-bezier(.2,.8,.3,1)}46%,100%{transform:scaleX(1)}}
@keyframes ri-skin{0%,27%{opacity:1;animation-timing-function:cubic-bezier(.6,0,.4,1)}33%,100%{opacity:0}}
@keyframes ri-dust{0%,28%{opacity:0;transform:translate(0,0)}34%{opacity:1}52%,100%{opacity:0;transform:translate(var(--dx),var(--dy))}}
@keyframes ri-wedge{
 0%,25.9%{opacity:0;transform:translate(6px,-18px) rotate(-30deg) scale(.9)}
 26%{opacity:1;transform:translate(6px,-18px) rotate(-30deg) scale(.9);animation-timing-function:cubic-bezier(.1,.5,.5,1)}
 38%{transform:translate(22px,-36px) rotate(-70deg);animation-timing-function:cubic-bezier(.5,0,.9,.55)}
 52%{transform:translate(0,0) rotate(-8deg);animation-timing-function:cubic-bezier(.1,.4,.55,1)}
 57%{transform:translate(1px,-4px) rotate(3deg);animation-timing-function:cubic-bezier(.45,0,.9,.6)}
 62%,100%{opacity:1;transform:translate(0,0) rotate(0)}}
@keyframes ri-wshadow{0%,30%{opacity:0;transform:scale(.4)}52%{opacity:.2;transform:scale(1.05)}57%{opacity:.14;transform:scale(.9)}62%,100%{opacity:.16;transform:scale(1)}}
@keyframes ri-star{
 0%,23.9%{opacity:0;transform:translate(50px,88px) scale(0)}
 24%{opacity:1;transform:translate(50px,88px) scale(calc(var(--s) * .4));animation-timing-function:cubic-bezier(.15,.6,.45,1)}
 36%{opacity:1;transform:translate(calc(50px + var(--dx)),calc(88px + var(--dy))) scale(var(--s)) rotate(45deg);animation-timing-function:cubic-bezier(.55,0,.9,.55)}
 52%{opacity:0;transform:translate(calc(50px + var(--dx) * 1.5),96px) scale(calc(var(--s) * .5)) rotate(90deg)}
 100%{opacity:0;transform:translate(calc(50px + var(--dx) * 1.5),96px) scale(0)}}
@media (prefers-reduced-motion:reduce){#ri-loader .gf.anim *{animation:none!important}}`;
  var style = document.createElement('style');
  style.id = 'ri-loader-css';
  style.textContent = css;
  root.appendChild(style);

  // 宋體跟 Google 要這幾個詞和數字用到的字（跟其他頁一樣的作法），沒載到就用系統宋體；Fraunces 只要 space.grapefruit 那行
  var chars = {};
  (WORDS.join('') + '0123456789%').split('').forEach(function (c) { chars[c] = 1; });
  var fonts = document.createElement('link');
  fonts.rel = 'stylesheet';
  fonts.href = 'https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@900&family=Fraunces:ital,opsz,wght@1,9..144,600&display=swap&text=' +
    encodeURIComponent(Object.keys(chars).join('') + 'space.grapefruit');
  root.appendChild(fonts);

  var L = document.createElement('div');
  L.id = 'ri-loader';
  L.setAttribute('role', 'status');
  L.setAttribute('aria-label', '載入中');
  L.innerHTML = '<canvas></canvas><div class="ld-num"><div class="ld-word"></div><span class="ld-pct">0%</span></div>' +
    '<div class="ld-logo"><svg class="gf" viewBox="-6 -6 112 112" aria-hidden="true" focusable="false"><defs> <radialGradient id="gf-gFlesh" cx="45%" cy="40%" r="65%"><stop offset="0" stop-color="#ff7672"/><stop offset=".75" stop-color="#ec4a58"/><stop offset="1" stop-color="#dc4254"/></radialGradient> <radialGradient id="gf-gPith" cx="50%" cy="50%" r="50%"><stop offset=".82" stop-color="#ffe6dc"/><stop offset="1" stop-color="#fbd0b4"/></radialGradient> <radialGradient id="gf-gRind" cx="70%" cy="30%" r="90%"><stop offset="0" stop-color="#ffc774"/><stop offset=".55" stop-color="#f39a4e"/><stop offset="1" stop-color="#d9672f"/></radialGradient> <clipPath id="gf-cPlanet"><circle cx="50" cy="54" r="34"/></clipPath> <clipPath id="gf-cRingBack"><rect x="-20" y="-20" width="140" height="74"/></clipPath> <clipPath id="gf-cRingFront"><rect x="-20" y="54" width="140" height="80"/></clipPath> <radialGradient id="gf-gShade" cx="34%" cy="30%" r="78%"><stop offset="0" stop-color="#fff" stop-opacity=".28"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset=".78" stop-color="#140d33" stop-opacity=".25"/><stop offset="1" stop-color="#140d33" stop-opacity=".6"/></radialGradient> <pattern id="gf-pBands" patternUnits="userSpaceOnUse" width="80" height="24" patternTransform="rotate(-16)"><rect width="80" height="24" fill="#6a55b8"/><rect y="0" width="80" height="6" fill="#806ace"/><rect y="7" width="80" height="4" fill="#c4a3df" opacity=".7"/><rect y="12" width="80" height="4" fill="#5b47a5"/><rect y="17" width="80" height="5" fill="#dcb0d3" opacity=".55"/></pattern> <radialGradient id="gf-gPlanet" cx="32%" cy="30%" r="80%"><stop offset="0" stop-color="#9b86e0"/><stop offset=".55" stop-color="#4f3e93"/><stop offset="1" stop-color="#241c4e"/></radialGradient> <linearGradient id="gf-gWedge" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f2505d"/><stop offset="1" stop-color="#ff7a74"/></linearGradient> </defs><ellipse class="shadow" cx="44" cy="90" rx="26" ry="3.6" fill="#3a2a5a"/><ellipse class="wshadow" cx="70" cy="93" rx="22" ry="3" fill="#3a2a5a"/><g class="stars"><g class="st" style="--dx:-34px;--dy:-30px;--s:1.00;animation-delay:0.00s"><path d="M0 -4 L1.1 -1.1 4 0 1.1 1.1 0 4 -1.1 1.1 -4 0 -1.1 -1.1z" fill="#ffd66e" stroke="#fff" stroke-width=".5"/></g><g class="st" style="--dx:-22px;--dy:-42px;--s:0.80;animation-delay:0.01s"><path d="M0 -4 L1.1 -1.1 4 0 1.1 1.1 0 4 -1.1 1.1 -4 0 -1.1 -1.1z" fill="#ffd66e" stroke="#fff" stroke-width=".5"/></g><g class="st" style="--dx:-44px;--dy:-14px;--s:0.70;animation-delay:0.02s"><path d="M0 -4 L1.1 -1.1 4 0 1.1 1.1 0 4 -1.1 1.1 -4 0 -1.1 -1.1z" fill="#ffd66e" stroke="#fff" stroke-width=".5"/></g><g class="st" style="--dx:34px;--dy:-32px;--s:1.00;animation-delay:0.00s"><path d="M0 -4 L1.1 -1.1 4 0 1.1 1.1 0 4 -1.1 1.1 -4 0 -1.1 -1.1z" fill="#ffd66e" stroke="#fff" stroke-width=".5"/></g><g class="st" style="--dx:24px;--dy:-44px;--s:0.75;animation-delay:0.01s"><path d="M0 -4 L1.1 -1.1 4 0 1.1 1.1 0 4 -1.1 1.1 -4 0 -1.1 -1.1z" fill="#ffd66e" stroke="#fff" stroke-width=".5"/></g><g class="st" style="--dx:46px;--dy:-16px;--s:0.70;animation-delay:0.02s"><path d="M0 -4 L1.1 -1.1 4 0 1.1 1.1 0 4 -1.1 1.1 -4 0 -1.1 -1.1z" fill="#ffd66e" stroke="#fff" stroke-width=".5"/></g><g class="st" style="--dx:-10px;--dy:-50px;--s:0.60;animation-delay:0.03s"><path d="M0 -4 L1.1 -1.1 4 0 1.1 1.1 0 4 -1.1 1.1 -4 0 -1.1 -1.1z" fill="#ffd66e" stroke="#fff" stroke-width=".5"/></g><g class="st" style="--dx:12px;--dy:-48px;--s:0.65;animation-delay:0.03s"><path d="M0 -4 L1.1 -1.1 4 0 1.1 1.1 0 4 -1.1 1.1 -4 0 -1.1 -1.1z" fill="#ffd66e" stroke="#fff" stroke-width=".5"/></g></g><g class="bounce"><g class="squash"><g class="halfL"><g transform="translate(47 52) rotate(-14)"><path d="M0 -33 A33 33 0 0 0 0 33 Z" fill="url(#gf-gRind)"/><g class="skin"><path d="M0 -33 A33 33 0 0 0 0 33 Z" fill="url(#gf-pBands)"/><path d="M0 -33 A33 33 0 0 0 0 33 Z" fill="url(#gf-gShade)"/></g><g class="face"><g transform="scale(.74 1.1)"><circle r="30" fill="#f2944a"/><circle r="28.6" fill="url(#gf-gPith)"/><circle r="24.2" fill="url(#gf-gFlesh)"/><ellipse cx="-4.6" cy="9.1" rx="1.2" ry=".5" transform="rotate(116 -4.6 9.1)" fill="#d8394c" opacity=".55"/><ellipse cx="3.7" cy="-7.7" rx="1.3" ry=".5" transform="rotate(295 3.7 -7.7)" fill="#d8394c" opacity=".55"/><ellipse cx="-6.6" cy="-0.3" rx="1.6" ry=".5" transform="rotate(182 -6.6 -0.3)" fill="#ff8f86" opacity=".55"/><ellipse cx="1.0" cy="17.8" rx="2.0" ry=".5" transform="rotate(86 1.0 17.8)" fill="#ff8f86" opacity=".55"/><ellipse cx="8.5" cy="8.4" rx="1.8" ry=".5" transform="rotate(44 8.5 8.4)" fill="#d8394c" opacity=".55"/><ellipse cx="17.0" cy="7.0" rx="2.2" ry=".5" transform="rotate(22 17.0 7.0)" fill="#ff8f86" opacity=".55"/><ellipse cx="21.0" cy="6.3" rx="1.6" ry=".5" transform="rotate(16 21.0 6.3)" fill="#ff8f86" opacity=".55"/><ellipse cx="-17.5" cy="-4.6" rx="2.0" ry=".5" transform="rotate(194 -17.5 -4.6)" fill="#d8394c" opacity=".55"/><ellipse cx="7.7" cy="16.6" rx="1.4" ry=".5" transform="rotate(65 7.7 16.6)" fill="#d8394c" opacity=".55"/><ellipse cx="16.5" cy="11.6" rx="1.3" ry=".5" transform="rotate(35 16.5 11.6)" fill="#d8394c" opacity=".55"/><ellipse cx="5.4" cy="18.9" rx="2.0" ry=".5" transform="rotate(74 5.4 18.9)" fill="#ff8f86" opacity=".55"/><ellipse cx="-22.2" cy="4.9" rx="1.5" ry=".5" transform="rotate(167 -22.2 4.9)" fill="#ff8f86" opacity=".55"/><ellipse cx="5.5" cy="-19.2" rx="1.3" ry=".5" transform="rotate(285 5.5 -19.2)" fill="#ff8f86" opacity=".55"/><ellipse cx="-5.3" cy="16.1" rx="1.9" ry=".5" transform="rotate(108 -5.3 16.1)" fill="#ff8f86" opacity=".55"/><ellipse cx="-5.5" cy="22.7" rx="1.7" ry=".5" transform="rotate(103 -5.5 22.7)" fill="#ff8f86" opacity=".55"/><ellipse cx="7.3" cy="12.4" rx="1.6" ry=".5" transform="rotate(59 7.3 12.4)" fill="#ff8f86" opacity=".55"/><ellipse cx="7.8" cy="-1.9" rx="1.8" ry=".5" transform="rotate(346 7.8 -1.9)" fill="#d8394c" opacity=".55"/><ellipse cx="9.8" cy="-9.7" rx="1.6" ry=".5" transform="rotate(315 9.8 -9.7)" fill="#d8394c" opacity=".55"/><ellipse cx="-21.2" cy="0.4" rx="2.0" ry=".5" transform="rotate(178 -21.2 0.4)" fill="#ff8f86" opacity=".55"/><ellipse cx="15.6" cy="-5.7" rx="1.3" ry=".5" transform="rotate(340 15.6 -5.7)" fill="#d8394c" opacity=".55"/><ellipse cx="-1.6" cy="-13.6" rx="2.2" ry=".5" transform="rotate(263 -1.6 -13.6)" fill="#d8394c" opacity=".55"/><ellipse cx="5.8" cy="-11.9" rx="2.1" ry=".5" transform="rotate(295 5.8 -11.9)" fill="#ff8f86" opacity=".55"/><ellipse cx="-13.1" cy="18.8" rx="1.4" ry=".5" transform="rotate(124 -13.1 18.8)" fill="#ff8f86" opacity=".55"/><ellipse cx="5.5" cy="5.0" rx="1.3" ry=".5" transform="rotate(42 5.5 5.0)" fill="#ff8f86" opacity=".55"/><ellipse cx="0.2" cy="15.2" rx="1.3" ry=".5" transform="rotate(89 0.2 15.2)" fill="#ff8f86" opacity=".55"/><ellipse cx="-16.9" cy="5.6" rx="2.0" ry=".5" transform="rotate(161 -16.9 5.6)" fill="#ff8f86" opacity=".55"/><ellipse cx="8.6" cy="-9.9" rx="2.2" ry=".5" transform="rotate(311 8.6 -9.9)" fill="#ff8f86" opacity=".55"/><path d="M1.5 0.1 Q12.0 -0.2 24.2 1.1" fill="none" stroke="#ffd9d2" stroke-width="1" opacity=".85"/><path d="M1.3 0.7 Q11.5 3.5 21.2 11.7" fill="none" stroke="#ffd9d2" stroke-width="1" opacity=".85"/><path d="M0.7 1.3 Q5.0 10.9 11.9 21.1" fill="none" stroke="#ffd9d2" stroke-width="1" opacity=".85"/><path d="M-0.0 1.5 Q-2.3 11.8 -0.6 24.2" fill="none" stroke="#ffd9d2" stroke-width="1" opacity=".85"/><path d="M-0.9 1.2 Q-6.1 10.4 -14.4 19.4" fill="none" stroke="#ffd9d2" stroke-width="1" opacity=".85"/><path d="M-1.4 0.5 Q-11.3 4.2 -22.6 8.8" fill="none" stroke="#ffd9d2" stroke-width="1" opacity=".85"/><path d="M-1.4 -0.5 Q-11.7 -2.6 -23.0 -7.4" fill="none" stroke="#ffd9d2" stroke-width="1" opacity=".85"/><path d="M-1.1 -1.0 Q-7.0 -9.7 -17.4 -16.8" fill="none" stroke="#ffd9d2" stroke-width="1" opacity=".85"/><path d="M-0.1 -1.5 Q0.5 -12.0 -0.8 -24.2" fill="none" stroke="#ffd9d2" stroke-width="1" opacity=".85"/><path d="M0.7 -1.3 Q5.4 -10.7 11.3 -21.4" fill="none" stroke="#ffd9d2" stroke-width="1" opacity=".85"/><path d="M1.3 -0.7 Q11.6 -3.0 21.4 -11.2" fill="none" stroke="#ffd9d2" stroke-width="1" opacity=".85"/><polygon points="4.4,0.0 1.6,0.8 2.4,3.1 0.4,1.6 -0.9,4.0 -1.0,1.3 -3.2,1.5 -2.1,0.0 -3.6,-1.7 -0.9,-1.1 -1.0,-4.2 0.3,-1.4 2.6,-3.3 1.6,-0.8" fill="#fff4ec"/></g></g></g><circle class="dust" style="--dx:-6px;--dy:-14px;animation-delay:0.00s" cx="20" cy="40" r="1.3" fill="#d9ccff"/><circle class="dust" style="--dx:-10px;--dy:-6px;animation-delay:0.06s" cx="16" cy="58" r="1.3" fill="#d9ccff"/><circle class="dust" style="--dx:-4px;--dy:-16px;animation-delay:0.12s" cx="24" cy="74" r="1.3" fill="#d9ccff"/><circle class="dust" style="--dx:-8px;--dy:-10px;animation-delay:0.04s" cx="30" cy="28" r="1.3" fill="#d9ccff"/></g><g class="sphere"><g class="ringwrap" transform="rotate(-16 50 54)"><g class="ringB"><ellipse cx="50" cy="54" rx="56.0" ry="14.6" fill="none" stroke="#e9ddff" stroke-width="2.2" opacity="0.90" clip-path="url(#gf-cRingBack)"/><ellipse cx="50" cy="54" rx="52.5" ry="13.7" fill="none" stroke="#c7b3f2" stroke-width="3.2" opacity="0.95" clip-path="url(#gf-cRingBack)"/><ellipse cx="50" cy="54" rx="47.6" ry="12.4" fill="none" stroke="#f2e8ff" stroke-width="1.6" opacity="0.85" clip-path="url(#gf-cRingBack)"/><ellipse cx="50" cy="54" rx="45.0" ry="11.7" fill="none" stroke="#a993e0" stroke-width="2.0" opacity="0.90" clip-path="url(#gf-cRingBack)"/></g></g><g class="planet"><circle cx="50" cy="54" r="34" fill="#6a55b8"/><g clip-path="url(#gf-cPlanet)"><g transform="rotate(-16 50 54)"><path d="M10 24.0 Q50 18.7 90 24.0 L90 31.0 Q50 25.7 10 31.0 Z" fill="#8e78d8" opacity=".85"/><path d="M10 33.0 Q50 29.3 90 33.0 L90 38.0 Q50 34.3 10 38.0 Z" fill="#c9a8e8" opacity=".85"/><path d="M10 40.0 Q50 37.5 90 40.0 L90 44.0 Q50 41.5 10 44.0 Z" fill="#5c47a6" opacity=".85"/><path d="M10 47.0 Q50 45.8 90 47.0 L90 53.0 Q50 51.8 10 53.0 Z" fill="#e3b7d9" opacity=".85"/><path d="M10 55.0 Q50 55.2 90 55.0 L90 59.0 Q50 59.2 10 59.0 Z" fill="#7b63c4" opacity=".85"/><path d="M10 61.0 Q50 62.2 90 61.0 L90 68.0 Q50 69.2 10 68.0 Z" fill="#f0c2cf" opacity=".85"/><path d="M10 69.0 Q50 71.6 90 69.0 L90 73.0 Q50 75.6 10 73.0 Z" fill="#5a449f" opacity=".85"/><path d="M10 75.0 Q50 78.7 90 75.0 L90 81.0 Q50 84.7 10 81.0 Z" fill="#a68ade" opacity=".85"/><path d="M10 83.0 Q50 88.1 90 83.0 L90 91.0 Q50 96.1 10 91.0 Z" fill="#463585" opacity=".85"/><ellipse cx="60" cy="63" rx="6.5" ry="3.4" fill="#ef8fa8"/><ellipse cx="60" cy="63" rx="3.6" ry="1.7" fill="#f7b9c6"/></g><g transform="rotate(-16 50 54)"><ellipse cx="50" cy="54" rx="52" ry="13.5" fill="none" stroke="#2a1f55" stroke-width="3" opacity=".35" transform="translate(0 -4)"/></g></g><circle cx="50" cy="54" r="34" fill="url(#gf-gShade)"/><circle cx="50" cy="54" r="33.4" fill="none" stroke="#cdb8ff" stroke-width="1.2" opacity=".55"/></g><g class="ringwrap" transform="rotate(-16 50 54)"><g class="ringF"><ellipse cx="50" cy="54" rx="56.0" ry="14.6" fill="none" stroke="#e9ddff" stroke-width="2.2" opacity="0.90" clip-path="url(#gf-cRingFront)"/><ellipse cx="50" cy="54" rx="52.5" ry="13.7" fill="none" stroke="#c7b3f2" stroke-width="3.2" opacity="0.95" clip-path="url(#gf-cRingFront)"/><ellipse cx="50" cy="54" rx="47.6" ry="12.4" fill="none" stroke="#f2e8ff" stroke-width="1.6" opacity="0.85" clip-path="url(#gf-cRingFront)"/><ellipse cx="50" cy="54" rx="45.0" ry="11.7" fill="none" stroke="#a993e0" stroke-width="2.0" opacity="0.90" clip-path="url(#gf-cRingFront)"/></g></g></g></g></g><g class="wedge"><g transform="translate(70 74) rotate(-8) scale(.92)"><path d="M-34.0 0 Q0 -10.0 34.0 0 A34.0 26.0 0 0 1 -34.0 0 Z" transform="translate(1.8 2.4)" fill="#c95a2c"/><path d="M-34.0 0 Q0 -10.0 34.0 0 A34.0 26.0 0 0 1 -34.0 0 Z" fill="url(#gf-gRind)"/><path class="wskin" d="M-34.0 0 Q0 -10.0 34.0 0 A34.0 26.0 0 0 1 -34.0 0 Z" fill="url(#gf-pBands)"/><path d="M-31.6 0 Q0 -9.2 31.6 0 A31.6 22.8 0 0 1 -31.6 0 Z" fill="#ffe3d6"/><path d="M-28.8 0 Q0 -8.4 28.8 0 A28.8 19.2 0 0 1 -28.8 0 Z" fill="url(#gf-gWedge)"/><clipPath id="gf-cBoat"><path d="M-28.8 0 Q0 -8.4 28.8 0 A28.8 19.2 0 0 1 -28.8 0 Z"/></clipPath><g clip-path="url(#gf-cBoat)"><ellipse cx="-2.6" cy="8.0" rx="1.9" ry=".6" transform="rotate(98 -2.6 8.0)" fill="#d93a4c" opacity=".6"/><ellipse cx="19.2" cy="-1.3" rx="2.1" ry=".6" transform="rotate(24 19.2 -1.3)" fill="#d93a4c" opacity=".6"/><ellipse cx="15.8" cy="-3.6" rx="1.5" ry=".6" transform="rotate(21 15.8 -3.6)" fill="#ffb3aa" opacity=".6"/><ellipse cx="2.1" cy="16.3" rx="2.1" ry=".6" transform="rotate(85 2.1 16.3)" fill="#ff9a92" opacity=".6"/><ellipse cx="-5.6" cy="5.3" rx="2.1" ry=".6" transform="rotate(110 -5.6 5.3)" fill="#ff9a92" opacity=".6"/><ellipse cx="17.9" cy="-4.4" rx="1.5" ry=".6" transform="rotate(17 17.9 -4.4)" fill="#ff9a92" opacity=".6"/><ellipse cx="-13.9" cy="-5.2" rx="1.7" ry=".6" transform="rotate(161 -13.9 -5.2)" fill="#d93a4c" opacity=".6"/><ellipse cx="4.9" cy="-1.1" rx="2.1" ry=".6" transform="rotate(61 4.9 -1.1)" fill="#ff9a92" opacity=".6"/><ellipse cx="-0.0" cy="10.6" rx="2.2" ry=".6" transform="rotate(90 -0.0 10.6)" fill="#d93a4c" opacity=".6"/><ellipse cx="-5.0" cy="7.8" rx="2.2" ry=".6" transform="rotate(105 -5.0 7.8)" fill="#ff9a92" opacity=".6"/><ellipse cx="-10.0" cy="-0.3" rx="1.3" ry=".6" transform="rotate(135 -10.0 -0.3)" fill="#ffb3aa" opacity=".6"/><ellipse cx="3.4" cy="-3.3" rx="2.4" ry=".6" transform="rotate(63 3.4 -3.3)" fill="#ff9a92" opacity=".6"/><ellipse cx="-6.1" cy="18.0" rx="1.6" ry=".6" transform="rotate(102 -6.1 18.0)" fill="#ff9a92" opacity=".6"/><ellipse cx="23.1" cy="-4.7" rx="2.6" ry=".6" transform="rotate(12 23.1 -4.7)" fill="#d93a4c" opacity=".6"/><ellipse cx="-5.5" cy="-4.2" rx="2.3" ry=".6" transform="rotate(133 -5.5 -4.2)" fill="#ff9a92" opacity=".6"/><ellipse cx="-12.4" cy="-3.8" rx="1.3" ry=".6" transform="rotate(153 -12.4 -3.8)" fill="#ffb3aa" opacity=".6"/><ellipse cx="-4.9" cy="17.1" rx="1.6" ry=".6" transform="rotate(100 -4.9 17.1)" fill="#ff9a92" opacity=".6"/><ellipse cx="-21.5" cy="-4.5" rx="1.5" ry=".6" transform="rotate(165 -21.5 -4.5)" fill="#d93a4c" opacity=".6"/><ellipse cx="3.2" cy="5.2" rx="2.6" ry=".6" transform="rotate(78 3.2 5.2)" fill="#ff9a92" opacity=".6"/><ellipse cx="14.6" cy="4.5" rx="1.5" ry=".6" transform="rotate(44 14.6 4.5)" fill="#d93a4c" opacity=".6"/><ellipse cx="-4.3" cy="-0.7" rx="2.4" ry=".6" transform="rotate(114 -4.3 -0.7)" fill="#ffb3aa" opacity=".6"/><ellipse cx="25.6" cy="8.8" rx="1.6" ry=".6" transform="rotate(36 25.6 8.8)" fill="#ff9a92" opacity=".6"/><ellipse cx="-5.7" cy="15.4" rx="1.4" ry=".6" transform="rotate(102 -5.7 15.4)" fill="#ff9a92" opacity=".6"/><ellipse cx="-19.1" cy="5.0" rx="2.3" ry=".6" transform="rotate(141 -19.1 5.0)" fill="#ff9a92" opacity=".6"/><ellipse cx="-9.2" cy="1.4" rx="1.4" ry=".6" transform="rotate(128 -9.2 1.4)" fill="#ff9a92" opacity=".6"/><ellipse cx="-15.7" cy="9.9" rx="2.1" ry=".6" transform="rotate(128 -15.7 9.9)" fill="#ff9a92" opacity=".6"/><ellipse cx="-6.9" cy="5.3" rx="2.4" ry=".6" transform="rotate(114 -6.9 5.3)" fill="#d93a4c" opacity=".6"/><ellipse cx="-19.7" cy="3.7" rx="1.7" ry=".6" transform="rotate(145 -19.7 3.7)" fill="#ff9a92" opacity=".6"/><ellipse cx="-14.7" cy="9.3" rx="1.5" ry=".6" transform="rotate(127 -14.7 9.3)" fill="#ff9a92" opacity=".6"/><ellipse cx="7.0" cy="7.8" rx="2.4" ry=".6" transform="rotate(68 7.0 7.8)" fill="#d93a4c" opacity=".6"/><ellipse cx="5.6" cy="4.5" rx="1.4" ry=".6" transform="rotate(68 5.6 4.5)" fill="#ff9a92" opacity=".6"/><ellipse cx="0.7" cy="0.4" rx="1.6" ry=".6" transform="rotate(86 0.7 0.4)" fill="#d93a4c" opacity=".6"/><ellipse cx="17.5" cy="8.9" rx="2.0" ry=".6" transform="rotate(47 17.5 8.9)" fill="#ffb3aa" opacity=".6"/><ellipse cx="23.2" cy="18.4" rx="1.6" ry=".6" transform="rotate(50 23.2 18.4)" fill="#ff9a92" opacity=".6"/><ellipse cx="3.2" cy="15.3" rx="1.7" ry=".6" transform="rotate(82 3.2 15.3)" fill="#ff9a92" opacity=".6"/><ellipse cx="22.5" cy="-0.9" rx="1.4" ry=".6" transform="rotate(21 22.5 -0.9)" fill="#ff9a92" opacity=".6"/><circle cx="-3.9" cy="1.2" r=".55" fill="#fff" opacity=".8"/><circle cx="-19.9" cy="1.8" r=".55" fill="#fff" opacity=".8"/><circle cx="1.4" cy="13.5" r=".55" fill="#fff" opacity=".8"/><circle cx="-17.9" cy="-0.6" r=".55" fill="#fff" opacity=".8"/></g><path d="M-34.0 0 Q0 -10.0 34.0 0 A34.0 26.0 0 0 1 -34.0 0 Z" fill="none" stroke="#fff4ec" stroke-width=".9" opacity=".9"/></g></g></svg><i>space.grapefruit</i></div>';
  root.appendChild(L);
  root.classList.add('ri-lock');
  var planet = L.querySelector('.gf');

  // 真的載入進度：字型＋整頁（圖片）都好了才算好；最多 4 秒
  var ready = false, t0 = performance.now();
  var waits = [new Promise(function (r) { if (document.readyState === 'complete') r(); else addEventListener('load', r); })];
  if (document.fonts && document.fonts.ready) waits.push(document.fonts.ready);
  Promise.all(waits).then(function () { ready = true; }, function () { ready = true; });
  setTimeout(function () { ready = true; }, 4000);
  setTimeout(function () { cleanup(); }, 9000);   // 保險：不管發生什麼事，9 秒後一定放行

  var done = false, wordTimer = 0, last = -1;
  addEventListener('pageshow', function (e) { if (e.persisted) { finish(); cleanup(); } });   // 從上一頁快取回來：不要卡在半路
  addEventListener('resize', function () { if (!done) size(); });
  var cv = L.querySelector('canvas'), x = cv.getContext('2d'), num = L.querySelector('.ld-pct'), numBox = L.querySelector('.ld-num'), wordEl = L.querySelector('.ld-word');
  var W = 0, H = 0, R = 0, cx = 0, cy = 0, dots = [];
  var COLS = [[219, 62, 120], [236, 141, 96], [120, 64, 140]];   // 粉紅、蜜桃、梅紫
  function size() {
    var d = Math.min(2, window.devicePixelRatio || 1);
    W = L.clientWidth; H = L.clientHeight; cv.width = W * d; cv.height = H * d; x.setTransform(d, 0, 0, d, 0, 0);
    R = Math.min(W, H) * .27; cx = W / 2; cy = H / 2;
  }
  size();
  for (var i = 0; i < 240; i++) dots.push({ a: i / 240 * Math.PI * 2, x: Math.random() * W, y: Math.random() * H, s: .6 + Math.random() * 1.5, j: Math.random() * 6.28, ord: Math.random() });
  function mix(u) { u = (u % 1 + 1) % 1; var k = u * 3, i = Math.floor(k), f = k - i, A = COLS[i % 3], B = COLS[(i + 1) % 3]; return 'rgb(' + A.map(function (v, j) { return Math.round(v + (B[j] - v) * f); }) + ')'; }

  // 輪播文字：隨機挑，不連續重複；波浪的相位用全域時間算，換字時波不會斷掉
  function setWord() {
    var n;
    do { n = Math.floor(Math.random() * WORDS.length); } while (n === last);
    last = n;
    var phase = (performance.now() / 1000) % WAVE_S;
    wordEl.textContent = '';
    WORDS[n].split('').forEach(function (c, k) {
      var s = document.createElement('span');
      s.textContent = c;
      s.style.animationDelay = (k * WAVE_STEP - phase).toFixed(3) + 's';
      wordEl.appendChild(s);
    });
  }
  function nextWord() {
    setWord();
    wordTimer = setTimeout(nextWord, WORD_MS[0] + Math.random() * (WORD_MS[1] - WORD_MS[0]));
  }

  var p = 0, burstAt = 0, raf = 0;
  function frame(now) {
    raf = requestAnimationFrame(frame);
    var t = (now - t0) / 1000;
    // 還沒好：慢慢爬到 90%；好了而且過了 1.4 秒：衝到 100%
    var goal = ready && now - t0 > 1400 ? 1 : .9;
    p += (goal - p) * (goal === 1 ? .12 : .025);
    if (goal === 1 && p > .995) p = 1;
    num.textContent = Math.round(p * 100) + '%';
    x.clearRect(0, 0, W, H);
    var k = burstAt ? Math.min(1, (now - burstAt) / 700) : 0;
    dots.forEach(function (o) {
      var wob = Math.sin(t * 1.6 + o.j) * 3;
      if (burstAt) { o.x += (cx + Math.cos(o.a) * R * 2.4 - o.x) * .08; o.y += (cy + Math.sin(o.a) * R * 2.4 - o.y) * .08; x.globalAlpha = 1 - k; }
      else if (o.ord < p) { o.x += (cx + Math.cos(o.a) * (R + wob) - o.x) * .07; o.y += (cy + Math.sin(o.a) * (R + wob) - o.y) * .07; x.globalAlpha = .95; }
      else { o.x += Math.sin(t * .7 + o.j) * .25; o.y += Math.cos(t * .6 + o.j) * .25; x.globalAlpha = .35; }
      x.fillStyle = mix(o.a / 6.283 + t * .12); x.fillRect(o.x, o.y, o.s, o.s);
    });
    x.globalAlpha = 1;
    if (p === 1 && !burstAt) { burstAt = now; clearTimeout(wordTimer); numBox.classList.add('gone'); setTimeout(split, 450); }
    if (done) cancelAnimationFrame(raf);
    if (k >= 1) { cancelAnimationFrame(raf); x.clearRect(0, 0, W, H); }
  }
  // 星球落地、切開；停在剖半那一格，再整片往上滑走
  function split() {
    L.classList.add('logo');
    if (planet) { void planet.getBoundingClientRect(); planet.classList.add('anim'); }
    setTimeout(finish, 2900);
  }
  function stripMark() {
    try {
      var q = location.search.replace(/([?&])from=gh(&|$)/, function (m, a, b) { return b ? a : ''; });   // 只拿掉記號，?text= 這類別的參數原樣留著
      history.replaceState(history.state, '', location.pathname + q + location.hash);
    } catch (e) {}
  }
  function finish() {
    if (done) return; done = true; cancelAnimationFrame(raf); clearTimeout(wordTimer);
    stripMark();
    L.classList.add('out');
    root.classList.remove('ri-lock');
    setTimeout(cleanup, 900);
  }
  function cleanup() {
    done = true; cancelAnimationFrame(raf); clearTimeout(wordTimer);
    root.classList.remove('ri-lock');
    L.remove(); style.remove(); fonts.remove();
  }
  if (reduce) {                                            // 不動：直接顯示剖半的葡萄柚，載好就淡出
    L.classList.add('logo', 'still');
    var wait = function () { if (ready) finish(); else setTimeout(wait, 150); };
    wait();
    return;
  }
  nextWord();
  raf = requestAnimationFrame(frame);
})();
