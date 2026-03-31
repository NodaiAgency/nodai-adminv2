"use client";
import { useState, useCallback, useEffect } from "react";

/* ─────────────── CONFIGURACIÓN Y CONSTANTES ─────────────── */
const AIRTABLE_CONFIG = {
  baseId: process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID,
  apiKey: process.env.NEXT_PUBLIC_AIRTABLE_API_KEY,
  tables: { vendedores: "Vendedores", clientes: "Clientes", contratos: "Contratos", comisiones: "Comisiones" },
};

const NODAI_DATA = {
  ranks: ["Nodo", "Bronce", "Plata", "Oro", "Diamante", "Elite", "Zafiro", "Esmeralda", "Corona", "Fundador"],
  plans: { "Nodo 97€": 97, "Conector 147€": 147, "Arquitecto 197€": 197 },
  colors: {
    plans: { "Nodo 97€": "#10b981", "Conector 147€": "#3b82f6", "Arquitecto 197€": "#a855f7" },
    status: { Activo: "#10b981", Lead: "#f59e0b", Pausado: "#6b7280", Baja: "#ef4444", Pendiente: "#f59e0b", Pagada: "#10b981", Vencido: "#ef4444" },
    ranks: { Nodo: "#6b7280", Bronce: "#cd7f32", Plata: "#c0c0c0", Oro: "#ffd700", Diamante: "#b9f2ff", Elite: "#a855f7", Zafiro: "#2563eb", Esmeralda: "#10b981", Corona: "#f59e0b", Fundador: "#ef4444" }
  }
};

/* ─────────────── UTILIDADES DE FORMATEO ─────────────── */
const formatValue = (v) => (Array.isArray(v) ? v[0] : (typeof v === "string" && v.startsWith("rec") ? "—" : v ?? "—"));
const renderCurrency = (v) => (v != null ? `${Number(v).toFixed(2)} €` : "0.00 €");
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
      <div style={{ fontSize: 11, color: "#8b8b9e", fontWeight: 600, textTransform: "uppercase", marginBottom: 8, letterSpacing: "0.05em" }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: "#f0f0f5", fontFamily: "monospace" }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: "#5a5a6e", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

/* ─────────────── NAVEGACIÓN Y PESTAÑAS ─────────────── */
const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: "◈" },
  { key: "vendedores", label: "Vendedores", icon: "◇" },
  { key: "clientes", label: "Clientes", icon: "□" },
  { key: "comisiones", label: "Comisiones", icon: "△" },
  { key: "recursos", label: "Recursos", icon: "📂" },
  { key: "bots", label: "Bots", icon: "🤖" },
];

