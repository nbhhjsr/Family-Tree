/* MODEL
 * Owns the data and answers every question about it.
 * JSON schema follows the lab sample (id, name, gender, dob, fatherId, motherId, spouses, isInLaw).
 * Children are NOT stored: they are derived from fatherId / motherId.
 */

// Each row = [month, first day of the sign in that month, sign name, symbol].
const ZODIAC_TABLE = [
  [1, 20, "Aquarius", "♒"], [2, 19, "Pisces", "♓"], [3, 21, "Aries", "♈"], [4, 20, "Taurus", "♉"],
  [5, 21, "Gemini", "♊"], [6, 21, "Cancer", "♋"], [7, 23, "Leo", "♌"], [8, 23, "Virgo", "♍"],
  [9, 23, "Libra", "♎"], [10, 23, "Scorpio", "♏"], [11, 22, "Sagittarius", "♐"], [12, 22, "Capricorn", "♑"]
];

class FamilyModel {
  constructor() {
    this.title = "Family Tree";
    this.people = [];
    this.byId = new Map();
    this.childMap = new Map();   // parentId -> [child, ...]
    this.genCache = new Map();
    this.warnings = [];
  }

  // Fetch the JSON file, then hand it to setData().
  async load(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Could not load ${url} (HTTP ${res.status}).`);
    this.setData(await res.json());
  }

  // Validate + index the data. Throws a readable Error if the file is unusable.
  setData(data) {
    if (!data || !Array.isArray(data.people) || data.people.length === 0) {
      throw new Error('The JSON must contain a non-empty "people" array.');
    }
    this.title = data.title || "Family Tree";
    this.people = data.people.map(p => ({ fatherId: null, motherId: null, ...p, spouses: p.spouses || [] }));
    this.byId = new Map(this.people.map(p => [p.id, p]));
    this.childMap = new Map();
    this.genCache = new Map();
    this.warnings = [];

    for (const p of this.people) {
      if (!p.id || !p.name) throw new Error('Every person needs an "id" and a "name".');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(p.dob || "")) this.warnings.push(`${p.name}: dob should look like 1995-05-09`);
      for (const pid of [p.fatherId, p.motherId]) {
        if (!pid) continue;
        if (!this.byId.has(pid)) { this.warnings.push(`${p.name}: parent "${pid}" not found`); continue; }
        if (!this.childMap.has(pid)) this.childMap.set(pid, []);
        this.childMap.get(pid).push(p);
      }
      for (const s of p.spouses) {
        if (!this.byId.has(s.id)) this.warnings.push(`${p.name}: spouse "${s.id}" not found`);
      }
    }
    if (this.warnings.length) console.warn("Data warnings:", this.warnings);
  }

  // ---- relationships -------------------------------------------------
  getPerson(id) { return this.byId.get(id) || null; }

  getParents(id) {
    const p = this.getPerson(id);
    return p ? [p.fatherId, p.motherId].map(i => this.getPerson(i)).filter(Boolean) : [];
  }

  getSpouses(id) {
    const p = this.getPerson(id);
    if (!p) return [];
    return p.spouses.map(s => ({ person: this.getPerson(s.id), status: s.status })).filter(s => s.person);
  }

  getChildren(id) {
    return [...(this.childMap.get(id) || [])].sort((a, b) => a.dob.localeCompare(b.dob));
  }

  // Children of this person AND their spouses, no duplicates (used to draw the tree).
  getFamilyChildren(id) {
    const ids = [id, ...this.getSpouses(id).map(s => s.person.id)];
    const seen = new Map();
    ids.forEach(i => this.getChildren(i).forEach(c => seen.set(c.id, c)));
    return [...seen.values()].sort((a, b) => a.dob.localeCompare(b.dob));
  }

  getSiblings(id) {
    const me = this.getPerson(id);
    if (!me) return [];
    return this.people.filter(p => p.id !== id &&
      ((me.fatherId && p.fatherId === me.fatherId) || (me.motherId && p.motherId === me.motherId)));
  }

  // Generation 1 = oldest. A married-in spouse takes their partner's generation.
  getGeneration(id) {
    if (this.genCache.has(id)) return this.genCache.get(id);
    let g = 1;
    const parents = this.getParents(id);
    if (parents.length) {
      g = 1 + Math.max(...parents.map(x => this.getGeneration(x.id)));
    } else {
      const partner = this.getSpouses(id).find(s => this.getParents(s.person.id).length);
      if (partner) g = this.getGeneration(partner.person.id);
    }
    this.genCache.set(id, g);
    return g;
  }

  getGenerations() {
    return [...new Set(this.people.map(p => this.getGeneration(p.id)))].sort((a, b) => a - b);
  }

  // Top of the tree: no known parents and not married into the family.
  getRoots() {
    return this.people.filter(p =>
      !this.getParents(p.id).length && !p.isInLaw &&
      !this.getSpouses(p.id).some(s => this.getParents(s.person.id).length));
  }

  // ---- facts ---------------------------------------------------------
  birthYear(p) { return parseInt(p.dob, 10) || "?"; }

  // Western zodiac sign from the birth date. Split the string ourselves to avoid timezone surprises.
  zodiac(p) {
    const [, m, d] = (p.dob || "").split("-").map(Number);
    if (!m || !d) return { name: "Unknown", symbol: "✨" };
    const row = ZODIAC_TABLE[m - 1];
    const [, , name, symbol] = d >= row[1] ? row : ZODIAC_TABLE[(m + 10) % 12];
    return { name, symbol };
  }

  zodiacNames() {
    return [...new Set(this.people.map(p => this.zodiac(p).name))].sort();
  }

  // ---- filtering -----------------------------------------------------
  matches(p, f) {
    const q = (f.query || "").trim().toLowerCase();
    if (q && !p.name.toLowerCase().includes(q)) return false;
    if (f.gender && p.gender !== f.gender) return false;
    if (f.generation && this.getGeneration(p.id) !== Number(f.generation)) return false;
    if (f.zodiac && this.zodiac(p).name !== f.zodiac) return false;
    return true;
  }

  // ---- statistics ----------------------------------------------------
  stats() {
    const count = (arr, keyFn) => {
      const m = new Map();
      arr.forEach(x => m.set(keyFn(x), (m.get(keyFn(x)) || 0) + 1));
      return [...m.entries()].map(([label, count]) => ({ label, count }));
    };
    const byDob = [...this.people].sort((a, b) => a.dob.localeCompare(b.dob));
    return {
      total: this.people.length,
      generations: this.getGenerations().length,
      oldest: byDob[0],
      youngest: byDob[byDob.length - 1],
      perGen: count(this.people, p => this.getGeneration(p.id)).sort((a, b) => a.label - b.label),
      perZodiac: count(this.people, p => `${this.zodiac(p).symbol} ${this.zodiac(p).name}`).sort((a, b) => b.count - a.count)
    };
  }
}
