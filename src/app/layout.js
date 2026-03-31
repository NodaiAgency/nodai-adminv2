export const metadata = {
  title: "Nodai Agency — Admin Panel",
  description: "Panel de administración de Nodai Agency",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;700&display=swap"
          rel="stylesheet"
        />
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { background: #09090d; overflow: hidden; }
          ::-webkit-scrollbar { width: 6px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb { background: #2a2a35; border-radius: 3px; }
          ::-webkit-scrollbar-thumb:hover { background: #3a3a45; }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
