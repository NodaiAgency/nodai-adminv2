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
  support_phone: "34919933251", 
  support_msg: "Hola, necesito que me ayudeis.",
  colors: {
    plans: { "Nodo 97€": "#10b981", "Conector 147€": "#3b82f6", "Arquitecto 197€": "#a855f7" },
    status: { Activo: "#10b981", Lead: "#f59e0b", Pausado: "#6b7280", Baja: "#ef4444", Pendiente: "#f59e0b", Pagada: "#10b981", Vencido: "#ef4444" },
    ranks: { Nodo: "#6b7280", Bronce: "#cd7f32", Plata: "#c0c0c0", Oro: "#ffd700", Diamante: "#b9f2ff", Elite: "#a855f7", Zafiro: "#2563eb", Esmeralda: "#10b981", Corona: "#f59e0b", Fundador: "#ef4444" }
  }
};

/* ─────────────── UTILIDADES INTELIGENTES DE FORMATEO ─────────────── */
const resolveName = (v, data) => {
  let val = Array.isArray(v) ? v[0] : v;
  if (typeof val === "string" && val.startsWith("rec")) {
    if (!data) return "—";
    const cliente = data.clientes?.find(c => c.id === val);
    if (cliente) return cliente.Nombre_negocio || cliente.Nombre;
    const vendedor = data.vendedores?.find(vd => vd.id === val);
    if (vendedor) return vendedor.Nombre;
    return "—"; 
  }
  return val ?? "—";
};

const renderCurrency = (v) => {
  let val = Array.isArray(v) ? v[0] : v;
  return val != null && !isNaN(val) ? `${Number(val).toFixed(2)} €` : "0.00 €";
};

const renderDate = (v) => {
  let val = Array.isArray(v) ? v[0] : v;
  return val ? new Date(val).toLocaleDateString("es-ES") : "—";
};

/* ─────────────── COMPONENTES UI ─────────────── */
function Badge({ children, color }) {
  return (
    <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 999, fontSize: 11, fontWeight: 600, background: color + "18", color: color, border: `1px solid ${color}30` }}>
      {children}
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

function PageHeader({ title, subtitle, count, countLabel }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32, paddingBottom: 24, borderBottom: "1px solid #1a1a22" }}>
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#f0f0f5", margin: 0 }}>{title}</h1>
        <p style={{ fontSize: 13, color: "#5a5a6e", marginTop: 6, margin: "6px 0 0 0" }}>{subtitle}</p>
      </div>
      {count !== undefined && (
        <div style={{ background: "#10b98115", padding: "10px 16px", borderRadius: 10, border: "1px solid #10b98140", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ color: "#10b981", fontWeight: 800, fontSize: 18, fontFamily: "monospace" }}>{count}</span>
          <span style={{ color: "#8b8b9e", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>{countLabel}</span>
        </div>
      )}
    </div>
  );
}

/* ─────────────── NAVEGACIÓN ─────────────── */
const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: "📊" },
  { key: "vendedores", label: "Vendedores", icon: "👥" },
  { key: "clientes", label: "Clientes", icon: "🏢" },
  { key: "comisiones", label: "Comisiones", icon: "💰" },
  { key: "recursos", label: "Recursos", icon: "📂" },
  { key: "bots", label: "Bots", icon: "🤖" },
  { key: "soporte", label: "Soporte", icon: "💬" },
];

