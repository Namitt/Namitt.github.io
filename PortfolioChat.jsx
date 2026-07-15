import { useState, useRef, useEffect } from "react";

// "Ask about my work or me" — Claude-powered Q&A widget for Namit's portfolio.
//
// SECURITY NOTE: This component does NOT hold an API key. It POSTs to your own
// /api/chat endpoint, which holds the key server-side. See api-chat.js for that
// endpoint. Never put an Anthropic API key in front-end code on a public site.

const SUGGESTED = [
  "Tell me about your strongest project",
  "What are your strengths?",
  "What tools do you use?",
  "Tell me about a time something went wrong",
];

export default function PortfolioChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]); // {role, content}
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  async function send(text) {
    const question = (text ?? input).trim();
    if (!question || loading) return;

    setError(null);
    setInput("");
    const nextMessages = [...messages, { role: "user", content: question }];
    setMessages(nextMessages);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Send full history so follow-up questions have context.
        body: JSON.stringify({ messages: nextMessages }),
      });

      if (!res.ok) throw new Error(`Request failed (${res.status})`);

      const data = await res.json();
      const reply =
        (data.content || [])
          .filter((b) => b.type === "text")
          .map((b) => b.text)
          .join("\n")
          .trim() || "Sorry, I didn't catch that. Try rephrasing?";

      setMessages([...nextMessages, { role: "assistant", content: reply }]);
    } catch (e) {
      setError("Something went wrong. You can email Namit directly instead.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="pc-root">
      {!open && (
        <button className="pc-launcher" onClick={() => setOpen(true)}>
          Ask about my work or me
        </button>
      )}

      {open && (
        <div className="pc-panel">
          <div className="pc-header">
            <div>
              <div className="pc-title">Ask about my work or me</div>
              <div className="pc-sub">Scoped to Namit's resume &amp; projects</div>
            </div>
            <button className="pc-close" onClick={() => setOpen(false)} aria-label="Close">
              ×
            </button>
          </div>

          <div className="pc-scroll" ref={scrollRef}>
            {messages.length === 0 && (
              <div className="pc-empty">
                <p>Ask me anything about Namit's background, skills, or projects.</p>
                <div className="pc-suggest">
                  {SUGGESTED.map((s) => (
                    <button key={s} className="pc-chip" onClick={() => send(s)}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`pc-msg pc-${m.role}`}>
                {m.content}
              </div>
            ))}

            {loading && <div className="pc-msg pc-assistant pc-typing">Thinking…</div>}
            {error && <div className="pc-error">{error}</div>}
          </div>

          <div className="pc-inputrow">
            <input
              className="pc-input"
              value={input}
              placeholder="Type your question…"
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              disabled={loading}
            />
            <button className="pc-send" onClick={() => send()} disabled={loading || !input.trim()}>
              Send
            </button>
          </div>
        </div>
      )}

      <style>{`
        .pc-root { position: fixed; bottom: 20px; right: 20px; z-index: 9999;
          font-family: ui-sans-serif, system-ui, -apple-system, sans-serif; }
        .pc-launcher { background: #111827; color: #fff; border: none; border-radius: 999px;
          padding: 12px 20px; font-size: 14px; font-weight: 600; cursor: pointer;
          box-shadow: 0 6px 20px rgba(0,0,0,.18); }
        .pc-launcher:hover { background: #000; }
        .pc-panel { width: 360px; max-width: calc(100vw - 32px); height: 520px;
          max-height: calc(100vh - 40px); background: #fff; border-radius: 16px;
          box-shadow: 0 12px 40px rgba(0,0,0,.22); display: flex; flex-direction: column;
          overflow: hidden; border: 1px solid #e5e7eb; }
        .pc-header { display: flex; justify-content: space-between; align-items: flex-start;
          padding: 14px 16px; border-bottom: 1px solid #f0f0f0; background: #111827; color: #fff; }
        .pc-title { font-size: 15px; font-weight: 700; }
        .pc-sub { font-size: 11px; opacity: .7; margin-top: 2px; }
        .pc-close { background: none; border: none; color: #fff; font-size: 22px; line-height: 1;
          cursor: pointer; opacity: .8; }
        .pc-close:hover { opacity: 1; }
        .pc-scroll { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 10px; }
        .pc-empty { color: #6b7280; font-size: 14px; }
        .pc-suggest { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
        .pc-chip { background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 999px;
          padding: 7px 12px; font-size: 12.5px; cursor: pointer; color: #374151; text-align: left; }
        .pc-chip:hover { background: #e5e7eb; }
        .pc-msg { padding: 10px 13px; border-radius: 12px; font-size: 14px; line-height: 1.5;
          max-width: 85%; white-space: pre-wrap; word-wrap: break-word; }
        .pc-user { background: #111827; color: #fff; align-self: flex-end; border-bottom-right-radius: 4px; }
        .pc-assistant { background: #f3f4f6; color: #111827; align-self: flex-start; border-bottom-left-radius: 4px; }
        .pc-typing { opacity: .6; font-style: italic; }
        .pc-error { color: #b91c1c; font-size: 13px; }
        .pc-inputrow { display: flex; gap: 8px; padding: 12px; border-top: 1px solid #f0f0f0; }
        .pc-input { flex: 1; border: 1px solid #d1d5db; border-radius: 10px; padding: 10px 12px;
          font-size: 14px; outline: none; }
        .pc-input:focus { border-color: #111827; }
        .pc-send { background: #111827; color: #fff; border: none; border-radius: 10px;
          padding: 0 16px; font-size: 14px; font-weight: 600; cursor: pointer; }
        .pc-send:disabled { opacity: .4; cursor: default; }
      `}</style>
    </div>
  );
}
