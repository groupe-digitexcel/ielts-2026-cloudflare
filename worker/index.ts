export interface Env {
  IELTS2026AI_DB: D1Database;
  CACHE: KVNamespace;
  REFERENCE_EXAMS: R2Bucket;
}

type GeneratePayload = {
  domain: string;
  examType: string;
  difficulty: string;
};

type SubmitPayload = {
  examId: number;
  userId: string;
  answers: Record<string, string>;
};

type PaymentPayload = {
  userId: string;
  amount: number;
  method: "LOCAL" | "VISA";
  accountNumber?: string;
};

const DEFAULT_DOMAINS = [
  "business",
  "healthcare",
  "education",
  "construction",
  "technology",
  "logistics",
  "hospitality",
  "banking",
  "civil-engineering",
  "public-services"
];

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders() });
    }

    try {
      // Health
      if (url.pathname === "/api/health") {
        return json({ ok: true, service: "groupe-digitexcel IELTS 2026 API" });
      }

      // Domains
      if (url.pathname === "/api/domains" && request.method === "GET") {
        const cached = await env.CACHE.get("domains");
        if (cached) return json(JSON.parse(cached));

        await env.CACHE.put("domains", JSON.stringify(DEFAULT_DOMAINS), { expirationTtl: 3600 });
        return json(DEFAULT_DOMAINS);
      }

      // Generate Exam
      if (url.pathname === "/api/generate-exam" && request.method === "POST") {
        const body = (await request.json()) as GeneratePayload;
        const exam = await generateExamFromReferences(body, env);
        return json(exam);
      }

      // Submit Result
      if (url.pathname === "/api/submit-result" && request.method === "POST") {
        const body = (await request.json()) as SubmitPayload;
        const result = await autoEvaluate(body, env);
        return json(result);
      }

      // Upload reference set
      if (url.pathname === "/api/admin/upload" && request.method === "POST") {
        const body = await request.json();
        const result = await uploadReferenceSet(body, env);
        return json(result);
      }

      // Get reference sets
      if (url.pathname === "/api/admin/reference-sets" && request.method === "GET") {
        const cached = await env.CACHE.get("reference_sets");
        if (cached) return json(JSON.parse(cached));

        const rows = await env.IELTS2026AI_DB
          .prepare(`SELECT * FROM exam_reference_sets ORDER BY id DESC`)
          .all();

        const results = rows.results || [];
        await env.CACHE.put("reference_sets", JSON.stringify(results), { expirationTtl: 120 });
        return json(results);
      }

      // Seed sample references from JSON manually through API if needed
      if (url.pathname === "/api/admin/seed-samples" && request.method === "POST") {
        const body = await request.json();
        const samples = Array.isArray(body) ? body : [];
        const created: number[] = [];

        for (const item of samples) {
          const res = await uploadReferenceSet({
            title: item.title,
            domain: item.domain,
            sections: item.sections
          }, env);
          created.push(res.referenceSetId);
        }

        return json({ success: true, created });
      }

      // Payments
      if (url.pathname === "/api/payments/create" && request.method === "POST") {
        const body = (await request.json()) as PaymentPayload;
        const payment = await createPayment(body, env);
        return json(payment);
      }

      return json({ error: "Not found" }, 404);
    } catch (error: any) {
      return json({ error: error?.message || "Internal error" }, 500);
    }
  }
};

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
}

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders()
    }
  });
}

async function uploadReferenceSet(body: any, env: Env) {
  const { title, domain, sections } = body;

  if (!title || !domain || !sections) {
    throw new Error("title, domain and sections are required");
  }

  const r2Key = `reference/${Date.now()}-${slugify(title)}.json`;
  await env.REFERENCE_EXAMS.put(r2Key, JSON.stringify(sections, null, 2), {
    httpMetadata: { contentType: "application/json" }
  });

  const refInsert = await env.IELTS2026AI_DB
    .prepare(`
      INSERT INTO exam_reference_sets (title, domain, source_type, r2_key)
      VALUES (?, ?, 'admin_upload', ?)
    `)
    .bind(title, domain, r2Key)
    .run();

  const referenceSetId = Number(refInsert.meta.last_row_id);

  for (const sectionType of ["listening", "reading", "writing", "speaking"]) {
    if (sections[sectionType]) {
      await env.IELTS2026AI_DB
        .prepare(`
          INSERT INTO exam_reference_sections (reference_set_id, section_type, content)
          VALUES (?, ?, ?)
        `)
        .bind(referenceSetId, sectionType, JSON.stringify(sections[sectionType]))
        .run();
    }
  }

  await env.CACHE.delete("reference_sets");

  return {
    success: true,
    referenceSetId,
    r2Key
  };
}

