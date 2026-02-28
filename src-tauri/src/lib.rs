use chrono::Local;
use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::{Manager, State};

pub struct DbState(pub Mutex<Connection>);

// ─────────────────────────────────────────────
// Domain types
// ─────────────────────────────────────────────

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct RigaBolla {
    pub id: i64,
    pub bolla_id: i64,
    pub variety: String,
    pub kg: f64,
    pub num_padelle: Option<i64>,
    pub harvest_date: Option<String>,
    pub price_per_kg: Option<f64>,
    pub revenue: Option<f64>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Cliente {
    pub id: i64,
    pub nome: String,
    pub sub: Option<String>,
    pub via: Option<String>,
    pub cap: Option<String>,
    pub citta: Option<String>,
    pub prov: Option<String>,
    pub piva: Option<String>,
    pub tel: Option<String>,
    pub sdi: Option<String>,
    pub predefinito: i64,
    pub attivo: i64,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct ClientePayload {
    pub nome: String,
    pub sub: Option<String>,
    pub via: Option<String>,
    pub cap: Option<String>,
    pub citta: Option<String>,
    pub prov: Option<String>,
    pub piva: Option<String>,
    pub tel: Option<String>,
    pub sdi: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ClienteDDT {
    pub id: i64,
    pub nome: String,
    pub sub: Option<String>,
    pub via: Option<String>,
    pub cap: Option<String>,
    pub citta: Option<String>,
    pub prov: Option<String>,
    pub piva: Option<String>,
    pub tel: Option<String>,
    pub sdi: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Bolla {
    pub id: i64,
    pub progressive_number: i64,
    pub emission_date: String,
    pub print_timestamp: Option<String>,
    pub closing_timestamp: Option<String>,
    pub pickup_datetime: Option<String>,
    pub notes: Option<String>,
    pub state: String,
    pub cliente_id: Option<i64>,
    pub cliente: Option<ClienteDDT>,
    pub righe: Vec<RigaBolla>,
    pub total_kg: f64,
    pub total_revenue: f64,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct RigaInput {
    pub variety: String,
    pub kg: f64,
    pub num_padelle: Option<i64>,
    pub harvest_date: Option<String>,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct CreateBollaPayload {
    pub pickup_datetime: Option<String>,
    pub notes: Option<String>,
    pub righe: Vec<RigaInput>,
    pub cliente_id: Option<i64>,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct UpdateBollaPayload {
    pub pickup_datetime: Option<String>,
    pub notes: Option<String>,
    pub righe: Vec<RigaInput>,
    pub cliente_id: Option<i64>,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct PriceEntry {
    pub riga_id: i64,
    pub price_per_kg: f64,
    pub kg: Option<f64>,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct ReportRow {
    pub variety: String,
    pub total_kg: f64,
    pub total_revenue: f64,
    pub avg_price: f64,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Dipendente {
    pub id: i64,
    pub nome: String,
    pub cognome: String,
    pub ruolo: Option<String>,
    pub costo_orario_default: f64,
    pub telefono: Option<String>,
    pub note: Option<String>,
    pub attivo: i64,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct DipendentePayload {
    pub nome: String,
    pub cognome: String,
    pub ruolo: Option<String>,
    pub costo_orario_default: f64,
    pub telefono: Option<String>,
    pub note: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Presenza {
    pub id: i64,
    pub dipendente_id: i64,
    pub dipendente_nome: String,
    pub data: String,
    pub ore: f64,
    pub costo_orario: f64,
    pub tipo_lavoro: Option<String>,
    pub note: Option<String>,
    pub costo_totale: f64,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct PresenzaPayload {
    pub dipendente_id: i64,
    pub data: String,
    pub ore: f64,
    pub costo_orario: f64,
    pub tipo_lavoro: Option<String>,
    pub note: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct CostoVario {
    pub id: i64,
    pub categoria: String,
    pub data: String,
    pub importo: f64,
    pub descrizione: String,
    pub note: Option<String>,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct CostoVarioPayload {
    pub categoria: String,
    pub data: String,
    pub importo: f64,
    pub descrizione: String,
    pub note: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Attrezzatura {
    pub id: i64,
    pub nome: String,
    pub descrizione: Option<String>,
    pub valore_acquisto: f64,
    pub data_acquisto: String,
    pub anni_vita_utile: i64,
    pub note: Option<String>,
    pub attiva: i64,
    pub quota_annua: f64,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct AttrezzaturaPayload {
    pub nome: String,
    pub descrizione: Option<String>,
    pub valore_acquisto: f64,
    pub data_acquisto: String,
    pub anni_vita_utile: i64,
    pub note: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct YearlyStats {
    pub year: i64,
    pub kg_totali: f64,
    pub ricavi: f64,
    pub costi_manodopera: f64,
    pub costi_vari: f64,
    pub ammortamenti: f64,
    pub margine: f64,
    pub ricavi_per_varieta: Vec<VarietaStats>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct VarietaStats {
    pub variety: String,
    pub ricavi: f64,
    pub kg: f64,
}

// ─────────────────────────────────────────────
// DB init + migration
// ─────────────────────────────────────────────

pub fn init_db(conn: &Connection) -> rusqlite::Result<()> {
    conn.execute_batch(
        "
        PRAGMA journal_mode=WAL;
        PRAGMA foreign_keys = ON;

        CREATE TABLE IF NOT EXISTS bolle (
            id                 INTEGER PRIMARY KEY AUTOINCREMENT,
            progressive_number INTEGER UNIQUE NOT NULL,
            emission_date      DATETIME NOT NULL,
            print_timestamp    DATETIME,
            closing_timestamp  DATETIME,
            harvest_date       DATE,
            pickup_datetime    DATETIME,
            notes              TEXT,
            state              TEXT NOT NULL DEFAULT 'NON_STAMPATA'
        );

        CREATE TABLE IF NOT EXISTS righe_bolla (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            bolla_id      INTEGER NOT NULL,
            variety       TEXT NOT NULL,
            kg            REAL NOT NULL,
            num_padelle   INTEGER,
            harvest_date  DATE,
            price_per_kg  REAL,
            revenue       REAL,
            FOREIGN KEY(bolla_id) REFERENCES bolle(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS dipendenti (
            id                    INTEGER PRIMARY KEY AUTOINCREMENT,
            nome                  TEXT NOT NULL,
            cognome               TEXT NOT NULL,
            ruolo                 TEXT,
            costo_orario_default  REAL DEFAULT 0,
            telefono              TEXT,
            note                  TEXT,
            attivo                INTEGER DEFAULT 1
        );

        CREATE TABLE IF NOT EXISTS presenze (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            dipendente_id   INTEGER NOT NULL,
            data            DATE NOT NULL,
            ore             REAL NOT NULL,
            costo_orario    REAL NOT NULL,
            tipo_lavoro     TEXT,
            note            TEXT,
            FOREIGN KEY(dipendente_id) REFERENCES dipendenti(id)
        );

        CREATE TABLE IF NOT EXISTS costi_vari (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            categoria   TEXT NOT NULL,
            data        DATE NOT NULL,
            importo     REAL NOT NULL,
            descrizione TEXT NOT NULL,
            note        TEXT
        );

        CREATE TABLE IF NOT EXISTS attrezzature (
            id               INTEGER PRIMARY KEY AUTOINCREMENT,
            nome             TEXT NOT NULL,
            descrizione      TEXT,
            valore_acquisto  REAL NOT NULL,
            data_acquisto    DATE NOT NULL,
            anni_vita_utile  INTEGER NOT NULL,
            note             TEXT,
            attiva           INTEGER DEFAULT 1
        );

        CREATE TABLE IF NOT EXISTS clienti (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            nome        TEXT NOT NULL,
            sub         TEXT,
            via         TEXT,
            cap         TEXT,
            citta       TEXT,
            prov        TEXT,
            piva        TEXT,
            tel         TEXT,
            sdi         TEXT,
            predefinito INTEGER DEFAULT 0,
            attivo      INTEGER DEFAULT 1
        );
        ",
    )?;

    // Migrations: safe to ignore errors if columns already exist
    let _ = conn.execute(
        "ALTER TABLE righe_bolla ADD COLUMN num_padelle INTEGER",
        [],
    );
    let _ = conn.execute(
        "ALTER TABLE righe_bolla ADD COLUMN harvest_date DATE",
        [],
    );
    let _ = conn.execute(
        "ALTER TABLE bolle ADD COLUMN cliente_id INTEGER REFERENCES clienti(id)",
        [],
    );

    // Migrazioni colonne clienti (safe to ignore if already exist)
    let _ = conn.execute("ALTER TABLE clienti ADD COLUMN sub TEXT", []);
    let _ = conn.execute("ALTER TABLE clienti ADD COLUMN via TEXT", []);
    let _ = conn.execute("ALTER TABLE clienti ADD COLUMN cap TEXT", []);
    let _ = conn.execute("ALTER TABLE clienti ADD COLUMN citta TEXT", []);
    let _ = conn.execute("ALTER TABLE clienti ADD COLUMN prov TEXT", []);
    let _ = conn.execute("ALTER TABLE clienti ADD COLUMN piva TEXT", []);
    let _ = conn.execute("ALTER TABLE clienti ADD COLUMN tel TEXT", []);
    let _ = conn.execute("ALTER TABLE clienti ADD COLUMN sdi TEXT", []);

    // Seed cliente predefinito (Azzani) se non esiste
    let _ = conn.execute(
        "INSERT OR IGNORE INTO clienti (id, nome, sub, via, cap, citta, prov, piva, tel, sdi, predefinito, attivo)
         VALUES (1, 'DESTINATARIO_NOME', 'A SOCIO UNICO', 'DESTINATARIO_VIA',
                 '41058', 'Vignola', 'MO', 'DESTINATARIO_PIVA', 'DESTINATARIO_TEL', 'DESTINATARIO_SDI', 1, 1)",
        [],
    );

    Ok(())
}

// ─────────────────────────────────────────────
// DB helpers
// ─────────────────────────────────────────────

fn load_righe(conn: &Connection, bolla_id: i64) -> rusqlite::Result<Vec<RigaBolla>> {
    let mut stmt = conn.prepare(
        "SELECT id, bolla_id, variety, kg, num_padelle, harvest_date, price_per_kg, revenue
         FROM righe_bolla WHERE bolla_id = ?1 ORDER BY id",
    )?;
    let rows = stmt
        .query_map([bolla_id], |r| {
            Ok(RigaBolla {
                id: r.get(0)?,
                bolla_id: r.get(1)?,
                variety: r.get(2)?,
                kg: r.get(3)?,
                num_padelle: r.get(4)?,
                harvest_date: r.get(5)?,
                price_per_kg: r.get(6)?,
                revenue: r.get(7)?,
            })
        })?
        .filter_map(|r| r.ok())
        .collect();
    Ok(rows)
}

fn load_bolla(conn: &Connection, id: i64) -> rusqlite::Result<Bolla> {
    let mut stmt = conn.prepare(
        "SELECT b.id, b.progressive_number, b.emission_date, b.print_timestamp,
                b.closing_timestamp, b.pickup_datetime, b.notes, b.state,
                b.cliente_id,
                c.nome, c.sub, c.via, c.cap, c.citta, c.prov, c.piva, c.tel, c.sdi
         FROM bolle b
         LEFT JOIN clienti c ON b.cliente_id = c.id
         WHERE b.id = ?1",
    )?;
    let mut b = stmt.query_row([id], |r| {
        let cliente_id: Option<i64> = r.get(8)?;
        let cliente = if let Some(cid) = cliente_id {
            Some(ClienteDDT {
                id: cid,
                nome:  r.get(9)?,
                sub:   r.get(10)?,
                via:   r.get(11)?,
                cap:   r.get(12)?,
                citta: r.get(13)?,
                prov:  r.get(14)?,
                piva:  r.get(15)?,
                tel:   r.get(16)?,
                sdi:   r.get(17)?,
            })
        } else {
            None
        };
        Ok(Bolla {
            id: r.get(0)?,
            progressive_number: r.get(1)?,
            emission_date: r.get(2)?,
            print_timestamp: r.get(3)?,
            closing_timestamp: r.get(4)?,
            pickup_datetime: r.get(5)?,
            notes: r.get(6)?,
            state: r.get(7)?,
            cliente_id,
            cliente,
            righe: vec![],
            total_kg: 0.0,
            total_revenue: 0.0,
        })
    })?;
    b.righe = load_righe(conn, id)?;
    b.total_kg = b.righe.iter().map(|r| r.kg).sum();
    b.total_revenue = b.righe.iter().filter_map(|r| r.revenue).sum();
    Ok(b)
}

// ─────────────────────────────────────────────
// Commands (in submodule to avoid macro conflicts)
// ─────────────────────────────────────────────

mod commands {
    use super::*;

    #[tauri::command]
    pub fn get_bolle(state: State<DbState>) -> Result<Vec<Bolla>, String> {
        let conn = state.0.lock().map_err(|e| e.to_string())?;
        let mut stmt = conn
            .prepare("SELECT id FROM bolle ORDER BY progressive_number DESC")
            .map_err(|e| e.to_string())?;
        let ids: Vec<i64> = stmt
            .query_map([], |r| r.get(0))
            .map_err(|e| e.to_string())?
            .filter_map(|r| r.ok())
            .collect();
        let mut bolle = Vec::with_capacity(ids.len());
        for id in ids {
            bolle.push(load_bolla(&conn, id).map_err(|e| e.to_string())?);
        }
        Ok(bolle)
    }

    #[tauri::command]
    pub fn get_bolla(state: State<DbState>, id: i64) -> Result<Bolla, String> {
        let conn = state.0.lock().map_err(|e| e.to_string())?;
        load_bolla(&conn, id).map_err(|e| e.to_string())
    }

    #[tauri::command]
    pub fn create_bolla(
        state: State<DbState>,
        payload: CreateBollaPayload,
    ) -> Result<i64, String> {
        if payload.righe.is_empty() {
            return Err("Aggiungere almeno una riga".to_string());
        }
        let conn = state.0.lock().map_err(|e| e.to_string())?;
        let now = Local::now().to_rfc3339();

        let max_num: i64 = conn
            .query_row(
                "SELECT COALESCE(MAX(progressive_number), 0) FROM bolle",
                [],
                |r| r.get(0),
            )
            .map_err(|e| e.to_string())?;

        conn.execute(
            "INSERT INTO bolle
                (progressive_number, emission_date, pickup_datetime, notes, state, cliente_id)
             VALUES (?1, ?2, ?3, ?4, 'NON_STAMPATA', ?5)",
            params![
                max_num + 1,
                now,
                payload.pickup_datetime,
                payload.notes,
                payload.cliente_id
            ],
        )
        .map_err(|e| e.to_string())?;

        let bolla_id = conn.last_insert_rowid();
        for riga in &payload.righe {
            conn.execute(
                "INSERT INTO righe_bolla (bolla_id, variety, kg, num_padelle, harvest_date)
                 VALUES (?1, ?2, ?3, ?4, ?5)",
                params![bolla_id, riga.variety, riga.kg, riga.num_padelle, riga.harvest_date],
            )
            .map_err(|e| e.to_string())?;
        }
        Ok(bolla_id)
    }

    #[tauri::command]
    pub fn update_bolla(
        state: State<DbState>,
        id: i64,
        payload: UpdateBollaPayload,
    ) -> Result<(), String> {
        if payload.righe.is_empty() {
            return Err("Aggiungere almeno una riga".to_string());
        }
        let conn = state.0.lock().map_err(|e| e.to_string())?;

        conn.execute(
            "UPDATE bolle SET pickup_datetime = ?1, notes = ?2, cliente_id = ?3 WHERE id = ?4",
            params![payload.pickup_datetime, payload.notes, payload.cliente_id, id],
        )
        .map_err(|e| e.to_string())?;

        conn.execute("DELETE FROM righe_bolla WHERE bolla_id = ?1", [id])
            .map_err(|e| e.to_string())?;

        for riga in &payload.righe {
            conn.execute(
                "INSERT INTO righe_bolla (bolla_id, variety, kg, num_padelle, harvest_date)
                 VALUES (?1, ?2, ?3, ?4, ?5)",
                params![id, riga.variety, riga.kg, riga.num_padelle, riga.harvest_date],
            )
            .map_err(|e| e.to_string())?;
        }
        Ok(())
    }

    #[tauri::command]
    pub fn delete_bolla(state: State<DbState>, id: i64) -> Result<(), String> {
        let conn = state.0.lock().map_err(|e| e.to_string())?;
        conn.execute("DELETE FROM bolle WHERE id = ?1", [id])
            .map_err(|e| e.to_string())?;
        Ok(())
    }

    #[tauri::command]
    pub fn confirm_bolla(state: State<DbState>, id: i64) -> Result<(), String> {
        let conn = state.0.lock().map_err(|e| e.to_string())?;
        let now = Local::now().to_rfc3339();
        conn.execute(
            "UPDATE bolle SET state = 'CONFERMATA', closing_timestamp = ?1 WHERE id = ?2",
            params![now, id],
        )
        .map_err(|e| e.to_string())?;
        Ok(())
    }

    #[tauri::command]
    pub fn insert_prices(
        state: State<DbState>,
        bolla_id: i64,
        prices: Vec<PriceEntry>,
    ) -> Result<(), String> {
        let conn = state.0.lock().map_err(|e| e.to_string())?;
        for entry in &prices {
            // For specials: update kg first so revenue formula uses the new value
            if let Some(kg) = entry.kg {
                conn.execute(
                    "UPDATE righe_bolla SET kg = ?1 WHERE id = ?2 AND bolla_id = ?3",
                    params![kg, entry.riga_id, bolla_id],
                )
                .map_err(|e| e.to_string())?;
            }
            conn.execute(
                "UPDATE righe_bolla
                 SET price_per_kg = ?1, revenue = (kg * ?1)
                 WHERE id = ?2 AND bolla_id = ?3",
                params![entry.price_per_kg, entry.riga_id, bolla_id],
            )
            .map_err(|e| e.to_string())?;
        }
        let now = Local::now().to_rfc3339();
        conn.execute(
            "UPDATE bolle SET state = 'IN_ATTESA', print_timestamp = ?1 WHERE id = ?2",
            params![now, bolla_id],
        )
        .map_err(|e| e.to_string())?;
        Ok(())
    }

    #[tauri::command]
    pub fn get_report(
        state: State<DbState>,
        start_date: String,
        end_date: String,
    ) -> Result<Vec<ReportRow>, String> {
        let conn = state.0.lock().map_err(|e| e.to_string())?;
        let mut stmt = conn
            .prepare(
                "SELECT rb.variety,
                        SUM(rb.kg)                                              AS total_kg,
                        COALESCE(SUM(rb.revenue), 0)                            AS total_revenue,
                        CASE WHEN SUM(rb.kg) > 0
                             THEN COALESCE(SUM(rb.revenue), 0) / SUM(rb.kg)
                             ELSE 0 END                                          AS avg_price
                 FROM righe_bolla rb
                 JOIN bolle b ON rb.bolla_id = b.id
                 WHERE b.state = 'CONFERMATA'
                   AND SUBSTR(b.emission_date, 1, 10) BETWEEN ?1 AND ?2
                 GROUP BY rb.variety
                 ORDER BY rb.variety",
            )
            .map_err(|e| e.to_string())?;

        let rows = stmt
            .query_map(params![start_date, end_date], |r| {
                Ok(ReportRow {
                    variety: r.get(0)?,
                    total_kg: r.get(1)?,
                    total_revenue: r.get(2)?,
                    avg_price: r.get(3)?,
                })
            })
            .map_err(|e| e.to_string())?
            .filter_map(|r| r.ok())
            .collect();
        Ok(rows)
    }

    // ── Dipendenti ──────────────────────────────────

    #[tauri::command]
    pub fn get_dipendenti(state: State<DbState>) -> Result<Vec<Dipendente>, String> {
        let conn = state.0.lock().map_err(|e| e.to_string())?;
        let mut stmt = conn
            .prepare(
                "SELECT id, nome, cognome, ruolo, costo_orario_default, telefono, note, attivo
                 FROM dipendenti ORDER BY cognome, nome",
            )
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map([], |r| {
                Ok(Dipendente {
                    id: r.get(0)?,
                    nome: r.get(1)?,
                    cognome: r.get(2)?,
                    ruolo: r.get(3)?,
                    costo_orario_default: r.get(4)?,
                    telefono: r.get(5)?,
                    note: r.get(6)?,
                    attivo: r.get(7)?,
                })
            })
            .map_err(|e| e.to_string())?
            .filter_map(|r| r.ok())
            .collect();
        Ok(rows)
    }

    #[tauri::command]
    pub fn create_dipendente(
        state: State<DbState>,
        payload: DipendentePayload,
    ) -> Result<i64, String> {
        let conn = state.0.lock().map_err(|e| e.to_string())?;
        conn.execute(
            "INSERT INTO dipendenti (nome, cognome, ruolo, costo_orario_default, telefono, note)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![
                payload.nome,
                payload.cognome,
                payload.ruolo,
                payload.costo_orario_default,
                payload.telefono,
                payload.note
            ],
        )
        .map_err(|e| e.to_string())?;
        Ok(conn.last_insert_rowid())
    }

    #[tauri::command]
    pub fn update_dipendente(
        state: State<DbState>,
        id: i64,
        payload: DipendentePayload,
    ) -> Result<(), String> {
        let conn = state.0.lock().map_err(|e| e.to_string())?;
        conn.execute(
            "UPDATE dipendenti SET nome=?1, cognome=?2, ruolo=?3,
             costo_orario_default=?4, telefono=?5, note=?6 WHERE id=?7",
            params![
                payload.nome,
                payload.cognome,
                payload.ruolo,
                payload.costo_orario_default,
                payload.telefono,
                payload.note,
                id
            ],
        )
        .map_err(|e| e.to_string())?;
        Ok(())
    }

    #[tauri::command]
    pub fn delete_dipendente(state: State<DbState>, id: i64) -> Result<(), String> {
        let conn = state.0.lock().map_err(|e| e.to_string())?;
        // Soft delete if has presenze, hard delete otherwise
        let count: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM presenze WHERE dipendente_id = ?1",
                [id],
                |r| r.get(0),
            )
            .map_err(|e| e.to_string())?;
        if count > 0 {
            conn.execute("UPDATE dipendenti SET attivo=0 WHERE id=?1", [id])
                .map_err(|e| e.to_string())?;
        } else {
            conn.execute("DELETE FROM dipendenti WHERE id=?1", [id])
                .map_err(|e| e.to_string())?;
        }
        Ok(())
    }

    // ── Presenze ────────────────────────────────────

    #[tauri::command]
    pub fn get_presenze(state: State<DbState>, year: Option<i64>) -> Result<Vec<Presenza>, String> {
        let conn = state.0.lock().map_err(|e| e.to_string())?;
        let sql = if year.is_some() {
            "SELECT p.id, p.dipendente_id,
                    d.nome || ' ' || d.cognome AS dipendente_nome,
                    p.data, p.ore, p.costo_orario, p.tipo_lavoro, p.note,
                    p.ore * p.costo_orario AS costo_totale
             FROM presenze p
             JOIN dipendenti d ON p.dipendente_id = d.id
             WHERE CAST(strftime('%Y', p.data) AS INT) = ?1
             ORDER BY p.data DESC"
        } else {
            "SELECT p.id, p.dipendente_id,
                    d.nome || ' ' || d.cognome AS dipendente_nome,
                    p.data, p.ore, p.costo_orario, p.tipo_lavoro, p.note,
                    p.ore * p.costo_orario AS costo_totale
             FROM presenze p
             JOIN dipendenti d ON p.dipendente_id = d.id
             ORDER BY p.data DESC"
        };
        let mut stmt = conn.prepare(sql).map_err(|e| e.to_string())?;
        let rows: Vec<Presenza> = if let Some(y) = year {
            stmt.query_map([y], |r| {
                Ok(Presenza {
                    id: r.get(0)?,
                    dipendente_id: r.get(1)?,
                    dipendente_nome: r.get(2)?,
                    data: r.get(3)?,
                    ore: r.get(4)?,
                    costo_orario: r.get(5)?,
                    tipo_lavoro: r.get(6)?,
                    note: r.get(7)?,
                    costo_totale: r.get(8)?,
                })
            })
            .map_err(|e| e.to_string())?
            .filter_map(|r| r.ok())
            .collect()
        } else {
            stmt.query_map([], |r| {
                Ok(Presenza {
                    id: r.get(0)?,
                    dipendente_id: r.get(1)?,
                    dipendente_nome: r.get(2)?,
                    data: r.get(3)?,
                    ore: r.get(4)?,
                    costo_orario: r.get(5)?,
                    tipo_lavoro: r.get(6)?,
                    note: r.get(7)?,
                    costo_totale: r.get(8)?,
                })
            })
            .map_err(|e| e.to_string())?
            .filter_map(|r| r.ok())
            .collect()
        };
        Ok(rows)
    }

    #[tauri::command]
    pub fn create_presenza(
        state: State<DbState>,
        payload: PresenzaPayload,
    ) -> Result<i64, String> {
        let conn = state.0.lock().map_err(|e| e.to_string())?;
        conn.execute(
            "INSERT INTO presenze (dipendente_id, data, ore, costo_orario, tipo_lavoro, note)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![
                payload.dipendente_id,
                payload.data,
                payload.ore,
                payload.costo_orario,
                payload.tipo_lavoro,
                payload.note
            ],
        )
        .map_err(|e| e.to_string())?;
        Ok(conn.last_insert_rowid())
    }

    #[tauri::command]
    pub fn update_presenza(
        state: State<DbState>,
        id: i64,
        payload: PresenzaPayload,
    ) -> Result<(), String> {
        let conn = state.0.lock().map_err(|e| e.to_string())?;
        conn.execute(
            "UPDATE presenze SET dipendente_id=?1, data=?2, ore=?3,
             costo_orario=?4, tipo_lavoro=?5, note=?6 WHERE id=?7",
            params![
                payload.dipendente_id,
                payload.data,
                payload.ore,
                payload.costo_orario,
                payload.tipo_lavoro,
                payload.note,
                id
            ],
        )
        .map_err(|e| e.to_string())?;
        Ok(())
    }

    #[tauri::command]
    pub fn delete_presenza(state: State<DbState>, id: i64) -> Result<(), String> {
        let conn = state.0.lock().map_err(|e| e.to_string())?;
        conn.execute("DELETE FROM presenze WHERE id=?1", [id])
            .map_err(|e| e.to_string())?;
        Ok(())
    }

    // ── Costi Vari ──────────────────────────────────

    #[tauri::command]
    pub fn get_costi_vari(state: State<DbState>, year: Option<i64>) -> Result<Vec<CostoVario>, String> {
        let conn = state.0.lock().map_err(|e| e.to_string())?;
        let rows: Vec<CostoVario> = if let Some(y) = year {
            let mut stmt = conn
                .prepare(
                    "SELECT id, categoria, data, importo, descrizione, note
                     FROM costi_vari
                     WHERE CAST(strftime('%Y', data) AS INT) = ?1
                     ORDER BY data DESC",
                )
                .map_err(|e| e.to_string())?;
            let v: Vec<CostoVario> = stmt.query_map([y], |r| {
                Ok(CostoVario {
                    id: r.get(0)?,
                    categoria: r.get(1)?,
                    data: r.get(2)?,
                    importo: r.get(3)?,
                    descrizione: r.get(4)?,
                    note: r.get(5)?,
                })
            })
            .map_err(|e| e.to_string())?
            .filter_map(|r| r.ok())
            .collect();
            v
        } else {
            let mut stmt = conn
                .prepare("SELECT id, categoria, data, importo, descrizione, note FROM costi_vari ORDER BY data DESC")
                .map_err(|e| e.to_string())?;
            let v: Vec<CostoVario> = stmt.query_map([], |r| {
                Ok(CostoVario {
                    id: r.get(0)?,
                    categoria: r.get(1)?,
                    data: r.get(2)?,
                    importo: r.get(3)?,
                    descrizione: r.get(4)?,
                    note: r.get(5)?,
                })
            })
            .map_err(|e| e.to_string())?
            .filter_map(|r| r.ok())
            .collect();
            v
        };
        Ok(rows)
    }

    #[tauri::command]
    pub fn create_costo_vario(
        state: State<DbState>,
        payload: CostoVarioPayload,
    ) -> Result<i64, String> {
        let conn = state.0.lock().map_err(|e| e.to_string())?;
        conn.execute(
            "INSERT INTO costi_vari (categoria, data, importo, descrizione, note)
             VALUES (?1, ?2, ?3, ?4, ?5)",
            params![
                payload.categoria,
                payload.data,
                payload.importo,
                payload.descrizione,
                payload.note
            ],
        )
        .map_err(|e| e.to_string())?;
        Ok(conn.last_insert_rowid())
    }

    #[tauri::command]
    pub fn update_costo_vario(
        state: State<DbState>,
        id: i64,
        payload: CostoVarioPayload,
    ) -> Result<(), String> {
        let conn = state.0.lock().map_err(|e| e.to_string())?;
        conn.execute(
            "UPDATE costi_vari SET categoria=?1, data=?2, importo=?3, descrizione=?4, note=?5 WHERE id=?6",
            params![
                payload.categoria,
                payload.data,
                payload.importo,
                payload.descrizione,
                payload.note,
                id
            ],
        )
        .map_err(|e| e.to_string())?;
        Ok(())
    }

    #[tauri::command]
    pub fn delete_costo_vario(state: State<DbState>, id: i64) -> Result<(), String> {
        let conn = state.0.lock().map_err(|e| e.to_string())?;
        conn.execute("DELETE FROM costi_vari WHERE id=?1", [id])
            .map_err(|e| e.to_string())?;
        Ok(())
    }

    // ── Attrezzature ────────────────────────────────

    #[tauri::command]
    pub fn get_attrezzature(state: State<DbState>) -> Result<Vec<Attrezzatura>, String> {
        let conn = state.0.lock().map_err(|e| e.to_string())?;
        let mut stmt = conn
            .prepare(
                "SELECT id, nome, descrizione, valore_acquisto, data_acquisto,
                        anni_vita_utile, note, attiva
                 FROM attrezzature ORDER BY nome",
            )
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map([], |r| {
                let valore: f64 = r.get(3)?;
                let anni: i64 = r.get(5)?;
                let quota = if anni > 0 { valore / anni as f64 } else { 0.0 };
                Ok(Attrezzatura {
                    id: r.get(0)?,
                    nome: r.get(1)?,
                    descrizione: r.get(2)?,
                    valore_acquisto: valore,
                    data_acquisto: r.get(4)?,
                    anni_vita_utile: anni,
                    note: r.get(6)?,
                    attiva: r.get(7)?,
                    quota_annua: quota,
                })
            })
            .map_err(|e| e.to_string())?
            .filter_map(|r| r.ok())
            .collect();
        Ok(rows)
    }

    #[tauri::command]
    pub fn create_attrezzatura(
        state: State<DbState>,
        payload: AttrezzaturaPayload,
    ) -> Result<i64, String> {
        let conn = state.0.lock().map_err(|e| e.to_string())?;
        conn.execute(
            "INSERT INTO attrezzature (nome, descrizione, valore_acquisto, data_acquisto, anni_vita_utile, note)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![
                payload.nome,
                payload.descrizione,
                payload.valore_acquisto,
                payload.data_acquisto,
                payload.anni_vita_utile,
                payload.note
            ],
        )
        .map_err(|e| e.to_string())?;
        Ok(conn.last_insert_rowid())
    }

    #[tauri::command]
    pub fn update_attrezzatura(
        state: State<DbState>,
        id: i64,
        payload: AttrezzaturaPayload,
    ) -> Result<(), String> {
        let conn = state.0.lock().map_err(|e| e.to_string())?;
        conn.execute(
            "UPDATE attrezzature SET nome=?1, descrizione=?2, valore_acquisto=?3,
             data_acquisto=?4, anni_vita_utile=?5, note=?6 WHERE id=?7",
            params![
                payload.nome,
                payload.descrizione,
                payload.valore_acquisto,
                payload.data_acquisto,
                payload.anni_vita_utile,
                payload.note,
                id
            ],
        )
        .map_err(|e| e.to_string())?;
        Ok(())
    }

    #[tauri::command]
    pub fn delete_attrezzatura(state: State<DbState>, id: i64) -> Result<(), String> {
        let conn = state.0.lock().map_err(|e| e.to_string())?;
        conn.execute("UPDATE attrezzature SET attiva=0 WHERE id=?1", [id])
            .map_err(|e| e.to_string())?;
        Ok(())
    }

    // ── Clienti ─────────────────────────────────────

    #[tauri::command]
    pub fn get_clienti(state: State<DbState>) -> Result<Vec<Cliente>, String> {
        let conn = state.0.lock().map_err(|e| e.to_string())?;
        let mut stmt = conn
            .prepare(
                "SELECT id, nome, sub, via, cap, citta, prov, piva, tel, sdi, predefinito, attivo
                 FROM clienti WHERE attivo = 1 ORDER BY predefinito DESC, nome",
            )
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map([], |r| {
                Ok(Cliente {
                    id:          r.get(0)?,
                    nome:        r.get(1)?,
                    sub:         r.get(2)?,
                    via:         r.get(3)?,
                    cap:         r.get(4)?,
                    citta:       r.get(5)?,
                    prov:        r.get(6)?,
                    piva:        r.get(7)?,
                    tel:         r.get(8)?,
                    sdi:         r.get(9)?,
                    predefinito: r.get(10)?,
                    attivo:      r.get(11)?,
                })
            })
            .map_err(|e| e.to_string())?
            .filter_map(|r| r.ok())
            .collect();
        Ok(rows)
    }

    #[tauri::command]
    pub fn create_cliente(
        state: State<DbState>,
        payload: ClientePayload,
    ) -> Result<i64, String> {
        let conn = state.0.lock().map_err(|e| e.to_string())?;
        conn.execute(
            "INSERT INTO clienti (nome, sub, via, cap, citta, prov, piva, tel, sdi)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
            params![
                payload.nome, payload.sub, payload.via, payload.cap,
                payload.citta, payload.prov, payload.piva, payload.tel, payload.sdi
            ],
        )
        .map_err(|e| e.to_string())?;
        Ok(conn.last_insert_rowid())
    }

    #[tauri::command]
    pub fn update_cliente(
        state: State<DbState>,
        id: i64,
        payload: ClientePayload,
    ) -> Result<(), String> {
        let conn = state.0.lock().map_err(|e| e.to_string())?;
        conn.execute(
            "UPDATE clienti SET nome=?1, sub=?2, via=?3, cap=?4,
             citta=?5, prov=?6, piva=?7, tel=?8, sdi=?9 WHERE id=?10",
            params![
                payload.nome, payload.sub, payload.via, payload.cap,
                payload.citta, payload.prov, payload.piva, payload.tel, payload.sdi, id
            ],
        )
        .map_err(|e| e.to_string())?;
        Ok(())
    }

    #[tauri::command]
    pub fn delete_cliente(state: State<DbState>, id: i64) -> Result<(), String> {
        let conn = state.0.lock().map_err(|e| e.to_string())?;
        let count: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM bolle WHERE cliente_id = ?1",
                [id],
                |r| r.get(0),
            )
            .map_err(|e| e.to_string())?;
        if count > 0 {
            conn.execute("UPDATE clienti SET attivo = 0 WHERE id = ?1", [id])
                .map_err(|e| e.to_string())?;
        } else {
            conn.execute("DELETE FROM clienti WHERE id = ?1", [id])
                .map_err(|e| e.to_string())?;
        }
        Ok(())
    }

    #[tauri::command]
    pub fn set_cliente_predefinito(state: State<DbState>, id: i64) -> Result<(), String> {
        let conn = state.0.lock().map_err(|e| e.to_string())?;
        conn.execute("UPDATE clienti SET predefinito = 0", [])
            .map_err(|e| e.to_string())?;
        conn.execute("UPDATE clienti SET predefinito = 1 WHERE id = ?1", [id])
            .map_err(|e| e.to_string())?;
        Ok(())
    }

    // ── Yearly Stats ────────────────────────────────

    #[tauri::command]
    pub fn get_yearly_stats(state: State<DbState>, years: Vec<i64>) -> Result<Vec<YearlyStats>, String> {
        let conn = state.0.lock().map_err(|e| e.to_string())?;
        let mut result = Vec::new();

        for year in years {
            // Ricavi e KG
            let (kg_totali, ricavi): (f64, f64) = conn
                .query_row(
                    "SELECT COALESCE(SUM(rb.kg), 0), COALESCE(SUM(rb.revenue), 0)
                     FROM righe_bolla rb
                     JOIN bolle b ON rb.bolla_id = b.id
                     WHERE b.state = 'CONFERMATA'
                       AND CAST(strftime('%Y', b.emission_date) AS INT) = ?1",
                    [year],
                    |r| Ok((r.get(0)?, r.get(1)?)),
                )
                .map_err(|e| e.to_string())?;

            // Costi manodopera
            let costi_manodopera: f64 = conn
                .query_row(
                    "SELECT COALESCE(SUM(ore * costo_orario), 0) FROM presenze
                     WHERE CAST(strftime('%Y', data) AS INT) = ?1",
                    [year],
                    |r| r.get(0),
                )
                .map_err(|e| e.to_string())?;

            // Costi vari
            let costi_vari_tot: f64 = conn
                .query_row(
                    "SELECT COALESCE(SUM(importo), 0) FROM costi_vari
                     WHERE CAST(strftime('%Y', data) AS INT) = ?1",
                    [year],
                    |r| r.get(0),
                )
                .map_err(|e| e.to_string())?;

            // Ammortamenti: somma quote per attrezzature attive quell'anno
            let mut stmt_amm = conn
                .prepare(
                    "SELECT valore_acquisto, anni_vita_utile, data_acquisto
                     FROM attrezzature
                     WHERE attiva = 1
                       AND CAST(strftime('%Y', data_acquisto) AS INT) + anni_vita_utile > ?1
                       AND CAST(strftime('%Y', data_acquisto) AS INT) <= ?1",
                )
                .map_err(|e| e.to_string())?;
            let ammortamenti: f64 = stmt_amm
                .query_map([year], |r| {
                    let valore: f64 = r.get(0)?;
                    let anni: i64 = r.get(1)?;
                    Ok(if anni > 0 { valore / anni as f64 } else { 0.0 })
                })
                .map_err(|e| e.to_string())?
                .filter_map(|r| r.ok())
                .sum();

            // Ricavi per varietà
            let mut stmt_var = conn
                .prepare(
                    "SELECT rb.variety, COALESCE(SUM(rb.revenue), 0), COALESCE(SUM(rb.kg), 0)
                     FROM righe_bolla rb
                     JOIN bolle b ON rb.bolla_id = b.id
                     WHERE b.state = 'CONFERMATA'
                       AND CAST(strftime('%Y', b.emission_date) AS INT) = ?1
                     GROUP BY rb.variety
                     ORDER BY SUM(rb.revenue) DESC",
                )
                .map_err(|e| e.to_string())?;
            let ricavi_per_varieta: Vec<VarietaStats> = stmt_var
                .query_map([year], |r| {
                    Ok(VarietaStats {
                        variety: r.get(0)?,
                        ricavi: r.get(1)?,
                        kg: r.get(2)?,
                    })
                })
                .map_err(|e| e.to_string())?
                .filter_map(|r| r.ok())
                .collect();

            let margine = ricavi - costi_manodopera - costi_vari_tot - ammortamenti;

            result.push(YearlyStats {
                year,
                kg_totali,
                ricavi,
                costi_manodopera,
                costi_vari: costi_vari_tot,
                ammortamenti,
                margine,
                ricavi_per_varieta,
            });
        }

        Ok(result)
    }
}

// ─────────────────────────────────────────────
// Entry point
// ─────────────────────────────────────────────

pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let app_data_dir = app
                .path()
                .app_data_dir()
                .expect("impossibile trovare app_data_dir");
            std::fs::create_dir_all(&app_data_dir)
                .expect("impossibile creare app_data_dir");

            let db_path = app_data_dir.join("bolla_ciliegie.db");
            let conn =
                Connection::open(&db_path).expect("Impossibile aprire il database");
            init_db(&conn).expect("Impossibile inizializzare il database");
            app.manage(DbState(Mutex::new(conn)));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_bolle,
            commands::get_bolla,
            commands::create_bolla,
            commands::update_bolla,
            commands::delete_bolla,
            commands::confirm_bolla,
            commands::insert_prices,
            commands::get_report,
            commands::get_dipendenti,
            commands::create_dipendente,
            commands::update_dipendente,
            commands::delete_dipendente,
            commands::get_presenze,
            commands::create_presenza,
            commands::update_presenza,
            commands::delete_presenza,
            commands::get_costi_vari,
            commands::create_costo_vario,
            commands::update_costo_vario,
            commands::delete_costo_vario,
            commands::get_attrezzature,
            commands::create_attrezzatura,
            commands::update_attrezzatura,
            commands::delete_attrezzatura,
            commands::get_clienti,
            commands::create_cliente,
            commands::update_cliente,
            commands::delete_cliente,
            commands::set_cliente_predefinito,
            commands::get_yearly_stats,
        ])
        .run(tauri::generate_context!())
        .expect("errore durante l'avvio dell'applicazione");
}
