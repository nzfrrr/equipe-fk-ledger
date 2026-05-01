const STORAGE_KEY = "brokerops-state-v2";
let supabaseClient = null;
let currentUser = null;
let persistenceMode = "local";

const makeId = () => {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (char) => {
    const random = window.crypto?.getRandomValues
      ? window.crypto.getRandomValues(new Uint8Array(1))[0]
      : Math.floor(Math.random() * 256);
    return (Number(char) ^ (random & (15 >> (Number(char) / 4)))).toString(16);
  });
};

const cloneData = (value) => JSON.parse(JSON.stringify(value));

const demoState = {
  agents: ["Frank", "Karine", "Brandon", "Angelica", "Ali"].map((name) => ({
    id: makeId(),
    name,
    email: `${name.toLowerCase()}@fkrealestate.example`,
    phone: "",
    team: "Equipe FK",
    split: 100,
    status: "active"
  })),
  deals: []
};

const fkDealRows = [
  ["Frank", "4870 Rue Beaubien (Laurent Owe)", "Laurent Owe", "sale", "2026-01-13", 520000, 6900, 0, 6900, 688, 345, 7933, 476, "2026-01-26"],
  ["Frank", "585 Glengarry unit 313", "FK client", "sale", "2026-01-23", 710500, 7105, 0, 7105, 709, 355, 8169, 490, "2026-02-04"],
  ["Frank", "Bank Referral Anthony Plescia", "Anthony Plescia", "referral", "2026-01-29", 261, 261, 0, 261, 13, 26, 300, 18, "2026-01-29"],
  ["Frank", "585 Glengarry unit 305", "FK client", "sale", "2026-01-23", 489500, 9790, 0, 4895, 488, 245, 5628, 337.69, "2026-02-06"],
  ["Frank", "2370 Boul Rosemont unit 2", "FK client", "lease", "2025-12-05", 16800, 1411, 0, 1411, 141, 71, 1623, 97.53, "2026-03-10"],
  ["Frank", "4811 Av Lacombe unit 1", "FK client", "lease", "2026-02-23", 22800, 851, 0, 851, 85, 43, 979, 58.71, "2026-03-10"],
  ["Frank", "7305 Chabot", "FK client", "lease", "2025-12-11", 16200, 1361, 0, 1361, 136, 68, 1565, 93.87, "2026-01-16"],
  ["Frank", "4811 Av. Lacombe unit 1", "FK client", "lease", "2026-02-23", 22800, 851, 0, 851, 85, 43, 979, 58.71, "2026-03-10"],
  ["Frank", "4811 Av. Lacombe unit 3", "FK client", "lease", "2026-02-19", 27600, 2318, 0, 2318, 231, 116, 2666, 158.7, "2026-03-23"],
  ["Frank", "4811 Av. Lacombe Unit 2", "FK client", "lease", "2026-03-02", 30000, 2520, 0, 2520, 251, 126, 2897, 144.87, "2026-03-23"],
  ["Karine", "585 Glengarry unit 313", "FK client", "sale", "2026-01-23", 710500, 7105, 0, 6900, 709, 355, 8169, 490, "2026-02-04"],
  ["Karine", "585 Glengarry unit 305", "FK client", "sale", "2025-12-30", 0, 0, 0, 0, 0, 0, 0, 0, "2026-07-01"],
  ["Karine", "Referral - Nancy", "Nancy", "referral", "2026-01-05", 850, 850, 0, 850, 85, 43, 977, 48.87, "2026-01-05"],
  ["Brandon", "4570 Walkley app. 7", "FK client", "lease", "2025-11-11", 810000, 32400, 0, 32400, 3232, 1620, 37252, 100, "2025-04-08"],
  ["Brandon", "3077 Paul-Pau", "FK client", "lease", "2026-01-22", 25200, 2092, 0, 2092, 209, 105, 2405, 144.3, "2026-02-09"],
  ["Brandon", "9008 Crois. Louvre", "FK client", "sale", "2025-10-30", 425000, 7438, 1063, 7438, 742, 372, 8551, 513.08, "2026-03-02"],
  ["Angelica", "4570 Walkley", "FK client", "lease", "2025-11-18", 810000, 32400, 0, 32400, 3232, 1620, 37252, 100, "2025-04-08"],
  ["Angelica", "7930 Rue des Ecores", "FK client", "lease", "2026-02-05", 34440, 1435, 0, 1435, 143, 72, 1650, 99, "2026-03-13"],
  ["Ali", "5165 Rue Sherbrooke unit 410", "FK client", "sale", "2025-07-16", 65880, 13497, 4049, 9448, 1346, 675, 15518, 652, "2026-02-09"],
  ["Ali", "6911-6915 St Denis", "FK client", "lease", "2025-01-16", 18000, 750, 0, 750, 38, 75, 862, 51.74, "2026-01-16"],
  ["Ali", "735 1 Av.", "FK client", "lease", "2026-01-12", 20700, 911, 0, 911, 91, 46, 1047, 62.83, "2026-02-11"],
  ["Ali", "11900 Balzac", "FK client", "lease", "2026-02-13", 16200, 1361, 0, 1361, 136, 68, 1429, 93.87, "2026-03-09"]
];

