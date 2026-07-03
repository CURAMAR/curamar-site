/* ===========================================================================
 * sitemap.js — 全ページ共通「ポップアップ式サイトマップ」
 * ---------------------------------------------------------------------------
 * 各ページの </body> 直前に  <script src="/sitemap.js" defer></script>  を1行。
 * 右下のフローティングボタン → 中央ポップアップで全ページ＋外部リンクを表示。
 * サイトマップの内容はこの SITEMAP 配列だけ直せば全ページに反映される（単一ソース）。
 * 既存のヘッダ/ナビは触らない（追加のみ・非破壊）。
 * ルート絶対パス（/xxx.html）で書くので posts/ など下層ページからも壊れない。
 * =========================================================================== */
(function () {
  "use strict";
  if (window.__scmInit) return;        // 二重読み込みガード
  window.__scmInit = true;

  // --- サイトマップ定義（ここだけ編集すれば全ページ反映） -------------------
  var SITEMAP = [
    {
      label: "Ligastmir（ツール）",
      key: "tool",
      items: [
        { t: "Ligastmir とは", d: "製品紹介・できること", href: "/ligastmir.html" },
        { t: "ダウンロード", d: "最新版を入手・導入手順", href: "/download.html" },
        { t: "使い方ガイド", d: "初期設定と各機能の使い方", href: "/guide.html" },
        { t: "よくある質問", d: "導入前の不安・トラブル", href: "/faq.html" },
        { t: "更新履歴", d: "バージョンごとの変更点", href: "/changelog.html" }
      ]
    },
    {
      label: "curamar（サイト）",
      key: "site",
      items: [
        { t: "トップ", d: "配信 / SF小説 / ツール開発", href: "/index.html" },
        { t: "curamar について", d: "プロフィール・3つの世界", href: "/about.html" },
        { t: "配信", d: "Twitch・Dead by Daylight", href: "/streaming.html" },
        { t: "SF小説", d: "アンチ・エントロピア（カクヨム）", href: "/novel.html" },
        { t: "ブログ・開発日誌", d: "個人開発と執筆の記録", href: "/blog.html" },
        { t: "活動を応援する", d: "OFUSE でのファンレター（任意）", href: "/support.html" },
        { t: "クレジット", d: "協力者・利用素材", href: "/credits.html" },
        { t: "プライバシーポリシー", d: "データの取り扱い", href: "/privacy.html" }
      ]
    },
    {
      label: "外部リンク",
      key: "ext",
      items: [
        { t: "Twitch 配信", d: "ゲーム配信（DBD 中心）", href: "https://www.twitch.tv/curamar", ext: true },
        { t: "カクヨム（SF小説）", d: "アンチ・エントロピア 連載中", href: "https://kakuyomu.jp/users/CURAMAR", ext: true },
        { t: "Discord", d: "質問・FB・雑談コミュニティ", href: "https://discord.gg/QtQcEgn9JF", ext: true },
        { t: "不具合報告・要望", d: "Google フォーム（匿名OK）", href: "https://forms.gle/RFj81KQe1nFik4L76", ext: true }
      ]
    }
  ];

  // --- 現在ページの判定（active 表示用） -------------------------------------
  function currentPath() {
    var p = location.pathname;
    if (p === "/" || p === "") return "/index.html";
    // 末尾スラッシュや /posts/ 下層も素直に比較できるよう正規化
    return p;
  }
  var here = currentPath();
  function isHere(href) {
    if (!href || href.charAt(0) !== "/") return false;
    return href === here;
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  // --- スタイル（既存トークンを利用・無い場合に備えフォールバック付き） -------
  var css =
    '.scm-fab{position:fixed;right:20px;bottom:20px;z-index:9000;display:inline-flex;' +
    'align-items:center;gap:8px;padding:11px 16px;border-radius:999px;cursor:pointer;' +
    'font-family:var(--font-mono,monospace);font-size:13px;letter-spacing:.04em;' +
    'color:var(--ink,#e8edf2);background:var(--bg-soft,#141a21);' +
    'border:1px solid var(--bg-line,#1f2730);box-shadow:0 6px 22px rgba(0,0,0,.4);' +
    'transition:transform .15s,border-color .2s,box-shadow .2s}' +
    '.scm-fab:hover{transform:translateY(-2px);border-color:var(--accent,#c8f542);' +
    'box-shadow:0 10px 30px rgba(200,245,66,.18)}' +
    '.scm-fab .scm-ic{display:inline-grid;grid-template-columns:1fr 1fr;gap:2px;width:14px;height:14px}' +
    '.scm-fab .scm-ic i{display:block;border-radius:1px;background:var(--accent,#c8f542)}' +
    '.scm-fab-label{white-space:nowrap}' +

    '.scm-overlay{position:fixed;inset:0;z-index:9001;display:none;' +
    'align-items:flex-start;justify-content:center;padding:6vh 16px 16px;' +
    'background:rgba(5,7,10,.66);-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px)}' +
    '.scm-overlay.scm-open{display:flex;animation:scmFade .18s ease}' +
    '@keyframes scmFade{from{opacity:0}to{opacity:1}}' +

    '.scm-panel{position:relative;width:100%;max-width:600px;max-height:88vh;overflow:auto;' +
    'background:var(--bg,#0d1014);border:1px solid var(--bg-line,#1f2730);' +
    'border-radius:var(--radius,14px);padding:22px 22px 10px;' +
    'box-shadow:0 24px 70px rgba(0,0,0,.6)}' +
    '.scm-overlay.scm-open .scm-panel{animation:scmRise .2s ease}' +
    '@keyframes scmRise{from{transform:translateY(10px);opacity:0}to{transform:translateY(0);opacity:1}}' +

    '.scm-head{display:flex;align-items:baseline;justify-content:space-between;gap:12px;' +
    'margin-bottom:6px}' +
    '.scm-title{font-family:var(--font-mono,monospace);font-size:13px;letter-spacing:.14em;' +
    'color:var(--accent-cool,#5cc8ff)}' +
    '.scm-close{background:none;border:1px solid var(--bg-line,#1f2730);color:var(--ink,#e8edf2);' +
    'border-radius:8px;width:32px;height:32px;font-size:18px;line-height:1;cursor:pointer;' +
    'transition:border-color .2s,color .2s}' +
    '.scm-close:hover{border-color:var(--accent,#c8f542);color:var(--accent,#c8f542)}' +

    '.scm-group{margin-top:16px}' +
    '.scm-group h3{font-family:var(--font-disp,sans-serif);font-size:13px;font-weight:700;' +
    'color:var(--ink-dim,#8a97a5);letter-spacing:.06em;margin-bottom:8px;' +
    'padding-bottom:6px;border-bottom:1px dashed var(--bg-line,#1f2730)}' +
    '.scm-links{display:grid;grid-template-columns:1fr 1fr;gap:8px}' +
    '.scm-link{display:block;padding:10px 12px;border-radius:10px;text-decoration:none;' +
    'border:1px solid var(--bg-line,#1f2730);background:var(--bg-soft,#141a21);' +
    'transition:transform .12s,border-color .2s,background .2s}' +
    '.scm-link:hover{transform:translateY(-2px);border-color:var(--accent,#c8f542)}' +
    '.scm-link .scm-t{font-size:14px;font-weight:700;color:var(--ink,#e8edf2);' +
    'display:flex;align-items:center;gap:7px}' +
    '.scm-link .scm-d{font-size:11.5px;color:var(--ink-dim,#8a97a5);margin-top:2px;line-height:1.5}' +
    '.scm-link .scm-ext-mark{font-size:11px;color:var(--accent-cool,#5cc8ff)}' +
    '.scm-link.scm-active{border-color:var(--accent,#c8f542);' +
    'background:linear-gradient(0deg,rgba(200,245,66,.07),rgba(200,245,66,.07))}' +
    '.scm-link.scm-active .scm-t::after{content:"現在地";margin-left:auto;font-family:var(--font-mono,monospace);' +
    'font-size:10px;color:var(--accent,#c8f542);border:1px solid var(--accent,#c8f542);' +
    'border-radius:999px;padding:0 7px;font-weight:400}' +
    '.scm-foot{margin:14px 0 6px;text-align:center;font-family:var(--font-mono,monospace);' +
    'font-size:11px;color:var(--ink-dim,#8a97a5)}' +

    '@media(max-width:560px){.scm-links{grid-template-columns:1fr}' +
    '.scm-fab-label{display:none}.scm-fab{padding:13px}}' +
    '@media (prefers-reduced-motion: reduce){.scm-overlay.scm-open,' +
    '.scm-overlay.scm-open .scm-panel{animation:none}.scm-fab:hover,.scm-link:hover{transform:none}}';

  // --- マークアップ生成 ------------------------------------------------------
  function buildPanel() {
    var html = '<div class="scm-panel" role="dialog" aria-modal="true" aria-label="サイトマップ">' +
      '<div class="scm-head"><span class="scm-title">SITE MAP</span>' +
      '<button class="scm-close" type="button" aria-label="閉じる">×</button></div>';
    SITEMAP.forEach(function (g) {
      html += '<div class="scm-group"><h3>' + esc(g.label) + '</h3><div class="scm-links">';
      g.items.forEach(function (it) {
        var active = isHere(it.href) ? " scm-active" : "";
        var attrs = it.ext ? ' target="_blank" rel="noopener"' : "";
        var mark = it.ext ? '<span class="scm-ext-mark">↗</span>' : "";
        html += '<a class="scm-link' + active + '" href="' + esc(it.href) + '"' + attrs + '>' +
          '<span class="scm-t">' + esc(it.t) + mark + '</span>' +
          '<span class="scm-d">' + esc(it.d) + '</span></a>';
      });
      html += '</div></div>';
    });
    html += '<div class="scm-foot">curamar.space — Esc キーで閉じる</div></div>';
    return html;
  }

  // --- 組み立て＆イベント ----------------------------------------------------
  function init() {
    var style = document.createElement("style");
    style.setAttribute("data-scm", "1");
    style.textContent = css;
    document.head.appendChild(style);

    var fab = document.createElement("button");
    fab.type = "button";
    fab.className = "scm-fab";
    fab.setAttribute("aria-label", "サイトマップを開く");
    fab.setAttribute("aria-expanded", "false");
    fab.innerHTML = '<span class="scm-ic"><i></i><i></i><i></i><i></i></span>' +
      '<span class="scm-fab-label">サイトマップ</span>';

    var overlay = document.createElement("div");
    overlay.className = "scm-overlay";
    overlay.innerHTML = buildPanel();

    document.body.appendChild(fab);
    document.body.appendChild(overlay);

    var lastFocus = null;
    function open() {
      lastFocus = document.activeElement;
      overlay.classList.add("scm-open");
      fab.setAttribute("aria-expanded", "true");
      var c = overlay.querySelector(".scm-close");
      if (c) c.focus();
    }
    function close() {
      overlay.classList.remove("scm-open");
      fab.setAttribute("aria-expanded", "false");
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    fab.addEventListener("click", open);
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) close();              // 背景クリックで閉じる
    });
    overlay.querySelector(".scm-close").addEventListener("click", close);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && overlay.classList.contains("scm-open")) close();
    });
  }

  if (document.body) init();
  else document.addEventListener("DOMContentLoaded", init);
})();
