// ============ Page renderers — exact markup captured from the original site ============
import { db } from "@/lib/db";
import { esc, fmtBal, fmtNum, PAGE_HEAD_STYLE, CARD_STYLE, IMG_ANIM_STYLE, pageBanner, pageBannerEnd, infoCard } from "./render-core";
import type { SessionUser } from "./auth-extra";

function thDate(d: Date): string {
  return d.toLocaleDateString("th-TH", { day: "2-digit", month: "2-digit", year: "numeric" }) + " " + d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
}

// product / app card (exact markup from the original app catalog page)
export function productCard(o: { id: string; name: string; img: string; price: number; stock: number; buyPage: string; buyLabel?: string; aos?: string }): string {
  const aos = o.aos || ` data-aos="zoom-in" data-aos-duration="800"`;
  const href = `?page=${o.buyPage}&amp;id=${esc(o.id)}`;
  return `<div class="col-12 col-lg-3 mb-4 justify-content-center"${aos}>
                                <div class="card-anim">
                                    <div class="card-anim-main bg-custom border-hov shadow-sm p-1" style="border-radius: 1vh; height: fit-content;">
                                        <div class="p-1">
                                            <a href="${href}">
                                                <div class="view overlay">
                                                    <center>
                                                        <img class="img-fluid " src="${esc(o.img)}" alt="${esc(o.name)}" style="border-radius: 1vh; width: 100%; max-width: 100vh;">
                                                    </center>
                                                    <a href="#!">
                                                        <div class="mask rgba-white-slight"></div>
                                                    </a>
                                                </div>

                                                <div class="p-3 pt-3 pb-1">
                                                    <h5 class="text-strongest mb-1" style="word-wrap: break-word;">${esc(o.name)}</h5>
                                                    <div class="d-flex justify-content-between mb-2">
                                                        <div class="d-flex">
                                                            <p class="text-main align-self-center m-0 h6 me-1"><strong>คงเหลือ ${fmtNum(o.stock)} ชิ้น</strong></p>
                                                        </div>
                                                        <p class="text-white main-badge bg-main align-self-center m-0"><strong style="color: #ffffff;">${o.price % 1 === 0 ? fmtNum(o.price) : fmtBal(o.price)} บาท</strong></p>
                                                    </div>
                                                    <center>
                                                        <a class="btn-main btn w-100 pd-sm-font mb-2 font-semibold" href="${href}" style="border-radius: 10px;">${o.buyLabel || "สั่งซื้อตอนนี้เลย"}</a>
                                                    </center>
                                                </div>
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>`;
}

// ---------------- HOME ----------------
export async function bodyHome(st: Record<string, string>, user: SessionUser | null): Promise<string> {
  const name = st.site_name || "Ahtee";
  const lead = st.hero_lead || name;
  const anns = await db.announcement.findMany({ where: { active: true } });
  const track = esc(anns.map((a) => a.text).join(" • ") || "ยินดีต้อนรับ");
  const [members, cats, products] = await Promise.all([
    db.user.count(),
    db.category.count({ where: { active: true } }),
    db.product.count({ where: { active: true } }),
  ]);
  const soldAgg = await db.order.aggregate({ _sum: { quantity: true } });
  const sold = soldAgg._sum.quantity || 0;
  const stats = [
    { icon: "fa-users", n: members, lbl: "สมาชิกทั้งหมด (คน)" },
    { icon: "fa-layer-group", n: cats, lbl: "หมวดหมู่ (หมวด)" },
    { icon: "fa-box", n: products, lbl: "พร้อมจำหน่าย (ชิ้น)" },
    { icon: "fa-bag-shopping", n: sold, lbl: "จำหน่ายแล้ว (ครั้ง)" },
  ];
  let statsHtml = "";
  for (const s of stats) {
    statsHtml += `<div class="hx-stat card">
        <div class="ic"><i class="fa-solid ${s.icon}"></i></div>
        <div><div class="num" data-count="${s.n}">${fmtNum(s.n)}</div><div class="lbl">${s.lbl}</div></div>
      </div>`;
  }

  const catsList = await db.category.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" }, take: 4 });
  const prodsList = await db.product.findMany({ where: { active: true, featured: true }, orderBy: { createdAt: "desc" }, take: 4 });
  let catsHtml: string;
  if (catsList.length === 0) {
    catsHtml = `<div class="hx-empty card">ยังไม่มีหมวดหมู่</div>`;
  } else {
    catsHtml = `<div class="row g-3">` + catsList.map((c) => productCard({ id: c.id, name: c.name, img: c.image || "assets/icon/x/category.svg", price: 0, stock: 0, buyPage: "cat", buyLabel: "เข้าชมหมวดนี้" }).replace(/<p class="text-main[\s\S]*?<\/p>/, "").replace(/<p class="text-white main-badge[\s\S]*?<\/p>/, "")).join("") + `</div>`;
  }
  let prodsHtml: string;
  if (prodsList.length === 0) {
    prodsHtml = `<div class="hx-empty card">ยังไม่มีสินค้า</div>`;
  } else {
    const stocks = await db.productItem.count({ where: { product: { id: { in: prodsList.map((p) => p.id) } }, sold: false } });
    prodsHtml = CARD_STYLE + `<div class="row g-3">` + prodsList.map((p) => productCard({ id: p.id, name: p.name, img: p.image || "assets/icon/x/category.svg", price: p.price, stock: stocks, buyPage: "buy" })).join("") + `</div>`;
  }

  return `<div class="container hx">

  <!-- ================= HERO (แตกต่างตามธีม) ================= -->
  <section class="hx-hero">
    <div class="hx-hero-top">
      <div class="hx-hero-txt">
        <span class="hx-badge"><span class="dot"></span> ระบบอัตโนมัติ 24 ชม.</span>
        <h1><span class="hx-grad">${esc(name)}</span></h1>
        <div class="hx-lead">${esc(lead)}</div>
      </div>
          <div class="hx-cta">
      <a class="btn bg-main" href="?page=shop"><i class="fa-solid fa-bag-shopping"></i>&nbsp; เลือกซื้อสินค้า</a>
      <a class="btn btn-outline-secondary" href="?page=payment"><i class="fa-solid fa-wallet"></i>&nbsp; เติมเงิน</a>
          </div>
        </div>
      </section>

    <div class="hx-ticker card"><span class="lbl"><i class="fa-solid fa-bullhorn"></i> ประกาศ</span><div style="overflow:hidden;flex:1"><span class="track">${track}</span></div></div>
  
  
  <!-- ================= สถิติ ================= -->
  <section class="hx-sec">
    <div class="hx-stats">
            ${statsHtml}
          </div>
  </section>



  <!-- ================= หมวดหมู่แนะนำ + บริการแนะนำ (ซ้าย/ขวา) ================= -->
  <section class="hx-sec">
    <div class="hx-duo-col">
    <div class="hx-head"><div class="hx-head-t"><img src="assets/icon/x/category.svg" alt="" class="hx-head-ic"><div><span class="hx-kicker">Categories</span><h2>หมวดหมู่แนะนำ</h2></div></div><a class="btn btn-outline-secondary btn-sm hx-more" href="?page=shop">ดูทั้งหมด <i class="fa-solid fa-arrow-right"></i></a></div>
      ${catsHtml}    </div>
      </section>

  <!-- ================= สินค้าแนะนำ ================= -->
  <section class="hx-sec">
    <div class="hx-head"><div class="hx-head-t"><img src="assets/icon/x/fire.svg" alt="" class="hx-head-ic"><div><span class="hx-kicker">Recommended</span><h2>สินค้าแนะนำ</h2></div></div><a class="btn btn-outline-secondary btn-sm hx-more" href="?page=shop">ดูทั้งหมด <i class="fa-solid fa-arrow-right"></i></a></div>
    ${prodsHtml}  </section>


</div>

<script>
// นับเลขสถิติเมื่อเลื่อนมาเห็น
(function () {
  var els = document.querySelectorAll('.hx-stat .num[data-count]');
  if (!('IntersectionObserver' in window)) return;
  var io = new IntersectionObserver(function (ents) {
    ents.forEach(function (en) {
      if (!en.isIntersecting) return; io.unobserve(en.target);
      var el = en.target, to = +el.dataset.count, t0 = performance.now(), d = 1200;
      (function step(t) { var k = Math.min(1, (t - t0) / d); el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))).toLocaleString(); if (k < 1) requestAnimationFrame(step); })(t0);
    });
  }, { threshold: .4 });
  els.forEach(function (el) { io.observe(el); });
})();
</script>
`;
}

