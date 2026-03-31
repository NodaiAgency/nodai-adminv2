"use client";
import { useState, useCallback } from "react";

/* ─────────────── CONFIGURACIÓN CON VARIABLES DE ENTORNO ─────────────── */
const AIRTABLE_CONFIG = {
  baseId: process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID,
  apiKey: process.env.NEXT_PUBLIC_AIRTABLE_API_KEY,
  tables: {
    vendedores: "Vendedores",
    clientes: "Clientes",
    contratos: "Contratos",
    comisiones: "Comisiones",
  },
};

const ADMIN_CREDENTIALS = {
  email: "ivan@nodaiagency.com",
  password: "nodai2025",
};

/* ─────────────── CONSTANTES DE DISEÑO ─────────────── */
const PLAN_COLORS = {
  "Nodo 97€": "#10b981",
  "Conector 147€": "#3b82f6",
  "Arquitecto 197€": "#a855f7",
};

const STATUS_COLORS = {
  Activo: "#10b981",
  Lead: "#f59e0b",
  Pausado: "#6b7280",
  Baja: "#ef4444",
  Pendiente: "#f59e0b",
  Pagada: "#10b981",
  Vencido: "#ef4444",
  Cancelado: "#ef4444",
};

const RANK_COLORS = {
  Nodo: "#6b7280", Bronce: "#cd7f32", Plata: "#c0c0c0", Oro: "#ffd700",
  Diamante: "#b9f2ff", Elite: "#a855f7", Zafiro: "#2563eb", Esmeralda: "#10b981",
  Corona: "#f59e0b", Fundador: "#ef4444",
};

/* ─────────────── UTILIDADES DE FORMATEO ─────────────── */
// Esta función limpia los IDs "rec..." y los Arrays que envía Airtable por defecto
const formatAirtableValue = (val) => {
  if (Array.isArray(val)) return val[0]; // Si es array, toma el primer elemento
  if (typeof val === "string" && val.startsWith("rec")) return "—"; // Si es un ID puro sin nombre, pone un guion
  return val ?? "—";
};

const renderCurrency = (v) => (v != null ? `${Number(v).toFixed(2)} €` : "—");
const renderDate = (v) => (v ? new Date(v).toLocaleDateString("es-ES") : "—");
const renderPlan = (v) => v ? <Badge color={PLAN_COLORS[v] || "#6b7280"}>{formatAirtableValue(v)}</Badge> : "—";
const renderStatus = (v) => v ? <Badge color={STATUS_COLORS[v] || "#6b7280"}>{formatAirtableValue(v)}</Badge> : "—";
const renderRank = (v) => v ? <Badge color={RANK_COLORS[v] || "#6b7280"}>{formatAirtableValue(v)}</Badge> : "—";

/* ─────────────── COMPONENTES UI ─────────────── */
function Badge({ children, color }) {
  return (
    <span style={{
      display: "inline-block", padding: "2px 10px", borderRadius: 999,
      fontSize: 11, fontWeight: 600, letterSpacing: "0.03em",
      background: color + "18", color: color, border: `1px solid ${color}30`,
    }}>{children}</span>
  );
}

