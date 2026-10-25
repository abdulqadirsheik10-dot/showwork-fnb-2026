"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Check, ArrowUpRight, Printer } from "lucide-react";
import type { Task } from "@/lib/tasks";
import type { Feedback } from "@/lib/feedback";
export default function Card() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<{
      task: Task;
      created: number;
      attempts: {
        id: string;
        response: string;
        feedback: Feedback;
        created: number;
      }[];
    } | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    fetch("/api/card/" + token)
      .then(async (r) => {
        const d = (await r.json()) as {
          error?: string;
          task: Task;
          created: number;
          attempts: {
            id: string;
            response: string;
            feedback: Feedback;
            created: number;
          }[];
        };
        if (!r.ok) throw Error(d.error);
        setData(d);
      })
      .catch((e) => setError(e.message));
  }, [token]);
  return (
    <main className="standalone">
      <a href="/" className="wordmark">
        <span className="mark">
          <Check size={23} />
        </span>
        ShowWork
      </a>
      {error ? (
        <>
          <h1>Card unavailable.</h1>
          <p>This link may have expired or been revoked by its owner.</p>
          <a className="text-link" href="/">
            Explore ShowWork <ArrowUpRight size={16} />
          </a>
        </>
      ) : !data ? (
        <p role="status">Opening work sample…</p>
      ) : (
        <>
          <div className="reviewer-header">
            <div>
              <p className="eyebrow orange">Shared work sample</p>
              <h1>{data.task.title}</h1>
            </div>
            <span className="tag found">Shared work sample</span>
          </div>
          <p>
            Demo candidate · {data.task.area} · Snapshot from{" "}
            {new Date(data.created).toLocaleDateString("en-ZA")}
          </p>
          <p className="card-note">
            Read the work and decide for yourself. This card is not a verified
            identity, qualification or hiring recommendation. All scenarios are
            fictional.
          </p>
          <section className="paper">
            <h2>The situation</h2>
            <p>{data.task.intro}</p>
            <dl className="facts">
              {data.task.facts.map((f) => (
                <div key={f.label}>
                  <dt>{f.label}</dt>
                  <dd>{f.value}</dd>
                </div>
              ))}
            </dl>
            <h3>Policy supplied to the candidate</h3>
            <ul className="policy">
              {data.task.policy.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </section>
          <h2>The work, in order</h2>
          {data.attempts.map((a, i) => (
            <section className="paper" key={a.id}>
              <p className="eyebrow">
                {i === 0 ? "ORIGINAL RESPONSE" : "REVISION " + i} ·{" "}
                {new Date(a.created).toLocaleString("en-ZA", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
              <p className="response-text">{a.response}</p>
              <details>
                <summary>View limited writing checks</summary>
                <p className="fineprint">
                  Rules-based language checks · {a.feedback.version}. A phrase
                  match is not proof of competence. A human must review the
                  actual response.
                </p>
                {a.feedback.warnings.map((w) => (
                  <p className="warning" key={w}>
                    {w}
                  </p>
                ))}
                {a.feedback.findings.map((f) => (
                  <div className="finding" key={f.id}>
                    <div className="finding-heading">
                      <h3>{f.label}</h3>
                      <span className={f.found ? "tag found" : "tag review"}>
                        {f.found ? "Phrase found" : "Review"}
                      </span>
                    </div>
                    {f.evidence && <blockquote>“{f.evidence}”</blockquote>}
                    <p>{f.note}</p>
                  </div>
                ))}
              </details>
            </section>
          ))}
          <div className="response-actions">
            <button className="secondary" onClick={() => window.print()}>
              <Printer size={16} /> Print this card
            </button>
            <a href="/" className="text-link">
              Try a situation yourself <ArrowUpRight size={16} />
            </a>
          </div>
          <p className="fineprint">
            This link includes only work saved at the time of sharing. The
            author may revoke future access. A saved or printed copy cannot be
            recalled.
          </p>
        </>
      )}
    </main>
  );
}