// ---------------- LOGIN ----------------
export function bodyLogin(st: Record<string, string>): string {
  const name = st.site_name || "Ahtee";
  return `${PAGE_HEAD_STYLE}<div class="container-fluid p-4">
    <div class="container-sm  m-cent ps-4 pe-4">
        <center>
            <div class="col-lg-6 m-auto bg-custom shadow-sm p-0 pb-3" style="border-radius: 0.5vh;">
                <div class="col-10 col-lg-12 m-cent pt-4" style="margin-bottom: 4em!important; ">
                    <center>
                        <h1 class=" text-strongest mt-3" style="font-size: 48px; text-transform: uppercase;">${esc(name)}</h1>
                        <h3 class=" text-strongest mb-3">เข้าสู่ระบบ</h3>
                    </center>
                    <div class="container-fluid ps-0 pe-0" style="margin-top: 1em;">

                        <div class="col-lg-8 m-cent mt-2">

                            <div class="mb-1 text-start">
                                <label class="ms-1"> ชื่อผู้ใช้</label>
                                <input type="text" id="user" class="form-control" placeholder="Username" aria-describedby="basic-addon1" style="border-radius: 0.5vh;">
                            </div>
                            <div class="mb-1 text-start">
                                <label class="ms-1"> รหัสผ่าน</label>
                                <input type="password" id="pass" class="form-control" placeholder="Password" aria-describedby="basic-addon1" style="border-radius: 0.5vh;">
                            </div>
                            <div class="mt-3">
                                <div id="captcha" class="cf-turnstile" data-sitekey="0x4AAAAAAAHloNCBDFBETKy5" data-theme="light" data-callback="onloadTurnstileCallback"></div>
                            </div>
                            <br>
                        <button class="btn bg-main   text-white  ps-4 pe-4  pt-2 pb-2 w-100 d-inline" id="btn_regis">&nbsp;เข้าสู่ระบบ</button>
                            <br>
                            <div class="pt-3 text-main">
                                <span>ยังไม่มีบัญชี <a class="ms-1" href="?page=register">&nbsp;สมัครสมาชิกตอนนี้</a></span>
                            </div>
                </div>
            </div>
        </div>
    </div>
</div>
<script type="text/javascript">
    $("#btn_regis").click(function(e) {
        e.preventDefault();
        var formData = new FormData();
        formData.append('user', $("#user").val());
        formData.append('pass', $("#pass").val());
        $('#btn_regis').attr('disabled', 'disabled');
        $.ajax({
            type: 'POST',
            url: 'services/login.php',
            data: formData,
            contentType: false,
            processData: false,
        }).done(function(res) {

            result = res;
            console.log(result);
            if (res.status == "success") {
                Swal.fire({
                    icon: 'success',
                    title: 'สำเร็จ',
                    text: result.message
                }).then(function() {
                    window.location = "?page=home";
                });
            }
            if (res.status == "fail") {
                Swal.fire({
                    icon: 'error',
                    title: 'ผิดพลาด',
                    text: result.message
                });
                $('#btn_regis').removeAttr('disabled');
            }
        }).fail(function(jqXHR) {
            console.log(jqXHR);
            res = jqXHR.responseJSON;
            Swal.fire({
                icon: 'error',
                title: 'ผิดพลาด',
                text: res.message
            });
            $('#btn_regis').removeAttr('disabled');
        });
    });
</script>
`;
}

// ---------------- REGISTER ----------------
export function bodyRegister(st: Record<string, string>): string {
  const name = st.site_name || "Ahtee";
  return `${PAGE_HEAD_STYLE}<div class="container-fluid p-4">
    <div class="container-sm m-cent ps-4 pe-4">
        <center>
            <div class="col-lg-6 m-auto bg-custom shadow-sm p-0 pb-3" style="border-radius: 0.5vh;">
                <div class="col-10 col-lg-12 m-cent pt-4" style="margin-bottom: 4em!important; ">
                    <center>
                        <h1 class="text-strongest mt-3" style="font-size: 48px; text-transform: uppercase;">${esc(name)}</h1>
                        <h3 class="text-strongest mb-3">สร้างบัญชี</h3>
                    </center>
                    <div class="container-fluid ps-0 pe-0" style="margin-top: 1em;">

                        <div class="col-lg-8 m-cent mt-2">

                            <div class="mb-1 text-start">
                                <label class="ms-1"> ชื่อผู้ใช้</label>
                                <input type="text" id="user" class="form-control" placeholder="Username" aria-describedby="basic-addon1" style="border-radius: 0.5vh;">
                            </div>

                            <div class="mb-1 text-start">
                                <label class="ms-1"> รหัสผ่าน</label>
                                <input type="password" id="pass" class="form-control" placeholder="Password" aria-describedby="basic-addon1" style="border-radius: 0.5vh;">
                            </div>

                            <div class="mb-3 text-start">
                                <label class="ms-1"> รหัสผ่านอีกครั้ง</label>
                                <input type="password" id="pass2" class="form-control" placeholder="Confirm password" aria-describedby="basic-addon1" style="border-radius: 0.5vh;">
                            </div>
                            <div class="mt-3">
                                <div id="captcha" class="cf-turnstile" data-sitekey="0x4AAAAAAAHloNCBDFBETKy5" data-theme="light" data-callback="onloadTurnstileCallback"></div>
                            </div>
                            <br>
                            <button class="btn bg-main   text-white  ps-4 pe-4  pt-2 pb-2 w-100 d-inline" id="btn_regis">&nbsp;สมัครสมาชิก</button>
                            <br>
                            <div class="pt-3 text-main">
                                <span>มีบัญชีแล้ว? <a class="ms-1" href="?page=login">&nbsp;เข้าสู่ระบบตอนนี้</a></span>
                            </div>
                    </div>
                </div>
        </center>
    </div>
</div>


<script type="text/javascript">
    $("#btn_regis").click(function(e) {
        e.preventDefault();
        var formData = new FormData();
        formData.append('user', $("#user").val());
        formData.append('pass', $("#pass").val());
        formData.append('pass2', $("#pass2").val());
        formData.append('captcha', captcha);
        $('#btn_regis').attr('disabled', 'disabled');
        $.ajax({
            type: 'POST',
            url: 'services/register.php',
            data: formData,
            contentType: false,
            processData: false,
        }).done(function(res) {

            result = res;
            console.log(result);
            
            if (res.status == "success") {
                Swal.fire({
                    icon: 'success',
                    title: 'สำเร็จ',
                    text: result.message
                }).then(function() {
                    window.location = "?page=home";
                });
            }
            if (res.status == "fail") {
                Swal.fire({
                    icon: 'error',
                    title: 'ผิดพลาด',
                    text: result.message
                });
                $('#btn_regis').removeAttr('disabled');
            }
        }).fail(function(jqXHR) {
            console.log(jqXHR);
            //   res = jqXHR.responseJSON;
            
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: res.message
            })
            //console.clear();
            $('#btn_regis').removeAttr('disabled');
        });
    });
    
</script>
`;
}

