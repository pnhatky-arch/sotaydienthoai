const state = {
  units: [], query: "", formerUnit: "Tất cả", favorites: new Set(JSON.parse(localStorage.getItem("phonebook-favorites") || "[]")),
};

const $ = (selector) => document.querySelector(selector);
const list = $("#directoryList");
const normalize = (value = "") => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase();
const initials = (name = "") => name.split(/\s+/).filter(Boolean).slice(-2).map(x => x[0]).join("").toUpperCase() || "—";
const contactId = (unit, index) => `${unit.id}-${index}`;
const escapeHtml = (value = "") => value.replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
const phoneIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.4 3H4.7C3.8 3 3 3.8 3 4.7 3 13.7 10.3 21 19.3 21c.9 0 1.7-.8 1.7-1.7v-2.6l-4-1.1-1.1 2.2a14.4 14.4 0 0 1-9.7-9.7L8.4 7l-1-4Z"/></svg>';
const copyIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="11" height="11" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg>';
const heartIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 20-1.45-1.32C5.4 14 2 10.9 2 7.1 2 4 4.4 2 7.5 2c1.75 0 3.45.8 4.5 2.05A6 6 0 0 1 16.5 2C19.6 2 22 4 22 7.1c0 3.8-3.4 6.9-8.55 11.58L12 20Z"/></svg>';

function searchableUnit(unit) {
  return normalize([unit.unit, unit.formerUnit, ...unit.contacts.flatMap(c => [c.name, c.role, c.phone])].join(" "));
}

function matchingContact(unit) {
  if (!state.query) return "";
  const q = normalize(state.query);
  const contact = unit.contacts.find(c => normalize(`${c.name} ${c.role} ${c.phone}`).includes(q));
  return contact ? `${contact.name || "Chưa cập nhật họ tên"} · ${contact.role}` : "";
}

function filteredUnits() {
  const q = normalize(state.query.trim());
  return state.units.filter(unit => (state.formerUnit === "Tất cả" || unit.formerUnit === state.formerUnit) && (!q || searchableUnit(unit).includes(q)));
}

function renderDirectory() {
  const units = filteredUnits();
  $("#resultCount").textContent = units.length;
  $("#resultTitle").textContent = state.query ? "Kết quả tìm kiếm" : state.formerUnit === "Tất cả" ? "Tất cả đơn vị" : state.formerUnit;
  list.innerHTML = units.map(unit => `
    <button class="unit-card" data-unit="${unit.id}">
      <span class="unit-avatar">${unit.id.toString().padStart(2,"0")}</span>
      <span class="unit-copy"><h4>${escapeHtml(unit.unit)}</h4><p>${escapeHtml(unit.formerUnit)} · 4 liên hệ</p>${matchingContact(unit) ? `<p class="match-line">${escapeHtml(matchingContact(unit))}</p>` : ""}</span>
      <span class="chevron">›</span>
    </button>`).join("");
  $("#emptyState").hidden = units.length > 0;
  list.hidden = units.length === 0;
}

function renderFilters() {
  const formerUnits = [...new Set(state.units.map(u => u.formerUnit))].sort((a,b) => a.localeCompare(b,"vi"));
  $("#filterPanel").innerHTML = ["Tất cả", ...formerUnits].map(name => `<button class="filter-chip ${name === state.formerUnit ? "active" : ""}" data-filter="${escapeHtml(name)}">${escapeHtml(name)}</button>`).join("");
  $("#filterLabel").textContent = state.formerUnit;
}

function contactCard(unit, contact, index, showUnit = false) {
  const id = contactId(unit, index);
  const favorite = state.favorites.has(id);
  const primaryPhone = contact.phoneNumbers[0];
  return `<article class="contact-card">
    <div class="contact-avatar">${escapeHtml(initials(contact.name))}</div>
    <div class="contact-main">
      <h4>${escapeHtml(contact.name || "Chưa cập nhật họ tên")}</h4>
      <p class="role">${escapeHtml(contact.role)}</p>
      ${primaryPhone ? `<a class="phone-link" href="tel:${primaryPhone}">${escapeHtml(contact.phone)}</a>` : `<span class="phone-missing">Chưa cập nhật số</span>`}
      ${showUnit ? `<span class="favorite-unit">${escapeHtml(unit.unit)} · ${escapeHtml(unit.formerUnit)}</span>` : ""}
    </div>
    <div class="contact-actions">
      ${primaryPhone ? `<a class="mini-button" href="tel:${primaryPhone}" aria-label="Gọi ${escapeHtml(contact.name)}">${phoneIcon}</a><button class="mini-button copy" data-copy="${primaryPhone}" aria-label="Sao chép số điện thoại">${copyIcon}</button>` : ""}
      <button class="mini-button favorite ${favorite ? "active" : ""}" data-favorite="${id}" aria-label="${favorite ? "Bỏ lưu" : "Lưu"} liên hệ">${heartIcon}</button>
    </div>
  </article>`;
}