demoState.deals = fkDealRows.map(([agentName, property, client, type, date, value, commission, teamCut, agentCut, qst, gst, totalWithTaxes, brokerageFees, paymentDate]) => ({
  id: makeId(),
  property,
  client,
  agentId: demoState.agents.find((agent) => agent.name === agentName).id,
  type,
  date,
  status: paymentDate && paymentDate <= "2026-05-01" ? "paid" : "closed",
  value,
  commission,
  teamCut,
  agentCut,
  qst,
  gst,
  totalWithTaxes,
  brokerageFees,
  paymentDate,
  notes: `Imported from Equipe FK / ${agentName}.`
}));

let state = cloneData(demoState);
let selectedAgentId = "";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

const currency = new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD",
  maximumFractionDigits: 0
});

function getSupabaseConfig() {
  const config = window.APP_CONFIG || {};
  return {
    url: (config.supabaseUrl || "").trim(),
    anonKey: (config.supabaseAnonKey || "").trim()
  };
}

function isSupabaseConfigured() {
  const config = getSupabaseConfig();
  return Boolean(config.url && config.anonKey && window.supabase);
}

function agentFromDb(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone || "",
    team: row.team || "Equipe FK",
    split: Number(row.split || 0),
    status: row.status || "active"
  };
}

function dealFromDb(row) {
  return {
    id: row.id,
    property: row.property,
    client: row.client,
    agentId: row.agent_id,
    type: row.type,
    date: row.date,
    status: row.status,
    value: Number(row.value || 0),
    commission: Number(row.commission || 0),
    teamCut: Number(row.team_cut || 0),
    agentCut: Number(row.agent_cut || 0),
    qst: Number(row.qst || 0),
    gst: Number(row.gst || 0),
    totalWithTaxes: Number(row.total_with_taxes || 0),
    brokerageFees: Number(row.brokerage_fees || 0),
    paymentDate: row.payment_date || "",
    notes: row.notes || ""
  };
}

function agentToDb(agent) {
  return {
    id: agent.id,
    name: agent.name,
    email: agent.email,
    phone: agent.phone,
    team: agent.team,
    split: agent.split,
    status: agent.status,
    updated_at: new Date().toISOString()
  };
}

function dealToDb(deal) {
  return {
    id: deal.id,
    property: deal.property,
    client: deal.client,
    agent_id: deal.agentId,
    type: deal.type,
    date: deal.date,
    status: deal.status,
    value: deal.value,
    commission: deal.commission,
    team_cut: deal.teamCut,
    agent_cut: deal.agentCut,
    qst: deal.qst,
    gst: deal.gst,
    total_with_taxes: deal.totalWithTaxes,
    brokerage_fees: deal.brokerageFees,
    payment_date: deal.paymentDate || null,
    notes: deal.notes,
    updated_at: new Date().toISOString()
  };
}

function loadLocalState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return cloneData(demoState);

  try {
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed.agents) || !Array.isArray(parsed.deals)) {
      return cloneData(demoState);
    }
    return parsed;
  } catch {
    return cloneData(demoState);
  }
}

function saveLocalState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

async function initializeSupabase() {
  if (!isSupabaseConfigured()) {
    persistenceMode = "local";
    updateConnectionUi();
    return;
  }

  const config = getSupabaseConfig();
  supabaseClient = window.supabase.createClient(config.url, config.anonKey);
  const { data } = await supabaseClient.auth.getSession();
  currentUser = data.session?.user || null;
  persistenceMode = currentUser ? "cloud" : "locked";

  supabaseClient.auth.onAuthStateChange(async (_event, session) => {
    currentUser = session?.user || null;
    persistenceMode = currentUser ? "cloud" : "locked";
    await loadStateFromActiveStore();
    renderAll();
    updateConnectionUi();
  });

  updateConnectionUi();
}

