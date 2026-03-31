"use client";
import { useState, useCallback, useEffect } from "react";

/* ─────────────── CONFIGURACIÓN Y CONSTANTES NODAI ─────────────── */
const AIRTABLE_CONFIG = {
  baseId: process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID,
  apiKey: process.env.NEXT_PUBLIC_AIRTABLE_API_KEY,
  tables: { vendedores: "Vendedores", clientes: "Clientes", contratos: "Contratos", comisiones: "Comisiones" },
};

const NODAI_DATA = {
  ranks: ["Nodo", "Bronce", "Plata", "Oro", "Diamante", "Elite", "Zafiro", "Esmeralda", "Corona", "Fundador"], //
  prices: { starter: 97, business: 147, enterprise: 197 }, //
  n8n_url: "https://n8n.nodaiagency.com" //
};

const RANK_COLORS = {
  Nodo: "#6b7280", Bronce: "#cd7f32", Plata: "#c0c0c0", Oro: "#ffd700",
  Diamante: "#b9f2ff", Elite: "#a855f7", Zafiro: "#2563eb", Esmeralda: "#10b981",
  Corona: "#f59e0b", Fundador: "#ef4444"
};

/* ─────────────── COMPONENTES DE APOYO ─────────────── */
const Badge = ({ children, color }) => (
  <span style={{
    display: "inline-block", padding: "2px 10px", borderRadius: 999,
    fontSize: 11, fontWeight: 600, background: color + "18", color: color, border: `1px solid ${color}30`
  }}>{children}</span>
);

/* ─────────────── PANEL PRINCIPAL ─────────────── */
export default function NodaiAdminPanel() {
  const [user, setUser] = useState(null); 
  const [page, setPage] = useState("dashboard");
  const [data, setData] = useState({ vendedores: [], clientes: [], contratos: [], comisiones: [] });
  const [loading, setLoading] = useState(false);

  const handleLogin = (email, pass) => {
    if (email === "ivan@nodaiagency.com" && pass === "nodai2025") {
      setUser({ email, name: "Iván", role: "admin" });
    } else if (pass === "nodai2025") {
      setUser({ email, name: email.split('@')[0], role: "vendedor" });
    }
  };

  const loadData = useCallback(async () => {
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
    } catch (e) { console.error("Error Airtable:", e); }
    setLoading(false);
  }, []);

  useEffect(() => { if (user) loadData(); }, [user, loadData]);

  if (!user) return <LoginScreen onLogin={handleLogin} />;

  const filteredData = {
    clientes: user.role === "admin" ? data.clientes : data.clientes.filter(c => c.Vendedor_Email === user.email),
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#09090d", color: "#e0e0ea", fontFamily: "Inter, sans-serif" }}>
      {/* Sidebar */}
      <div style={{ width: 240, background: "#0d0d12", borderRight: "1px solid #1a1a22", padding: "20px" }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: "#10b981", marginBottom: 5 }}>NODAI</div>
        <div style={{ fontSize: 10, color: "#5a5a6e", letterSpacing: 2, marginBottom: 30 }}>{user.role.toUpperCase()} PANEL</div>
        
        <nav style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {["dashboard", "vendedores", "clientes", "comisiones", "recursos", "bots"].map(p => (
            <button key={p} onClick={() => setPage(p)} style={{
              background: page === p ? "#141419" : "transparent",
              color: page === p ? "#10b981" : "#6b6b80",
              border: "none", padding: "12px", textAlign: "left", cursor: "pointer", borderRadius: 8, textTransform: "capitalize"
            }}>{p}</button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: "40px", overflowY: "auto" }}>
        {page === "dashboard" && (
          <div>
            <h1 style={{ marginBottom: 20 }}>Bienvenido, {user.name}</h1>
            <div style={{ display: "flex", gap: 20, marginBottom: 40 }}>
              <StatCard label="MRR Activo" value={`${NODAI_DATA.prices.starter * filteredData.clientes.length}€`} color="#3b82f6" />
              <StatCard label="Clientes Totales" value={filteredData.clientes.length} color="#10b981" />
              <StatCard label="Rango" value={user.role === "admin" ? "Fundador" : "Nodo"} color="#f59e0b" />
            </div>
          </div>
        )}

        {page === "bots" && <BotsSection />}
        {page === "recursos" && <ResourcesSection />}
        {page === "clientes" && <DataTable data={filteredData.clientes} columns={["Nombre_negocio", "Estado", "Plan"]} />}
      </div>
    </div>
  );
}

