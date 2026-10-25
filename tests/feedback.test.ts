import { describe, it, expect } from "vitest";
import { assess } from "../lib/feedback";
import { tasks } from "../lib/tasks";
import { optionalAI } from "../lib/optional-ai";
describe("transparent feedback", () => {
  it("does not award phrase matches for an empty response", () => {
    expect(assess("double-charge", "").findings.some((f) => f.found)).toBe(
      false,
    );
  });
  it("keeps every excerpt grounded in the submitted response", () => {
    for (const task of tasks) {
      const f = assess(task.id, task.sample);
      expect(
        f.findings.filter((x) => !x.found).map((x) => task.id + ":" + x.id),
      ).toEqual([]);
      for (const x of f.findings)
        expect(task.sample.includes(x.evidence!)).toBe(true);
      expect(f.nextTask).not.toBe(task.id);
    }
  });
  it("flags an unsupported immediate refund promise", () => {
    expect(
      assess("double-charge", "I will refund you immediately today.").warnings
        .length,
    ).toBe(1);
  });
  it("does not flag an explicit refusal to promise bank timing", () => {
    expect(
      assess(
        "double-charge",
        "I cannot promise the bank will release it today.",
      ).warnings.length,
    ).toBe(0);
  });
  it("requires the calculation, not just the answer", () => {
    expect(
      assess("stock-check", "The expected stock is 17.").findings[0].found,
    ).toBe(false);
  });
  it("does not invent quotes for unrelated text", () => {
    expect(
      assess("handover", "A lovely day at the seaside.").findings.every(
        (f) => f.evidence === null,
      ),
    ).toBe(true);
  });
  it("keeps incomplete work on the same task", () => {
    expect(assess("handover", "Hello there.").nextTask).toBe("handover");
  });
});
describe("optional API adapter, mock service only", () => {
  it("makes no request when disabled", async () => {
    let called = false;
    const result = await optionalAI(
      { enabled: false },
      { task: "test", response: "hello" },
      async () => {
        called = true;
        throw Error();
      },
    );
    expect(called).toBe(false);
    expect(result.status).toBe("disabled");
  });
  it("fails closed without explicit configuration", async () => {
    await expect(
      optionalAI({ enabled: true }, { task: "test", response: "hello" }),
    ).rejects.toThrow();
  });
  it("drops fabricated evidence", async () => {
    const fake = async () =>
      Response.json({
        choices: [
          {
            message: {
              content: JSON.stringify({
                suggestions: [
                  { suggestion: "Keep this", evidence: "hello" },
                  { suggestion: "Wrong quote", evidence: "invented" },
                ],
              }),
            },
          },
        ],
      });
    const result = await optionalAI(
      { enabled: true, apiKey: "mock-not-a-key", model: "mock" },
      { task: "test", response: "hello" },
      fake,
    );
    expect(result.suggestions).toHaveLength(1);
  });
  it("handles provider failures", async () => {
    const result = await optionalAI(
      { enabled: true, apiKey: "mock-not-a-key", model: "mock" },
      { task: "test", response: "hello" },
      async () => new Response("", { status: 429 }),
    );
    expect(result.status).toBe("unavailable");
  });
});