/* ─────────────── PANEL PRINCIPAL ─────────────── */
export default function NodaiAdminPanel() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [data, setData] = useState({ vendedores: [], clientes: [], contratos: [], comisiones: [] });
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

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
      } catch (e) { console.error("Error cargando tabla:", key, e); }
    }
    setData(results);
    setLoading(false);
  }, []);

  useEffect(() => { if (user) loadData(); }, [user, loadData]);

  if (!user) return <LoginScreen onLogin={handleLogin} />;

  // Lógica de Filtrado según Rol
  const filteredClientes = user.role === "admin" ? data.clientes : data.clientes.filter(c => formatValue(c.Vendedor) === user.name || c.Email_Vendedor === user.email);
  const filteredContratos = user.role === "admin" ? data.contratos : data.contratos.filter(c => formatValue(c.Vendedor) === user.name);
  const filteredComisiones = user.role === "admin" ? data.comisiones : data.comisiones.filter(c => formatValue(c.Vendedor) === user.name);

  // Cálculos Dashboard
  const activeClients = filteredClientes.filter(c => c.Estado === "Activo");
  const totalMRR = filteredContratos.filter(c => c.Estado === "Activo").reduce((acc, c) => acc + (c.Importe || 0), 0);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#09090d", color: "#e0e0ea", fontFamily: "Inter, sans-serif" }}>
      {/* Sidebar Fija */}
      <div style={{ width: 240, background: "#0d0d12", borderRight: "1px solid #1a1a22", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: "30px 24px", borderBottom: "1px solid #1a1a22" }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#10b981", letterSpacing: "-0.04em" }}>NODAI</div>
          <div style={{ fontSize: 10, color: "#5a5a6e", letterSpacing: "0.2em", marginTop: 4 }}>{user.role.toUpperCase()} ACCESS</div>
        </div>
        
        <nav style={{ flex: 1, padding: "20px 12px" }}>
          {NAV_ITEMS.map((item) => (
            (item.key === "vendedores" && user.role !== "admin") ? null : (
              <button key={item.key} onClick={() => setPage(item.key)} style={{
                width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", marginBottom: 4,
                background: page === item.key ? "#141419" : "transparent", border: "none", borderRadius: 10,
                color: page === item.key ? "#10b981" : "#6b6b80", cursor: "pointer", transition: "0.2s", textAlign: "left"
              }}>
                <span style={{ fontSize: 16 }}>{item.icon}</span>
                <span style={{ fontSize: 13, fontWeight: page === item.key ? 600 : 400 }}>{item.label}</span>
              </button>
            )
          ))}
        </nav>

        <div style={{ padding: "20px", borderTop: "1px solid #1a1a22" }}>
          <button onClick={() => setUser(null)} style={{ color: "#5a5a6e", background: "none", border: "none", cursor: "pointer", fontSize: 12 }}>Cerrar Sesión</button>
        </div>
      </div>

      {/* Área de Contenido Principal */}
      <div style={{ flex: 1, padding: "40px", overflowY: "auto" }}>
        {loading && <div style={{ color: "#10b981", position: "fixed", top: 20, right: 40, fontSize: 12 }}>Sincronizando Airtable...</div>}

        {page === "dashboard" && (
          <div>
            <div style={{ marginBottom: 32 }}>
                <h1 style={{ fontSize: 24, fontWeight: 700, color: "#f0f0f5", margin: 0 }}>Panel de Control — {user.name}</h1>
                <p style={{ fontSize: 13, color: "#5a5a6e", marginTop: 6 }}>Vista general de rendimiento y métricas clave.</p>
            </div>

            {/* Fila de Estadísticas (KPIs) */}
            <div style={{ display: "flex", gap: 16, marginBottom: 32, flexWrap: "wrap" }}>
              <KPICard label="MRR Activo" value={renderCurrency(totalMRR)} accent="#3b82f6" sub="Ingresos mensuales" />
              <KPICard label="Clientes" value={activeClients.length} accent="#10b981" sub={`${filteredClientes.length} registros`} />
              <KPICard label="Rango" value={user.role === "admin" ? "Fundador" : "Nodo"} accent="#f59e0b" sub="Nivel de cuenta" />
              <KPICard label="Vendedores" value={data.vendedores.length} accent="#a855f7" sub="Equipo activo" />
            </div>

            {/* Grid de Tablas Resumen */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
              {/* Últimos Contratos */}
              <div style={containerStyle}>
                <h3 style={headerStyle}>Últimos Contratos</h3>
                {data.contratos.slice(0, 5).map((c, i) => (
                  <div key={i} style={listStyle} onClick={() => setSelectedItem(c)}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: "#e0e0ea" }}>{formatValue(c.Cliente)}</div>
                      <div style={{ fontSize: 11, color: "#5a5a6e" }}>{formatValue(c.Vendedor)}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <Badge color={NODAI_DATA.colors.plans[c.Plan]}>{c.Plan}</Badge>
                      <div style={{ fontSize: 11, color: "#5a5a6e", marginTop: 4 }}>{renderDate(c.Fecha_inicio)}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Ranking de Vendedores */}
              <div style={containerStyle}>
                <h3 style={headerStyle}>Top Vendedores</h3>
                {[...data.vendedores].sort((a,b) => (b.Comisiones_totales || 0) - (a.Comisiones_totales || 0)).slice(0, 5).map((v, i) => (
                  <div key={i} style={listStyle}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: i === 0 ? "#ffd700" : "#5a5a6e", width: 20 }}>#{i+1}</span>
                      <div>
                        <div style={{ fontSize: 13, color: "#c8c8d5", fontWeight: 500 }}>{v.Nombre}</div>
                        <Badge color={NODAI_DATA.colors.ranks[v.Rango]}>{v.Rango}</Badge>
                      </div>
                    </div>
                    <div style={{ color: "#10b981", fontWeight: 700, fontFamily: "monospace" }}>{renderCurrency(v.Comisiones_totales)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Distribución de Planes */}
            <div style={containerStyle}>
              <h3 style={headerStyle}>Distribución de Planes Activos</h3>
              <div style={{ display: "flex", gap: 30 }}>
                {Object.keys(NODAI_DATA.plans).map(plan => {
                  const count = activeClients.filter(c => c.Plan === plan).length;
                  const pct = activeClients.length > 0 ? (count / activeClients.length) * 100 : 0;
                  return (
                    <div key={plan} style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 12 }}>
                        <span style={{ color: "#8b8b9e" }}>{plan}</span>
                        <span style={{ fontWeight: 700, color: NODAI_DATA.colors.plans[plan] }}>{count}</span>
                      </div>
                      <div style={{ height: 6, background: "#1a1a22", borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: NODAI_DATA.colors.plans[plan], transition: "0.6s" }} />
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
        {page === "comisiones" && <TableView data={filteredComisiones} columns={["Concepto", "Vendedor", "Importe", "Estado_pago", "Fecha_generada"]} />}
        {page === "vendedores" && user.role === "admin" && <TableView data={data.vendedores} columns={["Nombre", "Email", "Rango", "Clientes_activos", "Comisiones_totales"]} />}
      </div>
    </div>
  );
}

/* ─────────────── SECCIONES ADICIONALES ─────────────── */

function TableView({ data, columns }) {
  return (
    <div style={{ borderRadius: 14, border: "1px solid #1e1e28", overflow: "hidden", background: "#0d0d12" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ background: "#111116", color: "#5a5a6e", textAlign: "left" }}>
            {columns.map(c => <th key={c} style={{ padding: "16px", fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>{c.replace('_', ' ')}</th>)}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} style={{ borderBottom: "1px solid #151520", transition: "0.15s" }}>
              {columns.map(c => (
                <td key={c} style={{ padding: "16px", color: "#c8c8d5" }}>
                  {c === "Estado" || c === "Plan" || c === "Rango" || c === "Estado_pago" ? 
                    <Badge color={NODAI_DATA.colors.status[row[c]] || NODAI_DATA.colors.plans[row[c]] || NODAI_DATA.colors.ranks[row[c]] || "#6b7280"}>{row[c]}</Badge> : 
                    (c.includes("Importe") || c.includes("Comisiones") ? renderCurrency(row[c]) : (c.includes("Fecha") ? renderDate(row[c]) : formatValue(row[c])))
                  }
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BotsSection() {
  const bots = [
    { name: "Recepcionista WhatsApp", desc: "IA Multi-cliente. Captación automática de leads.", status: "Online", color: "#10b981" },
    { name: "Followup Post-Cita", desc: "Solicitud de Google Reviews y feedback automatizado.", status: "Online", color: "#3b82f6" },
    { name: "Reporte Semanal", desc: "Análisis de mercado con IA para clientes activos.", status: "Scheduled", color: "#a855f7" }
  ];
  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>Bots de Automatización</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
        {bots.map(b => (
          <div key={b.name} style={containerStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, margin: 0 }}>{b.name}</h3>
              <Badge color={b.color}>{b.status}</Badge>
            </div>
            <p style={{ fontSize: 13, color: "#8b8b9e", lineHeight: 1.6, marginBottom: 20 }}>{b.desc}</p>
            <button style={actionBtnStyle} onClick={() => alert("Conectando con n8n.nodaiagency.com...")}>Gestionar en n8n</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ResourcesSection() {
  return (
    <div style={{ maxWidth: 800 }}>
      <h2 style={{ marginBottom: 24 }}>Recursos del Equipo</h2>
      <div style={{ ...containerStyle, marginBottom: 20 }}>
        <h3 style={{ color: "#10b981", marginBottom: 12 }}>📜 Guion de Ventas Nodai Agency</h3>
        <p style={{ fontSize: 14, color: "#8b8b9e", lineHeight: 1.7 }}>
          Utiliza este guion para llamadas frías y cualificación de leads. Recuerda el enfoque en ahorro de costes mediante IA.
        </p>
        <button style={{ ...actionBtnStyle, background: "#10b981", color: "white", marginTop: 16, border: "none" }}>Abrir Guion</button>
      </div>
      <div style={containerStyle}>
        <h3 style={{ color: "#3b82f6", marginBottom: 12 }}>📊 Dossier Corporativo 2026</h3>
        <p style={{ fontSize: 14, color: "#8b8b9e" }}>Resumen de servicios: Starter (97€), Business (147€) y Enterprise (197€).</p>
        <button style={actionBtnStyle}>Descargar PDF</button>
      </div>
    </div>
  );
}

/* ─────────────── ESTILOS REUTILIZABLES ─────────────── */
const containerStyle = { background: "#111116", padding: "24px", borderRadius: "14px", border: "1px solid #1e1e28" };
const headerStyle = { fontSize: 12, color: "#8b8b9e", marginBottom: 20, textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 600 };
const listStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: "1px solid #1a1a22", cursor: "pointer" };
const actionBtnStyle = { padding: "10px 20px", background: "#1a1a22", color: "#ccc", border: "1px solid #2a2a35", borderRadius: "8px", cursor: "pointer", fontSize: 13, fontWeight: 600 };

function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  return (
    <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#09090d" }}>
      <div style={{ background: "#111116", padding: "44px", borderRadius: "24px", border: "1px solid #1e1e28", width: "360px", boxShadow: "0 20px 50px rgba(0,0,0,0.5)" }}>
        <h2 style={{ color: "#10b981", textAlign: "center", fontSize: 24, fontWeight: 800, marginBottom: 8 }}>NODAI</h2>
        <p style={{ textAlign: "center", color: "#5a5a6e", fontSize: 11, letterSpacing: 3, marginBottom: 32, textTransform: "uppercase" }}>Agency CRM</p>
        <input type="email" placeholder="Email corporativo" onChange={e => setEmail(e.target.value)} style={inputStyle} />
        <input type="password" placeholder="Contraseña" onChange={e => setPass(e.target.value)} style={inputStyle} />
        <button onClick={() => onLogin(email, pass)} style={{ width: "100%", padding: "14px", background: "#10b981", color: "white", border: "none", borderRadius: "12px", fontWeight: 700, cursor: "pointer", marginTop: 10 }}>ENTRAR AL PANEL</button>
      </div>
    </div>
  );
}
const inputStyle = { width: "100%", padding: "14px", marginBottom: "16px", background: "#0d0d12", border: "1px solid #2a2a35", color: "white", borderRadius: "12px", boxSizing: "border-box", outline: "none", fontSize: 14 };