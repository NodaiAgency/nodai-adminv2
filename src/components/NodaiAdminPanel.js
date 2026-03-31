"use client";
import { useState, useCallback } from "react";

/* ─────────────── CONFIGURACIÓN ─────────────── 
   Cambia estos valores por los tuyos de Airtable:
   - baseId: lo encuentras en https://airtable.com/api → selecciona tu base → el ID empieza por "app..."
   - apiKey: créalo en https://airtable.com/create/tokens → dale permisos de lectura a tu base
*/
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
/* ─────────────── CREDENCIALES ADMIN ───────────────
   Cambia el email y contraseña por los que quieras usar.
   Para producción se recomienda usar un sistema de auth real (NextAuth, etc.)
*/
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

/* ─────────────── DATOS DEMO ─────────────── */
const DEMO_DATA = {
  vendedores: [
    { id: "v1", Nombre: "Ivan Nodai", Email: "ivan@nodaiagency.com", Telefono: "+34600000001", Rango: "Fundador", Fecha_alta: "2025-01-01", Clientes_activos: 12, Comisiones_totales: 4850 },
    { id: "v2", Nombre: "Carlos Lopez", Email: "carlos@ejemplo.com", Telefono: "+34600000002", Rango: "Plata", Fecha_alta: "2025-06-15", Clientes_activos: 5, Comisiones_totales: 1920 },
    { id: "v3", Nombre: "Maria Garcia", Email: "maria@ejemplo.com", Telefono: "+34600000003", Rango: "Bronce", Fecha_alta: "2025-07-01", Clientes_activos: 3, Comisiones_totales: 780 },
    { id: "v4", Nombre: "Pedro Sanchez", Email: "pedro@ejemplo.com", Telefono: "+34600000004", Rango: "Oro", Fecha_alta: "2025-03-10", Clientes_activos: 8, Comisiones_totales: 3200 },
    { id: "v5", Nombre: "Laura Ruiz", Email: "laura@ejemplo.com", Telefono: "+34600000005", Rango: "Nodo", Fecha_alta: "2025-09-01", Clientes_activos: 1, Comisiones_totales: 194 },
  ],
  clientes: [
    { id: "c1", Nombre_negocio: "Peluquería Estilo", Contacto: "Ana Martinez", Email: "ana@peluqueriaestilo.com", Estado: "Activo", Plan: "Nodo 97€", Vendedor: "Carlos Lopez", Fecha_alta: "2025-07-20", Ciudad: "Madrid" },
    { id: "c2", Nombre_negocio: "Clínica Dental Sonrisa", Contacto: "Dr. Pedro Ruiz", Email: "pedro@clinicasonrisa.com", Estado: "Activo", Plan: "Conector 147€", Vendedor: "Maria Garcia", Fecha_alta: "2025-08-01", Ciudad: "Getafe" },
    { id: "c3", Nombre_negocio: "Restaurante El Buen Sabor", Contacto: "Luis Fernandez", Email: "luis@elbuensabor.com", Estado: "Lead", Plan: "Arquitecto 197€", Vendedor: "Carlos Lopez", Fecha_alta: "2025-08-10", Ciudad: "Alcorcón" },
    { id: "c4", Nombre_negocio: "Taller Mecánico Rápido", Contacto: "José Martín", Email: "jose@tallerrapido.com", Estado: "Activo", Plan: "Nodo 97€", Vendedor: "Pedro Sanchez", Fecha_alta: "2025-05-15", Ciudad: "Madrid" },
    { id: "c5", Nombre_negocio: "Fisioterapia Vital", Contacto: "Elena Torres", Email: "elena@fisiovital.com", Estado: "Activo", Plan: "Conector 147€", Vendedor: "Pedro Sanchez", Fecha_alta: "2025-06-20", Ciudad: "Leganés" },
    { id: "c6", Nombre_negocio: "Gimnasio PowerFit", Contacto: "Miguel Ángel", Email: "miguel@powerfit.com", Estado: "Pausado", Plan: "Arquitecto 197€", Vendedor: "Ivan Nodai", Fecha_alta: "2025-04-01", Ciudad: "Madrid" },
    { id: "c7", Nombre_negocio: "Óptica ClaraVista", Contacto: "Carmen Díaz", Email: "carmen@claravista.com", Estado: "Activo", Plan: "Nodo 97€", Vendedor: "Laura Ruiz", Fecha_alta: "2025-09-15", Ciudad: "Móstoles" },
    { id: "c8", Nombre_negocio: "Veterinaria PetCare", Contacto: "Roberto Sanz", Email: "roberto@petcare.com", Estado: "Baja", Plan: "Conector 147€", Vendedor: "Maria Garcia", Fecha_alta: "2025-03-10", Ciudad: "Fuenlabrada" },
  ],
  contratos: [
    { id: "ct1", Cliente: "Peluquería Estilo", Vendedor: "Carlos Lopez", Plan: "Nodo 97€", Modalidad_pago: "Mensual", Importe: 97, Fecha_inicio: "2025-07-20", Estado: "Activo" },
    { id: "ct2", Cliente: "Clínica Dental Sonrisa", Vendedor: "Maria Garcia", Plan: "Conector 147€", Modalidad_pago: "Anual", Importe: 897, Fecha_inicio: "2025-08-01", Fecha_fin: "2026-08-01", Estado: "Activo" },
    { id: "ct3", Cliente: "Taller Mecánico Rápido", Vendedor: "Pedro Sanchez", Plan: "Nodo 97€", Modalidad_pago: "Mensual", Importe: 97, Fecha_inicio: "2025-05-15", Estado: "Activo" },
    { id: "ct4", Cliente: "Fisioterapia Vital", Vendedor: "Pedro Sanchez", Plan: "Conector 147€", Modalidad_pago: "Mensual", Importe: 147, Fecha_inicio: "2025-06-20", Estado: "Activo" },
    { id: "ct5", Cliente: "Gimnasio PowerFit", Vendedor: "Ivan Nodai", Plan: "Arquitecto 197€", Modalidad_pago: "Único", Importe: 1970, Fecha_inicio: "2025-04-01", Estado: "Activo" },
    { id: "ct6", Cliente: "Veterinaria PetCare", Vendedor: "Maria Garcia", Plan: "Conector 147€", Modalidad_pago: "Mensual", Importe: 147, Fecha_inicio: "2025-03-10", Fecha_fin: "2025-09-10", Estado: "Cancelado" },
  ],
  comisiones: [
    { id: "cm1", Contrato: "Peluquería Estilo", Vendedor: "Carlos Lopez", Tipo: "Directa 40%", Importe: 38.8, Estado_pago: "Pagada", Fecha_generada: "2025-07-20", Concepto: "Alta Peluquería Estilo" },
    { id: "cm2", Contrato: "Clínica Dental Sonrisa", Vendedor: "Maria Garcia", Tipo: "Directa 40%", Importe: 358.8, Estado_pago: "Pendiente", Fecha_generada: "2025-08-01", Concepto: "Alta Clínica Sonrisa anual" },
    { id: "cm3", Contrato: "Taller Mecánico Rápido", Vendedor: "Pedro Sanchez", Tipo: "Directa 40%", Importe: 38.8, Estado_pago: "Pagada", Fecha_generada: "2025-05-15", Concepto: "Alta Taller Rápido" },
    { id: "cm4", Contrato: "Fisioterapia Vital", Vendedor: "Pedro Sanchez", Tipo: "Directa 40%", Importe: 58.8, Estado_pago: "Pagada", Fecha_generada: "2025-06-20", Concepto: "Alta Fisioterapia Vital" },
    { id: "cm5", Contrato: "Gimnasio PowerFit", Vendedor: "Ivan Nodai", Tipo: "Directa 40%", Importe: 788, Estado_pago: "Pagada", Fecha_generada: "2025-04-01", Concepto: "Alta PowerFit pago único" },
    { id: "cm6", Contrato: "Peluquería Estilo", Vendedor: "Maria Garcia", Tipo: "Red Nivel 1", Importe: 9.7, Estado_pago: "Pendiente", Fecha_generada: "2025-07-20", Concepto: "Red N1 cliente de Carlos" },
    { id: "cm7", Contrato: "Veterinaria PetCare", Vendedor: "Maria Garcia", Tipo: "Directa 40%", Importe: 58.8, Estado_pago: "Pagada", Fecha_generada: "2025-03-10", Concepto: "Alta Veterinaria PetCare" },
    { id: "cm8", Contrato: "Óptica ClaraVista", Vendedor: "Laura Ruiz", Tipo: "Directa 40%", Importe: 38.8, Estado_pago: "Pendiente", Fecha_generada: "2025-09-15", Concepto: "Alta Óptica ClaraVista" },
  ],
};

