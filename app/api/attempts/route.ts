import { owner, originOK, json, db, body, quota } from "@/lib/server";
import { assess } from "@/lib/feedback";
import { getTask } from "@/lib/tasks";
export async function GET(req: Request) {
  const id = await owner(req);
  if (!id) return json({ attempts: [] });
  const rows = await db()
    .prepare(
      "SELECT id,task,response,feedback,created FROM attempts WHERE owner=? ORDER BY created DESC",
    )
    .bind(id)
    .all();
  return json({
    attempts: rows.results.map((r) => ({
      ...r,
      feedback: JSON.parse(r.feedback as string),
    })),
  });
}
export async function POST(req: Request) {
  if (!originOK(req)) return json({ error: "Request rejected." }, 403);
  const id = await owner(req);
  if (!id)
    return json(
      { error: "Your demo session has ended. Start a new session." },
      401,
    );
  let b;
  try {
    b = await body(req);
  } catch {
    return json({ error: "Use a valid response under 4,000 characters." }, 400);
  }
  if (
    typeof b.task !== "string" ||
    !getTask(b.task) ||
    typeof b.response !== "string" ||
    b.response.trim().length < 40 ||
    b.response.length > 4000
  )
    return json(
      { error: "Write between 40 and 4,000 characters for a listed task." },
      400,
    );
  if (
    !(await quota("attempt:" + id, 30)) ||
    !(await quota("attempt-global", 3000))
  )
    return json(
      {
        error:
          "Practice limit reached for today. Your saved work is still available.",
      },
      429,
    );
  const response = b.response.trim(),
    feedback = assess(b.task, response),
    attempt = {
      id: crypto.randomUUID(),
      task: b.task,
      response,
      feedback,
      created: Date.now(),
    };
  await db()
    .prepare(
      "INSERT INTO attempts(id,owner,task,response,feedback,created) VALUES (?,?,?,?,?,?)",
    )
    .bind(
      attempt.id,
      id,
      b.task,
      response,
      JSON.stringify(feedback),
      attempt.created,
    )
    .run();
  return json({ attempt }, 201);
}