async function loadCloudState() {
  const [{ data: agents, error: agentError }, { data: deals, error: dealError }] = await Promise.all([
    supabaseClient.from("agents").select("*").order("name"),
    supabaseClient.from("deals").select("*").order("date", { ascending: false })
  ]);

  if (agentError) throw agentError;
  if (dealError) throw dealError;

  if (!agents.length && !deals.length) {
    await seedCloudState();
    return cloneData(demoState);
  }

  return {
    agents: agents.map(agentFromDb),
    deals: deals.map(dealFromDb)
  };
}

async function seedCloudState() {
  const agentRows = demoState.agents.map(agentToDb);
  const dealRows = demoState.deals.map(dealToDb);
  const { error: agentError } = await supabaseClient.from("agents").upsert(agentRows);
  if (agentError) throw agentError;
  const { error: dealError } = await supabaseClient.from("deals").upsert(dealRows);
  if (dealError) throw dealError;
}

async function loadStateFromActiveStore() {
  if (persistenceMode === "cloud") {
    state = await loadCloudState();
    return;
  }

  state = loadLocalState();
}

async function persistAgent(agent) {
  if (persistenceMode === "locked") throw new Error("Please sign in before saving changes.");
  if (persistenceMode !== "cloud") {
    saveLocalState();
    return;
  }

  const { error } = await supabaseClient.from("agents").upsert(agentToDb(agent));
  if (error) throw error;
}

async function persistDeal(deal) {
  if (persistenceMode === "locked") throw new Error("Please sign in before saving changes.");
  if (persistenceMode !== "cloud") {
    saveLocalState();
    return;
  }

  const { error } = await supabaseClient.from("deals").upsert(dealToDb(deal));
  if (error) throw error;
}

async function removeAgentFromStore(agentId) {
  if (persistenceMode === "locked") throw new Error("Please sign in before deleting records.");
  if (persistenceMode !== "cloud") {
    saveLocalState();
    return;
  }

  const { error } = await supabaseClient.from("agents").delete().eq("id", agentId);
  if (error) throw error;
}

async function removeDealFromStore(dealId) {
  if (persistenceMode === "locked") throw new Error("Please sign in before deleting records.");
  if (persistenceMode !== "cloud") {
    saveLocalState();
    return;
  }

  const { error } = await supabaseClient.from("deals").delete().eq("id", dealId);
  if (error) throw error;
}

function updateConnectionUi() {
  const status = $("#connectionStatus");
  const form = $("#authForm");
  const signOut = $("#signOutButton");
  if (!status || !form || !signOut) return;

  if (persistenceMode === "cloud") {
    status.textContent = `Cloud mode · ${currentUser.email}`;
    form.classList.add("hidden");
    signOut.classList.remove("hidden");
    return;
  }

  if (persistenceMode === "locked") {
    status.textContent = "Cloud mode · sign in required";
    form.classList.remove("hidden");
    signOut.classList.add("hidden");
    return;
  }

  status.textContent = "Local browser mode";
  form.classList.add("hidden");
  signOut.classList.add("hidden");
}

function getAgent(agentId) {
  return state.agents.find((agent) => agent.id === agentId);
}

function filteredDealsByPeriod() {
  const period = $("#periodFilter").value;
  if (period === "all") return state.deals;

  const days = Number(period);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  return state.deals.filter((deal) => new Date(`${deal.date}T00:00:00`) >= cutoff);
}

