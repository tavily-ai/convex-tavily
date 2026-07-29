import { FormEvent, useEffect, useRef, useState } from "react";
import { useMutation } from "convex/react";
import {
  optimisticallySendMessage,
  useUIMessages,
  type UIMessage,
} from "@convex-dev/agent/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { api } from "../convex/_generated/api";

const SUGGESTIONS = [
  "What are the top headlines in tech and markets right now?",
  "Pull the latest Fed rate decision and what analysts said about it",
  "Find docs on Convex actions vs mutations",
];

const THREAD_KEY = "tavily-convex-thread";

export function App() {
  const createThread = useMutation(api.chat.createChatThread);
  const [threadId, setThreadId] = useState<string | null>(() =>
    localStorage.getItem(THREAD_KEY),
  );
  const [bootError, setBootError] = useState<string | null>(null);

  useEffect(() => {
    if (threadId) return;
    let cancelled = false;
    void createThread({})
      .then((id) => {
        if (cancelled) return;
        localStorage.setItem(THREAD_KEY, id);
        setThreadId(id);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setBootError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      cancelled = true;
    };
  }, [threadId, createThread]);

  async function resetThread() {
    setBootError(null);
    const id = await createThread({ title: "Tavily chat" });
    localStorage.setItem(THREAD_KEY, id);
    setThreadId(id);
  }

  return (
    <div className="app">
      <header className="brand-bar">
        <div className="brand">
          <a
            href="https://www.tavily.com"
            target="_blank"
            rel="noreferrer"
            aria-label="Tavily"
          >
            <img
              className="brand-logo"
              src="/brand/tavily-full.svg"
              alt="Tavily"
              width={186}
              height={56}
            />
          </a>
          <div className="brand-sub">
            convex component demo · live web search
          </div>
        </div>
        <button
          type="button"
          className="new-thread"
          onClick={() => void resetThread()}
        >
          New thread
        </button>
      </header>

      {bootError ? <p className="error">{bootError}</p> : null}

      {threadId ? (
        <Chat threadId={threadId} />
      ) : (
        <div className="chat-shell">
          <div className="empty">
            <h2>Starting thread…</h2>
            <p>Connecting to your Convex deployment.</p>
          </div>
        </div>
      )}
    </div>
  );
}

function Chat({ threadId }: { threadId: string }) {
  const { results } = useUIMessages(
    api.chat.listMessages,
    { threadId },
    { initialNumItems: 40, stream: true },
  );
  const sendMessage = useMutation(api.chat.sendMessage).withOptimisticUpdate(
    optimisticallySendMessage(api.chat.listMessages),
  );
  const [prompt, setPrompt] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [results.length, pending, results]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = prompt.trim();
    if (!trimmed || pending) return;
    setPrompt("");
    setPending(true);
    setError(null);
    try {
      await sendMessage({ threadId, prompt: trimmed });
    } catch (err) {
      setPrompt(trimmed);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setPending(false);
    }
  }

  function useSuggestion(text: string) {
    setPrompt(text);
  }

  const busy =
    pending ||
    results.some((m) => m.status === "pending" || m.status === "streaming");

  return (
    <div className="chat-shell">
      <div className="messages">
        {results.length === 0 ? (
          <div className="empty">
            <img
              className="empty-mark"
              src="/brand/tavily-mark-black.svg"
              alt=""
              width={127}
              height={127}
            />
            <h2>Ask the live web</h2>
            <p>
              This assistant calls the{" "}
              <strong>@tavily/convex-tavily</strong> component from Convex Agent
              tools — search first, extract when it needs the full page.
            </p>
            <div className="suggestions">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  className="suggestion"
                  onClick={() => useSuggestion(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          results.map((message) => (
            <MessageBubble key={message.key} message={message} />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {error ? <p className="error">{error}</p> : null}
      {busy ? <p className="status">processing…</p> : null}

      <form className="composer" onSubmit={(e) => void onSubmit(e)}>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void onSubmit(e);
            }
          }}
          placeholder="Ask something that needs the web…"
          rows={2}
          disabled={pending}
        />
        <button
          className="send"
          type="submit"
          disabled={!prompt.trim() || pending}
        >
          Send
        </button>
      </form>
    </div>
  );
}

type ToolPart = {
  type: string;
  toolCallId?: string;
  toolName?: string;
  state?: string;
  input?: unknown;
  output?: unknown;
  errorText?: string;
};

function toolPartsFromMessage(message: UIMessage): ToolPart[] {
  return message.parts.filter(
    (p): p is UIMessage["parts"][number] & ToolPart =>
      p.type.startsWith("tool-") || p.type === "dynamic-tool",
  );
}

function toolDisplayName(part: ToolPart): string {
  if (part.type === "dynamic-tool" && part.toolName) return part.toolName;
  return part.type.replace(/^tool-/, "");
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

/** Short label for the collapsed tool row (query or URLs). */
function toolQueryPreview(part: ToolPart): string | null {
  const input = asRecord(part.input);
  if (!input) return null;

  if (typeof input.query === "string" && input.query.trim()) {
    return input.query.trim();
  }
  if (Array.isArray(input.urls) && input.urls.length > 0) {
    const urls = input.urls.filter((u): u is string => typeof u === "string");
    if (urls.length === 1) return urls[0];
    if (urls.length > 1) return `${urls.length} URLs`;
  }
  return null;
}

function toolStatusLabel(part: ToolPart): { label: string; tone: string } {
  if (part.errorText || part.state === "output-error") {
    return { label: "error", tone: "error" };
  }
  if (part.state === "input-streaming") {
    return { label: "preparing", tone: "live" };
  }
  if (part.state === "input-available") {
    return { label: "running", tone: "live" };
  }
  if (part.state === "output-available") {
    const output = asRecord(part.output);
    if (output && Array.isArray(output.results)) {
      const n = output.results.length;
      return {
        label: n === 1 ? "1 result" : `${n} results`,
        tone: "done",
      };
    }
    return { label: "done", tone: "done" };
  }
  return { label: part.state ?? "pending", tone: "muted" };
}

function formatJson(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function ToolResultList({ output }: { output: unknown }) {
  const record = asRecord(output);
  const results = record?.results;
  if (!Array.isArray(results) || results.length === 0) {
    return (
      <div className="tool-section">
        <div className="tool-label">result</div>
        <pre>{formatJson(output)}</pre>
      </div>
    );
  }

  return (
    <div className="tool-section">
      <div className="tool-label">results</div>
      <ul className="tool-result-list">
        {results.map((item, i) => {
          const row = asRecord(item);
          if (!row) return null;
          const title =
            typeof row.title === "string"
              ? row.title
              : typeof row.url === "string"
                ? row.url
                : `Result ${i + 1}`;
          const url = typeof row.url === "string" ? row.url : undefined;
          const content =
            typeof row.content === "string"
              ? row.content
              : typeof row.rawContent === "string"
                ? row.rawContent
                : undefined;
          return (
            <li key={url ?? `${title}-${i}`}>
              {url ? (
                <a href={url} target="_blank" rel="noreferrer">
                  {title}
                </a>
              ) : (
                <strong>{title}</strong>
              )}
              {content ? (
                <p className="tool-result-snippet">
                  {content.slice(0, 220)}
                  {content.length > 220 ? "…" : ""}
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function MarkdownBody({ text }: { text: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        a: ({ href, children }) => (
          <a href={href} target="_blank" rel="noreferrer">
            {children}
          </a>
        ),
      }}
    >
      {text}
    </ReactMarkdown>
  );
}

function MessageBubble({ message }: { message: UIMessage }) {
  const tools = toolPartsFromMessage(message);
  const isUser = message.role === "user";
  const body = message.text || (message.status === "pending" ? "…" : "");

  return (
    <article className={`message ${message.role}`}>
      <div className="role">{isUser ? "You" : "Assistant"}</div>
      {tools.length > 0 ? (
        <div className="tool-calls">
          {tools.map((part, i) => {
            const name = toolDisplayName(part);
            const query = toolQueryPreview(part);
            const status = toolStatusLabel(part);
            return (
              <details
                key={part.toolCallId ?? `${part.type}-${i}`}
                className="tool-call"
              >
                <summary>
                  <span className="tool-chip">{name}</span>
                  {query ? (
                    <span className="tool-query" title={query}>
                      {query}
                    </span>
                  ) : null}
                  <span className={`tool-state tone-${status.tone}`}>
                    {status.label}
                  </span>
                </summary>
                {part.input !== undefined ? (
                  <div className="tool-section">
                    <div className="tool-label">args</div>
                    <pre>{formatJson(part.input)}</pre>
                  </div>
                ) : null}
                {part.output !== undefined ? (
                  <ToolResultList output={part.output} />
                ) : null}
                {part.errorText ? (
                  <div className="tool-section tool-error">
                    <div className="tool-label">error</div>
                    <pre>{part.errorText}</pre>
                  </div>
                ) : null}
              </details>
            );
          })}
        </div>
      ) : null}
      {body ? (
        <div className={`bubble${isUser ? "" : " markdown"}`}>
          {isUser ? body : <MarkdownBody text={body} />}
        </div>
      ) : null}
    </article>
  );
}
