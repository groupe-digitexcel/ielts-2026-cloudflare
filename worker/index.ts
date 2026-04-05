import { Hono } from "hono";

type Bindings = {
  DB: D1Database;
  UPLOADS: R2Bucket;
  ASSETS: Fetcher;
  APP_NAME: string;
  ADMIN_EMAIL: string;
  AI_PROVIDER: string;
  AI_API_KEY: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// ----------------------
// Helper functions
// ----------------------
function estimateBandFromScore(score: number) {
  if (score >= 95) return 9.0;
  if (score >= 88) return 8.5;
  if (score >= 80) return 8.0;
  if (score >= 73) return 7.5;
  if (score >= 65) return 7.0;
  if (score >= 58) return 6.5;
  if (score >= 50) return 6.0;
  if (score >= 43) return 5.5;
  if (score >= 35) return 5.0;
  return 4.5;
}

function autoEvaluateWriting(answer: string) {
  const words = answer.trim().split(/\s+/).filter(Boolean).length;
  const chars = answer.trim().length;

  let score = 40;

  if (words >= 250) score += 20;
  else if (words >= 180) score += 12;
  else score -= 8;

  if (chars > 1200) score += 10;
  if (/\bhowever\b|\btherefore\b|\bmoreover\b|\bin conclusion\b/i.test(answer)) score += 10;
  if (/\bfor example\b|\bfor instance\b/i.test(answer)) score += 8;
  if (/[.!?]/.test(answer)) score += 5;
  if (answer.split(".").length > 6) score += 7;

  if (score > 100) score = 100;
  if (score < 0) score = 0;

  const band = estimateBandFromScore(score);

  let feedback = "Your essay shows potential but needs improvement in task response, coherence, lexical resource, and grammar.";
  if (band >= 7.5) {
    feedback = "Strong IELTS-style essay. Good structure, adequate development of ideas, and strong coherence. Continue refining grammar precision and advanced vocabulary.";
  } else if (band >= 6.5) {
    feedback = "Good performance. Improve idea extension, paragraph linking, and more precise vocabulary for a higher band.";
  } else if (band >= 5.5) {
    feedback = "Moderate performance. You need stronger structure, more examples, better connectors, and clearer grammar control.";
  }

  return {
    score,
    band_score: band,
    feedback
  };
}

function buildExam(examType: string, difficulty: string) {
  const reading = {
    passage:
      "The development of artificial intelligence in education has transformed how students prepare for standardized exams, especially through adaptive learning, instant feedback, and realistic exam simulation.",
    questions: [
      { question: "What has transformed exam preparation according to the passage?" },
      { question: "Name two benefits of AI in standardized exam preparation." },
      { question: "What kind of feedback is mentioned in the passage?" }
    ]
  };

  const listening = {
    audioScript:
      "You will hear a conversation between a student and an IELTS instructor discussing strategies for improving band scores in the writing section.",
    questions: [
      { question: "Who are the speakers in the conversation?" },
      { question: "Which IELTS section are they discussing?" }
    ]
  };

  const writing = {
    task1: {
      question:
        "The chart below shows the percentage of students using online platforms for IELTS preparation between 2022 and 2026. Summarize the information by selecting and reporting the main features."
    },
    task2: {
      question:
        "Some people believe that AI-based learning tools are the best way to prepare for language proficiency tests such as IELTS. To what extent do you agree or disagree?"
    }
  };

  const speaking = {
    part1: [
      "Do you enjoy studying English?",
      "How often do you practice speaking English?"
    ],
    part2: "Describe a time when technology helped you learn something important.",
    part3: [
      "Do you think AI will replace teachers in the future?",
      "What are the risks of relying too much on technology for education?"
    ]
  };

  const payload =
    examType === "reading"
      ? { reading }
      : examType === "listening"
      ? { listening }
      : examType === "writing"
      ? { writing }
      : examType === "speaking"
      ? { speaking }
      : { reading, listening, writing, speaking };

  return {
    title: `IELTS 2026 ${examType.toUpperCase()} Simulation (${difficulty})`,
    exam_type: examType,
    difficulty,
    payload
  };
}

// ----------------------
// API routes
// ----------------------
app.get("/api/health", (c) => {
  return c.json({
    ok: true,
    message: "Cloudflare fullstack backend is running"
  });
});

app.post("/api/exams/generate", async (c) => {
  const body = await c.req.json<{ examType: string; difficulty: string }>();
  const examType = body.examType || "full";
  const difficulty = body.difficulty || "medium";

  const exam = buildExam(examType, difficulty);

  const result = await c.env.DB.prepare(
    "INSERT INTO exams (title, exam_type, difficulty, payload, source) VALUES (?, ?, ?, ?, ?)"
  )
    .bind(
      exam.title,
      exam.exam_type,
      exam.difficulty,
      JSON.stringify(exam.payload),
      "ai"
    )
    .run();

  return c.json({
    success: true,
    exam: {
      id: result.meta.last_row_id,
      ...exam
    }
  });
});

app.post("/api/evaluate/writing", async (c) => {
  const body = await c.req.json<{ question: string; answer: string }>();
  const result = autoEvaluateWriting(body.answer || "");

  return c.json({
    success: true,
    result
  });
});

app.get("/api/exams", async (c) => {
  const rows = await c.env.DB.prepare(
    "SELECT id, title, exam_type, difficulty, source, created_at FROM exams ORDER BY id DESC LIMIT 20"
  ).all();

  return c.json({
    success: true,
    exams: rows.results || []
  });
});

app.post("/api/attempts/save", async (c) => {
  const body = await c.req.json<{
    user_id: number;
    exam_id: number;
    section: string;
    answers: any;
    score: number;
    band_score: number;
    feedback?: string;
  }>();

  const result = await c.env.DB.prepare(
    "INSERT INTO attempts (user_id, exam_id, section, answers, score, band_score, feedback) VALUES (?, ?, ?, ?, ?, ?, ?)"
  )
    .bind(
      body.user_id,
      body.exam_id,
      body.section,
      JSON.stringify(body.answers || {}),
      body.score || 0,
      body.band_score || 0,
      body.feedback || ""
    )
    .run();

  return c.json({
    success: true,
    id: result.meta.last_row_id
  });
});

// ----------------------
// Static frontend fallback
// ----------------------
app.all("*", async (c) => {
  return c.env.ASSETS.fetch(c.req.raw);
});

export default app;