// ---------------- SHOP ----------------
export async function bodyShop(st: Record<string, string>, user: SessionUser | null, catId: string | null): Promise<string> {
  const name = st.site_name || "Ahtee";
  if (catId) {
    const cat = await db.category.findUnique({ where: { id: catId }, include: { products: { where: { active: true }, orderBy: { createdAt: "desc" } } } });
    if (!cat) return bodyShop(st, user, null);
    let cards = "";
    if (cat.products.length > 0) {
      const rows = await Promise.all(
        cat.products.map(async (p) => {
          const stock = await db.productItem.count({ where: { productId: p.id, sold: false } });
          return productCard({ id: p.id, name: p.name, img: p.image || "assets/icon/x/category.svg", price: p.price, stock, buyPage: "buy", buyLabel: "สั่งซื้อสินค้า", aos: ` data-aos="zoom-in"` });
        })
      );
      cards = CARD_STYLE + `<div class="row justify-content-center justify-content-lg-start">` + rows.join("") + `</div>`;
    }
    return `${IMG_ANIM_STYLE}<div class="container-fluid p-0 ">
    <div class="container-sm m-cent p-0 pt-4 ">
        <div class="container-sm ">
            <div class="container-fluid">
                <div class="container-fluid" data-aos="zoom-in">
                    <center>
                        <div class="col-12 col-lg-12 p-0 mb-2" style="border-radius: 1vh;">
                            <div class="d-flex justify-content-between">
                                <div class="text-center text-lg-start">
                                    <h2 class=" mt-2 mb-0 font-semibold"><img src="assets/icon/x/category.svg" alt="" class="hx-ic" style="height:2.3rem;width:2.3rem;vertical-align:middle;margin:-.2rem .45rem 0 0"><b>${esc(cat.name)}</b></h2>
                                </div>
                                <a class="btn nav-link align-self-center bg-main mt-0" href="?page=shop" style="height: fit-content;border-radius: 1vh;"><b style="color: #ffffff;">ย้อนกลับ</b></a>
                            </div>
                        </div>
                    </center>
                    <hr>
                    ${cat.products.length === 0 ? `<div class="row justify-content-center justify-content-lg-start"><h6 class=" text-center">ยังไม่มีสินค้าในหมวดนี้</h6></div>` : cards}
                </div>
            </div>
        </div>
    </div>
</div>`;
  }

  const cats = await db.category.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } });
  let rows = "";
  if (cats.length === 0) {
    rows = `<h6 class=" text-center">ไม่มีหมวดหมู่ในตอนนี้</h6>`;
  } else {
    rows =
      CARD_STYLE +
      IMG_ANIM_STYLE +
      `<div class="row justify-content-center justify-content-lg-start">` +
      (
        await Promise.all(
          cats.map(async (c) => {
            const n = await db.product.count({ where: { categoryId: c.id, active: true } });
            return `<div class="col-6 col-md-4 col-lg-3 mb-4" data-aos="zoom-in">
                    <div class="card-anim">
                        <div class="card-anim-main bg-custom border-hov shadow-sm p-1" style="border-radius: 1vh; height: fit-content;">
                            <div class="p-1">
                                <a href="?page=shop&amp;cat=${esc(c.id)}">
                                    <div class="img-anim">
                                        <img src="${esc(c.image || "assets/icon/x/category.svg")}" alt="${esc(c.name)}">
                                        <div class="bg"></div>
                                        <div class="text">เข้าชม</div>
                                    </div>
                                    <div class="p-3 pt-3 pb-1">
                                        <h5 class="text-strongest mb-1" style="word-wrap: break-word;">${esc(c.name)}</h5>
                                        <div class="d-flex justify-content-between mb-2">
                                            <p class="text-main align-self-center m-0 h6"><strong>${n} สินค้า</strong></p>
                                        </div>
                                        <center>
                                            <a class="btn-main btn w-100 pd-sm-font mb-2 font-semibold" href="?page=shop&amp;cat=${esc(c.id)}" style="border-radius: 10px;">เข้าชมหมวดนี้</a>
                                        </center>
                                    </div>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>`;
          })
        )
      ).join("") +
      `</div>`;
  }
  return `<div class="container-fluid p-0 "> <div class="container-sm m-cent p-0 pt-4 "> <div class="container-sm "> <div class="container-fluid"> <div class="container-fluid" data-aos="zoom-in"> <center> <div class="col-12 col-lg-12 p-0 mb-2" style="border-radius: 1vh;"> <div class="d-flex justify-content-between"> <div class="text-center text-lg-start"> <h2 class=" mt-2 mb-0 font-semibold"><img src="assets/icon/x/category.svg" alt="" class="hx-ic" style="height:2.3rem;width:2.3rem;vertical-align:middle;margin:-.2rem .45rem 0 0"><b>หมวดหมู่ทั้งหมด</b></h2> </div> <a class="btn nav-link align-self-center bg-main mt-0" onclick="window.history.back()" style="height: fit-content;border-radius: 1vh;"><b style="color: #ffffff;">ย้อนกลับ</b></a> </div> </div> </center> <hr> <div class="row justify-content-center justify-content-lg-start"> ${rows} </div> </div> </div> </div> </div> </div>`;
}

// ---------------- PAYMENT ----------------
export function bodyPayment(): string {
  return `${pageBanner("assets/icon/x/topup.svg", "ช่องทางการชำระเงิน")}
                        <div class="col-lg-3">
                            <div class="container-fluid bg-custom p-4 pt-5 rounded shadow-sm border-ys count-only" style="border-radius: 1vh;">
                                <a href="?page=truemoney" style="text-decoration: none;">
                                    <center>
                                        <img src="assets/icon/pay_wallet.png" class="img-fluid mb-3" alt="TrueMoney Wallet" style="height: 100px;">
                                        <h2 class="ms-1 mb-0">TrueMoney Wallet</h2>
                                        <small class="ms-1">เติมเงินผ่านซองอั่งเปา หรือสแกนสลิป</small>
                                    </center>
                                </a>
                            </div>
                        </div>

                        <div class="col-lg-3">
                            <div class="container-fluid bg-custom p-4 pt-5 rounded shadow-sm border-ys count-only" style="border-radius: 1vh;">
                                <a href="?page=slip" style="text-decoration: none;">
                                    <center>
                                        <img src="assets/icon/pay_bank.png" class="img-fluid mb-3" alt="Slip Verification" style="height: 100px;">
                                        <h2 class="ms-1 mb-0">Slip Verification</h2>
                                        <small class="ms-1">เติมเงินผ่านการเช็คสลิป</small>
                                    </center>
                                </a>
                            </div>
                        </div>

                        <div class="col-lg-3">
                            <div class="container-fluid bg-custom p-4 pt-5 rounded shadow-sm border-ys count-only" style="border-radius: 1vh;">
                                <a href="?page=redeem" style="text-decoration: none;">
                                    <center>
                                        <img src="assets/icon/pay_code.png" class="img-fluid mb-3" alt="กรอกโค้ด" style="height: 100px;">
                                        <h2 class="ms-1 mb-0">กรอกโค้ด</h2>
                                        <small class="ms-1">กรอกโค้ดรับเงินจากร้านค้า</small>
                                    </center>
                                </a>
                            </div>
                        </div>
${pageBannerEnd()}`;
}

function topupForm(title: string, inner: string, js: string): string {
  return `${PAGE_HEAD_STYLE}<div class="container-fluid p-4">
    <div class="container-sm m-cent ps-4 pe-4">
        <center>
            <div class="col-lg-6 m-auto bg-custom shadow-sm p-0 pb-3" style="border-radius: 0.5vh;">
                <div class="col-10 col-lg-12 m-cent pt-4" style="margin-bottom: 4em!important; ">
                    <center>
                        <h1 class=" text-strongest mt-3" style="font-size: 40px; text-transform: uppercase;">${title}</h1>
                        <h3 class=" text-strongest mb-3">เติมเงินเข้าระบบ</h3>
                    </center>
                    <div class="container-fluid ps-0 pe-0" style="margin-top: 1em;">
                        <div class="col-lg-10 m-cent mt-2">
                            ${inner}
                            <br>
                            <button class="btn bg-main text-white ps-4 pe-4 pt-2 pb-2 w-100 d-inline" id="btn_topup">&nbsp;ยืนยันรายการ</button>
                            <br>
                            <div class="pt-3 text-main">
                                <span><a class="ms-1" href="?page=payment">&nbsp;<i class="fa-solid fa-turn-down-left"></i> กลับไปช่องทางเติมเงิน</a></span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </center>
    </div>
</div>
<script>
$(function(){
    $("#btn_topup").click(function(e){
        e.preventDefault();
        var f = new FormData();
        ${js}
        $('#btn_topup').attr('disabled','disabled');
        $.ajax({ type:'POST', url:'services/topup.php', data:f, contentType:false, processData:false })
        .done(function(res){
            Swal.fire({icon: res.status=='success'?'success':'error', title: res.status=='success'?'สำเร็จ':'ผิดพลาด', text: res.message})
            .then(function(){ if(res.status=='success'){ window.location='?page=payment'; } else { $('#btn_topup').removeAttr('disabled'); } });
        }).fail(function(jq){
            var res = jq.responseJSON || {message:'เกิดข้อผิดพลาด'};
            Swal.fire({icon:'error', title:'ผิดพลาด', text: res.message});
            $('#btn_topup').removeAttr('disabled');
        });
    });
});
</script>
`;
}

export function bodyTruemoney(): string {
  return topupForm(
    "TrueMoney Wallet",
    `<div class="mb-1 text-start">
        <label class="ms-1">ลิงก์ / เบอร์โทรศัพท์ซองอั่งเปา</label>
        <input type="text" id="v_code" class="form-control" placeholder="https://gift.truemoney.com/cash/?code=...." style="border-radius: 0.5vh;">
    </div>
    <small class="text-muted ms-1 d-block mb-2">ตั้งรหัสของซองเป็นข้อความอะไรก็ได้ (ไม่ต้องบอกร้าน) — เมื่อกดยืนยัน ทางร้านจะรับซองและเติมเงินเข้าบัญชีให้โดยเร็วที่สุด</small>`,
    `f.append('method','truemoney');
        f.append('code', $("#v_code").val());`
  );
}