async function generateExamFromReferences(payload: GeneratePayload, env: Env) {
  const domain = payload.domain || "business";
  const examType = payload.examType || "full";
  const difficulty = payload.difficulty || "mixed";

  const refs = await env.IELTS2026AI_DB
    .prepare(`
      SELECT * FROM exam_reference_sets
      WHERE domain = ?
      ORDER BY id DESC
      LIMIT 3
    `)
    .bind(domain)
    .all();

  let baseSections: any = null;
  let basedOnRefs: number[] = [];

  if ((refs.results || []).length > 0) {
    const ref = refs.results[0] as any;
    basedOnRefs = (refs.results || []).map((r: any) => Number(r.id));

    const r2Obj = await env.REFERENCE_EXAMS.get(ref.r2_key);
    if (r2Obj) {
      const text = await r2Obj.text();
      baseSections = JSON.parse(text);
    }
  }

  const generatedSections = buildGeneratedSections(domain, difficulty, baseSections);

  const title = `IELTS 2026 ${capitalize(domain)} ${capitalize(examType)} ${capitalize(difficulty)} Exam`;

  const insert = await env.IELTS2026AI_DB
    .prepare(`
      INSERT INTO exams (title, domain, exam_type, difficulty, sections)
      VALUES (?, ?, ?, ?, ?)
    `)
    .bind(title, domain, examType, difficulty, JSON.stringify(generatedSections))
    .run();

  const examId = Number(insert.meta.last_row_id);

  await env.IELTS2026AI_DB
    .prepare(`
      INSERT INTO generated_exam_lineage (exam_id, based_on_references, generation_prompt)
      VALUES (?, ?, ?)
    `)
    .bind(
      examId,
      JSON.stringify(basedOnRefs),
      `Generated from domain=${domain}, examType=${examType}, difficulty=${difficulty}`
    )
    .run();

  return {
    id: examId,
    title,
    domain,
    exam_type: examType,
    difficulty,
    sections: generatedSections
  };
}

function buildGeneratedSections(domain: string, difficulty: string, baseSections: any) {
  const domainTopic = getDomainTopic(domain);
  const diffWord = difficulty === "hard" ? "advanced" : difficulty === "easy" ? "accessible" : "balanced";

  const listeningBase = baseSections?.listening;
  const readingBase = baseSections?.reading;
  const writingBase = baseSections?.writing;
  const speakingBase = baseSections?.speaking;

  return {
    listening: {
      title: listeningBase?.title || `${capitalize(domain)} Listening Practice`,
      questions: listeningBase?.questions?.length
        ? listeningBase.questions.map((q: any, idx: number) => ({
            id: idx + 1,
            type: "mcq",
            question: `${q.question} (${diffWord} variant)`,
            options: q.options,
            answer: q.answer
          }))
        : [
            {
              id: 1,
              type: "mcq",
              question: `In a ${domainTopic} orientation, what is the first priority?`,
              options: ["Safety", "Decoration", "Silence", "Delay"],
              answer: "Safety"
            },
            {
              id: 2,
              type: "mcq",
              question: `What is essential in a ${domainTopic} workflow?`,
              options: ["Documentation", "Guesswork", "Confusion", "No plan"],
              answer: "Documentation"
            }
          ]
    },

    reading: {
      title: readingBase?.title || `${capitalize(domain)} Reading Passage`,
      passage:
        readingBase?.passage ||
        `${capitalize(domainTopic)} professionals often work in ${diffWord} and realistic environments where communication, planning, and problem-solving are essential. This passage simulates IELTS-style comprehension with practical and academic relevance.`,
      questions: readingBase?.questions?.length
        ? readingBase.questions.map((q: any, idx: number) => ({
            id: idx + 1,
            type: "mcq",
            question: `${q.question} (${diffWord} interpretation)`,
            options: q.options,
            answer: q.answer
          }))
        : [
            {
              id: 1,
              type: "mcq",
              question: `What is emphasized in the passage about ${domainTopic}?`,
              options: ["Planning", "Disorder", "Isolation", "Silence"],
              answer: "Planning"
            }
          ]
    },

    writing: {
      task1:
        writingBase?.task1 ||
        `The graph shows performance trends in the ${domainTopic} sector over five years. Summarize the key features and compare significant changes.`,
      task2:
        writingBase?.task2 ||
        `Some people believe that ${domainTopic} skills should be taught earlier in schools and training centers. Discuss both views and give your own opinion.`
    },

    speaking: {
      part1:
        speakingBase?.part1 || [
          `What interests you most about ${domainTopic}?`,
          `Have you ever learned about ${domainTopic} in real life?`
        ],
      part2:
        speakingBase?.part2 ||
        `Describe a time when you observed or participated in a ${domainTopic} situation that taught you something important.`,
      part3:
        speakingBase?.part3 || [
          `Why is communication important in ${domainTopic}?`,
          `How might technology improve ${domainTopic} in the future?`
        ]
    }
  };
}

