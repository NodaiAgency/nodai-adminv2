"use client";
import { useState, useCallback, useEffect } from "react";

/* ─────────────── CONFIGURACIÓN NODAI ─────────────── */
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

const PLAN_COLORS = { "Nodo 97€": "#10b981", "Conector 147€": "#3b82f6", "Arquitecto 197€": "#a855f7" };
const STATUS_COLORS = { Activo: "#10b981", Lead: "#f59e0b", Pausado: "#6b7280", Baja: "#ef4444", Pendiente: "#f59e0b", Pagada: "#10b981", Vencido: "#ef4444" };
const RANK_COLORS = { Nodo: "#6b7280", Bronce: "#cd7f32", Plata: "#c0c0c0", Oro: "#ffd700", Diamante: "#b9f2ff", Elite: "#a855f7", Zafiro: "#2563eb", Esmeralda: "#10b981", Corona: "#f59e0b", Fundador: "#ef4444" };

/* ─────────────── UTILIDADES ─────────────── */
const formatValue = (v) => (Array.isArray(v) ? v[0] : (typeof v === "string" && v.startsWith("rec") ? "—" : v ?? "—"));
const renderCurrency = (v) => (v != null ? `${Number(v).toFixed(2)} €` : "—");
const renderDate = (v) => (v ? new Date(v).toLocaleDateString("es-ES") : "—");

/* ─────────────── COMPONENTES UI ─────────────── */
function Badge({ children, color }) {
  return (
    <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 999, fontSize: 11, fontWeight: 600, background: color + "18", color: color, border: `1px solid ${color}30` }}>
      {formatValue(children)}
    </span>
  );
}