export function bodySlip(): string {
  return topupForm(
    "Slip Verification",
    `<div class="mb-1 text-start">
        <label class="ms-1">จำนวนเงิน (บาท)</label>
        <input type="number" id="v_amount" class="form-control" placeholder="0.00" min="1" step="0.01" style="border-radius: 0.5vh;">
    </div>
    <div class="mb-1 text-start">
        <label class="ms-1">แนบสลิปการโอนเงิน</label>
        <input type="file" id="v_slip" class="form-control" accept="image/*" style="border-radius: 0.5vh;">
    </div>
    <small class="text-muted ms-1 d-block mb-2">แนบสลิปที่โอนสำเร็จแล้ว ร้านจะตรวจสอบและเติมเงินให้โดยเร็วที่สุด</small>`,
    `f.append('method','slip');
        f.append('amount', $("#v_amount").val());
        if ($("#v_slip")[0].files[0]) f.append('slip', $("#v_slip")[0].files[0]);`
  );
}

export function bodyRedeem(): string {
  return topupForm(
    "กรอกโค้ด",
    `<div class="mb-1 text-start">
        <label class="ms-1">โค้ดรับเงิน</label>
        <input type="text" id="v_code" class="form-control" placeholder="XXXXXXXX" style="border-radius: 0.5vh;">
    </div>
    <small class="text-muted ms-1 d-block mb-2">กรอกโค้ดที่ได้รับจากร้านค้า ระบบจะเติมเงินเข้าบัญชีทันที</small>`,
    `f.append('method','redeem');
        f.append('code', $("#v_code").val());`
  );
}

// ---------------- INFORMATION (profile) ----------------
export function bodyInformation(st: Record<string, string>, user: SessionUser): string {
  return `${pageBanner("assets/icon/x/user.svg", "ข้อมูลส่วนตัว")}
                        <div class="col-lg-3">
                            <div class="container-fluid bg-custom p-4 pt-5 rounded shadow-sm border-ys count-only" style="border-radius: 1vh;">
                                <center>
                                    <img src="assets/icon/x/coin.svg" class="img-fluid mb-3" alt="point" style="height: 100px;">
                                    <h2 class=" ms-1 mb-0">POINT : <span class="ms-1">${fmtBal(user.balance)}</span></h2>
                                    <small class="ms-1">ยอดเงินในบัญชี : <span class="ms-1">${fmtBal(user.balance)} บาท</span></small>
                                </center>
                            </div>
                        </div>
                        <div class="col-lg-3">
                            <div class="container-fluid bg-custom p-4 pt-5 rounded shadow-sm border-ys count-only" style="border-radius: 1vh;">
                                <center>
                                    <img src="assets/icon/x/star.svg" class="img-fluid mb-3" alt="แต้ม" style="height: 100px;">
                                    <h2 class=" ms-1 mb-0">แต้มสะสม : <span class="ms-1">${fmtNum(user.points)}</span></h2>
                                    <small class="ms-1">สามารถนำแต้มสะสมไปแลกรางวัลได้</small>
                                </center>
                            </div>
                        </div>
                        <div class="col-lg-3">
                            <div class="container-fluid bg-custom p-4 pt-5 rounded shadow-sm border-ys count-only" style="border-radius: 1vh;">
                                <a href="?page=profile&subpage=cpass" style="text-decoration: none;">
                                    <center>
                                        <img src="assets/icon/x/edit.svg" class="img-fluid mb-3" alt="เปลี่ยนรหัสผ่าน" style="height: 100px;">
                                        <h2 class=" ms-1 mb-0">เปลี่ยนรหัสผ่าน</h2>
                                        <small class="ms-1">สามารถเปลี่ยนรหัสผ่านได้ที่นี่</small>
                                    </center>
                                </a>
                            </div>
                        </div>
                        <div class="col-lg-3">
                            <div class="container-fluid bg-custom p-4 pt-5 rounded shadow-sm border-ys count-only" style="border-radius: 1vh;">
                                <a href="?page=my_order" style="text-decoration: none;">
                                    <center>
                                        <img src="assets/icon/x/history.svg" class="img-fluid mb-3" alt="Order" style="height: 100px;">
                                        <h2 class=" ms-1 mb-0">Order ของคุณ</h2>
                                        <small class="ms-1">ดูสถานะ Order ของคุณได้ที่นี่</small>
                                    </center>
                                </a>
                            </div>
                        </div>
                        <div class="col-lg-3">
                            <div class="container-fluid bg-custom p-4 pt-5 rounded shadow-sm border-ys count-only" style="border-radius: 1vh;">
                                <a href="?page=history" style="text-decoration: none;">
                                    <center>
                                        <img src="assets/icon/x/history.svg" class="img-fluid mb-3" alt="ประวัติ" style="height: 100px;">
                                        <h2 class=" ms-1 mb-0">ประวัติทั้งหมด</h2>
                                        <small class="ms-1">ดูได้ที่นี่</small>
                                    </center>
                                </a>
                            </div>
                        </div>

                        <div class="col-lg-3 mt-3">
                            <div class="container-fluid bg-custom p-4 pt-5 rounded shadow-sm border-ys count-only" style="border-radius: 1vh;">
                                <a href="?page=logout" style="text-decoration: none;">
                                    <center>
                                        <img src="assets/icon/x/logout.svg" class="img-fluid mb-3" alt="ออกจากระบบ" style="height: 100px;">
                                        <h2 class=" ms-1 mb-0">ออกจากระบบ</h2>
                                        <small class="ms-1">Good Bye</small>
                                    </center>
                                </a>
                            </div>
                        </div>
                                                <div class="col-lg-3 mt-3">
                            <div class="container-fluid bg-custom p-4 pt-5 rounded shadow-sm border-ys count-only" style="border-radius: 1vh;">
                                <a href="?page=my_premiumapp" style="text-decoration: none;">
                                    <center>
                                        <img src="assets/icon/x/service.svg" class="img-fluid mb-3" alt="แอพพรีเมี่ยม" style="height: 100px;">
                                        <h2 class=" ms-1 mb-0">แอพ Premium</h2>
                                        <small class="ms-1">ประวัติซื้อแอพพรีเมี่ยม</small>
                                    </center>
                                </a>
                            </div>
                        </div>
${pageBannerEnd()}`;
}

// ---------------- CHANGE PASSWORD ----------------
export function bodyCpass(): string {
  return `${PAGE_HEAD_STYLE}<div class="container-fluid p-4">
    <div class="container-sm m-cent ps-4 pe-4">
        <center>
            <div class="col-lg-6 m-auto bg-custom shadow-sm p-0 pb-3" style="border-radius: 0.5vh;">
                <div class="col-10 col-lg-12 m-cent pt-4" style="margin-bottom: 4em!important; ">
                    <center>
                        <h3 class=" text-strongest mb-3 mt-3"><i class="fa-solid fa-key"></i> เปลี่ยนรหัสผ่าน</h3>
                    </center>
                    <div class="container-fluid ps-0 pe-0" style="margin-top: 1em;">
                        <div class="col-lg-8 m-cent mt-2">
                            <div class="mb-1 text-start">
                                <label class="ms-1"> รหัสผ่านเดิม</label>
                                <input type="password" id="old_pass" class="form-control" placeholder="Old password" style="border-radius: 0.5vh;">
                            </div>
                            <div class="mb-1 text-start">
                                <label class="ms-1"> รหัสผ่านใหม่</label>
                                <input type="password" id="new_pass" class="form-control" placeholder="New password" style="border-radius: 0.5vh;">
                            </div>
                            <div class="mb-3 text-start">
                                <label class="ms-1"> รหัสผ่านใหม่อีกครั้ง</label>
                                <input type="password" id="new_pass2" class="form-control" placeholder="Confirm new password" style="border-radius: 0.5vh;">
                            </div>
                            <button class="btn bg-main text-white ps-4 pe-4 pt-2 pb-2 w-100 d-inline" id="btn_cpass">&nbsp;บันทึกรหัสผ่านใหม่</button>
                            <br>
                            <div class="pt-3 text-main">
                                <span><a class="ms-1" href="?page=information">&nbsp;<i class="fa-solid fa-turn-down-left"></i> กลับไปข้อมูลบัญชี</a></span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </center>
    </div>
</div>
<script>
$(function(){
    $("#btn_cpass").click(function(e){
        e.preventDefault();
        var f = new FormData();
        f.append('action','cpass');
        f.append('old', $("#old_pass").val());
        f.append('new', $("#new_pass").val());
        f.append('new2', $("#new_pass2").val());
        $('#btn_cpass').attr('disabled','disabled');
        $.ajax({type:'POST', url:'services/account.php', data:f, contentType:false, processData:false})
        .done(function(res){
            Swal.fire({icon: res.status=='success'?'success':'error', title: res.status=='success'?'สำเร็จ':'ผิดพลาด', text: res.message});
            $('#btn_cpass').removeAttr('disabled');
        }).fail(function(jq){
            var res = jq.responseJSON || {message:'เกิดข้อผิดพลาด'};
            Swal.fire({icon:'error', title:'ผิดพลาด', text: res.message});
            $('#btn_cpass').removeAttr('disabled');
        });
    });
});
</script>
`;
}