/* ─────────────── AIRTABLE FETCH ─────────────── */
async function fetchTable(tableName) {
  try {
    const res = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_CONFIG.baseId}/${encodeURIComponent(tableName)}`,
      { headers: { Authorization: `Bearer ${AIRTABLE_CONFIG.apiKey}` } }
    );
    if (!res.ok) throw new Error(`Airtable error: ${res.status}`);
    const data = await res.json();
    return data.records.map((r) => ({ id: r.id, ...r.fields }));
  } catch (e) {
    console.error(`Error fetching ${tableName}:`, e);
    return null;
  }
}

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
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState("asc");
  const [filter, setFilter] = useState("");

  const handleSort = (col) => {
    if (sortCol === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortCol(col); setSortDir("asc"); }
  };

  const filtered = data.filter((row) =>
    columns.some((c) => String(row[c.key] || "").toLowerCase().includes(filter.toLowerCase()))
  );

  const sorted = sortCol
    ? [...filtered].sort((a, b) => {
        const va = a[sortCol] ?? "";
        const vb = b[sortCol] ?? "";
        const cmp = typeof va === "number" ? va - vb : String(va).localeCompare(String(vb));
        return sortDir === "asc" ? cmp : -cmp;
      })
    : filtered;

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
                <th key={c.key} onClick={() => handleSort(c.key)} style={{
                  padding: "10px 14px", textAlign: "left", color: "#6b6b80",
                  fontWeight: 600, fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase",
                  cursor: "pointer", userSelect: "none", borderBottom: "1px solid #1e1e28",
                  whiteSpace: "nowrap",
                }}>
                  {c.label} {sortCol === c.key ? (sortDir === "asc" ? "↑" : "↓") : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, i) => (
              <tr key={row.id || i}
                onClick={() => onRowClick?.(row)}
                style={{
                  background: i % 2 === 0 ? "#0d0d12" : "#111116",
                  cursor: onRowClick ? "pointer" : "default",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#1a1a24")}
                onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 0 ? "#0d0d12" : "#111116")}
              >
                {columns.map((c) => (
                  <td key={c.key} style={{ padding: "10px 14px", color: "#c8c8d5", borderBottom: "1px solid #151520", whiteSpace: "nowrap" }}>
                    {c.render ? c.render(row[c.key], row) : (row[c.key] ?? "—")}
                  </td>
                ))}
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr><td colSpan={columns.length} style={{ padding: 30, textAlign: "center", color: "#5a5a6e" }}>Sin resultados</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div style={{ fontSize: 11, color: "#5a5a6e", marginTop: 8 }}>{sorted.length} registros</div>
    </div>
  );
}

function DetailModal({ item, title, fields, onClose }) {
  if (!item) return null;
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex",
      alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)",
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: "#141419", border: "1px solid #23232b", borderRadius: 16,
        padding: "28px 32px", width: 440, maxHeight: "80vh", overflowY: "auto",
        boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#f0f0f5" }}>{title}</div>
          <button onClick={onClose} style={{
            background: "#1e1e28", border: "none", color: "#8b8b9e", width: 30, height: 30,
            borderRadius: 8, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center",
          }}>✕</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {fields.map((f) => (
            <div key={f.key} style={{ display: "flex", gap: 12 }}>
              <div style={{ width: 120, fontSize: 12, color: "#6b6b80", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", paddingTop: 2, flexShrink: 0 }}>{f.label}</div>
              <div style={{ fontSize: 14, color: "#c8c8d5" }}>
                {f.render ? f.render(item[f.key], item) : (item[f.key] ?? "—")}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = () => {
    setLoading(true);
    setError("");
    setTimeout(() => {
      if (email === ADMIN_CREDENTIALS.email && pass === ADMIN_CREDENTIALS.password) {
        onLogin(email);
      } else {
        setError("Credenciales incorrectas");
      }
      setLoading(false);
    }, 600);
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "#09090d", fontFamily: "'Inter', -apple-system, sans-serif",
    }}>
      <div style={{
        width: 380, background: "#111116", borderRadius: 18, padding: "40px 36px",
        border: "1px solid #1e1e28", boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
      }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em",
            background: "linear-gradient(135deg, #10b981, #3b82f6)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>NODAI</div>
          <div style={{ fontSize: 11, color: "#5a5a6e", letterSpacing: "0.15em", textTransform: "uppercase", marginTop: 4 }}>Agency Panel</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: 11, color: "#6b6b80", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              style={{
                width: "100%", padding: "10px 14px", background: "#0d0d12", border: "1px solid #2a2a35",
                borderRadius: 8, color: "#e0e0ea", fontSize: 14, outline: "none", boxSizing: "border-box",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#10b981")}
              onBlur={(e) => (e.target.style.borderColor = "#2a2a35")}
            />
          </div>
          <div>
            <label style={{ fontSize: 11, color: "#6b6b80", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Contraseña</label>
            <input type="password" value={pass} onChange={(e) => setPass(e.target.value)}
              style={{
                width: "100%", padding: "10px 14px", background: "#0d0d12", border: "1px solid #2a2a35",
                borderRadius: 8, color: "#e0e0ea", fontSize: 14, outline: "none", boxSizing: "border-box",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#10b981")}
              onBlur={(e) => (e.target.style.borderColor = "#2a2a35")}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>
          {error && <div style={{ fontSize: 13, color: "#ef4444", textAlign: "center" }}>{error}</div>}
          <button onClick={handleSubmit} disabled={loading}
            style={{
              marginTop: 8, padding: "12px 0", borderRadius: 10, border: "none", cursor: "pointer",
              background: "linear-gradient(135deg, #10b981, #059669)", color: "#fff",
              fontSize: 14, fontWeight: 700, letterSpacing: "0.02em",
              opacity: loading ? 0.6 : 1, transition: "opacity 0.2s",
            }}
          >{loading ? "Entrando..." : "Acceder al Panel"}</button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────── NAVEGACIÓN ─────────────── */
const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: "◈" },
  { key: "vendedores", label: "Vendedores", icon: "◇" },
  { key: "clientes", label: "Clientes", icon: "□" },
  { key: "contratos", label: "Contratos", icon: "○" },
  { key: "comisiones", label: "Comisiones", icon: "△" },
];

/* ─────────────── PANEL PRINCIPAL ─────────────── */
export default function NodaiAdminPanel() {
  const [auth, setAuth] = useState(false);
  const [page, setPage] = useState("dashboard");
  const [data, setData] = useState(DEMO_DATA);
  const [liveMode, setLiveMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [detailType, setDetailType] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const loadFromAirtable = useCallback(async () => {
    setLoading(true);
    const results = {};
    for (const [key, name] of Object.entries(AIRTABLE_CONFIG.tables)) {
      const records = await fetchTable(name);
      if (records) results[key] = records;
    }
    if (Object.keys(results).length === 4) {
      setData(results);
      setLiveMode(true);
    }
    setLoading(false);
  }, []);

  if (!auth) return <LoginScreen onLogin={() => setAuth(true)} />;

  const { vendedores, clientes, contratos, comisiones } = data;
  const activeClients = clientes.filter((c) => c.Estado === "Activo").length;
  const totalMRR = contratos.filter((c) => c.Estado === "Activo" && c.Modalidad_pago === "Mensual").reduce((s, c) => s + (c.Importe || 0), 0);
  const pendingComm = comisiones.filter((c) => c.Estado_pago === "Pendiente").reduce((s, c) => s + (c.Importe || 0), 0);
  const paidComm = comisiones.filter((c) => c.Estado_pago === "Pagada").reduce((s, c) => s + (c.Importe || 0), 0);

  const openDetail = (item, type) => { setSelectedItem(item); setDetailType(type); };
  const closeDetail = () => { setSelectedItem(null); setDetailType(null); };

  const renderPlan = (v) => v ? <Badge color={PLAN_COLORS[v] || "#6b7280"}>{v}</Badge> : "—";
  const renderStatus = (v) => v ? <Badge color={STATUS_COLORS[v] || "#6b7280"}>{v}</Badge> : "—";
  const renderRank = (v) => v ? <Badge color={RANK_COLORS[v] || "#6b7280"}>{v}</Badge> : "—";
  const renderCurrency = (v) => (v != null ? `${Number(v).toFixed(2)} €` : "—");
  const renderDate = (v) => (v ? new Date(v).toLocaleDateString("es-ES") : "—");

  const detailFields = {
    vendedores: [
      { key: "Nombre", label: "Nombre" }, { key: "Email", label: "Email" },
      { key: "Telefono", label: "Teléfono" }, { key: "Rango", label: "Rango", render: renderRank },
      { key: "Fecha_alta", label: "Fecha alta", render: renderDate },
      { key: "DNI_NIF", label: "DNI/NIF" }, { key: "IBAN", label: "IBAN" },
      { key: "Clientes_activos", label: "Clientes" }, { key: "Comisiones_totales", label: "Comisiones", render: renderCurrency },
    ],
    clientes: [
      { key: "Nombre_negocio", label: "Negocio" }, { key: "Contacto", label: "Contacto" },
      { key: "Email", label: "Email" }, { key: "Telefono", label: "Teléfono" },
      { key: "Estado", label: "Estado", render: renderStatus }, { key: "Plan", label: "Plan", render: renderPlan },
      { key: "Vendedor", label: "Vendedor" }, { key: "Ciudad", label: "Ciudad" },
      { key: "Fecha_alta", label: "Fecha alta", render: renderDate },
    ],
    contratos: [
      { key: "Cliente", label: "Cliente" }, { key: "Vendedor", label: "Vendedor" },
      { key: "Plan", label: "Plan", render: renderPlan }, { key: "Modalidad_pago", label: "Modalidad" },
      { key: "Importe", label: "Importe", render: renderCurrency },
      { key: "Fecha_inicio", label: "Inicio", render: renderDate }, { key: "Fecha_fin", label: "Fin", render: renderDate },
      { key: "Estado", label: "Estado", render: renderStatus },
    ],
    comisiones: [
      { key: "Contrato", label: "Contrato" }, { key: "Vendedor", label: "Vendedor" },
      { key: "Tipo", label: "Tipo" }, { key: "Importe", label: "Importe", render: renderCurrency },
      { key: "Estado_pago", label: "Estado", render: renderStatus },
      { key: "Fecha_generada", label: "Generada", render: renderDate },
      { key: "Fecha_pagada", label: "Pagada", render: renderDate }, { key: "Concepto", label: "Concepto" },
    ],
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#09090d", fontFamily: "'Inter', -apple-system, sans-serif", color: "#e0e0ea" }}>
      {/* Sidebar */}
      <div style={{
        width: sidebarOpen ? 220 : 60, background: "#0d0d12", borderRight: "1px solid #1a1a22",
        display: "flex", flexDirection: "column", transition: "width 0.2s", flexShrink: 0, overflow: "hidden",
      }}>
        <div style={{ padding: sidebarOpen ? "20px 20px 16px" : "20px 12px 16px", borderBottom: "1px solid #1a1a22", display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => setSidebarOpen((s) => !s)} style={{
            background: "none", border: "none", color: "#5a5a6e", cursor: "pointer", fontSize: 18, padding: 4, lineHeight: 1,
          }}>{sidebarOpen ? "◁" : "▷"}</button>
          {sidebarOpen && (
            <div style={{
              fontSize: 18, fontWeight: 800, letterSpacing: "-0.03em",
              background: "linear-gradient(135deg, #10b981, #3b82f6)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", whiteSpace: "nowrap",
            }}>NODAI</div>
          )}
        </div>
        <nav style={{ padding: "12px 8px", flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
          {NAV_ITEMS.map((n) => (
            <button key={n.key} onClick={() => setPage(n.key)} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: sidebarOpen ? "10px 14px" : "10px 0", justifyContent: sidebarOpen ? "flex-start" : "center",
              background: page === n.key ? "#141419" : "transparent",
              border: page === n.key ? "1px solid #23232b" : "1px solid transparent",
              borderRadius: 8, color: page === n.key ? "#10b981" : "#6b6b80",
              fontSize: 13, fontWeight: page === n.key ? 600 : 400, cursor: "pointer",
              transition: "all 0.15s", whiteSpace: "nowrap", width: "100%",
            }}>
              <span style={{ fontSize: 15, width: 20, textAlign: "center", flexShrink: 0 }}>{n.icon}</span>
              {sidebarOpen && n.label}
            </button>
          ))}
        </nav>
        {sidebarOpen && (
          <div style={{ padding: "12px 14px", borderTop: "1px solid #1a1a22" }}>
            <button onClick={loadFromAirtable} disabled={loading} style={{
              width: "100%", padding: "8px 0", borderRadius: 8, border: "1px solid #23232b",
              background: liveMode ? "#10b98118" : "#141419", color: liveMode ? "#10b981" : "#6b6b80",
              fontSize: 11, fontWeight: 600, cursor: "pointer", letterSpacing: "0.04em",
            }}>
              {loading ? "Cargando..." : liveMode ? "⚡ LIVE" : "Conectar Airtable"}
            </button>
            <button onClick={() => setAuth(false)} style={{
              width: "100%", padding: "8px 0", borderRadius: 8, border: "none",
              background: "transparent", color: "#5a5a6e", fontSize: 11, cursor: "pointer", marginTop: 6,
            }}>Cerrar sesión</button>
          </div>
        )}
      </div>

      {/* Main content */}
      <div style={{ flex: 1, padding: "28px 32px", overflowY: "auto", maxHeight: "100vh" }}>
        {page === "dashboard" && (
          <div>
            <div style={{ marginBottom: 28 }}>
              <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: "#f0f0f5" }}>Panel de Control</h1>
              <p style={{ fontSize: 13, color: "#5a5a6e", margin: "4px 0 0" }}>Nodai Agency — Vista general</p>
            </div>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 28 }}>
              <KPICard label="Clientes activos" value={activeClients} sub={`${clientes.length} totales`} accent="#10b981" />
              <KPICard label="MRR" value={`${totalMRR.toFixed(0)}€`} sub="Ingresos recurrentes mensuales" accent="#3b82f6" />
              <KPICard label="Comisiones pendientes" value={`${pendingComm.toFixed(0)}€`} sub={`${paidComm.toFixed(0)}€ pagadas`} accent="#f59e0b" />
              <KPICard label="Vendedores" value={vendedores.length} sub={`${vendedores.filter((v) => (v.Clientes_activos || 0) > 0).length} con clientes`} accent="#a855f7" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={{ background: "#111116", borderRadius: 14, border: "1px solid #1e1e28", padding: "20px 22px" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#8b8b9e", marginBottom: 14, letterSpacing: "0.04em" }}>Últimos contratos</div>
                {contratos.slice(0, 5).map((c, i) => (
                  <div key={i} onClick={() => openDetail(c, "contratos")} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "10px 0", borderBottom: i < 4 ? "1px solid #1a1a22" : "none", cursor: "pointer",
                  }}>
                    <div>
                      <div style={{ fontSize: 13, color: "#c8c8d5", fontWeight: 500 }}>{c.Cliente}</div>
                      <div style={{ fontSize: 11, color: "#5a5a6e" }}>{c.Vendedor}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      {renderPlan(c.Plan)}
                      <div style={{ fontSize: 11, color: "#5a5a6e", marginTop: 2 }}>{renderDate(c.Fecha_inicio)}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ background: "#111116", borderRadius: 14, border: "1px solid #1e1e28", padding: "20px 22px" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#8b8b9e", marginBottom: 14, letterSpacing: "0.04em" }}>Ranking vendedores</div>
                {[...vendedores].sort((a, b) => (b.Comisiones_totales || 0) - (a.Comisiones_totales || 0)).slice(0, 5).map((v, i) => (
                  <div key={i} onClick={() => openDetail(v, "vendedores")} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "10px 0", borderBottom: i < 4 ? "1px solid #1a1a22" : "none", cursor: "pointer",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: i === 0 ? "#ffd700" : i === 1 ? "#c0c0c0" : i === 2 ? "#cd7f32" : "#5a5a6e", width: 20 }}>#{i + 1}</span>
                      <div>
                        <div style={{ fontSize: 13, color: "#c8c8d5", fontWeight: 500 }}>{v.Nombre}</div>
                        <div style={{ fontSize: 11, color: "#5a5a6e" }}>{v.Clientes_activos || 0} clientes</div>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      {renderRank(v.Rango)}
                      <div style={{ fontSize: 12, color: "#10b981", fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", marginTop: 2 }}>{renderCurrency(v.Comisiones_totales)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: "#111116", borderRadius: 14, border: "1px solid #1e1e28", padding: "20px 22px", marginTop: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#8b8b9e", marginBottom: 14, letterSpacing: "0.04em" }}>Distribución de planes</div>
              <div style={{ display: "flex", gap: 24 }}>
                {["Nodo 97€", "Conector 147€", "Arquitecto 197€"].map((plan) => {
                  const count = clientes.filter((c) => c.Plan === plan && c.Estado === "Activo").length;
                  const pct = activeClients > 0 ? (count / activeClients) * 100 : 0;
                  return (
                    <div key={plan} style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontSize: 12, color: "#8b8b9e" }}>{plan}</span>
                        <span style={{ fontSize: 12, color: PLAN_COLORS[plan], fontWeight: 600 }}>{count}</span>
                      </div>
                      <div style={{ height: 6, background: "#1a1a22", borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: PLAN_COLORS[plan], borderRadius: 3, transition: "width 0.5s" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {page === "vendedores" && (
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 20px", color: "#f0f0f5" }}>Vendedores</h1>
            <DataTable columns={[
              { key: "Nombre", label: "Nombre" }, { key: "Email", label: "Email" },
              { key: "Rango", label: "Rango", render: renderRank },
              { key: "Clientes_activos", label: "Clientes", render: (v) => v ?? 0 },
              { key: "Comisiones_totales", label: "Comisiones", render: renderCurrency },
              { key: "Fecha_alta", label: "Fecha alta", render: renderDate },
            ]} data={vendedores} onRowClick={(row) => openDetail(row, "vendedores")} />
          </div>
        )}

        {page === "clientes" && (
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 20px", color: "#f0f0f5" }}>Clientes</h1>
            <DataTable columns={[
              { key: "Nombre_negocio", label: "Negocio" }, { key: "Contacto", label: "Contacto" },
              { key: "Estado", label: "Estado", render: renderStatus }, { key: "Plan", label: "Plan", render: renderPlan },
              { key: "Vendedor", label: "Vendedor" }, { key: "Ciudad", label: "Ciudad" },
              { key: "Fecha_alta", label: "Alta", render: renderDate },
            ]} data={clientes} onRowClick={(row) => openDetail(row, "clientes")} />
          </div>
        )}

        {page === "contratos" && (
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 20px", color: "#f0f0f5" }}>Contratos</h1>
            <DataTable columns={[
              { key: "Cliente", label: "Cliente" }, { key: "Vendedor", label: "Vendedor" },
              { key: "Plan", label: "Plan", render: renderPlan }, { key: "Modalidad_pago", label: "Modalidad" },
              { key: "Importe", label: "Importe", render: renderCurrency },
              { key: "Estado", label: "Estado", render: renderStatus },
              { key: "Fecha_inicio", label: "Inicio", render: renderDate },
            ]} data={contratos} onRowClick={(row) => openDetail(row, "contratos")} />
          </div>
        )}

        {page === "comisiones" && (
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 20px", color: "#f0f0f5" }}>Comisiones</h1>
            <DataTable columns={[
              { key: "Vendedor", label: "Vendedor" }, { key: "Contrato", label: "Contrato" },
              { key: "Tipo", label: "Tipo" }, { key: "Importe", label: "Importe", render: renderCurrency },
              { key: "Estado_pago", label: "Estado", render: renderStatus },
              { key: "Fecha_generada", label: "Fecha", render: renderDate },
              { key: "Concepto", label: "Concepto" },
            ]} data={comisiones} onRowClick={(row) => openDetail(row, "comisiones")} />
          </div>
        )}
      </div>

      {selectedItem && detailType && (
        <DetailModal
          item={selectedItem}
          title={selectedItem.Nombre || selectedItem.Nombre_negocio || selectedItem.Cliente || selectedItem.Concepto || "Detalle"}
          fields={detailFields[detailType]}
          onClose={closeDetail}
        />
      )}
    </div>
  );
}
