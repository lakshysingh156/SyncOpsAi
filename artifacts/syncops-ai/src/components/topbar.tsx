import { useState } from "react";
import { Search, Bell, Settings, ChevronDown, Command, Sun, Moon } from "lucide-react";

export function Topbar() {
  const [search, setSearch] = useState("");

  return (
    <header style={{
      height: 44,
      background: "rgba(7,9,12,0.95)",
      borderBottom: "1px solid #141820",
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "0 20px",
      position: "sticky",
      top: 0,
      zIndex: 20,
      backdropFilter: "blur(12px)",
    }}>
      {/* Search */}
      <div style={{ position: "relative", flex: 1, maxWidth: 360 }}>
        <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#4E5A6B", pointerEvents: "none" }} />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search services, logs, incidents…"
          className="field field-sm"
          style={{ width: "100%", paddingLeft: 30, paddingRight: 50 }}
        />
        <div style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", display: "flex", gap: 2 }}>
          <span className="kbd">⌘</span>
          <span className="kbd">K</span>
        </div>
      </div>

      <div style={{ flex: 1 }} />

      {/* Env selector */}
      <button style={{
        display: "flex", alignItems: "center", gap: 6,
        background: "#0C0E12", border: "1px solid #1C2029",
        borderRadius: 4, padding: "4px 10px",
        fontSize: 11.5, color: "#8896AB", cursor: "pointer",
      }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10B981", boxShadow: "0 0 6px rgba(16,185,129,0.5)" }} />
        production
        <ChevronDown size={11} />
      </button>

      {/* Icons */}
      {[Bell, Settings].map((Icon, i) => (
        <button key={i} style={{
          width: 28, height: 28, borderRadius: 4, border: "1px solid #1C2029",
          background: "transparent", display: "flex", alignItems: "center", justifyContent: "center",
          color: "#4E5A6B", cursor: "pointer", transition: "all 0.15s",
        }}
          onMouseEnter={e => { (e.target as HTMLElement).closest("button")!.style.background = "#111318"; (e.target as HTMLElement).closest("button")!.style.color = "#8896AB"; }}
          onMouseLeave={e => { (e.target as HTMLElement).closest("button")!.style.background = "transparent"; (e.target as HTMLElement).closest("button")!.style.color = "#4E5A6B"; }}
        >
          <Icon size={14} />
        </button>
      ))}

      {/* Avatar */}
      <div style={{
        width: 28, height: 28, borderRadius: "50%",
        background: "linear-gradient(135deg, #1D4ED8, #7C3AED)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 11, fontWeight: 700, color: "#fff", cursor: "pointer",
        border: "1.5px solid rgba(59,130,246,0.3)",
      }}>L</div>
    </header>
  );
}