// ---------------- HISTORY ----------------
export type HistoryRow = { name: string; reward: string; date: Date; ok: boolean };
export function bodyHistory(rows: HistoryRow[]): string {
  let trs = "";
  let i = 1;
  for (const r of rows) {
    trs += `<tr>
                        <td class="text-center">${i++}</td>
                        <td>${esc(r.name)}</td>
                        <td>${esc(r.reward)}</td>
                        <td>${thDate(r.date)}</td>
                    </tr>`;
  }
  return `<div class="container-fluid p-4">
    <div class="container-sm m-auto p-4 pt-0" data-aos="zoom-in">
        <div class="container-fluid ps-4 pe-4 bg-custom ">
        <center class="m-0"><h2 class=" mb-2 mt-4"><img src="assets/icon/x/history.svg" alt="" class="hx-ic" style="height:2rem;width:2rem;vertical-align:middle;margin:-.2rem .45rem 0 0">ประวัติการสั่งซื้อ</h2></center>
        <hr class="mt-1">
            <div class="table-responsive">
                <table class="table   table-striped " id="table">
                    <thead>
                    <tr>
                        <th scope="col" class="text-center">#</th>
                        <th scope="col">ชื่อรายการ</th>
                        <th scope="col">ของรางวัล</th>
                        <th scope="col">วันที่</th>
                    </tr>
                    </thead>
                    <tbody>
                    ${trs || `<tr><td colspan="4" class="text-center text-muted">ยังไม่มีรายการ</td></tr>`}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>`;
}

// ---------------- MY ORDER ----------------
export type OrderRow = { no: string; name: string; qty: number; total: number; payload: string; status: string; date: Date };
export function bodyMyOrder(rows: OrderRow[]): string {
  let trs = "";
  let i = 1;
  for (const r of rows) {
    const badge = r.status === "success" ? `<span class="badge bg-success">สำเร็จ</span>` : `<span class="badge bg-warning">รอดำเนินการ</span>`;
    trs += `<tr>
                        <td class="text-center">${i++}</td>
                        <td>${esc(r.name)} <small class="text-muted">(${esc(r.no)})</small></td>
                        <td>${r.qty}</td>
                        <td>${fmtBal(r.total)} บาท</td>
                        <td style="white-space:pre-wrap;word-break:break-all;">${esc(r.payload)}</td>
                        <td>${badge}</td>
                        <td>${thDate(r.date)}</td>
                    </tr>`;
  }
  return `<div class="container-fluid p-4">
    <div class="container-sm m-auto p-4 pt-0" data-aos="zoom-in">
        <div class="container-fluid ps-4 pe-4 bg-custom ">
        <center class="m-0"><h2 class=" mb-2 mt-4"><img src="assets/icon/x/history.svg" alt="" class="hx-ic" style="height:2rem;width:2rem;vertical-align:middle;margin:-.2rem .45rem 0 0">Order ของคุณ</h2></center>
        <hr class="mt-1">
            <div class="table-responsive">
                <table class="table table-striped " id="table">
                    <thead>
                    <tr>
                        <th scope="col" class="text-center">#</th>
                        <th scope="col">รายการ</th>
                        <th scope="col">จำนวน</th>
                        <th scope="col">รวม</th>
                        <th scope="col">ของที่ได้รับ</th>
                        <th scope="col">สถานะ</th>
                        <th scope="col">วันที่</th>
                    </tr>
                    </thead>
                    <tbody>
                    ${trs || `<tr><td colspan="7" class="text-center text-muted">ยังไม่มีรายการสั่งซื้อ</td></tr>`}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>`;
}

// ---------------- MY PREMIUM APP ----------------
export function bodyMyApp(rows: { no: string; name: string; total: number; payload: string; date: Date }[]): string {
  let trs = "";
  let i = 1;
  for (const r of rows) {
    trs += `<tr>
                        <td class="text-center">${i++}</td>
                        <td>${esc(r.name)} <small class="text-muted">(${esc(r.no)})</small></td>
                        <td>${fmtBal(r.total)} บาท</td>
                        <td style="white-space:pre-wrap;word-break:break-all;">${esc(r.payload)}</td>
                        <td>${thDate(r.date)}</td>
                    </tr>`;
  }
  return `<div class="container-fluid p-4">
    <div class="container-sm m-auto p-4 pt-0" data-aos="zoom-in">
        <div class="container-fluid ps-4 pe-4 bg-custom ">
        <center class="m-0"><h2 class=" mb-2 mt-4"><img src="assets/icon/x/service.svg" alt="" class="hx-ic" style="height:2rem;width:2rem;vertical-align:middle;margin:-.2rem .45rem 0 0">แอพพรีเมี่ยมของคุณ</h2></center>
        <hr class="mt-1">
            <div class="table-responsive">
                <table class="table table-striped " id="table">
                    <thead>
                    <tr>
                        <th scope="col" class="text-center">#</th>
                        <th scope="col">รายการ</th>
                        <th scope="col">ราคา</th>
                        <th scope="col">ข้อมูลที่ได้รับ</th>
                        <th scope="col">วันที่</th>
                    </tr>
                    </thead>
                    <tbody>
                    ${trs || `<tr><td colspan="5" class="text-center text-muted">ยังไม่มีรายการ</td></tr>`}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>`;
}

// ---------------- CONTACT ----------------
export function bodyContact(st: Record<string, string>): string {
  const fb = st.contact_facebook_url || "";
  const dc = st.contact_discord_url || "";
  return `${pageBanner("assets/icon/x/contact.svg", "ช่องทางการติดต่อ")}
                        <div class="col-lg-3">
                            <div class="container-fluid bg-custom p-4 pt-5 rounded shadow-sm border-ys count-only" style="border-radius: 1vh;">
                                <a href="${esc(fb)}" style="text-decoration: none;">
                                    <center>
                                        <img src="assets/icon/x/facebook.svg" class="img-fluid mb-3" alt="Facebook" style="height: 100px;">
                                        <h2 class="ms-1 mb-0">Facebook</h2>
                                    </center>
                                </a>
                            </div>
                        </div>

                        <div class="col-lg-3">
                            <div class="container-fluid bg-custom p-4 pt-5 rounded shadow-sm border-ys count-only" style="border-radius: 1vh;">
                                <a href="${esc(dc)}" style="text-decoration: none;">
                                    <center>
                                        <img src="assets/icon/x/discord.svg" class="img-fluid mb-3" alt="Discord" style="height: 100px;">
                                        <h2 class="ms-1 mb-0">Discord</h2>
                                    </center>
                                </a>
                            </div>
                        </div>
${pageBannerEnd()}`;
}

// ---------------- SEARCH ----------------
export function bodySearch(q: string, results: { id: string; name: string; img: string; price: number; stock: number }[] | null): string {
  let inner: string;
  if (results === null) {
    inner = `<div class="hm-head">
    <h2><img src="assets/icon/x/search.svg" alt="" class="hx-ic" style="height:2rem;width:2rem;vertical-align:middle;margin:-.2rem .45rem 0 0">ค้นหาสินค้า</h2>
      </div>
      <div class="hm-empty card">พิมพ์ชื่อสินค้าในช่องค้นหาด้านบน</div>`;
  } else {
    const cards =
      results.length > 0
        ? CARD_STYLE + `<div class="row justify-content-center justify-content-lg-start">` + results.map((r) => productCard({ id: r.id, name: r.name, img: r.img, price: r.price, stock: r.stock, buyPage: "buy", buyLabel: "สั่งซื้อสินค้า", aos: ` data-aos="zoom-in"` })).join("") + `</div>`
        : `<div class="hm-empty card">ไม่พบสินค้าที่ตรงกับ “${esc(q)}” ลองใช้คำที่สั้นลง หรือ <a href="?page=shop">ดูสินค้าทั้งหมด</a></div>`;
    inner = `<div class="hm-head">
    <h2><img src="assets/icon/x/search.svg" alt="" class="hx-ic" style="height:2rem;width:2rem;vertical-align:middle;margin:-.2rem .45rem 0 0">ผลการค้นหา “${esc(q)}”</h2> <span class="hm-sub">${results.length} รายการ</span>
      </div>
      ${cards}`;
  }
  return `<div class="container hm">
  ${inner}
  </div>`;
}

