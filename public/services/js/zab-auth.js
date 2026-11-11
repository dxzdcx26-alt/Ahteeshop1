(function () {
  function addDiscord() {
    var btn = document.getElementById("btn_regis");
    if (!btn || document.querySelector("[data-discord-login]")) return;
    var wrap = document.createElement("div");
    wrap.innerHTML =
      '<div style="display:flex;align-items:center;gap:12px;margin:18px 0 4px;">' +
      '<span style="flex:1;height:1px;background:var(--c-card_border,#3d1a2c);"></span>' +
      '<span style="color:var(--c-muted,#c48aa8);font-size:.8rem;">หรือ</span>' +
      '<span style="flex:1;height:1px;background:var(--c-card_border,#3d1a2c);"></span></div>' +
      '<a data-discord-login href="/api/auth/discord" style="display:flex;align-items:center;justify-content:center;gap:10px;text-decoration:none;background:#5865F2;color:#fff!important;margin-top:8px;width:100%;min-height:48px;border-radius:10px;font-weight:700;">' +
      '<i class="fa-brands fa-discord" style="font-size:1.15rem;"></i> เข้าสู่ระบบด้วย Discord</a>';
    btn.parentNode.insertBefore(wrap, btn.nextSibling);

    if (!document.querySelector("[data-discord-nav]")) {
      var login = document.querySelector('a.dn-btn-ghost[href="?page=login"]');
      if (login) {
        var a = document.createElement("a");
        a.className = "dn-btn";
        a.setAttribute("data-discord-nav", "1");
        a.href = "/api/auth/discord";
        a.style.cssText = "margin-left:6px;background:#5865F2!important;color:#fff!important;border-color:#5865F2!important;";
        a.innerHTML = '<i class="fa-brands fa-discord"></i> Discord';
        login.parentNode.insertBefore(a, login.nextSibling);
      }
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", addDiscord);
  else addDiscord();
})();
