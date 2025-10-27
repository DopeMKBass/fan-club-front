import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

type MessageItem = {
  id: number | string;
  text: string;
  sender?: string;
  timestamp?: string;
};

export default function Messages() {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const auth = useAuth();

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const headers: Record<string, string> = {};
        // include Authorization header if available
        const tok = auth.token ?? null;
        if (tok) headers["Authorization"] = `Bearer ${tok}`;
        const res = await fetch("/api/messages", { headers });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!mounted) return;
        // Expecting an array of messages from backend
        setMessages(Array.isArray(data) ? data : []);
      } catch (err: any) {
        if (!mounted) return;
        setError(err?.message ?? String(err));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Messages</h2>
      {loading && <div>Loading messages…</div>}
      {error && <div style={{ color: "#ff6b6b" }}>Error: {error}</div>}
      {!loading && messages.length === 0 && !error && (
        <div style={{ color: "rgba(255,255,255,0.7)" }}>No messages yet.</div>
      )}
      <ul className="messages-list" style={{ marginTop: 12 }}>
        {messages.map((m) => (
          <li key={String(m.id)} className="message-item">
            <div className="message-avatar">
              {m.sender ? String(m.sender).slice(0, 1).toUpperCase() : "💬"}
            </div>
            <div className="message-body">
              <div style={{ fontSize: 15 }}>{m.text}</div>
              <div className="message-meta">
                {m.sender && <span style={{ marginRight: 8 }}>{m.sender}</span>}
                {m.timestamp && <span>{formatTimestamp(m.timestamp)}</span>}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function formatTimestamp(input?: string) {
  if (!input) return "";
  try {
    const d = new Date(input);
    if (Number.isNaN(d.getTime())) return input;
    return d.toLocaleString();
  } catch {
    return input;
  }
}