// ---------------- INBOX ----------------
export function bodyInbox(msgs: { id: string; title: string; body: string; raw: string; read: boolean; createdAt: Date }[], csrf: string): string {
  let items = "";
  for (const m of msgs) {
    items += `<div class="card p-3 ib-item${m.read ? "" : " unread"}" data-id="${esc(m.id)}">
      <div class="d-flex justify-content-between align-items-start gap-2">
        <div>
          <b>${m.read ? "" : `<span class="ib-dot me-2"></span>`}${esc(m.title)}</b>
          <div class="small text-muted">${m.createdAt.toLocaleString("th-TH")}</div>
        </div>
        <div class="text-nowrap">
          ${m.raw ? `<button class="btn btn-sm btn-outline-secondary ib-copy"><i class="fa-solid fa-copy"></i> คัดลอก</button>` : ""}
          <button class="btn btn-sm btn-outline-danger ib-del"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>
      <div class="ib-body mt-2">${esc(m.body)}</div>
      ${m.raw ? `<textarea class="ib-raw d-none">${esc(m.raw)}</textarea>` : ""}
    </div>`;
  }
  return `<style>
  .ib-item { border-radius: 1vh; margin-bottom: .6rem; cursor: pointer; transition: transform .1s; }
  .ib-item:hover { transform: translateY(-1px); }
  .ib-item.unread { border-left: 4px solid var(--c-main, var(--main)) !important; }
  .ib-body { display: none; white-space: normal; word-break: break-word; }
  .ib-item.open .ib-body { display: block; }
  .ib-dot { width: 9px; height: 9px; border-radius: 50%; background: var(--c-main, var(--main)); display: inline-block; }
</style>
<div class="container-sm mt-3 mb-5">
  <div class="d-flex justify-content-between align-items-center mb-3">
    <h3 class="m-0"><img src="assets/icon/x/inbox.svg" alt="" class="hx-ic" style="height:2.3rem;width:2.3rem;vertical-align:middle;margin:-.2rem .45rem 0 0">กล่องข้อความ</h3>
    ${msgs.length > 0 ? `<button class="btn btn-outline-secondary btn-sm" id="ib_all">อ่านทั้งหมด</button>` : ""}
      </div>
      ${msgs.length === 0 ? `<div class="card p-5 text-center"><p class="m-0 text-muted">ยังไม่มีข้อความ</p></div>` : items}
    </div>
<script>
(function(){
  var csrf = "${esc(csrf)}";
  function post(d){ d.csrf = csrf; return $.post('services/inbox.php', d).done(function(r){ $('.inbox-count').text(r.unread).toggle(r.unread > 0); }); }
  $('.ib-item').on('click', function(e){
    if ($(e.target).closest('button,a').length) return;
    var it = $(this); it.toggleClass('open');
    if (it.hasClass('unread')) { it.removeClass('unread').find('.ib-dot').remove(); post({action:'read', id: it.data('id')}); }
  });
  $('#ib_all').on('click', function(){ post({action:'read_all'}).done(function(){ $('.ib-item').removeClass('unread'); $('.ib-dot').remove(); }); });
  $('.ib-copy').on('click', function(){
    var t = $(this).closest('.ib-item').find('.ib-raw').val();
    (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.resolve()).then(function(){ Swal.fire({icon:'success', title:'คัดลอกแล้ว', timer:1100, showConfirmButton:false}); });
  });
  $('.ib-del').on('click', function(){
    var it = $(this).closest('.ib-item');
    Swal.fire({title:'ลบข้อความนี้?', icon:'warning', showCancelButton:true, confirmButtonText:'ลบ', cancelButtonText:'ยกเลิก'}).then(function(r){
      if (r.isConfirmed) post({action:'delete', id: it.data('id')}).done(function(){ it.remove(); });
    });
  });
  })();
</script>`;
}

// ---------------- REWARD ----------------
export function bodyReward(rewards: { id: string; name: string; detail: string; image: string; pointsCost: number; stock: number }[]): string {
  let inner = `<div class="row justify-content-center justify-content-lg-start">
            </div>`;
  if (rewards.length > 0) {
    inner =
      CARD_STYLE +
      `<div class="row justify-content-center justify-content-lg-start">` +
      rewards
        .map(
          (r) => `<div class="col-12 col-lg-3 mb-4 justify-content-center" data-aos="zoom-in">
                <div class="card-anim">
                    <div class="card-anim-main bg-custom border-hov shadow-sm p-1" style="border-radius: 1vh; height: fit-content;">
                        <div class="p-1">
                            <div class="view overlay">
                                <center>
                                    <img class="img-fluid " src="${esc(r.image || "assets/icon/x/gift.svg")}" alt="${esc(r.name)}" style="border-radius: 1vh; width: 100%; max-width: 100vh;">
                                </center>
                            </div>
                            <div class="p-3 pt-3 pb-1">
                                <h5 class="text-strongest mb-1" style="word-wrap: break-word;">${esc(r.name)}</h5>
                                <div class="d-flex justify-content-between mb-2">
                                    <div class="d-flex">
                                        <p class="text-main align-self-center m-0 h6 me-1"><strong>คงเหลือ ${fmtNum(r.stock)} ชิ้น</strong></p>
                                    </div>
                                    <p class="text-white main-badge bg-main align-self-center m-0"><strong style="color: #ffffff;">${fmtNum(r.pointsCost)} แต้ม</strong></p>
                                </div>
                                <center>
                                    <a class="btn-main btn w-100 pd-sm-font mb-2 font-semibold" href="#" onclick="doRedeem('${esc(r.id)}','${esc(r.name)}',${r.pointsCost});return false;" style="border-radius: 10px;">แลกรางวัล</a>
                                </center>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`
        )
        .join("") +
      `</div>
<script>
function doRedeem(id, name, cost){
    Swal.fire({title:'แลกรางวัล?', text: name + " ใช้ " + cost + " แต้ม", icon:'question', showCancelButton:true, confirmButtonText:'แลกเลย', cancelButtonText:'ยกเลิก'})
    .then(function(r){
        if(!r.isConfirmed) return;
        var f = new FormData(); f.append('id', id);
        $.post('services/reward.php', {id: id, csrf: window.CSRF}).done(function(res){
            Swal.fire({icon: res.status=='success'?'success':'error', title: res.status=='success'?'สำเร็จ':'ผิดพลาด', text: res.message})
            .then(function(){ if(res.status=='success') window.location.reload(); });
        }).fail(function(jq){ var res=jq.responseJSON||{message:'เกิดข้อผิดพลาด'}; Swal.fire({icon:'error',title:'ผิดพลาด',text:res.message}); });
    });
}
</script>`;
  }
  return `<style>
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
</style>
<div class="container-sm">
    <center>
        <div class="col-12 col-lg-12  p-2 mb-2" style="border-radius: 1vh;">
            <div class="d-flex justify-content-between">
                <div class="text-center text-lg-start">
                    <h2 class=" mt-2 mb-0 font-bold"><img src="assets/icon/x/gift.svg" alt="" class="hx-ic" style="height:2.3rem;width:2.3rem;vertical-align:middle;margin:-.2rem .45rem 0 0"><b>แลกแต้ม</b></h2>
                </div>
                <a class="btn nav-link align-self-center bg-main mt-2 font-semibold" href="?page=home" style="height: fit-content;border-radius: 1vh;"><b style="color: #ffffff;">ย้อนกลับ</b></a>
            </div>
        </div>
    </center>
    ${rewards.length === 0 ? `<div class="hx-empty card">ยังไม่มีรางวัลในตอนนี้</div>` : inner}
</div>`;
}