/* ─────────────── PANEL PRINCIPAL ─────────────── */
export default function NodaiAdminPanel() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [data, setData] = useState({ vendedores: [], clientes: [], contratos: [], comisiones: [] });
  const [loading, setLoading] = useState(false);

  const handleLogin = (email, pass) => {
    if (email === "ivan@nodaiagency.com" && pass === "nodai2025") setUser({ email, name: "Iván", role: "admin" });
    else if (pass === "nodai2025") setUser({ email, name: email.split('@')[0], role: "vendedor" });
  };

  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    const results = {};
    for (const [key, name] of Object.entries(AIRTABLE_CONFIG.tables)) {
      try {
        const res = await fetch(`https://api.airtable.com/v0/${AIRTABLE_CONFIG.baseId}/${encodeURIComponent(name)}`, {
          headers: { Authorization: `Bearer ${AIRTABLE_CONFIG.apiKey}` },
          cache: "no-store"
        });
        const json = await res.json();
        results[key] = json.records?.map(r => ({ id: r.id, ...r.fields })) || [];
      } catch (e) { console.error(e); }
    }
    setData(results);
    if (!isSilent) setLoading(false);
  }, []);

  useEffect(() => { 
    if (user) {
      loadData(false); 
      const interval = setInterval(() => loadData(true), 60000); 
      return () => clearInterval(interval);
    }
  }, [user, loadData]);

  if (!user) return <LoginScreen onLogin={handleLogin} />;

  const filteredClientes = user.role === "admin" ? data.clientes : data.clientes.filter(c => resolveName(c.Vendedor, data) === user.name || c.Email_Vendedor === user.email);
  const filteredContratos = user.role === "admin" ? data.contratos : data.contratos.filter(c => resolveName(c.Vendedor, data) === user.name);
  const totalMRR = filteredContratos.filter(c => c.Estado === "Activo").reduce((acc, c) => acc + (Array.isArray(c.Importe) ? c.Importe[0] : (c.Importe || 0)), 0);

  // Filtramos contratos vacíos
  const contratosValidos = data.contratos.filter(c => {
    const nombre = resolveName(c.Cliente, data);
    return nombre && nombre !== "—";
  });

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#09090d", color: "#e0e0ea", fontFamily: "Inter, sans-serif" }}>
      {/* Sidebar Fija */}
      <div style={{ width: 240, background: "#0d0d12", borderRight: "1px solid #1a1a22", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "30px 24px", borderBottom: "1px solid #1a1a22" }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#10b981" }}>NODAI</div>
          <div style={{ fontSize: 10, color: "#5a5a6e", letterSpacing: "0.2em" }}>{user.role.toUpperCase()} ACCESS</div>
        </div>
        <nav style={{ flex: 1, padding: "20px 12px" }}>
          {NAV_ITEMS.map((item) => (
            (item.key === "vendedores" && user.role !== "admin") ? null : (
              <button key={item.key} onClick={() => setPage(item.key)} style={{
                width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", marginBottom: 4,
                background: page === item.key ? "#141419" : "transparent", border: "none", borderRadius: 10,
                color: page === item.key ? "#10b981" : "#6b6b80", cursor: "pointer", textAlign: "left", transition: "0.2s"
              }}>
                <span style={{ fontSize: 16 }}>{item.icon}</span>
                <span style={{ fontSize: 13, fontWeight: page === item.key ? 600 : 400 }}>{item.label}</span>
              </button>
            )
          ))}
        </nav>
        
        <div style={{ padding: "20px", borderTop: "1px solid #1a1a22", display: "flex", flexDirection: "column", gap: 12 }}>
          <button onClick={() => loadData(false)} disabled={loading} style={{ 
            width: "100%", padding: "10px", background: "#10b98115", color: "#10b981", border: "1px solid #10b98140", 
            borderRadius: "8px", cursor: "pointer", fontSize: 12, fontWeight: 600, transition: "0.2s" 
          }}>
            {loading ? "Sincronizando..." : "🔄 Sincronizar Datos"}
          </button>
          <button onClick={() => setUser(null)} style={{ padding: "10px", background: "none", border: "none", color: "#5a5a6e", cursor: "pointer", fontSize: 12, textAlign: "left" }}>
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Main Area */}
      <div style={{ flex: 1, padding: "40px", overflowY: "auto", position: "relative" }}>
        
        {page === "dashboard" && (
          <div>
            <PageHeader title={`Panel de Control — ${user.name}`} subtitle="Vista general de rendimiento y métricas clave en tiempo real." />
            
            <div style={{ display: "flex", gap: 16, marginBottom: 32, flexWrap: "wrap" }}>
              <KPICard label="MRR Activo" value={renderCurrency(totalMRR)} accent="#3b82f6" sub="Ingresos mensuales" />
              <KPICard label="Clientes" value={filteredClientes.length} accent="#10b981" sub="Registros totales" />
              <KPICard label="Rango" value={user.role === "admin" ? "Fundador" : "Nodo"} accent="#f59e0b" sub="Nivel de cuenta" />
              {user.role === "admin" && <KPICard label="Vendedores" value={data.vendedores.length} accent="#a855f7" sub="Equipo activo" />}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
              <div style={containerStyle}>
                <h3 style={headerStyle}>Últimos Contratos</h3>
                {contratosValidos.slice(0, 5).map((c, i) => (
                  <div key={i} style={listStyle}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: "#e0e0ea" }}>{resolveName(c.Cliente, data)}</div>
                      <div style={{ fontSize: 11, color: "#5a5a6e", marginTop: 2 }}>{resolveName(c.Vendedor, data)}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      {c.Plan ? <Badge color={NODAI_DATA.colors.plans[c.Plan] || "#6b7280"}>{resolveName(c.Plan, data)}</Badge> : <span style={{fontSize: 11, color: "#5a5a6e"}}>Sin Plan</span>}
                      <div style={{ fontSize: 11, color: "#5a5a6e", marginTop: 4 }}>{renderDate(c.Fecha_inicio)}</div>
                    </div>
                  </div>
                ))}
                {contratosValidos.length === 0 && <div style={{color: "#5a5a6e", fontSize: 12, padding: "10px 0"}}>No hay contratos registrados.</div>}
              </div>

              <div style={containerStyle}>
                <h3 style={headerStyle}>Top Vendedores</h3>
                {[...data.vendedores].sort((a,b) => {
                  let valA = Array.isArray(a.Comisiones_totales) ? a.Comisiones_totales[0] : (a.Comisiones_totales || 0);
                  let valB = Array.isArray(b.Comisiones_totales) ? b.Comisiones_totales[0] : (b.Comisiones_totales || 0);
                  return valB - valA;
                }).slice(0, 5).map((v, i) => (
                  <div key={i} style={listStyle}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: i === 0 ? "#ffd700" : "#5a5a6e", width: 20 }}>#{i+1}</span>
                      <div>
                        <div style={{ fontSize: 13, color: "#c8c8d5", fontWeight: 500 }}>{resolveName(v.Nombre, data)}</div>
                        <Badge color={NODAI_DATA.colors.ranks[v.Rango] || "#6b7280"}>{resolveName(v.Rango, data)}</Badge>
                      </div>
                    </div>
                    <div style={{ color: "#10b981", fontWeight: 700, fontFamily: "monospace" }}>{renderCurrency(v.Comisiones_totales)}</div>
                  </div>
                ))}
              </div>
            </div>
            
            <div style={containerStyle}>
              <h3 style={headerStyle}>Distribución de Planes Activos</h3>
              <div style={{ display: "flex", gap: 30 }}>
                {Object.keys(NODAI_DATA.plans).map(plan => {
                  const count = filteredClientes.filter(c => c.Plan === plan && c.Estado === "Activo").length;
                  const pct = filteredClientes.length > 0 ? (count / filteredClientes.length) * 100 : 0;
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

        {page === "clientes" && (
          <div>
            <PageHeader title="Directorio de Clientes" subtitle="Gestiona el estado y los planes de las cuentas registradas." count={filteredClientes.length} countLabel="Registros" />
            <TableView data={filteredClientes} columns={["Nombre_negocio", "Estado", "Plan", "Vendedor"]} fullData={data} />
          </div>
        )}

        {page === "comisiones" && (
          <div>
            <PageHeader title="Panel de Comisiones" subtitle="Seguimiento de honorarios y estado de pagos por ventas." count={user.role === 'admin' ? data.comisiones.length : data.comisiones.filter(c => resolveName(c.Vendedor, data) === user.name).length} countLabel="Operaciones" />
            <TableView data={user.role === 'admin' ? data.comisiones : data.comisiones.filter(c => resolveName(c.Vendedor, data) === user.name)} columns={["Concepto", "Importe", "Estado_pago"]} fullData={data} />
          </div>
        )}

        {page === "vendedores" && user.role === "admin" && (
          <div>
            <PageHeader title="Equipo Comercial" subtitle="Métricas de ventas y jerarquía de rangos del equipo." count={data.vendedores.length} countLabel="Agentes" />
            <TableView data={data.vendedores} columns={["Nombre", "Email", "Rango", "Comisiones_totales"]} fullData={data} />
          </div>
        )}

        {page === "bots" && <BotsSection />}
        {page === "recursos" && <ResourcesSection />}
        {page === "soporte" && <SupportSection />}
      </div>
    </div>
  );
}

/* ─────────────── SECCIONES Y TABLAS (CON SORT) ─────────────── */
function TableView({ data, columns, fullData }) {
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState("desc");

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("desc"); } // Por defecto descendente (ideal para importes)
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortCol) return 0;
    let valA = a[sortCol];
    let valB = b[sortCol];

    valA = Array.isArray(valA) ? valA[0] : valA;
    valB = Array.isArray(valB) ? valB[0] : valB;

    // Si es un número (importes, etc)
    let numA = Number(valA);
    let numB = Number(valB);
    if (!isNaN(numA) && !isNaN(numB) && valA !== null && valB !== null && valA !== "" && valB !== "") {
      return sortDir === "asc" ? numA - numB : numB - numA;
    }

    // Si es texto
    let strA = resolveName(valA, fullData)?.toString().toLowerCase() || "";
    let strB = resolveName(valB, fullData)?.toString().toLowerCase() || "";
    return sortDir === "asc" ? strA.localeCompare(strB) : strB.localeCompare(strA);
  });

  return (
    <div style={{ borderRadius: 14, border: "1px solid #1e1e28", overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", background: "#0d0d12", fontSize: 13 }}>
        <thead style={{ background: "#111116", color: "#8b8b9e", textAlign: "left" }}>
          <tr>
            {columns.map(c => (
              <th key={c} onClick={() => handleSort(c)} style={{ padding: "16px", textTransform: "uppercase", fontSize: 11, cursor: "pointer", userSelect: "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {c.replace('_', ' ')}
                  {sortCol === c ? (sortDir === "asc" ? "↑" : "↓") : <span style={{opacity: 0.3}}>↕</span>}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row, i) => (
            <tr key={i} style={{ borderBottom: "1px solid #1a1a22", transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "#141419"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              {columns.map(c => {
                let val = resolveName(row[c], fullData);
                return (
                  <td key={c} style={{ padding: "16px", color: "#c8c8d5" }}>
                    {c === "Estado" || c === "Plan" || c === "Rango" || c === "Estado_pago" ? 
                      <Badge color={NODAI_DATA.colors.status[val] || NODAI_DATA.colors.plans[val] || NODAI_DATA.colors.ranks[val] || "#6b7280"}>{val}</Badge> : 
                      (c.includes("Importe") || c.includes("Comisiones") ? renderCurrency(row[c]) : (c.includes("Fecha") ? renderDate(row[c]) : val))
                    }
                  </td>
                );
              })}
            </tr>
          ))}
          {sortedData.length === 0 && (
            <tr><td colSpan={columns.length} style={{ padding: "24px", textAlign: "center", color: "#5a5a6e" }}>No hay registros disponibles.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function BotsSection() {
  const bots = [
    { name: "Recepcionista WhatsApp", status: "Online", color: "#10b981", desc: "IA Multi-cliente. Captación automática de leads." },
    { name: "Followup Post-Cita", status: "Offline", color: "#ef4444", desc: "Solicitud de Google Reviews y feedback automatizado. (Configurando)" },
    { name: "Reporte Semanal", status: "Online", color: "#10b981", desc: "Análisis de mercado con IA para clientes activos." }
  ];
  return (
    <div>
      <PageHeader title="Estado del Sistema" subtitle="Consulta la operatividad en tiempo real de los agentes de IA de Nodai Agency." />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
        {bots.map(b => (
          <div key={b.name} style={containerStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{display: "flex", alignItems: "center", gap: 10}}>
                <div style={{width: 8, height: 8, borderRadius: "50%", background: b.color, boxShadow: `0 0 10px ${b.color}`}}></div>
                <h3 style={{ fontSize: 16, margin: 0 }}>{b.name}</h3>
              </div>
              <span style={{ display: "inline-block", padding: "4px 12px", borderRadius: 999, fontSize: 11, fontWeight: 700, background: b.color + "15", color: b.color, border: `1px solid ${b.color}30` }}>
                {b.status}
              </span>
            </div>
            <p style={{ fontSize: 13, color: "#8b8b9e", lineHeight: 1.5, margin: 0 }}>{b.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ResourcesSection() {
  return (
    <div style={{ maxWidth: 800 }}>
      <PageHeader title="Recursos Corporativos" subtitle="Documentación, dossiers y guiones oficiales para el equipo comercial." />
      <div style={{ ...containerStyle, marginBottom: 20 }}>
        <h3 style={{ color: "#10b981", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}><span>📜</span> Guion de Ventas y PDF Oficial</h3>
        <p style={{ fontSize: 14, color: "#8b8b9e", lineHeight: 1.7 }}>
          Utiliza este documento oficial para tus llamadas comerciales y para presentar los servicios (Starter, Business, Enterprise).
        </p>
        <a href="https://drive.google.com/file/d/1heoJKKVypQnC1JBlOtIn18d1L3sgkQ9j/view?usp=sharing" target="_blank" rel="noopener noreferrer" style={{ ...actionBtnStyle, display: "inline-block", textDecoration: "none", background: "#10b981", color: "white", marginTop: 16, border: "none" }}>
          Abrir PDF de Ventas
        </a>
      </div>
    </div>
  );
}

function SupportSection() {
  const whatsappUrl = `https://wa.me/${NODAI_DATA.support_phone}?text=${encodeURIComponent(NODAI_DATA.support_msg)}`;
  return (
    <div style={{ maxWidth: 600 }}>
      <PageHeader title="Centro de Soporte" subtitle="Asistencia técnica y comercial directa con el equipo central." />
      <div style={{...containerStyle, textAlign: "center", padding: "40px 24px"}}>
        <div style={{ fontSize: 48, marginBottom: 20 }}>💬</div>
        <h3 style={{ marginBottom: 12, fontSize: 18 }}>¿Necesitas ayuda con el CRM o tus clientes?</h3>
        <p style={{ color: "#8b8b9e", fontSize: 14, lineHeight: 1.6, marginBottom: 30, maxWidth: 400, margin: "0 auto 30px auto" }}>
          Nuestro equipo de soporte está disponible para resolver cualquier incidencia sobre comisiones, bots de automatización o accesos.
        </p>
        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", background: "#25D366", color: "white", padding: "14px 32px", borderRadius: "12px", textDecoration: "none", fontWeight: 700, fontSize: 14, boxShadow: "0 4px 15px rgba(37, 211, 102, 0.3)" }}>
          Contactar por WhatsApp
        </a>
      </div>
    </div>
  );
}

function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  return (
    <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#09090d" }}>
      <div style={{ background: "#111116", padding: "44px", borderRadius: "24px", border: "1px solid #1e1e28", width: "360px", boxShadow: "0 20px 50px rgba(0,0,0,0.5)" }}>
        <h2 style={{ color: "#10b981", textAlign: "center", marginBottom: 30, fontSize: 26, fontWeight: 800, letterSpacing: -1 }}>NODAI CRM</h2>
        <input type="email" placeholder="Email corporativo" onChange={e => setEmail(e.target.value)} style={inputStyle} />
        <input type="password" placeholder="Contraseña" onChange={e => setPass(e.target.value)} style={inputStyle} />
        <button onClick={() => onLogin(email, pass)} style={{ width: "100%", padding: "14px", background: "#10b981", color: "white", border: "none", borderRadius: "12px", fontWeight: 700, cursor: "pointer", marginTop: 10, fontSize: 14 }}>ACCEDER AL PANEL</button>
      </div>
    </div>
  );
}

const containerStyle = { background: "#111116", padding: "24px", borderRadius: "14px", border: "1px solid #1e1e28" };
const headerStyle = { fontSize: 12, color: "#8b8b9e", marginBottom: 20, textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 600 };
const listStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: "1px solid #1a1a22" };
const actionBtnStyle = { padding: "10px 16px", background: "#1a1a22", color: "#ccc", border: "1px solid #2a2a35", borderRadius: "8px", cursor: "pointer", fontSize: 13, fontWeight: 600 };
const inputStyle = { width: "100%", padding: "14px", marginBottom: "16px", background: "#0d0d12", border: "1px solid #2a2a35", color: "white", borderRadius: "12px", boxSizing: "border-box", outline: "none", fontSize: 14 };