/* ─────────────── SECCIÓN DE BOTS (INTEGRACIÓN n8n) ─────────────── */
function BotsSection() {
  const bots = [
    { name: "Recepcionista WhatsApp", desc: "Multi-cliente. Gestión de leads inicial.", status: "Online", color: "#10b981" }, //
    { name: "Followup Post-Cita", desc: "Envío automático de Google Reviews.", status: "Online", color: "#3b82f6" }, //
    { name: "Reporte Semanal", desc: "Inteligencia de Mercado con IA.", status: "Scheduled", color: "#a855f7" } //
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 10 }}>Gestión de Automatizaciones</h2>
      <p style={{ fontSize: 13, color: "#5a5a6e", marginBottom: 25 }}>Conectado a {NODAI_DATA.n8n_url}</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
        {bots.map(bot => (
          <div key={bot.name} style={cardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 15 }}>
              <h3 style={{ fontSize: 16 }}>{bot.name}</h3>
              <Badge color={bot.color}>{bot.status}</Badge>
            </div>
            <p style={{ fontSize: 13, color: "#8b8b9e", marginBottom: 20 }}>{bot.desc}</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button style={btnStyle} onClick={() => alert(`Reiniciando ${bot.name} en n8n...`)}>Reiniciar</button>
              <button style={{ ...btnStyle, background: "#10b98120", color: "#10b981" }}>Configurar</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────── SECCIÓN DE RECURSOS ─────────────── */
function ResourcesSection() {
  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>Recursos y Guías</h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div style={cardStyle}>
          <h3 style={{ color: "#10b981", marginBottom: 10 }}>📜 Guion de Ventas Nodai</h3>
          <p style={{ fontSize: 13, color: "#8b8b9e", lineHeight: "1.6" }}>
            Estructura optimizada para cierres de servicios de automatización.
          </p>
          <button style={btnStyle}>Abrir Guion</button>
        </div>
      </div>
    </div>
  );
}

const cardStyle = { background: "#111116", padding: "24px", borderRadius: "14px", border: "1px solid #1e1e28" };
const btnStyle = { padding: "8px 16px", background: "#1a1a22", color: "#ccc", border: "1px solid #2a2a35", borderRadius: "8px", cursor: "pointer", fontSize: 12 };

function StatCard({ label, value, color }) {
  return (
    <div style={{ ...cardStyle, flex: 1, borderTop: `4px solid ${color}` }}>
      <div style={{ fontSize: 11, color: "#5a5a6e", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

function DataTable({ data, columns }) {
  return (
    <div style={{ overflowX: "auto", borderRadius: "12px", border: "1px solid #1e1e28" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", background: "#0d0d12" }}>
        <thead><tr style={{ textAlign: "left", color: "#5a5a6e", fontSize: 11, background: "#111116" }}>
          {columns.map(c => <th key={c} style={{ padding: "15px", borderBottom: "1px solid #1e1e28" }}>{c.replace('_', ' ').toUpperCase()}</th>)}
        </tr></thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} style={{ borderBottom: "1px solid #1a1a22" }}>
              {columns.map(c => <td key={c} style={{ padding: "15px", fontSize: 13, color: "#c8c8d5" }}>{row[c] || "—"}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  return (
    <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#09090d" }}>
      <div style={{ background: "#111116", padding: "40px", borderRadius: "20px", border: "1px solid #1e1e28", width: "340px" }}>
        <h2 style={{ color: "#10b981", marginBottom: 30, textAlign: "center" }}>NODAI AGENCY</h2>
        <input type="email" placeholder="Email" onChange={e => setEmail(e.target.value)} style={inputStyle} />
        <input type="password" placeholder="Contraseña" onChange={e => setPass(e.target.value)} style={inputStyle} />
        <button onClick={() => onLogin(email, pass)} style={{ ...btnStyle, background: "#10b981", color: "white", width: "100%", fontWeight: "bold", padding: "12px" }}>ACCEDER AL PANEL</button>
      </div>
    </div>
  );
}
const inputStyle = { width: "100%", padding: "12px", marginBottom: "15px", background: "#0d0d12", border: "1px solid #2a2a35", color: "white", borderRadius: "10px", boxSizing: "border-box", outline: "none" };