function KPICard({ label, value, sub, accent }) {
  return (
    <div style={{ background: "#141419", border: "1px solid #23232b", borderRadius: 14, padding: "22px 24px", flex: "1 1 200px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${accent}, transparent)` }} />
      <div style={{ fontSize: 11, color: "#8b8b9e", fontWeight: 600, textTransform: "uppercase", marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: "#f0f0f5", fontFamily: "monospace" }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: "#5a5a6e", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

/* ─────────────── PANEL PRINCIPAL ─────────────── */
export default function NodaiAdminPanel() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [data, setData] = useState({ vendedores: [], clientes: [], contratos: [], comisiones: [] });
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogin = (email, pass) => {
    if (email === "ivan@nodaiagency.com" && pass === "nodai2025") setUser({ email, name: "Iván", role: "admin" });
    else if (pass === "nodai2025") setUser({ email, name: email.split('@')[0], role: "vendedor" });
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    const results = {};
    for (const [key, name] of Object.entries(AIRTABLE_CONFIG.tables)) {
      try {
        const res = await fetch(`https://api.airtable.com/v0/${AIRTABLE_CONFIG.baseId}/${encodeURIComponent(name)}`, {
          headers: { Authorization: `Bearer ${AIRTABLE_CONFIG.apiKey}` }
        });
        const json = await res.json();
        results[key] = json.records?.map(r => ({ id: r.id, ...r.fields })) || [];
      } catch (e) { console.error(e); }
    }
    setData(results);
    setLoading(false);
  }, []);

  useEffect(() => { if (user) loadData(); }, [user, loadData]);

  if (!user) return <LoginScreen onLogin={handleLogin} />;

  const { vendedores, clientes, contratos, comisiones } = data;
  
  // Lógica de filtrado
  const filteredClientes = user.role === "admin" ? clientes : clientes.filter(c => formatValue(c.Vendedor) === user.name || c.Email_Vendedor === user.email);
  const activeClientsCount = filteredClientes.filter(c => c.Estado === "Activo").length;
  const totalMRR = (user.role === "admin" ? contratos : contratos.filter(c => formatValue(c.Vendedor) === user.name))
    .filter(c => c.Estado === "Activo").reduce((acc, c) => acc + (c.Importe || 0), 0);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#09090d", color: "#e0e0ea", fontFamily: "Inter, sans-serif" }}>
      {/* Sidebar */}
      <div style={{ width: sidebarOpen ? 220 : 70, background: "#0d0d12", borderRight: "1px solid #1a1a22", transition: "0.3s", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "20px", fontSize: 20, fontWeight: 800, color: "#10b981", borderBottom: "1px solid #1a1a22" }}>
            {sidebarOpen ? "NODAI" : "N"}
        </div>
        <nav style={{ flex: 1, padding: "10px" }}>
          {["dashboard", "vendedores", "clientes", "comisiones", "recursos", "bots"].map(p => (
            <button key={p} onClick={() => setPage(p)} style={{ 
              width: "100%", padding: "12px", background: page === p ? "#141419" : "transparent", color: page === p ? "#10b981" : "#5a5a6e", 
              border: "none", borderRadius: 8, textAlign: "left", cursor: "pointer", marginBottom: 5, textTransform: "capitalize", fontWeight: page === p ? 600 : 400
            }}>
              {sidebarOpen ? p : p[0].toUpperCase()}
            </button>
          ))}
        </nav>
        <button onClick={() => setUser(null)} style={{ padding: "20px", background: "none", border: "none", color: "#5a5a6e", cursor: "pointer", fontSize: 12 }}>Cerrar Sesión</button>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: "30px", overflowY: "auto" }}>
        {loading && <div style={{ color: "#10b981", marginBottom: 20 }}>Actualizando desde Airtable...</div>}

        {page === "dashboard" && (
          <div>
            <h1 style={{ fontSize: 24, marginBottom: 25 }}>Bienvenido, {user.name}</h1>
            
            {/* Stats Grid */}
            <div style={{ display: "flex", gap: 15, marginBottom: 30, flexWrap: "wrap" }}>
              <KPICard label="MRR Activo" value={renderCurrency(totalMRR)} accent="#3b82f6" sub="Ingresos recurrentes" />
              <KPICard label="Clientes Activos" value={activeClientsCount} accent="#10b981" sub={`${filteredClientes.length} totales`} />
              <KPICard label="Rango" value={user.role === "admin" ? "Fundador" : "Nodo"} accent="#f59e0b" sub="Nivel actual" />
            </div>

            {/* Dash Content Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
              {/* Últimos Contratos */}
              <div style={cardContainer}>
                <h3 style={cardTitle}>Últimos Contratos</h3>
                {contratos.slice(0, 5).map((c, i) => (
                  <div key={i} style={listItem}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{formatValue(c.Cliente)}</div>
                      <div style={{ fontSize: 11, color: "#5a5a6e" }}>{formatValue(c.Vendedor)}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <Badge color={PLAN_COLORS[c.Plan]}>{c.Plan}</Badge>
                      <div style={{ fontSize: 11, color: "#5a5a6e", marginTop: 4 }}>{renderDate(c.Fecha_inicio)}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Ranking Vendedores */}
              <div style={cardContainer}>
                <h3 style={cardTitle}>Ranking Vendedores</h3>
                {[...vendedores].sort((a,b) => (b.Comisiones_totales || 0) - (a.Comisiones_totales || 0)).slice(0, 5).map((v, i) => (
                  <div key={i} style={listItem}>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <span style={{ color: i === 0 ? "#ffd700" : "#5a5a6e", fontWeight: 800 }}>#{i+1}</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{v.Nombre}</div>
                        <Badge color={RANK_COLORS[v.Rango]}>{v.Rango}</Badge>
                      </div>
                    </div>
                    <div style={{ color: "#10b981", fontWeight: 700, fontFamily: "monospace" }}>{renderCurrency(v.Comisiones_totales)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Gráfico de Distribución */}
            <div style={cardContainer}>
               <h3 style={cardTitle}>Distribución de Planes Activos</h3>
               <div style={{ display: "flex", gap: 20 }}>
                 {Object.keys(PLAN_COLORS).map(plan => {
                   const count = filteredClientes.filter(c => c.Plan === plan && c.Estado === "Activo").length;
                   const pct = activeClientsCount > 0 ? (count / activeClientsCount) * 100 : 0;
                   return (
                     <div key={plan} style={{ flex: 1 }}>
                       <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 12 }}>
                         <span>{plan}</span>
                         <span style={{ color: PLAN_COLORS[plan], fontWeight: 700 }}>{count}</span>
                       </div>
                       <div style={{ height: 6, background: "#1a1a22", borderRadius: 3 }}>
                         <div style={{ width: `${pct}%`, height: "100%", background: PLAN_COLORS[plan], borderRadius: 3, transition: "0.5s" }} />
                       </div>
                     </div>
                   );
                 })}
               </div>
            </div>
          </div>
        )}

        {page === "bots" && <BotsSection />}
        {page === "recursos" && <ResourcesSection />}
        {page === "clientes" && <TableView data={filteredClientes} columns={["Nombre_negocio", "Contacto", "Estado", "Plan", "Vendedor"]} />}
        {page === "vendedores" && user.role === "admin" && <TableView data={vendedores} columns={["Nombre", "Email", "Rango", "Clientes_activos"]} />}
      </div>
    </div>
  );
}

/* ─────────────── ESTILOS Y SECCIONES ─────────────── */
const cardContainer = { background: "#111116", padding: "20px", borderRadius: "14px", border: "1px solid #1e1e28" };
const cardTitle = { fontSize: 13, color: "#8b8b9e", marginBottom: 20, textTransform: "uppercase", letterSpacing: 1 };
const listItem = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #1a1a22" };

function BotsSection() {
  const bots = [
    { name: "Recepcionista WhatsApp", desc: "IA multi-cliente. Gestión de leads entrantes.", status: "Online", color: "#10b981" },
    { name: "Followup Post-Cita", desc: "Automatización de reseñas y seguimiento.", status: "Online", color: "#3b82f6" },
    { name: "Reporte Semanal", desc: "Inteligencia de mercado enviada a clientes.", status: "Scheduled", color: "#a855f7" }
  ];
  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>Nodai Automation Stack</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
        {bots.map(b => (
          <div key={b.name} style={cardContainer}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 15 }}>
              <h3>{b.name}</h3>
              <Badge color={b.color}>{b.status}</Badge>
            </div>
            <p style={{ fontSize: 13, color: "#8b8b9e", marginBottom: 20 }}>{b.desc}</p>
            <button style={{ padding: "8px 16px", background: "#1a1a22", color: "#ccc", border: "1px solid #2a2a35", borderRadius: 8, cursor: "pointer" }}>Configurar en n8n</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ResourcesSection() {
  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>Recursos y PDFs</h2>
      <div style={cardContainer}>
        <h3 style={{ color: "#10b981", marginBottom: 10 }}>📜 Guion de Ventas Nodai Agency</h3>
        <p style={{ fontSize: 14, color: "#8b8b9e", lineHeight: 1.6 }}>Utiliza este guion actualizado para cerrar clientes de Automatización e IA.</p>
        <button style={{ marginTop: 15, padding: "10px 20px", background: "#10b981", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700 }}>Abrir Documento</button>
      </div>
    </div>
  );
}

function TableView({ data, columns }) {
  return (
    <div style={{ borderRadius: 12, border: "1px solid #1e1e28", overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead style={{ background: "#111116", color: "#5a5a6e", textAlign: "left" }}>
          <tr>{columns.map(c => <th key={c} style={{ padding: "15px", textTransform: "uppercase", fontSize: 11 }}>{c.replace('_', ' ')}</th>)}</tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} style={{ borderBottom: "1px solid #151520", background: i % 2 === 0 ? "#0d0d12" : "#111116" }}>
              {columns.map(c => (
                <td key={c} style={{ padding: "15px", color: "#c8c8d5" }}>
                  {c === "Estado" || c === "Plan" || c === "Rango" ? <Badge color={STATUS_COLORS[row[c]] || PLAN_COLORS[row[c]] || RANK_COLORS[row[c]] || "#6b7280"}>{row[c]}</Badge> : formatValue(row[c])}
                </td>
              ))}
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
        <h2 style={{ color: "#10b981", marginBottom: 30, textAlign: "center", letterSpacing: -1 }}>NODAI AGENCY</h2>
        <input type="email" placeholder="Email" onChange={e => setEmail(e.target.value)} style={inputStyle} />
        <input type="password" placeholder="Contraseña" onChange={e => setPass(e.target.value)} style={inputStyle} />
        <button onClick={() => onLogin(email, pass)} style={{ width: "100%", padding: "12px", background: "#10b981", color: "white", border: "none", borderRadius: "10px", fontWeight: "bold", cursor: "pointer" }}>ACCEDER AL PANEL</button>
      </div>
    </div>
  );
}
const inputStyle = { width: "100%", padding: "12px", marginBottom: "15px", background: "#0d0d12", border: "1px solid #2a2a35", color: "white", borderRadius: "10px", boxSizing: "border-box", outline: "none" };