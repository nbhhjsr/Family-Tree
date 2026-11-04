/* CONTROLLER
 * Listens to the user, updates the state, asks the model, tells the view to draw.
 */
const model = new FamilyModel();
const view = new FamilyView();

// One place for everything that changes what is on screen.
const state = {
  view: "tree",
  selectedId: null,
  filters: { query: "", gender: "", generation: "", zodiac: "" }
};

// Filter control id -> key inside state.filters
const FILTER_INPUTS = { search: "query", gender: "gender", generation: "generation", zodiac: "zodiac" };

function render() {
  if (state.view === "tree") view.renderTree(model, state);
  if (state.view === "members") view.renderMembers(model, state);
  if (state.view === "stats") view.renderStats(model);
  view.renderDetails(model, state.selectedId);
}

// Selecting a person changes the URL hash (#p5) so Back/Forward and shared links work.
function select(id) {
  if (location.hash.slice(1) === id) { state.selectedId = id; render(); }
  else location.hash = id;                       // triggers "hashchange" -> syncFromHash()
}

function syncFromHash() {
  const id = decodeURIComponent(location.hash.slice(1));
  state.selectedId = model.getPerson(id) ? id : null;
  render();
}

// Close the pop-up: clear the selection and remove #id from the address bar.
function closeDetails() {
  history.replaceState(null, "", location.pathname + location.search);
  state.selectedId = null;
  render();
}

function resetFilters() {
  Object.keys(FILTER_INPUTS).forEach(elId => {
    document.getElementById(elId).value = "";
    state.filters[FILTER_INPUTS[elId]] = "";
  });
  render();
}

function bindEvents() {
  // Cards and relative links both carry data-id. X button or the dark backdrop closes the pop-up.
  document.addEventListener("click", e => {
    if (e.target.closest("#close-details") || e.target.id === "overlay") return closeDetails();
    const el = e.target.closest("[data-id]");
    if (el) select(el.dataset.id);
  });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && state.selectedId) closeDetails(); });

  document.querySelectorAll(".tab").forEach(btn =>
    btn.addEventListener("click", () => {
      state.view = btn.dataset.view;
      document.querySelectorAll(".tab").forEach(b => b.classList.toggle("active", b === btn));
      render();
    }));

  Object.entries(FILTER_INPUTS).forEach(([elId, key]) =>
    document.getElementById(elId).addEventListener("input", e => { state.filters[key] = e.target.value; render(); }));

  document.getElementById("reset").addEventListener("click", resetFilters);
  window.addEventListener("hashchange", syncFromHash);
}

// Called once the model has data (from fetch OR from the file picker).
function start() {
  view.setTitle(model.title);
  view.fillSelect("generation", model.getGenerations(), g => genLabel(g));
  view.fillSelect("zodiac", model.zodiacNames());
  syncFromHash();
}

// Fallback: user picks people.json manually.
function bindFilePicker() {
  document.addEventListener("change", e => {
    if (e.target.id !== "file-input" || !e.target.files[0]) return;
    const reader = new FileReader();
    reader.onload = () => {
      try { model.setData(JSON.parse(reader.result)); start(); }
      catch (err) { view.showLoadError(`That file could not be used: ${err.message}`); }
    };
    reader.readAsText(e.target.files[0]);
  });
}

async function init() {
  bindEvents();
  bindFilePicker();
  try {
    await model.load("data/people.json");
    start();
  } catch (err) {
    view.showLoadError(err.message);
  }
}

init();