function formatDate(value) {
  return new Intl.DateTimeFormat("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(`${value}T00:00:00`));
}

function typeLabel(type) {
  const labels = {
    sale: "Sale",
    lease: "Lease",
    referral: "Referral"
  };
  return labels[type] || type;
}

function summarizeDeals(deals) {
  const closedDeals = deals.filter((deal) => deal.status !== "pipeline");
  const paidDeals = deals.filter((deal) => deal.status === "paid");
  const totalCommission = deals.reduce((sum, deal) => sum + Number(deal.commission || 0), 0);
  const brokerageNet = deals.reduce((sum, deal) => sum + Number(deal.teamCut || 0) + Number(deal.brokerageFees || 0), 0);
  const totalAgentCut = deals.reduce((sum, deal) => sum + Number(deal.agentCut || 0), 0);
  const salesVolume = deals
    .filter((deal) => deal.type === "sale")
    .reduce((sum, deal) => sum + Number(deal.value || 0), 0);

  return {
    closedCount: closedDeals.length,
    paidCount: paidDeals.length,
    totalCommission,
    brokerageNet,
    totalAgentCut,
    salesVolume
  };
}

function sortDeals(deals, sortValue) {
  const [field, direction] = sortValue.split("-");
  const multiplier = direction === "asc" ? 1 : -1;
  const getValue = (deal) => {
    if (field === "date") return new Date(`${deal.date}T00:00:00`).getTime();
    if (field === "commission") return Number(deal.commission || 0);
    if (field === "value") return Number(deal.value || 0);
    if (field === "agentCut") return Number(deal.agentCut || 0);
    return 0;
  };

  return [...deals].sort((a, b) => (getValue(a) - getValue(b)) * multiplier);
}

function showView(viewName) {
  $$(".nav-item").forEach((item) => item.classList.toggle("active", item.dataset.view === viewName));
  $$(".view").forEach((view) => view.classList.remove("active-view"));
  $(`#${viewName}View`).classList.add("active-view");
}

function renderMetrics(deals) {
  const summary = summarizeDeals(deals);

  const metrics = [
    ["Gross commission", currency.format(summary.totalCommission), `${deals.length} deals tracked`],
    ["Brokerage revenue", currency.format(summary.brokerageNet), "Team cut plus brokerage fees"],
    ["Agent cut", currency.format(summary.totalAgentCut), "Production payable to agents"],
    ["Closed / paid deals", summary.closedCount.toString(), `${summary.paidCount} fully paid`],
    ["Sales volume", currency.format(summary.salesVolume), "Lease and referral values tracked separately"]
  ];

  $("#metricGrid").innerHTML = metrics
    .map(
      ([label, value, detail]) => `
        <article class="metric-card">
          <span>${label}</span>
          <strong>${value}</strong>
          <small>${detail}</small>
        </article>
      `
    )
    .join("");
}

function renderAgentPerformance(deals) {
  const rows = state.agents
    .map((agent) => {
      const agentDeals = deals.filter((deal) => deal.agentId === agent.id);
      const salesVolume = agentDeals
        .filter((deal) => deal.type === "sale")
        .reduce((sum, deal) => sum + Number(deal.value), 0);
      const commission = agentDeals.reduce((sum, deal) => sum + Number(deal.commission), 0);
      const agentCut = agentDeals.reduce((sum, deal) => sum + Number(deal.agentCut || 0), 0);
      return {
        agent,
        count: agentDeals.length,
        salesVolume,
        commission,
        agentCut,
        avg: agentDeals.length ? commission / agentDeals.length : 0
      };
    })
    .sort((a, b) => b.commission - a.commission);

  $("#agentPerformance").innerHTML = rows.length
    ? rows
        .map(
          (row) => `
            <tr>
              <td><strong><button class="agent-name-button" type="button" data-view-agent="${row.agent.id}">${row.agent.name}</button></strong><br><span class="muted">${row.agent.team}</span></td>
              <td>${row.count}</td>
              <td>${currency.format(row.salesVolume)}</td>
              <td>${currency.format(row.commission)}</td>
              <td>${currency.format(row.agentCut)}<br><span class="muted">${currency.format(row.avg)} avg gross</span></td>
            </tr>
          `
        )
        .join("")
    : `<tr><td colspan="5" class="empty-state">No agents yet.</td></tr>`;

  $("#agentPerformance").querySelectorAll("[data-view-agent]").forEach((button) => {
    button.addEventListener("click", () => openAgentDashboard(button.dataset.viewAgent));
  });
}

function renderDealMix(deals) {
  const totalCommission = Math.max(1, deals.reduce((sum, deal) => sum + Number(deal.commission), 0));
  const types = ["sale", "lease", "referral"].map((type) => {
    const matching = deals.filter((deal) => deal.type === type);
    const commission = matching.reduce((sum, deal) => sum + Number(deal.commission), 0);
    return { type, count: matching.length, commission, percent: Math.round((commission / totalCommission) * 100) };
  });

  $("#dealMix").innerHTML = types
    .map(
      (item) => `
        <div class="mix-item">
          <div class="mix-label">
            <strong>${typeLabel(item.type)}s</strong>
            <span>${item.count} deals · ${currency.format(item.commission)}</span>
          </div>
          <div class="bar ${item.type}"><span style="width: ${item.percent}%"></span></div>
        </div>
      `
    )
    .join("");
}

function renderAgentMix(deals) {
  const totalCommission = Math.max(1, deals.reduce((sum, deal) => sum + Number(deal.commission || 0), 0));
  const types = ["sale", "lease", "referral"].map((type) => {
    const matching = deals.filter((deal) => deal.type === type);
    const commission = matching.reduce((sum, deal) => sum + Number(deal.commission || 0), 0);
    const value = matching.reduce((sum, deal) => sum + Number(deal.value || 0), 0);
    return { type, count: matching.length, commission, value, percent: Math.round((commission / totalCommission) * 100) };
  });

  $("#agentActivityMix").innerHTML = types
    .map(
      (item) => `
        <div class="mix-item">
          <div class="mix-label">
            <strong>${typeLabel(item.type)}s</strong>
            <span>${item.count} deals · ${currency.format(item.commission)}</span>
          </div>
          <div class="bar ${item.type}"><span style="width: ${item.percent}%"></span></div>
          <small class="muted">${currency.format(item.value)} tracked value</small>
        </div>
      `
    )
    .join("");
}

function renderAgents() {
  $("#agentGrid").innerHTML = state.agents.length
    ? state.agents
        .map((agent) => {
          const agentDeals = state.deals.filter((deal) => deal.agentId === agent.id);
          const commission = agentDeals.reduce((sum, deal) => sum + Number(deal.commission), 0);
          const initials = agent.name
            .split(" ")
            .map((part) => part[0])
            .slice(0, 2)
            .join("")
            .toUpperCase();

          return `
            <article class="agent-card">
              <div class="agent-card-head">
                <div class="avatar" aria-hidden="true">${initials}</div>
                <span class="status-pill status-${agent.status}">${agent.status}</span>
              </div>
              <div>
                <h3><button class="agent-name-button" type="button" data-view-agent="${agent.id}">${agent.name}</button></h3>
                <p>${agent.email}</p>
              </div>
              <div class="agent-meta">
                <span>${agent.phone || "No phone saved"}</span>
                <span>${agent.team} · ${agent.split}% default split</span>
                <span>${agentDeals.length} deals · ${currency.format(commission)} commission</span>
              </div>
              <div class="card-actions">
                <button class="text-button" type="button" data-edit-agent="${agent.id}">Edit</button>
                <button class="text-button danger" type="button" data-delete-agent="${agent.id}">Delete</button>
              </div>
            </article>
          `;
        })
        .join("")
    : `<div class="empty-state">Add your first agent to start tracking production.</div>`;

  $$("[data-edit-agent]").forEach((button) => {
    button.addEventListener("click", () => openAgentModal(button.dataset.editAgent));
  });
  $$("[data-view-agent]").forEach((button) => {
    button.addEventListener("click", () => openAgentDashboard(button.dataset.viewAgent));
  });
  $$("[data-delete-agent]").forEach((button) => {
    button.addEventListener("click", () => deleteAgent(button.dataset.deleteAgent));
  });
}

function agentActivityMatchesFilters(deal) {
  const type = $("#agentActivityType").value;
  const status = $("#agentActivityStatus").value;

  return (type === "all" || deal.type === type) && (status === "all" || deal.status === status);
}

function renderAgentDetail() {
  const agent = getAgent(selectedAgentId);
  if (!agent) {
    selectedAgentId = "";
    showView("agents");
    return;
  }

  const allAgentDeals = state.deals.filter((deal) => deal.agentId === agent.id);
  const visibleDeals = sortDeals(allAgentDeals.filter(agentActivityMatchesFilters), $("#agentActivitySort").value);
  const summary = summarizeDeals(allAgentDeals);
  const averageCommission = allAgentDeals.length ? summary.totalCommission / allAgentDeals.length : 0;

  $("#agentDetailHeading").textContent = agent.name;
  $("#agentDetailSubhead").textContent = `${agent.team} · ${agent.status} · ${agent.email}`;
  $("#agentDetailMetrics").innerHTML = [
    ["Gross commission", currency.format(summary.totalCommission), `${allAgentDeals.length} total deals`],
    ["Agent cut", currency.format(summary.totalAgentCut), `${currency.format(averageCommission)} avg gross`],
    ["Sales volume", currency.format(summary.salesVolume), "Sales only"],
    ["Brokerage fees", currency.format(allAgentDeals.reduce((sum, deal) => sum + Number(deal.brokerageFees || 0), 0)), "Fees tracked on this agent"],
    ["Paid deals", summary.paidCount.toString(), `${summary.closedCount} closed or paid`]
  ]
    .map(
      ([label, value, detail]) => `
        <article class="metric-card">
          <span>${label}</span>
          <strong>${value}</strong>
          <small>${detail}</small>
        </article>
      `
    )
    .join("");

  $("#agentActivityTable").innerHTML = visibleDeals.length
    ? visibleDeals
        .map(
          (deal) => `
            <tr>
              <td><strong>${deal.property}</strong><br><span class="muted">${deal.client}</span></td>
              <td><span class="type-pill type-${deal.type}">${deal.type}</span></td>
              <td>${formatDate(deal.date)}</td>
              <td>${currency.format(deal.value)}</td>
              <td>${currency.format(deal.commission)}</td>
              <td>${currency.format(deal.agentCut || 0)}</td>
              <td>${currency.format(deal.brokerageFees || 0)}</td>
              <td>${deal.paymentDate ? formatDate(deal.paymentDate) : "—"}</td>
              <td><span class="status-pill status-${deal.status}">${deal.status}</span></td>
              <td>
                <div class="row-actions">
                  <button class="text-button" type="button" data-edit-deal="${deal.id}">Edit</button>
                  <button class="text-button danger" type="button" data-delete-deal="${deal.id}">Delete</button>
                </div>
              </td>
            </tr>
          `
        )
        .join("")
    : `<tr><td colspan="10" class="empty-state">No activity matches those filters.</td></tr>`;

  renderAgentMix(allAgentDeals);

  $("#agentActivityTable").querySelectorAll("[data-edit-deal]").forEach((button) => {
    button.addEventListener("click", () => openDealModal(button.dataset.editDeal));
  });
  $("#agentActivityTable").querySelectorAll("[data-delete-deal]").forEach((button) => {
    button.addEventListener("click", () => deleteDeal(button.dataset.deleteDeal));
  });
}

function openAgentDashboard(agentId) {
  selectedAgentId = agentId;
  renderAgentDetail();
  showView("agentDetail");
}

function dealMatchesFilters(deal) {
  const search = $("#dealSearch").value.trim().toLowerCase();
  const type = $("#dealTypeFilter").value;
  const status = $("#dealStatusFilter").value;
  const agent = getAgent(deal.agentId);
  const text = `${deal.property} ${deal.client} ${agent?.name || ""}`.toLowerCase();

  return (!search || text.includes(search)) && (type === "all" || deal.type === type) && (status === "all" || deal.status === status);
}

function renderDeals() {
  const deals = sortDeals(state.deals.filter(dealMatchesFilters), $("#dealSort").value);

  $("#dealTable").innerHTML = deals.length
    ? deals
        .map((deal) => {
          const agent = getAgent(deal.agentId);
          return `
            <tr>
              <td><strong>${deal.property}</strong><br><span class="muted">${deal.client}</span></td>
              <td>${agent?.name || "Unassigned"}</td>
              <td><span class="type-pill type-${deal.type}">${deal.type}</span></td>
              <td>${formatDate(deal.date)}</td>
              <td>${currency.format(deal.value)}</td>
              <td>${currency.format(deal.commission)}</td>
              <td>${currency.format(deal.agentCut || 0)}</td>
              <td>${currency.format(deal.brokerageFees || 0)}</td>
              <td>${deal.paymentDate ? formatDate(deal.paymentDate) : "—"}</td>
              <td><span class="status-pill status-${deal.status}">${deal.status}</span></td>
              <td>
                <div class="row-actions">
                  <button class="text-button" type="button" data-edit-deal="${deal.id}">Edit</button>
                  <button class="text-button danger" type="button" data-delete-deal="${deal.id}">Delete</button>
                </div>
              </td>
            </tr>
          `;
        })
        .join("")
    : `<tr><td colspan="11" class="empty-state">No deals match those filters.</td></tr>`;

  $$("[data-edit-deal]").forEach((button) => {
    button.addEventListener("click", () => openDealModal(button.dataset.editDeal));
  });
  $$("[data-delete-deal]").forEach((button) => {
    button.addEventListener("click", () => deleteDeal(button.dataset.deleteDeal));
  });
}

function populateAgentSelect() {
  $("#dealAgent").innerHTML = state.agents
    .map((agent) => `<option value="${agent.id}">${agent.name}</option>`)
    .join("");
}

function renderDashboard() {
  const deals = filteredDealsByPeriod();
  renderMetrics(deals);
  renderAgentPerformance(deals);
  renderDealMix(deals);
}

function renderAll() {
  populateAgentSelect();
  renderDashboard();
  renderAgents();
  renderDeals();
  if (selectedAgentId) renderAgentDetail();
}

function openAgentModal(agentId = "") {
  const agent = state.agents.find((item) => item.id === agentId);
  $("#agentModalTitle").textContent = agent ? "Edit agent" : "New agent";
  $("#agentId").value = agent?.id || "";
  $("#agentName").value = agent?.name || "";
  $("#agentEmail").value = agent?.email || "";
  $("#agentPhone").value = agent?.phone || "";
  $("#agentTeam").value = agent?.team || "Equipe FK";
  $("#agentSplit").value = agent?.split ?? 70;
  $("#agentStatus").value = agent?.status || "active";
  $("#agentModal").showModal();
}

function openDealModal(dealId = "") {
  if (!state.agents.length) {
    openAgentModal();
    return;
  }

  const deal = state.deals.find((item) => item.id === dealId);
  $("#dealModalTitle").textContent = deal ? "Edit deal" : "New deal";
  $("#dealId").value = deal?.id || "";
  $("#dealProperty").value = deal?.property || "";
  $("#dealClient").value = deal?.client || "";
  $("#dealAgent").value = deal?.agentId || state.agents[0].id;
  $("#dealType").value = deal?.type || "sale";
  $("#dealDate").value = deal?.date || new Date().toISOString().slice(0, 10);
  $("#dealStatus").value = deal?.status || "pipeline";
  $("#dealValue").value = deal?.value || "";
  $("#dealCommission").value = deal?.commission || "";
  $("#dealTeamCut").value = deal?.teamCut ?? 0;
  $("#dealAgentCut").value = deal?.agentCut ?? "";
  $("#dealQst").value = deal?.qst ?? 0;
  $("#dealGst").value = deal?.gst ?? 0;
  $("#dealTotalWithTaxes").value = deal?.totalWithTaxes ?? "";
  $("#dealBrokerageFees").value = deal?.brokerageFees ?? 0;
  $("#dealPaymentDate").value = deal?.paymentDate || "";
  $("#dealNotes").value = deal?.notes || "";
  $("#dealModal").showModal();
}

async function deleteAgent(agentId) {
  const agent = getAgent(agentId);
  if (!agent) return;

  const linkedDeals = state.deals.filter((deal) => deal.agentId === agentId).length;
  const confirmed = window.confirm(
    linkedDeals
      ? `${agent.name} has ${linkedDeals} linked deals. Delete the agent and those deals?`
      : `Delete ${agent.name}?`
  );
  if (!confirmed) return;

  const previousState = cloneData(state);
  try {
    state.agents = state.agents.filter((item) => item.id !== agentId);
    state.deals = state.deals.filter((deal) => deal.agentId !== agentId);
    if (selectedAgentId === agentId) selectedAgentId = "";
    await removeAgentFromStore(agentId);
    renderAll();
    if (!selectedAgentId) showView("agents");
  } catch (error) {
    state = previousState;
    alert(`Could not delete agent: ${error.message}`);
    renderAll();
  }
}

async function deleteDeal(dealId) {
  const deal = state.deals.find((item) => item.id === dealId);
  if (!deal || !window.confirm(`Delete ${deal.property}?`)) return;

  const previousState = cloneData(state);
  try {
    state.deals = state.deals.filter((item) => item.id !== dealId);
    await removeDealFromStore(dealId);
    renderAll();
  } catch (error) {
    state = previousState;
    alert(`Could not delete deal: ${error.message}`);
    renderAll();
  }
}

function exportCsv() {
  const rows = [
    ["Property", "Client", "Agent", "Type", "Date", "Status", "Value", "Gross Commission", "Team Cut", "Agent Cut", "QST", "GST", "Total With Taxes", "Brokerage Fees", "Payment Date", "Notes"],
    ...state.deals.map((deal) => [
      deal.property,
      deal.client,
      getAgent(deal.agentId)?.name || "",
      deal.type,
      deal.date,
      deal.status,
      deal.value,
      deal.commission,
      deal.teamCut,
      deal.agentCut,
      deal.qst,
      deal.gst,
      deal.totalWithTaxes,
      deal.brokerageFees,
      deal.paymentDate,
      deal.notes
    ])
  ];

  const csv = rows
    .map((row) =>
      row
        .map((value) => String(value ?? "").replaceAll('"', '""'))
        .map((value) => `"${value}"`)
        .join(",")
    )
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `brokerops-deals-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function bindEvents() {
  $$(".nav-item").forEach((button) => {
    button.addEventListener("click", () => {
      showView(button.dataset.view);
    });
  });

  $("#openAgentModal").addEventListener("click", () => openAgentModal());
  $("#openDealModal").addEventListener("click", () => openDealModal());
  $("#exportCsv").addEventListener("click", exportCsv);
  $("#periodFilter").addEventListener("change", renderDashboard);
  $("#dealSearch").addEventListener("input", renderDeals);
  $("#dealTypeFilter").addEventListener("change", renderDeals);
  $("#dealStatusFilter").addEventListener("change", renderDeals);
  $("#dealSort").addEventListener("change", renderDeals);
  $("#agentActivityType").addEventListener("change", renderAgentDetail);
  $("#agentActivityStatus").addEventListener("change", renderAgentDetail);
  $("#agentActivitySort").addEventListener("change", renderAgentDetail);
  $("#backToAgents").addEventListener("click", () => showView("agents"));

  $$("[data-close-modal]").forEach((button) => {
    button.addEventListener("click", () => $(`#${button.dataset.closeModal}`).close());
  });

  $("#authForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!supabaseClient) return;

    const email = $("#authEmail").value.trim();
    const password = $("#authPassword").value;
    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) {
      alert(`Could not sign in: ${error.message}`);
      return;
    }
    $("#authPassword").value = "";
  });

  $("#signOutButton").addEventListener("click", async () => {
    if (!supabaseClient) return;
    await supabaseClient.auth.signOut();
  });

  $("#agentForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const id = $("#agentId").value || makeId();
    const previousState = cloneData(state);
    const agent = {
      id,
      name: $("#agentName").value.trim(),
      email: $("#agentEmail").value.trim(),
      phone: $("#agentPhone").value.trim(),
      team: $("#agentTeam").value,
      split: Number($("#agentSplit").value),
      status: $("#agentStatus").value
    };

    try {
      state.agents = state.agents.some((item) => item.id === id)
        ? state.agents.map((item) => (item.id === id ? agent : item))
        : [...state.agents, agent];
      await persistAgent(agent);
      $("#agentModal").close();
      renderAll();
    } catch (error) {
      state = previousState;
      alert(`Could not save agent: ${error.message}`);
      renderAll();
    }
  });

  $("#dealForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const id = $("#dealId").value || makeId();
    const previousState = cloneData(state);
    const deal = {
      id,
      property: $("#dealProperty").value.trim(),
      client: $("#dealClient").value.trim(),
      agentId: $("#dealAgent").value,
      type: $("#dealType").value,
      date: $("#dealDate").value,
      status: $("#dealStatus").value,
      value: Number($("#dealValue").value),
      commission: Number($("#dealCommission").value),
      teamCut: Number($("#dealTeamCut").value),
      agentCut: Number($("#dealAgentCut").value),
      qst: Number($("#dealQst").value),
      gst: Number($("#dealGst").value),
      totalWithTaxes: Number($("#dealTotalWithTaxes").value),
      brokerageFees: Number($("#dealBrokerageFees").value),
      paymentDate: $("#dealPaymentDate").value,
      notes: $("#dealNotes").value.trim()
    };

    try {
      state.deals = state.deals.some((item) => item.id === id)
        ? state.deals.map((item) => (item.id === id ? deal : item))
        : [...state.deals, deal];
      await persistDeal(deal);
      $("#dealModal").close();
      renderAll();
    } catch (error) {
      state = previousState;
      alert(`Could not save deal: ${error.message}`);
      renderAll();
    }
  });
}

async function initializeApp() {
  bindEvents();
  try {
    await initializeSupabase();
    await loadStateFromActiveStore();
  } catch (error) {
    console.error(error);
    persistenceMode = "local";
    state = loadLocalState();
    updateConnectionUi();
  }
  renderAll();
}

initializeApp();
