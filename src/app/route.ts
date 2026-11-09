import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/site";
import { getUserByToken, getUnread, csrfFor, destroySession, SESSION_COOKIE, type SessionUser } from "@/lib/auth-extra";
import { shell } from "@/lib/render-core";
import {
  bodyHome, bodyLogin, bodyRegister, bodyShop, bodyPayment, bodyTruemoney, bodySlip, bodyRedeem,
  bodyInformation, bodyCpass, bodyHistory, bodyMyOrder, bodyMyApp, bodyContact, bodySearch,
  bodyInbox, bodyReward, bodyWheelList, bodyWheelDetail, bodyApp, bodyEmptyApp, bodyBuyApp, bodyLogout, bodyProductBuy, type HistoryRow, type OrderRow,
} from "@/lib/render-pages";
import { adminDash, adminCats, adminProds, adminApps, adminTopups, adminCodes, adminRewards, adminWheels, adminUsers, adminAnnounce, adminSettings } from "@/lib/render-admin";

export const dynamic = "force-dynamic";

const TITLES: Record<string, string> = {
  home: "ยินดีต้อนรับ", shop: "ร้านค้า", login: "เข้าสู่ระบบ", register: "สมัครสมาชิก", payment: "เติมเงิน",
  truemoney: "เติมเงิน TrueMoney Wallet", slip: "เติมเงินผ่านสลิป", redeem: "เติมเงินด้วยโค้ด",
  information: "ข้อมูลบัญชี", profile: "ข้อมูลบัญชี", history: "ประวัติการซื้อ", my_order: "Order ของคุณ",
  my_premiumapp: "แอพพรีเมี่ยมของคุณ", reward: "แลกแต้ม", random_wheel: "สุ่มวงล้อ", wheel: "สุ่มวงล้อ",
  app: "แอพพรีเมี่ยม", buyapp: "สั่งซื้อแอพพรีเมี่ยม", contact: "ติดต่อเรา", search: "ค้นหาสินค้า",
  inbox: "กล่องข้อความ", admin: "หลังบ้าน", logout: "ออกจากระบบ",
};

const AUTH_PAGES = new Set(["payment", "truemoney", "slip", "redeem", "information", "history", "my_order", "my_premiumapp", "reward", "random_wheel", "wheel", "app", "buyapp", "inbox"]);

