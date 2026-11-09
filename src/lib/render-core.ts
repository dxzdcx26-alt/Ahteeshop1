// ============ Core shell renderer — pixel-accurate clone of the original site ============
import { db } from "@/lib/db";
import { getSettings } from "@/lib/site";
import type { SessionUser } from "./auth-extra";

export function esc(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function fmtBal(n: number): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
export function fmtNum(n: number): string {
  return n.toLocaleString("en-US");
}

export type PageCtx = {
  user: SessionUser | null;
  unread: number;
  page: string;
  title: string;
  body: string;
};

export async function getSite(s = null as Record<string, string> | null) {
  return s ?? (await getSettings());
}

// ---------------- HEAD (exact copy of original head block) ----------------
export function headHTML(st: Record<string, string>, page: string, title: string): string {
  const name = st.site_name || "AhteeShop";
  const siteTitle = st.site_title || "AhteeShop | เติมเกมอัตโนมัติ 24 ชม.";
  const desc = st.site_desc || name;
  return `<!DOCTYPE html>
<html lang="en">

<head>

    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

            <meta property="og:site_name" content="${esc(siteTitle)}">
        <meta property="og:title" content="${esc(siteTitle)} - ${esc(title)}">
        <meta property="og:type" content="website">
        <meta property="og:url" content="?page=${esc(page)}">
        <meta property="og:locale" content="th_TH">
        <meta name="twitter:card" content="summary_large_image">
                <meta property="og:description" content="${esc(desc)}">
        <meta name="description" content="${esc(desc)}">

    <title>${esc(title === "ยินดีต้อนรับ" ? siteTitle : siteTitle + " - " + title)}</title>
    <link rel="icon" type="image/png" href="${esc(st.logo_url || "favicon.png")}">
    
    <link rel="stylesheet" href="services/styles/styles.css">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-1BmE4kWBq78iYhFldvKuhfTAU6auU8tT94WrHftjDbrCEXSU1oBoqyl2QvZ6jIW3" crossorigin="anonymous">
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js" integrity="sha384-ka7Sk0Gln4gmtz2MlQnikT1wXgYsOg+OMhuP+IlRH9sENBO0LRn5q+8nbTov4+1p" crossorigin="anonymous"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.4/jquery.min.js" integrity="sha512-pumBsjNRGGqkPzKHndZMaAG+bir374sORyzM3uulLV14lN5LyykqNk8eEeUlUkB3U0M4FApyaHraT65ihJhDpQ==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
    <link rel="stylesheet" href="//cdn.datatables.net/1.13.4/css/jquery.dataTables.min.css">
    <script src="//cdn.datatables.net/1.13.4/js/jquery.dataTables.min.js"></script>
    <!-- <link rel="stylesheet" href="services/gshake/css/box.css"> -->
    <link href="https://kit-pro.fontawesome.com/releases/v6.2.0/css/pro.min.css" rel="stylesheet">
    <script src="//cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <script src="https://www.google.com/recaptcha/api.js" async defer></script>
    <link href="https://unpkg.com/aos@2.3.1/dist/aos.css" rel="stylesheet">
    <script src="https://unpkg.com/aos@2.3.1/dist/aos.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/typed.js@2.0.12"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Kanit:wght@600&family=Kanit&display=swap" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/chart.js/2.8.0/chart.bundle.min.js"></script>

    <style>
        :root {
            --main: #d4af37;
            --sub: #f3d77a;
            --font: #d9d2c3;
            --sub-opa-50: #d4af3780;
            --sub-opa-25: #d4af37;
        }
    </style>
    <link rel="stylesheet" href="services/styles/styles.css">
    <style>
        *,
        html,
        body,
        h1,
        h2,
        h3,
        h4,
        h5,
        h6,
        span,
        small,
        p,
        button,
        .btn,
        .nav-link,
        .text-dark,
        .text-white,
        .text-secondary,
        .underline-active {
            color: var(--font);
        }
        .bg-custom{
          background: linear-gradient(135deg, rgba(255, 255,255 , 0.1)  ,  rgba(255, 255,255 , 0)  );
          backdrop-filter: blur(30px);
          -webkit-backdrop-filter: blur(30px);
          box-shadow: 0 8px 32px 0 rgba(0,0,0,0.37);
      }
        ::-webkit-scrollbar {
width: 3px
}
        .owl-items {
            max-width: 220px;
            max-height: 220px;

        }


        .owl-items img {
            border-radius: 25px !important;
            animation: glow 2s infinite ease-in-out;
        }


        body {
            background-image: url('');
            background-repeat: no-repeat;
            background-attachment: fixed;
            background-position: center;
            background-size: cover;
            overflow-x: hidden;
        }

        ::-webkit-scrollbar-track {
            background: #000
        }

        ::-webkit-scrollbar-thumb {
            border-radius: 25px;
            background: -webkit-linear-gradient(transparent,var(--main))
        }

        .bg-custom {
            background-color: #030303;
        }
        .font-bold {
            font-weight: 700;
        }
        .font-semibold {
            font-weight: 600;
        }  

        </style>

            <!--width: 100%;
            height: 100%;
            background-color: #ffffff;
            background-image: radial-gradient(rgba(12, 12, 12, 0.171) 2px, transparent 0);
            background-size: 30px 30px;
            background-position: -5px -5px;-->

    <script>(function(){var c={"base":"dark","toggle":true,"def":"system"},m=c.base,d=document.documentElement;if(c.def==="system"&&window.matchMedia)m=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";if(c.toggle){try{var s=localStorage.getItem("site_mode");if(s==="dark"||s==="light")m=s;}catch(e){}}d.setAttribute("data-mode",m);window.SITE_MODE=c;})();</script>        <style id="theme-colors">:root{--c-main:#d4af37;--c-sub:#f3d77a;--c-page_bg:#0a0907;--c-text:#d9d2c3;--c-heading:#f6efdf;--c-muted:#8e8571;--c-link:#d4af37;--c-link_hover:#f3d77a;--c-selection:#d4af37;--c-nav_bg:#14120ef0;--c-nav_text:#d9d2c3;--c-nav_hover:#d4af37;--c-nav_line:#d4af37;--c-nav_badge_bg:#d4af37;--c-nav_badge_text:#1a1300;--c-nav_count_bg:#f43f5e;--c-adm_bg:#14120e;--c-adm_text:#d9d2c3;--c-adm_hover:#d4af37;--c-card_bg:#14120e;--c-card_text:#d9d2c3;--c-card_title:#f6efdf;--c-card_border:#2a2418;--c-btn_bg:#d4af37;--c-btn_text:#1a1406;--c-btn_hover:#e2c25a;--c-btn2_text:#f6efdf;--c-btn2_border:#3b3322;--c-input_bg:#0f0d0a;--c-input_text:#f6efdf;--c-input_border:#3b3322;--c-input_focus:#d4af37;--c-placeholder:#8e8571;--c-label:#d9d2c3;--c-switch_on:#d4af37;--c-table_text:#d9d2c3;--c-table_head_bg:#0f0d0a;--c-table_head_text:#f6efdf;--c-table_border:#2a2418;--c-table_stripe:#ffffff06;--c-ok:#16a34a;--c-danger:#e11d48;--c-warning:#f59e0b;--c-info:#0ea5e9;--c-alert_text:#f6efdf;--c-modal_bg:#14120e;--c-modal_text:#d9d2c3;--c-hero_from:#d4af37;--c-hero_to:#f3d77a;--c-hero_text:#ffffff;--c-price:#e6c158;--c-step_bg:#d4af37;--c-footer_bg:#14120e;--c-footer_text:#8e8571;--c-scroll_thumb:#d4af37;--c-scroll_track:#0a0907;--main:#d4af37;--sub:#f3d77a;--font:#d9d2c3;--sub-opa-50:#d4af3780;--sub-opa-25:#d4af3740;color-scheme:dark}html[data-mode="light"]{--c-main:#d4af37;--c-sub:#f3d77a;--c-page_bg:#f4f4f8;--c-text:#3a3848;--c-heading:#16151f;--c-muted:#77748a;--c-link:#d4af37;--c-link_hover:#f3d77a;--c-selection:#d4af37;--c-nav_bg:#ffffffeb;--c-nav_text:#3a3848;--c-nav_hover:#d4af37;--c-nav_line:#d4af37;--c-nav_badge_bg:#d4af37;--c-nav_badge_text:#1a1300;--c-nav_count_bg:#f43f5e;--c-adm_bg:#ffffff;--c-adm_text:#3a3848;--c-adm_hover:#d4af37;--c-card_bg:#ffffff;--c-card_text:#3a3848;--c-card_title:#16151f;--c-card_border:#e6e5ee;--c-btn_bg:#d4af37;--c-btn_text:#1a1406;--c-btn_hover:#e2c25a;--c-btn2_text:#16151f;--c-btn2_border:#d9d7e5;--c-input_bg:#f6f5fa;--c-input_text:#16151f;--c-input_border:#d9d7e5;--c-input_focus:#d4af37;--c-placeholder:#77748a;--c-label:#3a3848;--c-switch_on:#d4af37;--c-table_text:#3a3848;--c-table_head_bg:#f6f5fa;--c-table_head_text:#16151f;--c-table_border:#e6e5ee;--c-table_stripe:#00000005;--c-ok:#16a34a;--c-danger:#e11d48;--c-warning:#f59e0b;--c-info:#0ea5e9;--c-alert_text:#16151f;--c-modal_bg:#ffffff;--c-modal_text:#3a3848;--c-hero_from:#d4af37;--c-hero_to:#f3d77a;--c-hero_text:#ffffff;--c-price:#e6c158;--c-step_bg:#d4af37;--c-footer_bg:#ffffff;--c-footer_text:#77748a;--c-scroll_thumb:#d4af37;--c-scroll_track:#f4f4f8;--main:#d4af37;--sub:#f3d77a;--font:#3a3848;--sub-opa-50:#d4af3780;--sub-opa-25:#d4af3740;color-scheme:light}
html,body{background-color:var(--c-page_bg)!important}
body,p,span,small,li,td,th,div,label,strong,b,i{color:var(--c-text)}
h1,h2,h3,h4,h5,h6,.h1,.h2,.h3,.h4,.h5,.h6{color:var(--c-heading)!important}
.text-muted,.form-text,small.text-muted{color:var(--c-muted)!important}
a:not(.btn):not(.nav-link):not(.navbar-brand){color:var(--c-link)}
a:not(.btn):not(.nav-link):not(.navbar-brand):hover{color:var(--c-link_hover)}
::selection{background:var(--c-selection);color:#fff}
.text-main{color:var(--c-main)!important}.text-sec{color:var(--c-sub)!important}.text-font{color:var(--c-text)!important}
.bg-main{background:var(--c-main)!important;color:var(--c-btn_text)!important}
.border-main{border-color:var(--c-main)!important}

/* แถบเมนูด้านบน */
#mainNav{background:var(--c-nav_bg)!important}
#mainNav .nav-link{white-space:nowrap}
@media (min-width:1200px) and (max-width:1499px){#mainNav .nav-link{font-size:.88rem;margin-right:.15rem!important;padding-left:.35rem;padding-right:.35rem}}
#mainNav .nav-link,#mainNav .nav-link i,#mainNav .navbar-toggler,#mainNav .navbar-toggler i{color:var(--c-nav_text)!important}
#mainNav .nav-link:hover,#mainNav .nav-link:hover i,#mainNav .nav-link.active,#mainNav .nav-link.active i{color:var(--c-nav_hover)!important}
#mainNav .underline-active::after{background:var(--c-nav_line)!important}
#mainNav .btn.bg-main,#mainNav .btn.bg-main i{color:var(--c-btn_text)!important}
.autoweb-badge{background:var(--c-nav_badge_bg)!important;color:var(--c-nav_badge_text)!important}
.inbox-count{background:var(--c-nav_count_bg)!important;color:#fff!important}

/* เมนูหลังบ้าน */
.admin-nav{background:var(--c-adm_bg)!important}
.admin-nav .nav-link{color:var(--c-adm_text)!important;white-space:nowrap}
.admin-nav .navbar-nav{flex-wrap:wrap;justify-content:center}
.nav-pills .nav-link{color:var(--c-text)!important}.nav-pills .nav-link.active{background:var(--c-main)!important;color:var(--c-btn_text)!important}
.admin-nav .nav-link:hover,.admin-nav .nav-link.active{color:var(--c-adm_hover)!important}

/* การ์ด */
.card,.list-group-item,div.bg-custom,div.bg-glass,div.bg-dark,div.bg-light,.card-anim-main,.dropdown-menu{background:var(--c-card_bg)!important;color:var(--c-card_text);border-color:var(--c-card_border)!important}
.card p,.card span:not(.badge),.card div,.card li,.card td,.card label,.card small:not(.text-muted){color:var(--c-card_text)}
.card h1,.card h2,.card h3,.card h4,.card h5,.card h6,.card .card-title{color:var(--c-card_title)!important}
.dropdown-item{color:var(--c-card_text)!important}.dropdown-item:hover{background:var(--c-main)!important;color:var(--c-btn_text)!important}
hr{border-color:var(--c-card_border)!important;opacity:1}

/* ปุ่ม */
.btn.bg-main,.btn-primary,.swal2-confirm{background:var(--c-btn_bg)!important;border-color:var(--c-btn_bg)!important;color:var(--c-btn_text)!important}
.btn.bg-main *,.btn-primary *{color:var(--c-btn_text)!important}
.btn.bg-main:hover,.btn-primary:hover,.swal2-confirm:hover{background:var(--c-btn_hover)!important;border-color:var(--c-btn_hover)!important}
.btn-outline-secondary,.btn-outline-primary,.btn-outline-light,.btn-outline-dark{background:transparent!important;color:var(--c-btn2_text)!important;border-color:var(--c-btn2_border)!important}
.btn-outline-secondary *,.btn-outline-primary *{color:var(--c-btn2_text)!important}
.btn-outline-secondary:hover,.btn-outline-primary:hover{background:var(--c-btn2_border)!important}
.btn-success{background:var(--c-ok)!important;border-color:var(--c-ok)!important;color:#fff!important}
.btn-danger{background:var(--c-danger)!important;border-color:var(--c-danger)!important;color:#fff!important}
.btn-outline-danger{color:var(--c-danger)!important;border-color:var(--c-danger)!important;background:transparent!important}
.btn-outline-danger *{color:var(--c-danger)!important}

/* ฟอร์ม */
.form-control,.form-select,textarea,input[type=text],input[type=number],input[type=password],input[type=email],select{background-color:var(--c-input_bg)!important;color:var(--c-input_text)!important;border-color:var(--c-input_border)!important}
.form-select option,select option{background:var(--c-input_bg);color:var(--c-input_text)}
.form-control:focus,.form-select:focus{border-color:var(--c-input_focus)!important;box-shadow:0 0 0 .2rem color-mix(in srgb,var(--c-input_focus) 30%,transparent)!important}
.form-control::placeholder,textarea::placeholder{color:var(--c-placeholder)!important;opacity:1}
.input-group-text{background:var(--c-card_border)!important;color:var(--c-label)!important;border-color:var(--c-input_border)!important}
.form-label,.form-check-label,label{color:var(--c-label)!important}
.form-check-input{background-color:var(--c-input_bg);border-color:var(--c-input_border)}
.form-check-input:checked{background-color:var(--c-switch_on)!important;border-color:var(--c-switch_on)!important}
.form-control-color{padding:.2rem!important}
.form-range::-webkit-slider-thumb{background:var(--c-switch_on)!important}.form-range::-moz-range-thumb{background:var(--c-switch_on)!important}.form-range{accent-color:var(--c-switch_on)}

/* ตาราง */
.table{--bs-table-bg:transparent;--bs-table-striped-bg:var(--c-table_stripe);--bs-table-striped-color:var(--c-table_text);--bs-table-hover-color:var(--c-table_text);color:var(--c-table_text)!important;border-color:var(--c-table_border)!important}
.table>:not(caption)>*>*{background-color:transparent!important;color:var(--c-table_text)!important;border-bottom-color:var(--c-table_border)!important}
.table-striped>tbody>tr:nth-of-type(odd)>*{box-shadow:inset 0 0 0 9999px var(--c-table_stripe)!important}
.table thead th,.table thead td{background:var(--c-table_head_bg)!important;color:var(--c-table_head_text)!important}
.dataTables_wrapper,.dataTables_wrapper *{color:var(--c-table_text)!important}

/* แจ้งเตือน */
.alert{color:var(--c-alert_text)!important}.alert *{color:var(--c-alert_text)!important}
.alert-success{background:color-mix(in srgb,var(--c-ok) 22%,transparent)!important;border-color:color-mix(in srgb,var(--c-ok) 55%,transparent)!important}
.alert-danger{background:color-mix(in srgb,var(--c-danger) 22%,transparent)!important;border-color:color-mix(in srgb,var(--c-danger) 55%,transparent)!important}
.alert-warning{background:color-mix(in srgb,var(--c-warning) 22%,transparent)!important;border-color:color-mix(in srgb,var(--c-warning) 55%,transparent)!important}
.alert-info,.alert-primary{background:color-mix(in srgb,var(--c-info) 22%,transparent)!important;border-color:color-mix(in srgb,var(--c-info) 55%,transparent)!important}
.badge.bg-success{background:var(--c-ok)!important}.badge.bg-danger{background:var(--c-danger)!important}
.badge.bg-warning{background:var(--c-warning)!important;color:#000!important}.badge.bg-info{background:var(--c-info)!important}
.badge,.badge *{color:#fff}
.text-success{color:var(--c-ok)!important}.text-danger{color:var(--c-danger)!important}.text-warning{color:var(--c-warning)!important}.text-info{color:var(--c-info)!important}

/* ป๊อปอัป */
.modal-content,.swal2-popup{background:var(--c-modal_bg)!important;color:var(--c-modal_text)!important}
.modal-content *:not(.btn):not(.btn *):not(.badge),.swal2-title,.swal2-html-container,.swal2-html-container *{color:var(--c-modal_text)!important}
.btn-close{filter:invert(1) grayscale(1)}

/* ส่วนท้าย / scrollbar */
footer{background:var(--c-footer_bg)!important}footer,footer *:not(.btn){color:var(--c-footer_text)!important}
::-webkit-scrollbar-track{background:var(--c-scroll_track)!important}
::-webkit-scrollbar-thumb{background:var(--c-scroll_thumb)!important}</style>        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600&display=swap"><link rel="stylesheet" href="services/styles/themes.css?v=1794131156"><style>:root{--theme-font:'Prompt',"Kanit",sans-serif}</style>    </head>

`;
}

// ---------------- HEADER NAV ----------------
export function navLinksHTML(active: string, isMobile = false): string {
  const link = (page: string, icon: string, label: string) => {
    const act = active === page ? (isMobile ? " is-active" : " is-active") : "";
    const cur = active === page ? ` aria-current="page"` : "";
    return `<a class="dn-${isMobile ? "item dn-item-m" : "link"}${act}" href="?page=${page}"${cur}><i class="fa-solid ${icon}"></i><span>${label}</span></a>`;
  };
  let html = link("home", "fa-house", "หน้าหลัก") + link("shop", "fa-store", "ร้านค้า") + link("payment", "fa-wallet", "เติมเงิน");
  if (!isMobile) {
    html += `      <div class="dropdown">
        <button class="dn-link" type="button" data-bs-toggle="dropdown" aria-expanded="false"><i class="fa-solid fa-grip"></i><span>เพิ่มเติม</span><i class="fa-solid fa-chevron-down dn-caret"></i></button>
        <div class="dropdown-menu dropdown-menu-end dn-menu">
          <a class="dropdown-item dn-item" href="?page=random_wheel"><i class="fa-solid fa-dharmachakra"></i><span>สุ่มวงล้อ</span></a><a class="dropdown-item dn-item" href="?page=reward"><i class="fa-solid fa-gift"></i><span>แลกแต้ม</span></a><a class="dropdown-item dn-item" href="?page=app"><i class="fa-solid fa-crown"></i><span>แอพพรีเมี่ยม</span></a><a class="dropdown-item dn-item" href="?page=contact"><i class="fa-solid fa-phone"></i><span>ติดต่อเรา</span></a>        </div>
      </div>`;
  } else {
    html += link("random_wheel", "fa-dharmachakra", "สุ่มวงล้อ") + link("reward", "fa-gift", "แลกแต้ม") + link("app", "fa-crown", "แอพพรีเมี่ยม") + link("contact", "fa-phone", "ติดต่อเรา");
  }
  return html;
}

export function headerHTML(st: Record<string, string>, user: SessionUser | null, unread: number, active: string): string {
  const name = st.site_name || "AhteeShop";
  const modeBtn = `<button class="dn-icon dn-mode" type="button" aria-label="สลับโหมดมืด/สว่าง" title="สลับโหมดมืด/สว่าง" onclick="siteToggleMode()"><i class="fa-solid fa-moon dn-mode-dark"></i><i class="fa-solid fa-sun dn-mode-light"></i></button><script>function siteToggleMode(){var d=document.documentElement,n=d.getAttribute("data-mode")==="dark"?"light":"dark";d.classList.add("mode-anim");d.setAttribute("data-mode",n);try{localStorage.setItem("site_mode",n);}catch(e){}setTimeout(function(){d.classList.remove("mode-anim");},450);}</script>`;
  let right = "";
  if (user) {
    const letter = esc((user.username || "?").charAt(0).toUpperCase());
    const badge = unread > 0 ? `<span class="inbox-count dn-count">${unread}</span>` : `<span class="inbox-count dn-count" style="display:none">0</span>`;
    right = `${modeBtn}              <a class="dn-icon" href="?page=inbox" aria-label="กล่องข้อความ"><i class="fa-solid fa-bell"></i>${badge}</a> <div class="dropdown"> <button class="dn-avatar" type="button" data-bs-toggle="dropdown" aria-expanded="false" aria-label="บัญชีของฉัน">${letter}</button> <div class="dropdown-menu dropdown-menu-end dn-menu dn-account"> <div class="dn-acc-head"> <span class="dn-avatar dn-avatar-lg">${letter}</span> <div><b>${esc(user.username)}</b><small>ยอดเงิน ${fmtBal(user.balance)} บาท</small></div> </div> <a class="dropdown-item dn-item" href="?page=payment"><i class="fa-solid fa-circle-plus"></i><span>เติมเงิน</span></a> <a class="dropdown-item dn-item" href="?page=information"><i class="fa-solid fa-user"></i><span>ข้อมูลบัญชี</span></a> <a class="dropdown-item dn-item" href="?page=history"><i class="fa-solid fa-clock-rotate-left"></i><span>ประวัติการซื้อ</span></a> <a class="dropdown-item dn-item" href="?page=inbox"><i class="fa-solid fa-envelope"></i><span>กล่องข้อความ</span></a> <div class="dropdown-divider"></div> <a class="dropdown-item dn-item dn-danger" href="?page=logout"><i class="fa-solid fa-right-from-bracket"></i><span>ออกจากระบบ</span></a> </div> </div> <button class="dn-icon dn-burger" type="button" data-bs-toggle="offcanvas" data-bs-target="#dnDrawer" aria-controls="dnDrawer" aria-label="เปิดเมนู"><i class="fa-solid fa-bars"></i></button>`;
  } else {
    right = `${modeBtn}              <a class="dn-btn-ghost" href="?page=login">เข้าสู่ระบบ</a>
        <a class="dn-btn" href="?page=register">สมัครสมาชิก</a>
            <button class="dn-icon dn-burger" type="button" data-bs-toggle="offcanvas" data-bs-target="#dnDrawer" aria-controls="dnDrawer" aria-label="เปิดเมนู"><i class="fa-solid fa-bars"></i></button>`;
  }
  return `<header class="dn-wrap">
  <nav class="dn" id="mainNav" aria-label="เมนูหลัก">
        <a class="dn-brand" href="?page=home" aria-label="${esc(name)}" style="--logo-h: 40px"><img src="${esc(st.logo_url || "")}" alt=""></a>

    <form class="dn-search" action="" method="get" role="search">
      <input type="hidden" name="page" value="search">
      <i class="fa-solid fa-magnifying-glass"></i>
      <input type="search" name="q" value="" placeholder="ค้นหาสินค้า..." aria-label="ค้นหาสินค้า" autocomplete="off">
    </form>

    <div class="dn-links">
      ${navLinksHTML(active, false)}
    </div>

    <div class="dn-right">
      ${right}
    </div>
  </nav>
</header>

<div class="offcanvas offcanvas-end dn-drawer" tabindex="-1" id="dnDrawer" aria-label="เมนู">
  <div class="offcanvas-header">
    <img src="${esc(st.logo_url || "")}" alt="" height="36">
    <button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="ปิด"></button>
  </div>
  <div class="offcanvas-body">
    <form class="dn-search dn-search-m" action="" method="get" role="search">
      <input type="hidden" name="page" value="search"><i class="fa-solid fa-magnifying-glass"></i>
      <input type="search" name="q" value="" placeholder="ค้นหาสินค้า..." aria-label="ค้นหาสินค้า">
    </form>
    ${navLinksHTML(active, true)}${user ? "" : `          <div class="d-grid gap-2 mt-3"><a class="dn-btn" href="?page=register">สมัครสมาชิก</a><a class="dn-btn-ghost" href="?page=login">เข้าสู่ระบบ</a></div>`}
      </div>
</div>

`;
}

// ---------------- BUY MODAL (on every page) ----------------
export function buyModalHTML(user: SessionUser | null): string {
  const bal = user ? fmtBal(user.balance) : "";
  return `<div class="modal fade" id="buy_count" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="modal_title"><i class="fa-duotone fa-cart-shopping-fast"></i>&nbsp;&nbsp;สั่งซื้อสินค้า</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body p-3 pb-2">
                        <div class="row mt-2">
                            <div class="col">
                                <hr>
                            </div>
                            <div class="col-auto">จำนวนสินค้าที่จะซื้อ</div>
                            <div class="col">
                                <hr>
                            </div>
                            <div class="mb-2">
                            </div>
                            <div class="d-flex justify-content-between pe-3 ps-3 mt-2">
                                <span class="m-0 align-self-center">สินค้าคงเหลือ  <span id="m_stock"></span> ชิ้น</span>
                                <span class="m-0 align-self-center" style="color: white; padding: 3.5px 5px; border-radius: 1vh; background-color: var(--main);">ยอดเงินคงเหลือ ${bal}</span>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" id="shop-btn" class="btn w-100" style="background-color: var(--main); color: #fff;" onclick="buybox()" data-id="" data-name="" data-price=""><i class=" fa-duotone fa-cart-shopping-fast"></i>&nbsp;&nbsp;สั่งซื้้อเลย</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <br />
`;
}

// ---------------- FOOTER ----------------
export function footerHTML(st: Record<string, string>, csrf: string): string {
  const name = st.site_name || "AhteeShop";
  const brand = st.foot_brand || `${name} — เติมเกมไว ปลอดภัย 24 ชม.`;
  const copy = st.foot_copy || "2025 AhteeShop, All right reserved.";
  const reportUrl = st.foot_report_url || "";
  const reportTxt = st.foot_report_text || "ติดต่อเจ้าของร้าน / แจ้งปัญหาการใช้งาน";
  return `<footer class="site-foot">
            <div class="container site-foot-in">
                <div class="site-foot-brand">
                                                            <p>${esc(brand)}</p>
                </div>
                <div class="site-foot-links">
                    <span>ติดต่อเรา</span>
                    ${st.contact_facebook_url ? `<a href="${esc(st.contact_facebook_url)}" target="_blank" rel="noopener"><i class="fa-brands fa-facebook"></i> Facebook</a>` : ""}
                    ${st.contact_discord_url ? `<a href="${esc(st.contact_discord_url)}" target="_blank" rel="noopener"><i class="fa-brands fa-discord"></i> Discord</a>` : ""}
                </div>
            </div>
            <div class="container site-foot-bottom">
                <span><i class="fa-regular fa-copyright"></i> ${esc(copy)}</span>
                ${reportUrl ? `<a href="${esc(reportUrl)}" target="_blank" rel="noopener">${esc(reportTxt)}</a>` : `<span>${esc(reportTxt)}</span>`}
            </div>
            <script>
                async function shake_alert(status, result) {
                    if (status) {
                        if (result.salt == "prize") {
                            // await GShake();
                            Swal.fire({
                                icon: 'success',
                                title: 'สำเร็จ',
                                text: result.message
                            }).then(function() {
                                window.location = "?page=history";
                            });
                        } else {
                            await GShake();
                            Swal.fire({
                                icon: 'error',
                                title: 'เสียใจด้วย',
                                text: result.message
                            });
                        }
                    } else {
                        if (result.salt == "salt") {
                            // await GShake();
                            Swal.fire({
                                icon: 'error',
                                title: 'เสียใจด้วย',
                                text: result.message
                            });
                        } else {
                            Swal.fire({
                                icon: 'error',
                                title: 'ผิดพลาด',
                                text: result.message
                            });
                        }
                    }
                }

                function buybox() {
                    var name = $("#shop-btn").attr("data-name");
                    var price = $("#shop-btn").attr("data-price");
                    var count = $("#b_count").val();
                    var formData = new FormData();
                    formData.append('id', $("#shop-btn").attr("data-id"));
                    formData.append('count', count);
                    Swal.fire({
                        title: 'ยืนยันการสั่งซื้อ?',
                        text: name + " " + count + " ชิ้น " + " ราคา " + price * count + " บาท ",
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonColor: '#3085d6',
                        cancelButtonColor: '#d33',
                        confirmButtonText: 'ซื้อเลย'
                    }).then((result) => {
                        if (result.isConfirmed) {
                            $.ajax({
                                type: 'POST',
                                url: 'services/buybox.php',
                                data: formData,
                                contentType: false,
                                processData: false,
                                beforeSend: function() {
                                    $('#btn_buyid').attr('disabled', 'disabled');
                                    $('#btn_buyid').html('<span class="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true"></span>รอสักครู่...');
                                },
                            }).done(function(res) {
                                console.log(res)
                                result = res;
                                // await GShake();
                                shake_alert(true, result);
                                console.clear();
                                $('#btn_buyid').html('<i class="fas fa-shopping-cart mr-1"></i>สั่งซื้อสินค้า');
                                $('#btn_buyid').removeAttr('disabled');
                            }).fail(function(jqXHR) {
                                console.log(jqXHR)
                                res = jqXHR.responseJSON;
                                shake_alert(false, res);

                                $('#btn_buyid').html('<i class="fas fa-shopping-cart mr-1"></i>สั่งซื้อสินค้า');
                                $('#btn_buyid').removeAttr('disabled');
                            });
                        }
                    })
                }

                function openBuy(id, name, price, stock) {
                    $("#modal_title").html('<i class="fa-duotone fa-cart-shopping-fast"></i>&nbsp;&nbsp;สั่งซื้อสินค้า');
                    $("#m_stock").text(stock);
                    $("#shop-btn").attr("data-id", id).attr("data-name", name).attr("data-price", price);
                    var box = $("#buy_count .mb-2").first();
                    box.html('<div class="mb-1 text-start px-3"><label class="ms-1">จำนวน</label><input type="number" id="b_count" class="form-control" min="1" max="' + stock + '" value="1" style="border-radius: 0.5vh;"></div>');
                    bootstrap.Modal.getOrCreateInstance(document.getElementById('buy_count')).show();
                }

                window.CSRF = ${JSON.stringify(csrf)};
            </script>
            <script>
                AOS.init();
                // var options = {
                //     strings: [\`\`],
                //     typeSpeed: 40,
                //     color: "#fff"
                // };
                // var typed = new Typed('#typing', options);
            </script>
    <script>window.SITE_PARTICLE={"type":"coin","amount":1,"speed":1};</script><script src="services/js/particles.js?v=1793782706" defer></script><script>(function(){if(matchMedia("(hover:none)").matches)return;document.addEventListener("pointermove",function(e){var c=e.target.closest&&e.target.closest(".sc.fx-tilt:not(.is-out)");document.querySelectorAll(".sc.fx-tilt.is-tilt").forEach(function(x){if(x!==c){x.classList.remove("is-tilt");x.style.transform="";}});if(!c)return;var r=c.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;c.classList.add("is-tilt");c.style.transform="perspective(800px) rotateX("+((.5-y)*10).toFixed(2)+"deg) rotateY("+((x-.5)*12).toFixed(2)+"deg) translateY(-4px)";c.style.setProperty("--gx",(x*100).toFixed(1)+"%");c.style.setProperty("--gy",(y*100).toFixed(1)+"%");});})();</script></body>

    </html>`;
}

// ---------------- FULL SHELL ----------------
export function shell(o: { st: Record<string, string>; user: SessionUser | null; unread: number; page: string; title: string; active: string; body: string; csrf: string }): string {
  return (
    headHTML(o.st, o.page, o.title) +
    `<body class="theme-gold use-bg">
   <!-- <div id="snow" count="50"></div> -->
        ` +
    headerHTML(o.st, o.user, o.unread, o.active) +
    "\n\n        " +
    o.body +
    "\n" +
    buyModalHTML(o.user) +
    footerHTML(o.st, o.csrf)
  );
}

// ---------------- shared page-card helpers (styles used by the original inner pages) ----------------
export const PAGE_HEAD_STYLE = `<style>
    .form-control {
        /* border: none;
        border-bottom: 3px solid var(--main); */
        border-radius: 1vh;
    }
</style>`;

export const CARD_STYLE = `<style>
    .btn-main {
        color: var(--main);
        background: var(--main-30);
        border: 1px solid var(--main);
        transition: all .5s ease;
    }
    .btn-main.active {
        color: white;
        background-color: var(--main);
        border: 1px solid var(--main);
    }
    .btn-main.active i {
        color: white !important;
    }
    .btn-main:hover {
        color: white;
        background-color: var(--main);
        border: 1px solid var(--main);
    }
    @media only screen and (max-width: 500px) {
        .pd-sm-font {
            font-size: 13px !important;
        }
        .pd-h-font {
            font-size: 16px;
        }
    }
</style>`;

export const IMG_ANIM_STYLE = `<style>
   .img-anim {
        position: relative;
        text-align: center;
        overflow: hidden;
        border-radius: 1vh;
    }
    .img-anim img {
        width: 100%;
        height: auto;
        margin-left: auto;
    }
    .img-anim>img {
        background-size: cover;
        background-position: center;
        transition: all 0.3s ease;
    }
    .img-anim>div.bg {
        position: absolute;
        z-index: 2;
        opacity: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(1, 1, 1, 0.3);
        transition: all 0.3s ease;
    }
    .img-anim>div.text {
        position: absolute;
        z-index: 3;
        top: 120%;
        left: 50%;
        opacity: 0;
        color: #fff;
        font-size: 20px;
        border-bottom: 3px solid transparent;
        border-image: linear-gradient(to right, var(--main), var(--main));
        border-image-slice: 1;
        transform: translate(-50%, -50%);
        transition: all 0.3s ease;
    }
    .img-anim:hover>img {
        transform: scale(1.1);
    }
    .img-anim:hover>div {
        opacity: 1;
    }
    .img-anim:hover>div.text {
        top: 80%;
        opacity: 1;
    }
    .content {
        height: auto;
        border: 3px solid rgba(0, 0, 0, .3);
        transition: all .5s ease;
    }
    .content:hover {
        border: 3.5px solid var(--main);
    }
    .font-bold {
        font-weight: 700;
    }
    .font-semibold {
        font-weight: 600;
    }  
</style>`;

// header banner used by payment/contact/information pages
export function pageBanner(icon: string, title: string): string {
  return `<div class="container-sm p-4" data-aos="zoom-in">
<center>
            <div class="col-12 col-lg-12 bg-custom p-2 mb-2" style="border-radius: 1vh;">
                <div class="d-flex justify-content-between">
                    <div class="text-center text-lg-start">
                    <h3 class=" m-0"><img src="${icon}" class="m-0 mb-2" style="height: 2.5rem;">&nbsp; ${esc(title)}</h3>
                    </div>
                    <button class="btn nav-link align-self-center bg-custom underline-active" onclick="window.history.back()" style="height: fit-content;"><b><i class="fa-solid fa-turn-down-left"></i> ย้อนกลับ</b></button>
                </div>
            </div>
        </center>
            <div class="container-fluid mt-2 mb-5 p-4">
                <div class="container-sm p-0">
                    <div class="row justify-content-center">
`;
}

export function pageBannerEnd(): string {
  return `                    </div>
                </div>
            </div>
        </div>
    </div>
</div>        `;
}

// generic inner card (payment/contact/info style)
export function infoCard(href: string, icon: string, title: string, sub: string, mt = ""): string {
  return `<div class="col-lg-3${mt}">
                            <div class="container-fluid bg-custom p-4 pt-5 rounded shadow-sm border-ys count-only" style="border-radius: 1vh;">
                                <a href="${href}" style="text-decoration: none;">
                                    <center>
                                        <img src="${icon}" class="img-fluid mb-3" style="height: 100px;">
                                        <h2 class=" ms-1 mb-0">${title}</h2>
                                        <small class="ms-1">${sub}</small>
                                    </center>
                                </a>
                            </div>
                        </div>`;
}