// ---------------- RANDOM WHEEL ----------------
export function bodyWheelList(wheels: { id: string; name: string; cost: number; currency: string }[]): string {
  let inner = "";
  if (wheels.length > 0) {
    inner =
      CARD_STYLE +
      `<div class="row justify-content-center justify-content-lg-start">` +
      wheels
        .map(
          (w) => `<div class="col-12 col-lg-3 mb-4 justify-content-center" data-aos="zoom-in">
                <div class="card-anim">
                    <div class="card-anim-main bg-custom border-hov shadow-sm p-1" style="border-radius: 1vh; height: fit-content;">
                        <div class="p-1">
                            <div class="view overlay">
                                <center>
                                    <img class="img-fluid " src="assets/icon/x/wheel.svg" alt="${esc(w.name)}" style="border-radius: 1vh; width: 100%; max-width: 100vh;">
                                </center>
                            </div>
                            <div class="p-3 pt-3 pb-1">
                                <h5 class="text-strongest mb-1" style="word-wrap: break-word;">${esc(w.name)}</h5>
                                <div class="d-flex justify-content-between mb-2">
                                    <p class="text-main align-self-center m-0 h6"><strong>ค่าสุ่ม ${w.currency === "points" ? fmtNum(w.cost) + " แต้ม" : fmtBal(w.cost) + " บาท"}</strong></p>
                                </div>
                                <center>
                                    <a class="btn-main btn w-100 pd-sm-font mb-2 font-semibold" href="?page=wheel&amp;id=${esc(w.id)}" style="border-radius: 10px;">เข้าเล่น</a>
                                </center>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`
        )
        .join("") +
      `</div>`;
  }
  return `${IMG_ANIM_STYLE}<div class="container-lg p-4">
    <div class="container-sm m-auto p-4 pt-0">
        <div class="container-lg" data-aos="zoom-in">

            <center>
                <div class="col-12 col-lg-12 p-0 mb-2" style="border-radius: 1vh;">
                    <div class="d-flex justify-content-between">
                        <div class="text-center text-lg-start">
                            <h2 class=" mt-2 mb-0 font-semibold"><img src="assets/icon/x/wheel.svg" alt="" class="hx-ic" style="height:2.3rem;width:2.3rem;vertical-align:middle;margin:-.2rem .45rem 0 0"><b>สุ่มวงล้อทั้งหมด</b></h2>
                        </div>
                        <a class="btn nav-link align-self-center bg-main mt-0" onclick="window.history.back()" style="height: fit-content;border-radius: 1vh;"><b style="color: #ffffff;">ย้อนกลับ</b></a>
                    </div>
                </div>
            </center>
            <hr>
            <div class="row justify-content-center justify-content-lg-start">
            ${wheels.length === 0 ? `<h6 class=" text-center">ยังไม่มีวงล้อในตอนนี้</h6>` : inner}
            </div>
        </div>
    </div>
</div>`;
}

export function bodyWheelDetail(wheel: { id: string; name: string; cost: number; currency: string; prizes: { label: string; color: string }[] }, user: SessionUser): string {
  const labels = JSON.stringify(wheel.prizes.map((p) => p.label));
  const colors = JSON.stringify(wheel.prizes.map((p) => p.color));
  return `${PAGE_HEAD_STYLE}<div class="container-fluid p-4">
    <div class="container-sm m-cent ps-4 pe-4">
        <center>
            <div class="col-lg-8 m-auto bg-custom shadow-sm p-0 pb-3" style="border-radius: 0.5vh;">
                <div class="col-10 col-lg-12 m-cent pt-4 pb-4">
                    <center>
                        <h1 class=" text-strongest mt-3" style="font-size: 36px;">${esc(wheel.name)}</h1>
                        <h3 class=" text-strongest mb-3">ค่าสุ่ม ${wheel.currency === "points" ? fmtNum(wheel.cost) + " แต้ม" : fmtBal(wheel.cost) + " บาท"} — ยอดคงเหลือ ${wheel.currency === "points" ? fmtNum(user.points) + " แต้ม" : fmtBal(user.balance) + " บาท"}</h3>
                    </center>
                    <canvas id="wheelCanvas" width="440" height="440" style="max-width:100%;"></canvas>
                    <div class="mt-3">
                        <button class="btn bg-main ps-5 pe-5 pt-2 pb-2 w-75" id="btn_spin">&nbsp;<i class="fa-solid fa-dharmachakra"></i>&nbsp; หมุนวงล้อ</button>
                    </div>
                    <div class="pt-3 text-main">
                        <span><a class="ms-1" href="?page=random_wheel">&nbsp;<i class="fa-solid fa-turn-down-left"></i> กลับไปหน้าวงล้อ</a></span>
                    </div>
                </div>
            </div>
        </center>
    </div>
</div>
<script>
(function(){
    var labels = ${labels};
    var colors = ${colors};
    var cv = document.getElementById('wheelCanvas'), ctx = cv.getContext('2d');
    var N = labels.length, ang = 0, spinning = false;
    function draw(){
        var w = cv.width, h = cv.height, r = w/2 - 6, cx = w/2, cy = h/2;
        ctx.clearRect(0,0,w,h);
        for (var i=0;i<N;i++){
            var a0 = ang + i*2*Math.PI/N, a1 = ang + (i+1)*2*Math.PI/N;
            ctx.beginPath(); ctx.moveTo(cx,cy); ctx.arc(cx,cy,r,a0,a1); ctx.closePath();
            ctx.fillStyle = colors[i % colors.length]; ctx.fill();
            ctx.strokeStyle = '#0a0907'; ctx.lineWidth = 2; ctx.stroke();
            ctx.save(); ctx.translate(cx,cy); ctx.rotate(a0 + Math.PI/N);
            ctx.textAlign = 'right'; ctx.fillStyle = '#16130a'; ctx.font = '600 15px Prompt, Kanit, sans-serif';
            ctx.fillText(labels[i], r - 14, 5); ctx.restore();
        }
        ctx.beginPath(); ctx.arc(cx,cy,r*0.16,0,2*Math.PI); ctx.fillStyle = '#d4af37'; ctx.fill();
        ctx.beginPath(); ctx.moveTo(cx + r - 4, cy); ctx.lineTo(cx + r - 26, cy - 14); ctx.lineTo(cx + r - 26, cy + 14); ctx.closePath();
        ctx.fillStyle = '#f3d77a'; ctx.fill();
    }
    draw();
    $('#btn_spin').click(function(){
        if (spinning) return;
        spinning = true;
        $('#btn_spin').attr('disabled','disabled').html('<span class="spinner-border spinner-border-sm"></span> กำลังหมุน...');
        $.post('services/wheel.php', {action:'spin', id:'${esc(wheel.id)}', csrf: window.CSRF})
        .done(function(res){
            if (res.status != 'success'){
                Swal.fire({icon:'error', title:'ผิดพลาด', text: res.message});
                spinning = false; $('#btn_spin').removeAttr('disabled').html('&nbsp;<i class="fa-solid fa-dharmachakra"></i>&nbsp; หมุนวงล้อ');
                return;
            }
            var idx = res.index, seg = 2*Math.PI/N;
            var target = (2*Math.PI*6) + (1.5*Math.PI - (idx*seg + seg/2));
            var start = ang % (2*Math.PI), t0 = null, dur = 4200;
            function anim(t){
                if(!t0) t0 = t;
                var k = Math.min(1,(t-t0)/dur);
                var e = 1 - Math.pow(1-k,3);
                ang = start + target*e;
                draw();
                if(k<1) requestAnimationFrame(anim);
                else {
                    spinning = false;
                    $('#btn_spin').removeAttr('disabled').html('&nbsp;<i class="fa-solid fa-dharmachakra"></i>&nbsp; หมุนอีกครั้ง');
                    Swal.fire({icon: res.type=='none'?'error':'success', title: res.type=='none'?'เสียใจด้วย':'ยินดีด้วย!', text: res.message})
                    .then(function(){ window.location.reload(); });
                }
            }
            requestAnimationFrame(anim);
        }).fail(function(jq){
            var res = jq.responseJSON || {message:'เกิดข้อผิดพลาด'};
            Swal.fire({icon:'error', title:'ผิดพลาด', text: res.message});
            spinning = false; $('#btn_spin').removeAttr('disabled').html('&nbsp;<i class="fa-solid fa-dharmachakra"></i>&nbsp; หมุนวงล้อ');
        });
    });
})();
</script>
`;
}

// ---------------- APP (premium catalog) ----------------
export function bodyApp(apps: { id: string; name: string; image: string; price: number; stock: number }[]): string {
  const cards = apps.map((a) => productCard({ id: String(a.id), name: a.name, img: a.image, price: a.price, stock: a.stock, buyPage: "buyapp" })).join("\n");
  return `<div class="container-fluid p-0 "> <div class="container-sm m-cent p-0 pt-4 "> <div class="container-sm "> <div class="container-fluid"> <div class="container-fluid"> <div class="row justify-content-center justify-content-lg-start"> <div class="row" >
                                                ${cards}
                                                </div> </div> </div> </div> </div> </div> </div>`;
}

