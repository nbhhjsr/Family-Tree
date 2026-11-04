/* VIEW
 * Turns data into HTML. It never loads data or decides what a click means.
 */
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmtDate = d => { const x = new Date(d + "T00:00:00"); return isNaN(x) ? "Unknown" : x.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); };
const initials = name => name.split(/\s+/).slice(0, 2).map(w => w[0]).join("").toUpperCase();

// Cute names for the generations (the "roots" idea). Falls back to "Generation n".
const GEN_LABELS = { 1: "🌱 Roots", 2: "🌿 Branches", 3: "🌸 Blossoms", 4: "🍃 Buds" };
const genLabel = g => GEN_LABELS[g] || `Generation ${g}`;

class FamilyView {
  constructor() {
    this.main = document.getElementById("main-view");
    this.details = document.getElementById("details");
    this.overlay = document.getElementById("overlay");
    this.title = document.getElementById("title");
  }

  setTitle(text) { this.title.textContent = text; document.title = text; }

  // Fill a <select> with options (keeps the first "All ..." option).
  fillSelect(id, values, labelFn = v => v) {
    const el = document.getElementById(id);
    el.length = 1;
    values.forEach(v => el.add(new Option(labelFn(v), v)));
  }

  avatar(p, cls = "") {
    return `<span class="avatar ${cls}" aria-hidden="true">${esc(initials(p.name))}</span>`;
  }

  card(model, p, state) {
    const z = model.zodiac(p);
    const classes = ["card", p.gender, state.selectedId === p.id ? "selected" : "", model.matches(p, state.filters) ? "" : "dimmed"];
    return `<button class="${classes.join(" ")}" data-id="${esc(p.id)}" title="${esc(p.name)}">
      ${this.avatar(p)}
      <span class="txt"><span class="name">${esc(p.name)}</span>
      <span class="life">${z.symbol} ${esc(fmtDate(p.dob))}</span></span>
    </button>`;
  }

  // ---- Tree view -----------------------------------------------------
  renderTree(model, state) {
    const rendered = new Set();
    const node = id => {
      const p = model.getPerson(id);
      const spouses = model.getSpouses(id);
      rendered.add(id);
      spouses.forEach(s => rendered.add(s.person.id));
      const kids = model.getFamilyChildren(id);
      return `<li>
        <div class="couple">
          ${this.card(model, p, state)}
          ${spouses.map(s => `<span class="ring" title="${esc(s.status || "married")}">💕</span>${this.card(model, s.person, state)}`).join("")}
        </div>
        ${kids.length ? `<ul>${kids.map(k => node(k.id)).join("")}</ul>` : ""}
      </li>`;
    };
    const items = model.getRoots().filter(r => !rendered.has(r.id)).map(r => node(r.id)).join("");
    this.main.innerHTML = `<div class="tree-scroll"><div class="tree"><ul>${items}</ul></div></div>`;
  }

  // ---- Members view --------------------------------------------------
  renderMembers(model, state) {
    const list = model.people.filter(p => model.matches(p, state.filters));
    if (!list.length) {
      this.main.innerHTML = `<p class="empty">Nobody matches these filters 🥺 Press "Clear" to see everyone.</p>`;
      return;
    }
    this.main.innerHTML = `<div class="grid">${list.map(p => `
      <div class="member">
        ${this.card(model, p, { ...state, filters: {} })}
        <span class="meta">${esc(genLabel(model.getGeneration(p.id)))} · ${esc(model.zodiac(p).name)}</span>
      </div>`).join("")}</div>`;
  }

  // ---- Stats view (a second "page") ----------------------------------
  renderStats(model) {
    const s = model.stats();
    const bars = rows => {
      const max = Math.max(...rows.map(r => r.count));
      return rows.map(r => `<div class="bar-row"><span>${esc(r.label)}</span>
        <div class="bar" style="width:${Math.max(10, (r.count / max) * 100)}%">${r.count}</div></div>`).join("");
    };
    this.main.innerHTML = `
      <div class="stats">
        <dl class="facts">
          <div><dt>Family members</dt><dd>${s.total} 💛</dd></div>
          <div><dt>Generations</dt><dd>${s.generations} 🌳</dd></div>
          <div><dt>Eldest</dt><dd>${esc(s.oldest.name)} (${model.birthYear(s.oldest)})</dd></div>
          <div><dt>Youngest</dt><dd>${esc(s.youngest.name)} (${model.birthYear(s.youngest)})</dd></div>
        </dl>
        <h2>🌱 People per generation</h2>
        <div class="bars">${bars(s.perGen.map(r => ({ label: genLabel(r.label), count: r.count })))}</div>
        <h2>✨ Zodiac signs</h2>
        <div class="bars">${bars(s.perZodiac)}</div>
      </div>`;
  }

  // ---- Details panel (only birth date + zodiac, as requested) --------
  renderDetails(model, id) {
    const p = model.getPerson(id);
    if (!p) { this.details.innerHTML = ""; this.setOverlay(false); return; }
    const links = (people, note = () => "") => people.length
      ? people.map(x => `<button class="link" data-id="${esc(x.id)}">${esc(x.name)}${note(x)}</button>`).join("")
      : `<span class="none">None 🌼</span>`;
    const spouses = model.getSpouses(id);
    const z = model.zodiac(p);

    this.details.innerHTML = `
      <button class="close" id="close-details" aria-label="Close">✕</button>
      <div class="profile ${p.gender}">
        ${this.avatar(p, "big")}
        <div>
          <h2>${esc(p.name)}</h2>
          <p>${esc(genLabel(model.getGeneration(p.id)))}${p.isInLaw ? ' <span class="badge">Married in 💍</span>' : ""}</p>
        </div>
      </div>
      <dl class="info">
        <div><dt>🎂 Birth date</dt><dd>${esc(fmtDate(p.dob))}</dd></div>
        <div><dt>✨ Zodiac</dt><dd>${z.symbol} ${esc(z.name)}</dd></div>
      </dl>
      <h3>Parents</h3><div class="links">${links(model.getParents(id))}</div>
      <h3>Spouse</h3><div class="links">${links(spouses.map(s => s.person))}</div>
      <h3>Children</h3><div class="links">${links(model.getChildren(id))}</div>
      <h3>Siblings</h3><div class="links">${links(model.getSiblings(id))}</div>`;
    this.setOverlay(true);
  }

  // Show / hide the pop-up. When it opens, move keyboard focus to the close button.
  setOverlay(open) {
    const wasOpen = !this.overlay.hidden;
    this.overlay.hidden = !open;
    if (open && !wasOpen) this.details.querySelector(".close").focus();
  }

  // Shown when people.json cannot be fetched (e.g. opened without a server).
  showLoadError(msg) {
    this.main.innerHTML = `
      <div class="loaderror">
        <p class="error"><strong>${esc(msg)}</strong></p>
        <p>Some browsers block loading files from your disk. Run a local server (VS Code Live Server)
        or load the file by hand:</p>
        <label class="filebtn">Choose data/people.json
          <input type="file" id="file-input" accept=".json,application/json" hidden>
        </label>
      </div>`;
    this.details.innerHTML = "";
    this.setOverlay(false);
  }
}