function getDomainTopic(domain: string) {
  const map: Record<string, string> = {
    business: "business and trade",
    healthcare: "healthcare and clinical support",
    education: "education and learning",
    construction: "construction and site operations",
    technology: "technology and digital systems",
    logistics: "logistics and supply chain",
    hospitality: "hospitality and customer service",
    banking: "banking and finance",
    "civil-engineering": "civil engineering and infrastructure",
    "public-services": "public administration and public services"
  };

  return map[domain] || domain;
}

async function autoEvaluate(payload: SubmitPayload, env: Env) {
  const examRow = await env.IELTS2026AI_DB
    .prepare(`SELECT * FROM exams WHERE id = ?`)
    .bind(payload.examId)
    .first<any>();

  if (!examRow) throw new Error("Exam not found");

  const sections = JSON.parse(examRow.sections);

  let listeningScore = 0;
  let readingScore = 0;

  for (const q of sections.listening.questions || []) {
    const key = `listening-${q.id}`;
    if (payload.answers[key] === q.answer) listeningScore++;
  }

  for (const q of sections.reading.questions || []) {
    const key = `reading-${q.id}`;
    if (payload.answers[key] === q.answer) readingScore++;
  }

  const writingTask1 = payload.answers["writing-task1"] || "";
  const writingTask2 = payload.answers["writing-task2"] || "";

  const writingBand = estimateWritingBand(writingTask1, writingTask2);
  const speakingBand = 6.5; // Placeholder until real speech/voice integration later

  const objectiveBandListening = mapObjectiveToBand(listeningScore, (sections.listening.questions || []).length || 1);
  const objectiveBandReading = mapObjectiveToBand(readingScore, (sections.reading.questions || []).length || 1);

  const overallBand = roundToHalf(
    (objectiveBandListening + objectiveBandReading + writingBand + speakingBand) / 4
  );

  const feedback = buildFeedback({
    listeningScore,
    readingScore,
    writingBand,
    speakingBand,
    overallBand
  });

  await env.IELTS2026AI_DB
    .prepare(`
      INSERT INTO exam_attempts (exam_id, user_id, answers, score, band_overall)
      VALUES (?, ?, ?, ?, ?)
    `)
    .bind(
      payload.examId,
      payload.userId,
      JSON.stringify(payload.answers),
      JSON.stringify({
        listeningScore,
        readingScore,
        writingBand,
        speakingBand,
        overallBand
      }),
      overallBand
    )
    .run();

  return {
    examId: payload.examId,
    listeningScore,
    readingScore,
    writingBand,
    speakingBand,
    overallBand,
    feedback
  };
}

function estimateWritingBand(task1: string, task2: string) {
  const totalWords = countWords(task1) + countWords(task2);

  if (totalWords >= 500) return 7.5;
  if (totalWords >= 350) return 6.5;
  if (totalWords >= 220) return 5.5;
  return 4.5;
}

function countWords(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function mapObjectiveToBand(score: number, total: number) {
  const ratio = total > 0 ? score / total : 0;
  if (ratio >= 0.95) return 9;
  if (ratio >= 0.85) return 8;
  if (ratio >= 0.75) return 7;
  if (ratio >= 0.6) return 6;
  if (ratio >= 0.45) return 5;
  if (ratio >= 0.3) return 4;
  return 3;
}

function roundToHalf(n: number) {
  return Math.round(n * 2) / 2;
}

function buildFeedback(data: {
  listeningScore: number;
  readingScore: number;
  writingBand: number;
  speakingBand: number;
  overallBand: number;
}) {
  return `Listening: ${data.listeningScore}, Reading: ${data.readingScore}. Estimated Writing Band: ${data.writingBand}. Speaking provisional band: ${data.speakingBand}. Overall estimated IELTS band: ${data.overallBand}. Improve vocabulary range, coherence, and timing for stronger performance.`;
}

async function createPayment(payload: PaymentPayload, env: Env) {
  const metadata =
    payload.method === "LOCAL"
      ? {
          instructions: [
            "Send payment using local mobile money / local transfer",
            "Admin can later verify manually",
            "Future automation can be added"
          ]
        }
      : {
          instructions: [
            "Visa / Grey placeholder created",
            "Later connect Grey virtual US bank account",
            "Later connect card or ACH flow"
          ]
        };

  const insert = await env.IELTS2026AI_DB
    .prepare(`
      INSERT INTO payments (user_id, amount, method, account_number, status, metadata)
      VALUES (?, ?, ?, ?, 'pending', ?)
    `)
    .bind(
      payload.userId,
      payload.amount,
      payload.method,
      payload.accountNumber || "",
      JSON.stringify(metadata)
    )
    .run();

  return {
    success: true,
    paymentId: Number(insert.meta.last_row_id),
    message:
      payload.method === "LOCAL"
        ? "Local payment request created successfully"
        : "Visa / Grey placeholder payment request created successfully",
    metadata
  };
}

function slugify(input: string) {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
