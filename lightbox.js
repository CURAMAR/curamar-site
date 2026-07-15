/* lightbox.js — スクショをクリックで拡大表示（サイト共通・単一ソース）2026-07-15
 *
 * 対象: assets/shots/ 配下の画像（.shots / .qshots / .fshots の figure 内）。
 * 依存なし・自己完結（CSSもJSで注入）。各ページで <script src="/lightbox.js" defer> するだけ。
 * 操作: 画像クリックで拡大／背景クリック・×ボタン・Esc で閉じる。
 * アクセシビリティ: role=dialog / aria-modal、開いた画像へフォーカス復帰、body スクロール抑止。
 */
(function () {
  'use strict';
  if (window.__scLightbox) return;      // 二重初期化ガード
  window.__scLightbox = true;

  var STYLE = [
    '.sc-lb-zoom{cursor:zoom-in}',
    '.sc-lb-ov{position:fixed;inset:0;z-index:9999;display:flex;flex-direction:column;',
    '  align-items:center;justify-content:center;gap:14px;padding:24px;box-sizing:border-box;',
    '  background:rgba(6,9,13,.92);backdrop-filter:blur(4px);opacity:0;transition:opacity .18s ease}',
    '.sc-lb-ov.on{opacity:1}',
    '.sc-lb-img{max-width:min(1600px,94vw);max-height:86vh;width:auto;height:auto;',
    '  border-radius:10px;box-shadow:0 18px 60px rgba(0,0,0,.6);',
    '  transform:scale(.97);transition:transform .18s ease;background:#0b0e12}',
    '.sc-lb-ov.on .sc-lb-img{transform:scale(1)}',
    '.sc-lb-cap{max-width:min(1600px,94vw);color:#e8eef5;font-size:13.5px;line-height:1.6;',
    '  text-align:center;text-shadow:0 1px 2px rgba(0,0,0,.5)}',
    '.sc-lb-cap strong{color:#fff}',
    '.sc-lb-close{position:fixed;top:14px;right:16px;width:42px;height:42px;border:0;cursor:pointer;',
    '  border-radius:50%;background:rgba(255,255,255,.12);color:#fff;font-size:22px;line-height:1;',
    '  display:flex;align-items:center;justify-content:center;transition:background .15s}',
    '.sc-lb-close:hover{background:rgba(255,255,255,.24)}',
    '.sc-lb-hint{position:fixed;bottom:14px;left:0;right:0;text-align:center;color:#9fb0c0;font-size:11.5px}',
    '@media(max-width:560px){.sc-lb-img{max-height:78vh}.sc-lb-hint{display:none}}'
  ].join('');

  function injectStyle() {
    var s = document.createElement('style');
    s.textContent = STYLE;
    document.head.appendChild(s);
  }

  var ov, imgEl, capEl, lastFocus = null;

  function build() {
    ov = document.createElement('div');
    ov.className = 'sc-lb-ov';
    ov.setAttribute('role', 'dialog');
    ov.setAttribute('aria-modal', 'true');
    ov.setAttribute('aria-label', '拡大画像');

    var close = document.createElement('button');
    close.className = 'sc-lb-close';
    close.type = 'button';
    close.setAttribute('aria-label', '閉じる');
    close.innerHTML = '&times;';

    imgEl = document.createElement('img');
    imgEl.className = 'sc-lb-img';
    imgEl.alt = '';

    capEl = document.createElement('div');
    capEl.className = 'sc-lb-cap';

    var hint = document.createElement('div');
    hint.className = 'sc-lb-hint';
    hint.textContent = 'クリックまたは Esc で閉じる';

    ov.appendChild(close);
    ov.appendChild(imgEl);
    ov.appendChild(capEl);
    ov.appendChild(hint);
    document.body.appendChild(ov);

    // 背景クリックで閉じる（画像・キャプション自体のクリックは無視）
    ov.addEventListener('click', function (e) {
      if (e.target === imgEl || e.target === capEl) return;
      closeLb();
    });
    close.addEventListener('click', closeLb);
    document.addEventListener('keydown', function (e) {
      if (ov.classList.contains('on') && (e.key === 'Escape' || e.key === 'Esc')) closeLb();
    });
  }

  function openLb(src, alt, captionHtml, trigger) {
    if (!ov) build();
    lastFocus = trigger || null;
    imgEl.src = src;
    imgEl.alt = alt || '';
    if (captionHtml) { capEl.innerHTML = captionHtml; capEl.style.display = ''; }
    else { capEl.textContent = ''; capEl.style.display = 'none'; }
    document.body.style.overflow = 'hidden';
    ov.style.display = 'flex';
    // reflow → トランジション発火
    void ov.offsetWidth;
    ov.classList.add('on');
    ov.querySelector('.sc-lb-close').focus();
  }

  function closeLb() {
    if (!ov) return;
    ov.classList.remove('on');
    document.body.style.overflow = '';
    setTimeout(function () { ov.style.display = 'none'; imgEl.src = ''; }, 180);
    if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
  }

  function enhance() {
    injectStyle();
    var imgs = document.querySelectorAll('img[src*="assets/shots/"]');
    Array.prototype.forEach.call(imgs, function (img) {
      if (img.dataset.scLb) return;
      img.dataset.scLb = '1';
      img.classList.add('sc-lb-zoom');
      // フルサイズ src（この後 srcset 等が来ても現状は同一ファイル）
      var full = img.getAttribute('src');
      // 同じ figure 内の figcaption をキャプションに流用
      var fig = img.closest('figure');
      var cap = fig ? fig.querySelector('figcaption') : null;
      var capHtml = cap ? cap.innerHTML : '';
      // キーボード操作可能に（画像を button 相当に）
      img.setAttribute('role', 'button');
      img.setAttribute('tabindex', '0');
      img.setAttribute('aria-label', (img.alt || 'スクリーンショット') + '（クリックで拡大）');
      img.addEventListener('click', function () { openLb(full, img.alt, capHtml, img); });
      img.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLb(full, img.alt, capHtml, img); }
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enhance);
  } else {
    enhance();
  }
})();