function html(body: string, status = 200): NextResponse {
  const res = new NextResponse(body, { status });
  res.headers.set("content-type", "text/html; charset=utf-8");
  res.headers.set("cache-control", "no-store");
  return res;
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const page = sp.get("page") || "home";
  const st = await getSettings();
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user: SessionUser | null = await getUserByToken(token);
  const unread = user ? await getUnread(user.id) : 0;
  const csrf = user && token ? csrfFor(token) : "";

  // guest-only pages
  if ((page === "login" || page === "register") && user) {
    return NextResponse.redirect(new URL("/?page=home", req.url), 302);
  }
  // original behavior: guests hitting profile/admin are sent home
  if ((page === "profile" || page === "admin") && !user) {
    return NextResponse.redirect(new URL("/?page=home", req.url), 302);
  }
  // auth-required pages show the login form to guests (exact original behavior)
  if (AUTH_PAGES.has(page) && !user) {
    return html(shell({ st, user: null, unread: 0, page, title: TITLES[page] || "", active: "home", body: bodyLogin(st), csrf: "" }));
  }
  if (page === "admin" && user && user.role !== "admin") {
    return NextResponse.redirect(new URL("/?page=home", req.url), 302);
  }

  let body = "";
  let title = TITLES[page] || "";
  let active = ["home", "shop", "payment", "random_wheel", "app", "contact"].includes(page) ? page : "home";

  switch (page) {
    case "home":
    case "profile": {
      if (page === "profile" && user) {
        title = "ข้อมูลบัญชี";
        body = (sp.get("subpage") === "cpass") ? bodyCpass() : bodyInformation(st, user);
      } else {
        title = "ยินดีต้อนรับ";
        body = await bodyHome(st, user);
      }
      break;
    }
    case "login":
      body = bodyLogin(st);
      break;
    case "register":
      body = bodyRegister(st);
      break;
    case "shop": {
      const cat = sp.get("cat");
      body = await bodyShop(st, user, cat);
      if (cat) {
        const c = await db.category.findUnique({ where: { id: cat } });
        if (c) title = "ร้านค้า - " + c.name;
      }
      break;
    }
    case "buy": {
      const id = sp.get("id");
      const p = id ? await db.product.findUnique({ where: { id } }) : null;
      if (!p) return NextResponse.redirect(new URL("/?page=shop", req.url), 302);
      if (!user) return NextResponse.redirect(new URL("/?page=login", req.url), 302);
      const stock = await db.productItem.count({ where: { productId: p.id, sold: false } });
      title = "สั่งซื้อสินค้า";
      body = bodyProductBuy({ id: p.id, name: p.name, img: p.image || "assets/icon/x/box.svg", price: p.price, stock, detail: p.detail }, user);
      break;
    }
    case "payment":
      body = bodyPayment();
      break;
    case "truemoney":
      body = bodyTruemoney();
      break;
    case "slip":
      body = bodySlip();
      break;
    case "redeem":
      body = bodyRedeem();
      break;
    case "information":
      body = bodyInformation(st, user!);
      break;
    case "history": {
      const uid = user!.id;
      const [orders, spins] = await Promise.all([
        db.order.findMany({ where: { userId: uid }, orderBy: { createdAt: "desc" } }),
        db.wheelSpin.findMany({ where: { userId: uid }, orderBy: { createdAt: "desc" }, include: { wheel: true } }),
      ]);
      const rows: HistoryRow[] = [
        ...orders.map((o) => ({ name: `${o.productName} x${o.quantity}`, reward: o.payloads || "-", date: o.createdAt, ok: o.status === "success" })),
        ...spins.map((s) => ({ name: `สุ่มวงล้อ: ${s.wheel.name}`, reward: s.prize, date: s.createdAt, ok: s.type !== "none" })),
      ].sort((a, b) => b.date.getTime() - a.date.getTime());
      body = bodyHistory(rows);
      break;
    }
    case "my_order": {
      const orders = await db.order.findMany({ where: { userId: user!.id }, orderBy: { createdAt: "desc" } });
      const rows: OrderRow[] = orders.map((o) => ({ no: o.orderNo, name: o.productName, qty: o.quantity, total: o.total, payload: o.payloads, status: o.status, date: o.createdAt }));
      body = bodyMyOrder(rows);
      break;
    }
    case "my_premiumapp": {
      const orders = await db.appOrder.findMany({ where: { userId: user!.id }, orderBy: { createdAt: "desc" }, include: { app: true } });
      body = bodyMyApp(orders.map((o) => ({ no: o.orderNo, name: o.appName, total: o.total, payload: o.payload, date: o.createdAt })));
      break;
    }
    case "reward": {
      const rewards = await db.rewardItem.findMany({ where: { active: true }, orderBy: { pointsCost: "asc" } });
      body = bodyReward(rewards);
      break;
    }
    case "random_wheel": {
      const wheels = await db.wheel.findMany({ where: { active: true }, orderBy: { createdAt: "desc" } });
      body = bodyWheelList(wheels);
      break;
    }
    case "wheel": {
      const id = sp.get("id");
      const w = id ? await db.wheel.findUnique({ where: { id }, include: { prizes: { orderBy: { sortOrder: "asc" } } } }) : null;
      if (!w || w.prizes.length < 2) return NextResponse.redirect(new URL("/?page=random_wheel", req.url), 302);
      title = "สุ่มวงล้อ - " + w.name;
      body = bodyWheelDetail({ id: w.id, name: w.name, cost: w.cost, currency: w.currency, prizes: w.prizes.map((p) => ({ label: p.label, color: p.color })) }, user!);
      break;
    }
    case "app": {
      const apps = await db.appProduct.findMany({ where: { active: true }, orderBy: [{ active: "desc" }, { extId: "asc" }] });
      body = apps.length ? bodyApp(apps.map((a) => ({ id: a.id, name: a.name, image: a.image, price: a.price, stock: a.stock }))) : bodyEmptyApp();
      break;
    }
    case "buyapp": {
      const id = sp.get("id");
      const app = id ? await db.appProduct.findFirst({ where: { OR: [{ id }, { extId: Number(id) || -1 }] } }) : null;
      if (!app) return NextResponse.redirect(new URL("/?page=app", req.url), 302);
      title = "สั่งซื้อ " + app.name;
      body = bodyBuyApp({ id: app.id, name: app.name, image: app.image, price: app.price, stock: app.stock, detail: app.detail }, user!);
      break;
    }
    case "contact":
      body = bodyContact(st);
      break;
    case "search": {
      const q = (sp.get("q") || "").trim();
      if (!q) {
        body = bodySearch(q, null);
      } else {
        const found = await db.product.findMany({ where: { active: true, name: { contains: q } }, orderBy: { createdAt: "desc" }, take: 24 });
        const withStock = await Promise.all(found.map(async (p) => ({ id: p.id, name: p.name, img: p.image || "assets/icon/x/box.svg", price: p.price, stock: await db.productItem.count({ where: { productId: p.id, sold: false } }) })));
        body = bodySearch(q, withStock);
      }
      break;
    }
    case "inbox": {
      const msgs = await db.inboxMessage.findMany({ where: { userId: user!.id }, orderBy: { createdAt: "desc" }, take: 100 });
      body = bodyInbox(msgs, csrf);
      break;
    }
    case "logout": {
      await destroySession(req);
      const res = html(shell({ st, user: null, unread: 0, page, title, active, body: bodyLogout(), csrf: "" }));
      res.cookies.delete(SESSION_COOKIE);
      return res;
    }
    case "admin": {
      const tab = sp.get("tab") || "dash";
      title = "หลังบ้าน";
      const [adCats, adProds, adApps, adRws, adWhs, adUsers] = await Promise.all([
        db.category.findMany({ orderBy: { sortOrder: "asc" } }),
        db.product.findMany({ orderBy: { createdAt: "desc" } }),
        db.appProduct.findMany({ orderBy: { extId: "asc" } }),
        db.rewardItem.findMany({ orderBy: { pointsCost: "asc" } }),
        db.wheel.findMany({ orderBy: { createdAt: "desc" }, include: { prizes: { orderBy: { sortOrder: "asc" } } } }),
        db.user.findMany({ orderBy: { createdAt: "asc" } }),
      ]);
      const adData = {
        cats: adCats, prods: adProds, apps: adApps, rws: adRws,
        whs: adWhs.map((w) => ({ id: w.id, name: w.name, cost: w.cost, currency: w.currency, active: w.active, prizes: w.prizes })),
        users: adUsers.map((u) => ({ id: u.id, username: u.username, role: u.role, balance: u.balance, points: u.points })),
      };
      if (tab === "dash") {
        const [users, cats, prods, orders, apps, pend] = await Promise.all([
          db.user.count(), db.category.count(), db.product.count(), db.order.count(), db.appProduct.count(),
          db.topupRequest.count({ where: { status: "pending" } }),
        ]);
        body = adminDash({ users, cats, prods, orders, apps }, pend);
      } else if (tab === "cats") {
        body = adminCats(adCats);
      } else if (tab === "prods") {
        const withStock = await Promise.all(adProds.map(async (p) => ({ ...p, stock: await db.productItem.count({ where: { productId: p.id, sold: false } }) })));
        body = adminProds(adCats, withStock);
      } else if (tab === "apps") {
        body = adminApps(adApps);
      } else if (tab === "topups") {
        body = adminTopups(await db.topupRequest.findMany({ orderBy: { createdAt: "desc" }, take: 200, include: { user: true } }));
      } else if (tab === "codes") {
        body = adminCodes(await db.redeemCode.findMany({ orderBy: { createdAt: "desc" }, take: 200 }));
      } else if (tab === "rewards") {
        body = adminRewards(adRws);
      } else if (tab === "wheels") {
        body = adminWheels(adWhs);
      } else if (tab === "users") {
        body = adminUsers(adUsers);
      } else if (tab === "announce") {
        body = adminAnnounce(await db.announcement.findMany({ orderBy: { createdAt: "desc" } }));
      } else {
        body = adminSettings(st);
      }
      body += `<script>window.__cats=${JSON.stringify(adData.cats)};window.__prods=${JSON.stringify(adData.prods)};window.__apps=${JSON.stringify(adData.apps)};window.__rws=${JSON.stringify(adData.rws)};window.__whs=${JSON.stringify(adData.whs)};window.__users=${JSON.stringify(adData.users)};</script>`;
      body += adminJs();
      break;
    }
    default:
      return NextResponse.redirect(new URL("/?page=home", req.url), 302);
  }

  return html(shell({ st, user, unread, page, title, active, body, csrf }));
}