function openUnit(id) {
  const unit = state.units.find(u => u.id === Number(id));
  if (!unit) return;
  $("#sheetTitle").textContent = unit.unit;
  $("#sheetFormer").textContent = `TRƯỚC SÁP NHẬP · ${unit.formerUnit}`;
  $("#sheetMeta").textContent = `STT ${unit.id} · 4 liên hệ · Nguồn trang ${unit.sourcePage}`;
  $("#sheetContacts").innerHTML = unit.contacts.map((contact,index) => contactCard(unit,contact,index)).join("");
  $("#detailSheet").hidden = false;
  document.body.classList.add("sheet-open");
  $("#closeSheet").focus();
}

function closeSheet() { $("#detailSheet").hidden = true; document.body.classList.remove("sheet-open"); }

function toggleFavorite(id) {
  state.favorites.has(id) ? state.favorites.delete(id) : state.favorites.add(id);
  localStorage.setItem("phonebook-favorites", JSON.stringify([...state.favorites]));
  renderFavorites();
  const unitId = Number(id.split("-")[0]);
  if (!$("#detailSheet").hidden) openUnit(unitId);
  showToast(state.favorites.has(id) ? "Đã lưu liên hệ" : "Đã bỏ lưu liên hệ");
}

function renderFavorites() {
  const favorites = [];
  for (const unit of state.units) unit.contacts.forEach((contact,index) => { if (state.favorites.has(contactId(unit,index))) favorites.push({unit,contact,index}); });
  $("#favoritesList").innerHTML = favorites.map(x => contactCard(x.unit,x.contact,x.index,true)).join("");
  $("#favoritesEmpty").hidden = favorites.length > 0;
  $("#favoriteBadge").hidden = favorites.length === 0;
  $("#favoriteBadge").textContent = favorites.length;
}

let toastTimer;
function showToast(message) { const toast=$("#toast"); toast.textContent=message; toast.classList.add("show"); clearTimeout(toastTimer); toastTimer=setTimeout(()=>toast.classList.remove("show"),1800); }

async function copyPhone(phone) {
  try { await navigator.clipboard.writeText(phone); showToast("Đã sao chép số điện thoại"); }
  catch { showToast(`Số điện thoại: ${phone}`); }
}

function switchView(viewId) {
  document.querySelectorAll(".view").forEach(v => v.classList.toggle("active", v.id === viewId));
  document.querySelectorAll(".tab").forEach(t => t.classList.toggle("active", t.dataset.view === viewId));
  window.scrollTo({top:0,behavior:"smooth"});
}

document.addEventListener("click", event => {
  const unit = event.target.closest("[data-unit]"); if (unit) return openUnit(unit.dataset.unit);
  const filter = event.target.closest("[data-filter]"); if (filter) { state.formerUnit=filter.dataset.filter; renderFilters(); renderDirectory(); return; }
  const favorite = event.target.closest("[data-favorite]"); if (favorite) return toggleFavorite(favorite.dataset.favorite);
  const copy = event.target.closest("[data-copy]"); if (copy) return copyPhone(copy.dataset.copy);
  const tab = event.target.closest("[data-view]"); if (tab) return switchView(tab.dataset.view);
});

$("#searchInput").addEventListener("input", event => { state.query=event.target.value; $("#clearSearch").hidden=!state.query; renderDirectory(); });
$("#clearSearch").addEventListener("click", () => { state.query=""; $("#searchInput").value=""; $("#clearSearch").hidden=true; renderDirectory(); $("#searchInput").focus(); });
$("#resetButton").addEventListener("click", () => { state.query=""; state.formerUnit="Tất cả"; $("#searchInput").value=""; $("#clearSearch").hidden=true; renderFilters(); renderDirectory(); });
$("#filterButton").addEventListener("click", () => { const panel=$("#filterPanel"); panel.hidden=!panel.hidden; $("#filterButton").setAttribute("aria-expanded",String(!panel.hidden)); });
$("#closeSheet").addEventListener("click", closeSheet);
$("#detailSheet").addEventListener("click", event => { if (event.target === $("#detailSheet")) closeSheet(); });
document.addEventListener("keydown", event => { if (event.key === "Escape" && !$("#detailSheet").hidden) closeSheet(); });
$("#infoButton").addEventListener("click", () => switchView("aboutView"));

try {
  const response = await fetch("data/phonebook.json");
  if (!response.ok) throw new Error("Không tải được dữ liệu");
  state.units = await response.json();
  $("#unitCount").textContent = state.units.length;
  $("#contactCount").textContent = state.units.reduce((sum,u)=>sum+u.contacts.length,0);
  renderFilters(); renderDirectory(); renderFavorites();
} catch (error) {
  list.innerHTML = `<div class="empty-state"><div class="empty-icon">!</div><h3>Không tải được danh bạ</h3><p>${escapeHtml(error.message)}</p></div>`;
}

if ("serviceWorker" in navigator && location.protocol !== "file:") navigator.serviceWorker.register("service-worker.js");
