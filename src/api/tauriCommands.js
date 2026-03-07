import { invoke } from "@tauri-apps/api/core";

export const getBolle = () => invoke("get_bolle");

export const getBolla = (id) => invoke("get_bolla", { id });

export const createBolla = (payload) => invoke("create_bolla", { payload });

export const updateBolla = (id, payload) =>
  invoke("update_bolla", { id, payload });

export const deleteBolla = (id) => invoke("delete_bolla", { id });

export const confirmBolla = (id) => invoke("confirm_bolla", { id });

export const insertPrices = (bollaId, prices) =>
  invoke("insert_prices", { bollaId, prices });

export const getReport = (startDate, endDate) =>
  invoke("get_report", { startDate, endDate });

// ── Dipendenti ────────────────────────────────────────
export const getDipendenti = () => invoke("get_dipendenti");
export const createDipendente = (payload) => invoke("create_dipendente", { payload });
export const updateDipendente = (id, payload) => invoke("update_dipendente", { id, payload });
export const deleteDipendente = (id) => invoke("delete_dipendente", { id });

// ── Presenze ──────────────────────────────────────────
export const getPresenze = (year) => invoke("get_presenze", { year: year ?? null });
export const createPresenza = (payload) => invoke("create_presenza", { payload });
export const updatePresenza = (id, payload) => invoke("update_presenza", { id, payload });
export const deletePresenza = (id) => invoke("delete_presenza", { id });

// ── Costi Vari ────────────────────────────────────────
export const getCostiVari = (year) => invoke("get_costi_vari", { year: year ?? null });
export const createCostoVario = (payload) => invoke("create_costo_vario", { payload });
export const updateCostoVario = (id, payload) => invoke("update_costo_vario", { id, payload });
export const deleteCostoVario = (id) => invoke("delete_costo_vario", { id });

// ── Attrezzature ──────────────────────────────────────
export const getAttrezzature = () => invoke("get_attrezzature");
export const createAttrezzatura = (payload) => invoke("create_attrezzatura", { payload });
export const updateAttrezzatura = (id, payload) => invoke("update_attrezzatura", { id, payload });
export const deleteAttrezzatura = (id) => invoke("delete_attrezzatura", { id });

// ── Clienti ───────────────────────────────────────────
export const getClienti = () => invoke("get_clienti");
export const createCliente = (payload) => invoke("create_cliente", { payload });
export const updateCliente = (id, payload) => invoke("update_cliente", { id, payload });
export const deleteCliente = (id) => invoke("delete_cliente", { id });
export const setClientePredefinito = (id) => invoke("set_cliente_predefinito", { id });

// ── Yearly Stats ──────────────────────────────────────
export const getYearlyStats = (years) => invoke("get_yearly_stats", { years });

// ── Giornale di Raccolta ───────────────────────────────
export const getGiornale = (year) => invoke("get_giornale", { year: year ?? null });
export const createGiornaleEntry = (payload) => invoke("create_giornale_entry", { payload });
export const updateGiornaleEntry = (id, payload) => invoke("update_giornale_entry", { id, payload });
export const deleteGiornaleEntry = (id) => invoke("delete_giornale_entry", { id });
