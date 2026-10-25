"use client";
import { useEffect, useState, useRef } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronLeft,
  Clock,
  FileText,
  Link2,
  LockKeyhole,
  RotateCcw,
  ShieldCheck,
  Trash2,
  X,
  Menu,
} from "lucide-react";
import { tasks, Task } from "@/lib/tasks";
import type { Feedback } from "@/lib/feedback";
type Attempt = {
  id: string;
  task: string;
  response: string;
  feedback: Feedback;
  created: number;
};
type Share = { token: string; task: string; created: number };
type ApiPayload = {
  error?: string;
  attempts: Attempt[];
  shares: Share[];
  active: boolean;
  attempt: Attempt;
  token: string;
};
async function api(path: string, method = "GET", data?: unknown) {
  const r = await fetch("/api/" + path, {
    method,
    headers: data ? { "Content-Type": "application/json" } : undefined,
    body: data ? JSON.stringify(data) : undefined,
  });
  let b: ApiPayload;
  try {
    b = (await r.json()) as ApiPayload;
  } catch {
    throw Error("The connection failed. Your draft is still here. Try again.");
  }
  if (!r.ok) throw Error(b.error || "Something went wrong. Try again.");
  return b;
}
export default function Home() {
  const [view, setView] = useState<"practice" | "record" | "about">("practice"),
    [task, setTask] = useState<Task | null>(null),
    [attempts, setAttempts] = useState<Attempt[]>([]),
    [shares, setShares] = useState<Share[]>([]),
    [draft, setDraft] = useState(""),
    [current, setCurrent] = useState<Attempt | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [shareTask, setShareTask] = useState<string | null>(null),
    [deleteOpen, setDeleteOpen] = useState(false),
    [active, setActive] = useState(false),
    [loading, setLoading] = useState(true),
    [taskStep, setTaskStep] = useState<"read" | "write">("read");
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (!shareTask && !deleteOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    const dialog = document.querySelector<HTMLElement>('[role="dialog"]');
    if (!dialog) return;
    const controls = () =>
      Array.from(
        dialog.querySelectorAll<HTMLElement>(
          "button:not(:disabled),a[href],input,textarea,summary",
        ),
      );
    controls()[0]?.focus();
    function keys(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setShareTask(null);
        setDeleteOpen(false);
      }
      if (e.key === "Tab") {
        const list = controls(),
          first = list[0],
          last = list[list.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    }
    document.addEventListener("keydown", keys);
    return () => {
      document.removeEventListener("keydown", keys);
      previous?.focus();
    };
  }, [shareTask, deleteOpen]);
  useEffect(() => {
    if (headingRef.current) {
      window.scrollTo(0, 0);
      headingRef.current?.focus();
    }
  }, [view, task, taskStep, current]);
  async function refresh() {
    const [a, s, c] = await Promise.all([
      api("attempts"),
      api("shares"),
      api("session"),
    ]);
    setAttempts(a.attempts);
    setShares(s.shares);
    setActive(c.active);
  }
  useEffect(() => {
    refresh()
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    if (task) {
      const saved = sessionStorage.getItem("draft-" + task.id);
      setDraft(saved || "");
    }
  }, [task]);
  function select(t: Task) {
    setTask(t);
    setTaskStep("read");
    setCurrent(null);
    setError("");
    setNotice("");
    window.scrollTo(0, 0);
  }
  function changeDraft(v: string) {
    setDraft(v);
    if (task) sessionStorage.setItem("draft-" + task.id, v);
  }
  async function submit() {
    if (!task) return;
    setBusy(true);
    setError("");
    try {
      await api("session", "POST");
      setActive(true);
      const b = await api("attempts", "POST", {
        task: task.id,
        response: draft,
      });
      setCurrent(b.attempt);
      sessionStorage.removeItem("draft-" + task.id);
      await refresh();
      window.scrollTo(0, 0);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function share() {
    setBusy(true);
    setError("");
    try {
      await api("shares", "POST", { task: shareTask });
      setShareTask(null);
      await refresh();
      setNotice(
        "Your link is ready. Only work saved before this moment is included.",
      );
      setView("record");
      setTask(null);
      setCurrent(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function revoke(token: string) {
    setBusy(true);
    setError("");
    try {
      await api("shares", "DELETE", { token });
      await refresh();
      setNotice(
        "Link revoked. It no longer opens your card. Copies already made cannot be recalled.",
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function erase() {
    setBusy(true);
    try {
      await api("session", "DELETE");
      tasks.forEach((t) => sessionStorage.removeItem("draft-" + t.id));
      setAttempts([]);
      setShares([]);
      setActive(false);
      setDeleteOpen(false);
      setTask(null);
      setCurrent(null);
      setNotice("Your saved demo work and links have been deleted.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to main content
      </a>
      <header className="topbar">
        <a className="wordmark" href="/" aria-label="ShowWork home">
          <span className="mark">
            <Check size={23} />
          </span>
          ShowWork<span className="wordmark-dot">.</span>
        </a>
        <div className="topright">
          <span className="demo-pill">Hackathon demo</span>
          <a href="/judge">
            Judge’s guide <ArrowUpRight size={14} />
          </a>
        </div>
      </header>
      <div className="shell">
        <aside className="sidebar">
          <nav aria-label="Main navigation">
            {[
              ["practice", "Practise"],
              ["record", "My saved work"],
              ["about", "How it works"],
            ].map(([id, label]) => (
              <button
                key={id}
                aria-current={view === id ? "page" : undefined}
                className={view === id ? "nav-item selected" : "nav-item"}
                onClick={() => {
                  setView(id as typeof view);
                  setTask(null);
                  setCurrent(null);
                  setError("");
                  setNotice("");
                  window.scrollTo(0, 0);
                }}
              >
                {label}
              </button>
            ))}
          </nav>
        </aside>
        <main id="main" className="main">
          {error && (
            <div className="alert error" role="alert">
              {error}
              <button aria-label="Dismiss error" onClick={() => setError("")}>
                <X size={16} />
              </button>
            </div>
          )}
          {notice && (
            <div className="alert success" role="status">
              {notice}
              <button
                aria-label="Dismiss notification"
                onClick={() => setNotice("")}
              >
                <X size={16} />
              </button>
            </div>
          )}
          {view === "practice" && !task && (
            <>
              <section className="intro">
                <p className="eyebrow">Retail & customer service</p>
                <h1 ref={headingRef} tabIndex={-1}>
                  Practise a task.
                  <br />
                  Show what you can do.
                </h1>
                <p className="intro-copy">
                  Try a situation you might face at work. Write your response,
                  get feedback, and save it to share.
                </p>
              </section>
              <section className="start-task" aria-labelledby="start-title">
                <div className="start-task-copy">
                  <span className="eyebrow">Start here · About 5 minutes</span>
                  <h2 id="start-title">Help a customer who sees two charges</h2>
                  <p>
                    A customer thinks the shop charged them twice. What would
                    you say and do?
                  </p>
                  <button className="primary" onClick={() => select(tasks[0])}>
                    Start this task <ArrowRight size={20} />
                  </button>
                </div>
                <ol className="start-steps" aria-label="How the task works">
                  <li>
                    <span>1</span>Read the situation
                  </li>
                  <li>
                    <span>2</span>Write your response
                  </li>
                  <li>
                    <span>3</span>Review and improve
                  </li>
                </ol>
              </section>
              <section className="task-section">
                <div className="section-heading">
                  <h2>Or choose another task</h2>
                </div>
                <div className="task-list">
                  {tasks.slice(1).map((t) => (
                    <button
                      className="task-row"
                      key={t.id}
                      onClick={() => select(t)}
                    >
                      <div className="task-description">
                        <span className="eyebrow">
                          {t.area} · {t.minutes} minutes
                        </span>
                        <h3>{t.title}</h3>
                        <span className="task-row-action">
                          {attempts.some((a) => a.task === t.id)
                            ? "Practise again"
                            : "Start task"}{" "}
                          <ArrowRight size={18} />
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
              <p className="bottom-note">
                Practice demo. Use made-up information only. Your work stays
                private until you choose to share it.
              </p>
            </>
          )}
          {view === "practice" && task && !current && (
            <>
              <button className="back" onClick={() => setTask(null)}>
                <ChevronLeft size={20} /> Back to tasks
              </button>
              <ol className="progress-steps" aria-label="Task progress">
                {["Read", "Write", "Review"].map((label, i) => (
                  <li
                    key={label}
                    aria-current={
                      (taskStep === "read" ? 0 : 1) === i ? "step" : undefined
                    }
                    className={
                      (taskStep === "read" ? 0 : 1) === i ? "current" : ""
                    }
                  >
                    <span>{i + 1}</span>
                    {label}
                  </li>
                ))}
              </ol>
              <div className="task-title">
                <p className="eyebrow">
                  {task.area} · About {task.minutes} minutes
                </p>
                <h1 ref={headingRef} tabIndex={-1}>
                  {taskStep === "read"
                    ? task.title
                    : "What would you say and do?"}
                </h1>
                <p>{taskStep === "read" ? task.intro : task.prompt}</p>
              </div>
              {taskStep === "read" ? (
                <div className="task-reading">
                  <TaskBrief task={task} />
                  <div className="step-action">
                    <p>
                      Read the facts and store policy above. Then write your own
                      response.
                    </p>
                    <button
                      className="primary"
                      onClick={() => setTaskStep("write")}
                    >
                      I’m ready to write <ArrowRight size={20} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="writing-layout">
                  <section className="response-section">
                    <label htmlFor="response">Your response</label>
                    <textarea
                      autoFocus
                      id="response"
                      value={draft}
                      onChange={(e) => changeDraft(e.target.value)}
                      maxLength={4000}
                      placeholder="Start with what you would say to the customer or your colleague…"
                      aria-describedby="draft-help response-minimum"
                    />
                    <div className="draft-meta">
                      <span id="draft-help">Draft saved in this tab</span>
                      <span>{draft.length.toLocaleString()} / 4,000</span>
                    </div>
                    <p id="response-minimum" className="response-minimum">
                      {draft.trim().length < 40
                        ? `Write at least ${40 - draft.trim().length} more characters to get feedback.`
                        : "Ready to save. You can revise your response afterwards."}
                    </p>
                    <button
                      className="primary"
                      disabled={busy || draft.trim().length < 40}
                      onClick={submit}
                    >
                      {busy ? "Saving your response…" : "Save and get feedback"}{" "}
                      <ArrowRight size={20} />
                    </button>
                    <details className="example-help">
                      <summary>Need help getting started?</summary>
                      <p>
                        Explain the facts, what you would check, and your next
                        step. You can also load a made-up example to try the
                        app.
                      </p>
                      <button
                        className="secondary"
                        onClick={() => {
                          changeDraft(task.sample);
                          setNotice(
                            "Example loaded for demonstration. Edit it to make your own response.",
                          );
                        }}
                      >
                        Load an example response
                      </button>
                    </details>
                    <p className="fineprint">
                      Saved work lasts 7 days in this browser. Use made-up
                      information only.
                    </p>
                  </section>
                  <aside className="task-reference">
                    <details>
                      <summary>Read the situation again</summary>
                      <p>{task.intro}</p>
                      <TaskBrief task={task} />
                    </details>
                    <details>
                      <summary>What should I include?</summary>
                      {task.checks.map((c) => (
                        <div className="guide-item" key={c.id}>
                          <div>
                            <h3>{c.label}</h3>
                            <p>{c.guidance}</p>
                          </div>
                        </div>
                      ))}
                    </details>
                  </aside>
                </div>
              )}
            </>
          )}
          {view === "practice" && task && current && (
            <>
              <button
                className="back"
                onClick={() => {
                  setTaskStep("write");
                  setCurrent(null);
                  changeDraft(current.response);
                }}
              >
                <ChevronLeft size={16} /> Back to your response
              </button>
              <ol className="progress-steps" aria-label="Task progress">
                <li>
                  <span>1</span>Read
                </li>
                <li>
                  <span>2</span>Write
                </li>
                <li className="current" aria-current="step">
                  <span>3</span>Review
                </li>
              </ol>
              <div className="result-head">
                <div>
                  <p className="eyebrow">
                    Saved ·{" "}
                    {new Date(current.created).toLocaleDateString("en-ZA")}
                  </p>
                  <h1 ref={headingRef} tabIndex={-1}>
                    Your response is saved.
                  </h1>
                  <p>
                    Read the feedback below. Then improve your response or
                    create a link to share your work.
                  </p>
                </div>
              </div>
              <div className="review-primary">
                <button
                  className="primary"
                  onClick={() => {
                    changeDraft(current.response);
                    setTaskStep("write");
                    setCurrent(null);
                    window.scrollTo(0, 0);
                  }}
                >
                  Improve my response <ArrowRight size={20} />
                </button>
                <span>Your previous response will be kept.</span>
              </div>
              <div className="work-grid">
                <div>
                  <details className="saved-response">
                    <summary>Read my saved response</summary>
                    <p className="response-text">{current.response}</p>
                  </details>
                  <div className="feedback-list">
                    <div className="section-heading">
                      <h2>Writing checks</h2>
                      <span>Suggestions to help you edit</span>
                    </div>
                    {current.feedback.warnings.map((w) => (
                      <p className="warning" key={w}>
                        {w}
                      </p>
                    ))}
                    {current.feedback.findings.map((f) => (
                      <article key={f.id} className="finding">
                        <div className="finding-heading">
                          <h3>{f.label}</h3>
                          <span
                            className={f.found ? "tag found" : "tag review"}
                          >
                            {f.found ? "Phrase found" : "Review"}
                          </span>
                        </div>
                        {f.evidence && <blockquote>“{f.evidence}”</blockquote>}
                        <p>{f.note}</p>
                      </article>
                    ))}
                  </div>
                  <div className="response-actions">
                    <button
                      className="primary"
                      onClick={() => {
                        changeDraft(current.response);
                        setTaskStep("write");
                        setCurrent(null);
                        window.scrollTo(0, 0);
                      }}
                    >
                      <RotateCcw size={16} /> Improve my response
                    </button>
                    <button
                      className="secondary"
                      onClick={() => setShareTask(task.id)}
                    >
                      <Link2 size={16} /> Share this work
                    </button>
                  </div>
                </div>
                <aside>
                  <div className="next-panel">
                    <p className="eyebrow">NEXT PRACTICE</p>
                    <h2>
                      {
                        tasks.find((t) => t.id === current.feedback.nextTask)
                          ?.title
                      }
                    </h2>
                    <p>{current.feedback.reason}</p>
                    <button
                      className="text-link"
                      onClick={() =>
                        select(
                          tasks.find(
                            (t) => t.id === current.feedback.nextTask,
                          )!,
                        )
                      }
                    >
                      Open task <ArrowRight size={17} />
                    </button>
                  </div>
                  <div className="guide-limit">
                    <strong>No competency score.</strong>
                    <p>
                      These checks help you edit. They do not measure
                      employability, verify identity, or decide who gets hired.
                    </p>
                  </div>
                </aside>
              </div>
            </>
          )}
          {view === "record" && (
            <>
              <div className="record-title">
                <p className="eyebrow orange">Responses and revisions</p>
                <h1 ref={headingRef} tabIndex={-1}>
                  My saved work
                </h1>
                <p>
                  Originals and revisions stay together. Choose a task to share.
                </p>
              </div>
              {loading ? (
                <p>Loading saved work…</p>
              ) : attempts.length === 0 ? (
                <div className="empty">
                  <FileText size={32} />
                  <h2>You haven’t saved any work yet.</h2>
                  <p>
                    Start a task and write a response. Your saved work will
                    appear here.
                  </p>
                  <button
                    className="primary"
                    onClick={() => {
                      setView("practice");
                      select(tasks[0]);
                    }}
                  >
                    Try the first task <ArrowRight size={17} />
                  </button>
                </div>
              ) : (
                tasks
                  .filter((t) => attempts.some((a) => a.task === t.id))
                  .map((t) => (
                    <section className="record-task" key={t.id}>
                      <div className="section-heading">
                        <div>
                          <p className="eyebrow">{t.area}</p>
                          <h2>{t.title}</h2>
                        </div>
                        <button
                          className="secondary"
                          onClick={() => setShareTask(t.id)}
                        >
                          <Link2 size={15} /> Share card
                        </button>
                      </div>
                      {attempts
                        .filter((a) => a.task === t.id)
                        .map((a, i, all) => (
                          <details className="attempt" key={a.id}>
                            <summary>
                              <span className="attempt-dot" />
                              <strong>
                                {i === all.length - 1
                                  ? "Original response"
                                  : "Revision " + (all.length - i - 1)}
                              </strong>
                              <span>
                                {new Date(a.created).toLocaleString("en-ZA", {
                                  dateStyle: "medium",
                                  timeStyle: "short",
                                })}
                              </span>
                              <span className="attempt-open">Read work +</span>
                            </summary>
                            <p className="response-text">{a.response}</p>
                            <p className="fineprint">
                              {
                                a.feedback.findings.filter((f) => f.found)
                                  .length
                              }{" "}
                              of {a.feedback.findings.length} writing prompts
                              contain a matched phrase. This is a writing check.
                              It does not measure your ability.
                            </p>
                            <button
                              className="text-link"
                              onClick={() => {
                                setView("practice");
                                setTask(t);
                                setCurrent(a);
                              }}
                            >
                              See feedback <ArrowUpRight size={16} />
                            </button>
                          </details>
                        ))}
                    </section>
                  ))
              )}
              {shares.length > 0 && (
                <section className="sharing-list">
                  <div className="section-heading">
                    <h2>Active share links</h2>
                    <span>Anyone with a link can read its card</span>
                  </div>
                  {shares.map((s) => (
                    <div className="share-row" key={s.token}>
                      <div>
                        <strong>
                          {tasks.find((t) => t.id === s.task)?.title}
                        </strong>
                        <a
                          href={"/card/" + s.token}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open reviewer view <ArrowUpRight size={14} />
                        </a>
                      </div>
                      <button
                        className="quiet"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(
                              location.origin + "/card/" + s.token,
                            );
                            setNotice("Link copied.");
                          } catch {
                            setNotice(
                              "Open the reviewer view and copy the address from your browser.",
                            );
                          }
                        }}
                      >
                        Copy link
                      </button>
                      <button
                        className="danger-link"
                        disabled={busy}
                        onClick={() => revoke(s.token)}
                      >
                        Revoke
                      </button>
                    </div>
                  ))}
                </section>
              )}
              {active && (
                <div className="data-controls">
                  <p>Demo data expires after 7 days. You can remove it now.</p>
                  <button
                    className="danger-link"
                    onClick={() => setDeleteOpen(true)}
                  >
                    <Trash2 size={14} /> Delete my demo data
                  </button>
                </div>
              )}
            </>
          )}
          {view === "about" && (
            <article className="about">
              <p className="eyebrow orange">Practise, improve, share</p>
              <h1 ref={headingRef} tabIndex={-1}>
                How ShowWork works
              </h1>
              <p className="intro-copy">
                A CV can say “good with customers”. A work sample lets someone
                read how you handled a difficult situation.
              </p>
              <div className="about-grid">
                {[
                  [
                    "01",
                    "Try a situation",
                    "Read the facts and policy, then write the response you would give.",
                  ],
                  [
                    "02",
                    "Make another attempt",
                    "Use the writing prompts to edit your response. The original stays in your work record.",
                  ],
                  [
                    "03",
                    "Choose what to share",
                    "Create a link for one task. A reviewer can read the situation, your responses and the feedback.",
                  ],
                ].map(([n, h, b]) => (
                  <section key={n}>
                    <span className="task-index">{n}</span>
                    <h2>{h}</h2>
                    <p>{b}</p>
                  </section>
                ))}
              </div>
              <section className="paper">
                <h2>What this demo does—and what it doesn’t</h2>
                <p>
                  ShowWork is a hackathon prototype by The Sponges. It uses
                  fictional retail scenarios and deterministic language checks.
                  The checks can miss paraphrases, misunderstand negation or
                  match a phrase that is wrong in context. They are editing
                  prompts, not an assessment or credential.
                </p>
                <p>
                  There are no live AI calls, employer partnerships, real
                  applicant trials or hiring outcomes claimed. An optional
                  server-side API adapter is included for later testing; it is
                  disabled here. A human must review the underlying work.
                </p>
                <p>
                  Enter no real customer, bank, identity or employer
                  information. Demo sessions are isolated by a private browser
                  cookie and expire after 7 days. A share link reveals only the
                  chosen task’s work saved when the link was created. Revoking
                  it blocks later access, but cannot remove copies a reader
                  already made.
                </p>
                <a className="text-link" href="/judge">
                  Read the judge’s guide <ArrowUpRight size={16} />
                </a>
              </section>
            </article>
          )}
          <footer>
            <span>ShowWork / The Sponges</span>
            <span>Built for the FNB AOTY Hackathon 2026</span>
          </footer>
        </main>
      </div>
      {shareTask && (
        <div className="modal-backdrop">
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="share-title"
          >
            <button
              className="modal-close"
              aria-label="Close sharing dialog"
              onClick={() => setShareTask(null)}
            >
              <X size={20} />
            </button>
            <Link2 size={25} />
            <h2 id="share-title">Create a share link?</h2>
            {error && (
              <p role="alert" className="warning">
                {error}
              </p>
            )}
            <p>
              This creates a link anyone can open. It includes the brief, your
              saved responses and writing checks for{" "}
              <strong>{tasks.find((t) => t.id === shareTask)?.title}</strong>.
            </p>
            <p>
              Later revisions will not appear in this link. You can revoke it
              from My saved work. Only use fictional information in this demo.
            </p>
            <div className="response-actions">
              <button
                autoFocus
                className="primary"
                disabled={busy}
                onClick={share}
              >
                {busy ? "Creating…" : "Create share link"}
              </button>
              <button className="quiet" onClick={() => setShareTask(null)}>
                Cancel
              </button>
            </div>
          </section>
        </div>
      )}
      {deleteOpen && (
        <div className="modal-backdrop">
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-title"
          >
            <h2 id="delete-title">Delete your demo work?</h2>
            <p>
              This permanently removes your saved responses and share links from
              this session. You can start again, but cannot recover this work.
            </p>
            <div className="response-actions">
              <button
                autoFocus
                className="secondary"
                onClick={() => setDeleteOpen(false)}
              >
                Keep my work
              </button>
              <button
                className="primary danger"
                disabled={busy}
                onClick={erase}
              >
                {busy ? "Deleting…" : "Delete demo work"}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

function TaskBrief({ task }: { task: Task }) {
  return (
    <section className="paper">
      <h2>The facts</h2>
      <dl className="facts">
        {task.facts.map((f) => (
          <div key={f.label}>
            <dt>{f.label}</dt>
            <dd>{f.value}</dd>
          </div>
        ))}
      </dl>
      <h2>Store policy</h2>
      <ul className="policy">
        {task.policy.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
      <p className="fineprint">This is a made-up practice situation.</p>
    </section>
  );
}
