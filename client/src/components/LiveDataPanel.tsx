import { CheckCircle2, CloudLightning, Database, Hospital, RefreshCw, Users } from "lucide-react";

type SourceState = { label: string; detail: string; status: "live" | "fallback" | "error"; updated: string };
type Props = { sources: SourceState[]; loading: boolean; onRefresh: () => void };
const icons = { "Hazard feeds": CloudLightning, "Hospital facilities": Hospital, "Hospital capacity": Hospital, "Population baseline": Users };

export function LiveDataPanel({ sources, loading, onRefresh }: Props) {
  return <section className="panel live-data-panel"><div className="panel-head compact-head"><div><div className="section-kicker"><Database size={13} /> LIVE DATA CONNECTORS</div><h2>External evidence layer</h2></div><button className="compact-button" onClick={onRefresh} disabled={loading}><RefreshCw size={13} className={loading ? "spin" : ""} /> {loading ? "Refreshing" : "Refresh sources"}</button></div><p className="panel-description">Public feeds are loaded in the browser and kept separate from the synthetic scenario engine until mapped to a specific asset.</p><div className="live-source-grid">{sources.map((source) => { const Icon = icons[source.label as keyof typeof icons] ?? Database; return <div className="live-source" key={source.label}><div className={`live-source-icon ${source.status}`}><Icon size={15} /></div><div><strong>{source.label}</strong><span>{source.detail}</span><small>{source.status === "live" ? <><CheckCircle2 size={11} /> Live · {source.updated}</> : source.status === "fallback" ? "Fallback retained · source unavailable" : "Unavailable · retry to reconnect"}</small></div></div>; })}</div></section>;
}