function adminJs(): string {
  return `<script>
$(function(){
  function fields(defs){
    var h = '';
    defs.forEach(function(d){
      if (d.type === 'textarea') h += '<div class="mb-2 text-start"><label class="form-label">'+d.label+'</label><textarea class="form-control sw-in" data-k="'+d.k+'" rows="4" placeholder="'+(d.ph||'')+'">'+(d.val||'')+'</textarea></div>';
      else if (d.type === 'select') { h += '<div class="mb-2 text-start"><label class="form-label">'+d.label+'</label><select class="form-select sw-in" data-k="'+d.k+'">'+d.opts.map(function(o){return '<option value="'+o.v+'"'+(String(d.val)===String(o.v)?' selected':'')+'>'+o.t+'</option>';}).join('')+'</select></div>'; }
      else if (d.type === 'check') h += '<div class="form-check mb-2 text-start"><input class="form-check-input sw-in" type="checkbox" data-k="'+d.k+'"'+(d.val?' checked':'')+'><label class="form-check-label">'+d.label+'</label></div>';
      else h += '<div class="mb-2 text-start"><label class="form-label">'+d.label+'</label><input type="'+(d.type||'text')+'" class="form-control sw-in" data-k="'+d.k+'" value="'+(d.val!=null?d.val:'')+'" placeholder="'+(d.ph||'')+'"></div>';
    });
    return h;
  }
  function collect(){ var o={}; $('.sw-in').each(function(){ var k=$(this).data('k'); if($(this).attr('type')==='checkbox') o[k]=$(this).is(':checked'); else o[k]=$(this).val(); }); return o; }
  function post(data, cb){
    $.post('services/admin.php', Object.assign({csrf: window.CSRF}, data)).done(function(res){
      if (res.status !== 'success') { Swal.showValidationMessage(res.message || 'ผิดพลาด'); return; }
      cb && cb(res);
    }).fail(function(jq){ Swal.showValidationMessage((jq.responseJSON||{}).message || 'เกิดข้อผิดพลาด'); });
  }
  $(document).on('click', '.ad-act', function(){
    var $b = $(this), act = $b.data('act'), id = $b.data('id') || '';
    var dlg = function(title, defs, action, extra){
      Swal.fire({
        title: title, html: fields(defs), focusConfirm: false, showCancelButton: true, confirmButtonText:'บันทึก', cancelButtonText:'ยกเลิก',
        preConfirm: function(){ return new Promise(function(res){ var d = Object.assign({action: action, id: id, csrf: window.CSRF}, collect(), extra||{}); $.post('services/admin.php', d).done(function(r){ if(r.status!=='success'){ Swal.showValidationMessage(r.message||'ผิดพลาด'); } else { res(r); } }).fail(function(jq){ Swal.showValidationMessage((jq.responseJSON||{}).message||'เกิดข้อผิดพลาด'); }); }); }
      }).then(function(r){ if(r.isConfirmed){ Swal.fire({icon:'success', title:'สำเร็จ', timer:900, showConfirmButton:false}).then(function(){ window.location.reload(); }); } });
    };
    if (act === 'cat_new' || act === 'cat_edit') {
      var c = act==='cat_edit' ? window.__cats.find(function(x){return x.id===id;}) : {};
      dlg(act==='cat_new'?'เพิ่มหมวดหมู่':'แก้ไขหมวดหมู่', [
        {k:'name', label:'ชื่อหมวด', val:c.name||''},
        {k:'detail', label:'รายละเอียด', val:c.detail||''},
        {k:'image', label:'URL รูปภาพ', val:c.image||''},
        {k:'sortOrder', label:'ลำดับ', type:'number', val:(c.sortOrder!=null?c.sortOrder:0)},
        {k:'active', label:'เปิดใช้งาน', type:'check', val:c.active!==false}
      ], 'cat_save');
    } else if (act === 'cat_del' || act === 'prod_del' || act === 'app_del' || act === 'rw_del' || act === 'wh_del' || act === 'code_del' || act === 'user_del') {
      Swal.fire({title:'ยืนยันการลบ?', icon:'warning', showCancelButton:true, confirmButtonText:'ลบ', cancelButtonText:'ยกเลิก'})
      .then(function(r){ if(r.isConfirmed) post({action: act, id: id}, function(){ window.location.reload(); }); });
    } else if (act === 'prod_new' || act === 'prod_edit') {
      var p = act==='prod_edit' ? window.__prods.find(function(x){return x.id===id;}) : {};
      dlg(act==='prod_new'?'เพิ่มสินค้า':'แก้ไขสินค้า', [
        {k:'categoryId', label:'หมวดหมู่', type:'select', opts: window.__cats.map(function(x){return {v:x.id,t:x.name};}), val:p.categoryId},
        {k:'name', label:'ชื่อสินค้า', val:p.name||''},
        {k:'detail', label:'รายละเอียด', val:p.detail||''},
        {k:'price', label:'ราคา (บาท)', type:'number', val:(p.price!=null?p.price:0)},
        {k:'image', label:'URL รูปภาพ', val:p.image||''},
        {k:'featured', label:'สินค้าแนะนำ', type:'check', val:!!p.featured},
        {k:'active', label:'เปิดขาย', type:'check', val:p.active!==false}
      ], 'prod_save');
    } else if (act === 'stock_add') {
      dlg('เพิ่มของเข้าคลัง', [{k:'items', label:'ไอเทม (1 บรรทัด = 1 ชิ้น)', type:'textarea', ph:'user:pass\\ncode-1234'}], 'stock_add');
    } else if (act === 'app_new' || act === 'app_edit') {
      var a = act==='app_edit' ? window.__apps.find(function(x){return x.id===id;}) : {};
      dlg(act==='app_new'?'เพิ่มแอพ':'แก้ไขแอพ', [
        {k:'name', label:'ชื่อแอพ', val:a.name||''},
        {k:'price', label:'ราคา (บาท)', type:'number', val:(a.price!=null?a.price:0)},
        {k:'stock', label:'คงเหลือ (ชิ้น)', type:'number', val:(a.stock!=null?a.stock:0)},
        {k:'image', label:'URL รูปภาพ', val:a.image||''},
        {k:'detail', label:'ข้อมูลที่ส่งให้ลูกค้า (1 ชิ้น)', type:'textarea', val:a.detail||''},
        {k:'active', label:'เปิดขาย', type:'check', val:a.active!==false}
      ], 'app_save');
    } else if (act === 'rw_new' || act === 'rw_edit') {
      var r = act==='rw_edit' ? window.__rws.find(function(x){return x.id===id;}) : {};
      dlg(act==='rw_new'?'เพิ่มรางวัล':'แก้ไขรางวัล', [
        {k:'name', label:'ชื่อรางวัล', val:r.name||''},
        {k:'detail', label:'รายละเอียด', val:r.detail||''},
        {k:'image', label:'URL รูปภาพ', val:r.image||''},
        {k:'pointsCost', label:'แต้มที่ใช้', type:'number', val:(r.pointsCost!=null?r.pointsCost:0)},
        {k:'stock', label:'คงเหลือ', type:'number', val:(r.stock!=null?r.stock:0)},
        {k:'active', label:'เปิดใช้งาน', type:'check', val:r.active!==false}
      ], 'rw_save');
    } else if (act === 'wh_new' || act === 'wh_edit') {
      var w = act==='wh_edit' ? window.__whs.find(function(x){return x.id===id;}) : {};
      var prizes = w.prizes ? w.prizes.map(function(p){ return p.label+'|'+p.type+':'+p.value+'|'+(p.weight||10)+'|'+(p.color||'#d4af37'); }).join('\\n') : '';
      dlg(act==='wh_new'?'เพิ่มวงล้อ':'แก้ไขวงล้อ', [
        {k:'name', label:'ชื่อวงล้อ', val:w.name||''},
        {k:'cost', label:'ค่าสุ่ม', type:'number', val:(w.cost!=null?w.cost:0)},
        {k:'currency', label:'หักจาก', type:'select', opts:[{v:'balance',t:'ยอดเงิน'},{v:'points',t:'แต้ม'}], val:w.currency||'balance'},
        {k:'prizes', label:'รางวัล (ชื่อ|type:ค่า|น้ำหนัก|สี) 1 บรรทัดต่อช่อง', type:'textarea', val:prizes, ph:'เงินรางวัล 50|balance:50|10|#d4af37\\nไม่ได้รางวัล|none:0|40|#3b3322'},
        {k:'active', label:'เปิดใช้งาน', type:'check', val:w.active!==false}
      ], 'wh_save');
    } else if (act === 'user_edit') {
      var u = window.__users.find(function(x){return x.id===id;});
      dlg('แก้ไขสมาชิก: '+u.username, [
        {k:'balance', label:'ยอดเงิน', type:'number', val:u.balance},
        {k:'points', label:'แต้ม', type:'number', val:u.points},
        {k:'role', label:'สิทธิ์', type:'select', opts:[{v:'user',t:'user'},{v:'admin',t:'admin'}], val:u.role}
      ], 'user_save');
    } else if (act === 'topup_ok' || act === 'topup_no') {
      var ok = act === 'topup_ok';
      var amt = $b.closest('tr').find('td').eq(1).text().replace(/[^0-9.]/g,'') || '0';
      Swal.fire({title: ok?'อนุมัติรายการเติมเงิน?':'ปฏิเสธรายการ?', html:'<div class="mb-1 text-start px-2"><label class="form-label">จำนวนเงินที่เติม (บาท)</label><input id="tp_amount" class="form-control" value="'+amt+'"></div><div class="text-start px-2"><label class="form-label">หมายเหตุ</label><input id="tp_note" class="form-control" placeholder="(ถ้ามี)"></div>', showCancelButton:true, confirmButtonText:'ยืนยัน', cancelButtonText:'ยกเลิก', preConfirm:function(){ return new Promise(function(res){ post({action: ok?'topup_ok':'topup_no', id:id, amount:$('#tp_amount').val(), note:$('#tp_note').val()}, function(){ res(); }); }); }})
      .then(function(r){ if(r.isConfirmed){ Swal.fire({icon:'success',title:'สำเร็จ',timer:900,showConfirmButton:false}).then(function(){ window.location.reload(); }); } });
    } else if (act === 'ann_add') {
      var t = $('#ann_text').val();
      if (!t) { Swal.showValidationMessage && Swal.fire({icon:'error',title:'กรอกข้อความก่อน'}); return; }
      post({action:'ann_add', text: t}, function(){ window.location.reload(); });
    } else if (act === 'ann_toggle') {
      post({action:'ann_toggle', id:id}, function(){ window.location.reload(); });
    } else if (act === 'code_gen') {
      post({action:'code_gen', amount: $('#code_amount').val(), count: $('#code_count').val()}, function(res){
        $('#code_out').removeClass('d-none').text((res.codes||[]).join('\\n'));
        Swal.fire({icon:'success', title:'สร้างโค้ดแล้ว '+ (res.codes||[]).length +' โค้ด', timer:1200, showConfirmButton:false});
      });
    } else if (act === 'settings_save') {
      var d = {action:'settings_save', csrf: window.CSRF};
      $('.st-field').each(function(){ d[$(this).data('key')] = $(this).val(); });
      post(d, function(){ Swal.fire({icon:'success', title:'บันทึกแล้ว', timer:900, showConfirmButton:false}).then(function(){ window.location.reload(); }); });
    }
  });
});
</script>`;
}