function KPICard({ label, value, sub, accent }) {
  return (
    <div style={{
      background: "#141419", border: "1px solid #23232b", borderRadius: 14,
      padding: "22px 24px", flex: "1 1 200px", minWidth: 180,
      position: "relative", overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 3,
        background: `linear-gradient(90deg, ${accent}, transparent)`,
      }} />
      <div style={{ fontSize: 12, color: "#8b8b9e", fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 30, fontWeight: 700, color: "#f0f0f5", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "-0.02em" }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: "#5a5a6e", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function DataTable({ columns, data, onRowClick }) {
  const [filter, setFilter] = useState("");
  const filtered = data.filter((row) =>
    columns.some((c) => String(row[c.key] || "").toLowerCase().includes(filter.toLowerCase()))
  );

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <input
          type="text" placeholder="Buscar..." value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{
            background: "#1a1a22", border: "1px solid #2a2a35", borderRadius: 8,
            padding: "8px 14px", color: "#ccc", fontSize: 13, width: 260, outline: "none",
          }}
        />
      </div>
      <div style={{ overflowX: "auto", borderRadius: 10, border: "1px solid #1e1e28" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#111116" }}>
              {columns.map((c) => (
                <th key={c.key} style={{
                  padding: "10px 14px", textAlign: "left", color: "#6b6b80",
                  fontWeight: 600, fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase",
                  borderBottom: "1px solid #1e1e28", whiteSpace: "nowrap",
                }}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((row, i) => (
              <tr key={row.id || i}
                onClick={() => onRowClick?.(row)}
                style={{ background: i % 2 === 0 ? "#0d0d12" : "#111116", cursor: "pointer" }}
              >
                {columns.map((c) => (
                  <td key={c.key} style={{ padding: "10px 14px", color: "#c8c8d5", borderBottom: "1px solid #151520" }}>
                    {c.render ? c.render(row[c.key], row) : formatAirtableValue(row[c.key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─────────────── PANEL PRINCIPAL ─────────────── */
export default function NodaiAdminPanel() {
  const [auth, setAuth] = useState(false);
  const [page, setPage] = useState("dashboard");
  const [data, setData] = useState({ vendedores: [], clientes: [], contratos: [], comisiones: [] });
  const [loading, setLoading] = useState(false);

  const loadFromAirtable = useCallback(async () => {
    setLoading(true);
    try {
      const results = {};
      for (const [key, name] of Object.entries(AIRTABLE_CONFIG.tables)) {
        const res = await fetch(`https://api.airtable.com/v0/${AIRTABLE_CONFIG.baseId}/${encodeURIComponent(name)}`, {
          headers: { Authorization: `Bearer ${AIRTABLE_CONFIG.apiKey}` }
        });
        const json = await res.json();
        results[key] = json.records?.map(r => ({ id: r.id, ...r.fields })) || [];
      }
      setData(results);
    } catch (e) {
      console.error("Error cargando Airtable:", e);
    }
    setLoading(false);
  }, []);

  if (!auth) return <LoginScreen onLogin={() => { setAuth(true); loadFromAirtable(); }} />;

  const { vendedores, clientes, contratos, comisiones } = data;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#09090d", color: "#e0e0ea" }}>
      {/* Sidebar Simple */}
      <div style={{ width: 220, background: "#0d0d12", borderRight: "1px solid #1a1a22", padding: "20px" }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: "#10b981", marginBottom: 30 }}>NODAI</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {["dashboard", "vendedores", "clientes", "contratos", "comisiones"].map(p => (
            <button key={p} onClick={() => setPage(p)} style={{
              background: page === p ? "#141419" : "transparent",
              color: page === p ? "#10b981" : "#6b6b80",
              border: "none", padding: "10px", textAlign: "left", cursor: "pointer", textTransform: "capitalize"
            }}>{p}</button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: "32px" }}>
        {loading && <div style={{ color: "#10b981" }}>Cargando datos de Airtable...</div>}
        
        {page === "dashboard" && (
          <div>
            <div style={{ display: "flex", gap: 14, marginBottom: 28 }}>
              <KPICard label="Clientes" value={clientes.length} accent="#10b981" />
              <KPICard label="Contratos" value={contratos.length} accent="#3b82f6" />
              <KPICard label="Vendedores" value={vendedores.length} accent="#a855f7" />
            </div>
          </div>
        )}

        {page === "contratos" && (
          <DataTable columns={[
            { key: "Cliente", label: "Cliente" },
            { key: "Vendedor", label: "Vendedor" },
            { key: "Plan", label: "Plan", render: renderPlan },
            { key: "Importe", label: "Importe", render: renderCurrency },
            { key: "Estado", label: "Estado", render: renderStatus },
            { key: "Fecha_inicio", label: "Inicio", render: renderDate },
          ]} data={contratos} />
        )}

        {/* ... Resto de páginas similares ... */}
        {page === "clientes" && (
            <DataTable columns={[
                { key: "Nombre_negocio", label: "Negocio" },
                { key: "Estado", label: "Estado", render: renderStatus },
                { key: "Vendedor", label: "Vendedor" },
                { key: "Fecha_alta", label: "Alta", render: renderDate },
            ]} data={clientes} />
        )}
      </div>
    </div>
  );
}

function LoginScreen({ onLogin }) {
    const [email, setEmail] = useState("");
    const [pass, setPass] = useState("");
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#09090d" }}>
        <div style={{ background: "#111116", padding: "40px", borderRadius: "12px", border: "1px solid #1e1e28", width: "320px" }}>
          <input type="email" placeholder="Email" onChange={e => setEmail(e.target.value)} style={{ width: "100%", marginBottom: "10px", padding: "10px", background: "#0d0d12", color: "white", border: "1px solid #2a2a35" }} />
          <input type="password" placeholder="Contraseña" onChange={e => setPass(e.target.value)} style={{ width: "100%", marginBottom: "20px", padding: "10px", background: "#0d0d12", color: "white", border: "1px solid #2a2a35" }} />
          <button onClick={() => onLogin()} style={{ width: "100%", padding: "10px", background: "#10b981", color: "white", border: "none", cursor: "pointer" }}>Entrar</button>
        </div>
      </div>
    );
}