export function bodyEmptyApp(): string {
  return `<div class="container-fluid p-0 "> <div class="container-sm m-cent p-0 pt-4 "> <div class="container-sm "> <div class="container-fluid"> <div class="container-fluid" data-aos="zoom-in"> <div class="hx-empty card">ยังไม่มีแอพพรีเมี่ยมในตอนนี้</div> </div> </div> </div> </div> </div>`;
}

// ---------------- BUY APP detail ----------------
export function bodyBuyApp(app: { id: string; name: string; image: string; price: number; stock: number; detail: string }, user: SessionUser): string {
  return `${CARD_STYLE}${PAGE_HEAD_STYLE}<div class="container-fluid p-4">
    <div class="container-sm m-cent ps-4 pe-4">
        <center>
            <div class="col-lg-6 m-auto bg-custom shadow-sm p-0 pb-3" style="border-radius: 0.5vh;">
                <div class="col-10 col-lg-12 m-cent pt-4" style="margin-bottom: 4em!important; ">
                    <center>
                        <img class="img-fluid mb-3" src="${esc(app.image)}" alt="${esc(app.name)}" style="border-radius: 1vh; max-height: 240px;">
                        <h3 class="text-strongest mb-1">${esc(app.name)}</h3>
                        <p class="text-main h6"><strong>คงเหลือ ${fmtNum(app.stock)} ชิ้น</strong></p>
                        <p class="text-white main-badge bg-main align-self-center m-0 d-inline-block px-3 py-1"><strong style="color: #ffffff;">${fmtBal(app.price)} บาท</strong></p>
                    </center>
                    <div class="container-fluid ps-0 pe-0" style="margin-top: 1em;">
                        <div class="col-lg-10 m-cent mt-2 text-start">
                            <p class="mb-2">${esc(app.detail)}</p>
                            <div class="d-flex justify-content-between pe-3 ps-3 mt-2">
                                <span class="m-0 align-self-center">ยอดเงินคงเหลือ <b>${fmtBal(user.balance)}</b> บาท</span>
                            </div>
                            <br>
                            <button class="btn bg-main text-white ps-4 pe-4 pt-2 pb-2 w-100 d-inline" id="btn_buyapp" data-id="${esc(app.id)}" data-name="${esc(app.name)}" data-price="${app.price}">&nbsp;<i class="fa-regular fa-shopping-basket"></i>&nbsp; สั่งซื้อตอนนี้เลย</button>
                            <br>
                            <div class="pt-3 text-main">
                                <span><a class="ms-1" href="?page=app">&nbsp;<i class="fa-solid fa-turn-down-left"></i> กลับไปหน้าแอพพรีเมี่ยม</a></span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </center>
    </div>
</div>
<script>
$(function(){
    $("#btn_buyapp").click(function(e){
        e.preventDefault();
        var id = $(this).attr('data-id'), name = $(this).attr('data-name'), price = $(this).attr('data-price');
        Swal.fire({title:'ยืนยันการสั่งซื้อ?', text: name + " ราคา " + price + " บาท", icon:'warning', showCancelButton:true, confirmButtonColor:'#3085d6', cancelButtonColor:'#d33', confirmButtonText:'ซื้อเลย'})
        .then(function(r){
            if(!r.isConfirmed) return;
            $('#btn_buyapp').attr('disabled','disabled');
            $.post('services/buyapp.php', {id: id, csrf: window.CSRF}).done(function(res){
                if (res.status == 'success') {
                    Swal.fire({icon:'success', title:'สำเร็จ', text: res.message})
                    .then(function(){ window.location = '?page=my_premiumapp'; });
                } else {
                    Swal.fire({icon:'error', title:'ผิดพลาด', text: res.message});
                    $('#btn_buyapp').removeAttr('disabled');
                }
            }).fail(function(jq){
                var res = jq.responseJSON || {message:'เกิดข้อผิดพลาด'};
                Swal.fire({icon:'error', title:'ผิดพลาด', text: res.message});
                $('#btn_buyapp').removeAttr('disabled');
            });
        });
    });
});
</script>
`;
}

// ---------------- BUY PRODUCT detail ----------------
export function bodyProductBuy(p: { id: string; name: string; img: string; price: number; stock: number; detail: string }, user: SessionUser): string {
  return `${CARD_STYLE}${PAGE_HEAD_STYLE}<div class="container-fluid p-4">
    <div class="container-sm m-cent ps-4 pe-4">
        <center>
            <div class="col-lg-6 m-auto bg-custom shadow-sm p-0 pb-3" style="border-radius: 0.5vh;">
                <div class="col-10 col-lg-12 m-cent pt-4" style="margin-bottom: 4em!important; ">
                    <center>
                        <img class="img-fluid mb-3" src="${esc(p.img)}" alt="${esc(p.name)}" style="border-radius: 1vh; max-height: 240px;">
                        <h3 class="text-strongest mb-1">${esc(p.name)}</h3>
                        <p class="text-main h6"><strong>คงเหลือ ${fmtNum(p.stock)} ชิ้น</strong></p>
                        <p class="text-white main-badge bg-main align-self-center m-0 d-inline-block px-3 py-1"><strong style="color: #ffffff;">${fmtBal(p.price)} บาท</strong></p>
                    </center>
                    <div class="container-fluid ps-0 pe-0" style="margin-top: 1em;">
                        <div class="col-lg-10 m-cent mt-2 text-start">
                            <p class="mb-2">${esc(p.detail)}</p>
                            <div class="d-flex justify-content-between pe-3 ps-3 mt-2">
                                <span class="m-0 align-self-center">สินค้าคงเหลือ ${fmtNum(p.stock)} ชิ้น</span>
                                <span class="m-0 align-self-center" style="color: white; padding: 3.5px 5px; border-radius: 1vh; background-color: var(--main);">ยอดเงินคงเหลือ ${fmtBal(user.balance)}</span>
                            </div>
                            <div class="mb-1 mt-3 text-start">
                                <label class="ms-1">จำนวนที่ต้องการซื้อ</label>
                                <input type="number" id="buy_qty" class="form-control" min="1" max="${p.stock}" value="1" style="border-radius: 0.5vh;">
                            </div>
                            <br>
                            <button class="btn bg-main text-white ps-4 pe-4 pt-2 pb-2 w-100 d-inline" id="btn_buyprod" data-id="${esc(p.id)}" data-name="${esc(p.name)}" data-price="${p.price}" data-stock="${p.stock}">&nbsp;<i class="fa-duotone fa-cart-shopping-fast"></i>&nbsp;&nbsp;สั่งซื้อสินค้า</button>
                            <br>
                            <div class="pt-3 text-main">
                                <span><a class="ms-1" href="?page=shop">&nbsp;<i class="fa-solid fa-turn-down-left"></i> กลับไปหน้าร้านค้า</a></span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </center>
    </div>
</div>
<script>
$(function(){
    $("#btn_buyprod").click(function(e){
        e.preventDefault();
        var id = $(this).attr('data-id'), name = $(this).attr('data-name'), price = Number($(this).attr('data-price'));
        var stock = Number($(this).attr('data-stock')), qty = Math.max(1, Math.min(stock, Number($("#buy_qty").val()) || 1));
        Swal.fire({title:'ยืนยันการสั่งซื้อ?', text: name + " " + qty + " ชิ้น ราคา " + (price*qty) + " บาท", icon:'warning', showCancelButton:true, confirmButtonColor:'#3085d6', cancelButtonColor:'#d33', confirmButtonText:'ซื้อเลย'})
        .then(function(r){
            if(!r.isConfirmed) return;
            $('#btn_buyprod').attr('disabled','disabled');
            $.post('services/buybox.php', {id: id, count: qty}).done(function(res){
                if (res.status == 'success') {
                    Swal.fire({icon:'success', title:'สำเร็จ', text: res.message})
                    .then(function(){ window.location = '?page=history'; });
                } else {
                    Swal.fire({icon:'error', title:'ผิดพลาด', text: res.message});
                    $('#btn_buyprod').removeAttr('disabled');
                }
            }).fail(function(jq){
                var res = jq.responseJSON || {message:'เกิดข้อผิดพลาด'};
                Swal.fire({icon:'error', title:'ผิดพลาด', text: res.message});
                $('#btn_buyprod').removeAttr('disabled');
            });
        });
    });
});
</script>
`;
}

// ---------------- LOGOUT ----------------
export function bodyLogout(): string {
  return `<script>window.location.replace('?page=home');</script>`;
}

export { thDate };
