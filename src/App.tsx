import React, { useEffect, useState } from "react";

type Exam = {
  id?: number;
  title: string;
  exam_type: string;
  difficulty?: string;
  payload: any;
};

type EvalResult = {
  score: number;
  band_score: number;
  feedback: string;
};

export default function App() {
  const [health, setHealth] = useState("Checking...");
  const [examType, setExamType] = useState("full");
  const [difficulty, setDifficulty] = useState("medium");
  const [exam, setExam] = useState<Exam | null>(null);
  const [writingAnswer, setWritingAnswer] = useState("");
  const [evalResult, setEvalResult] = useState<EvalResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then((d) => setHealth(d.message))
      .catch(() => setHealth("Backend not responding"));
  }, []);

  const generateExam = async () => {
    setLoading(true);
    setEvalResult(null);
    try {
      const res = await fetch("/api/exams/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ examType, difficulty })
      });
      const data = await res.json();
      setExam(data.exam);
    } catch {
      alert("Failed to generate exam.");
    } finally {
      setLoading(false);
    }
  };

  const evaluateWriting = async () => {
    if (!writingAnswer.trim()) {
      alert("Please enter your writing response first.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/evaluate/writing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: exam?.payload?.writing?.task2?.question || "Sample IELTS writing task",
          answer: writingAnswer
        })
      });
      const data = await res.json();
      setEvalResult(data.result);
    } catch {
      alert("Evaluation failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="hero">
        <h1>IELTS 2026 Version Format Exams Simulator</h1>
        <p>
          AI-generated IELTS-style exams with automatic scoring and commercial-ready cloud deployment.
        </p>
        <div className="badge">Backend Status: {health}</div>
      </header>

      <section className="card">
        <h2>Create New Exam</h2>
        <div className="grid">
          <div>
            <label>Exam Type</label>
            <select value={examType} onChange={(e) => setExamType(e.target.value)}>
              <option value="full">Full Test</option>
              <option value="reading">Reading</option>
              <option value="listening">Listening</option>
              <option value="writing">Writing</option>
              <option value="speaking">Speaking</option>
            </select>
          </div>

          <div>
            <label>Difficulty</label>
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>

        <button onClick={generateExam} disabled={loading}>
          {loading ? "Generating..." : "Generate AI Exam"}
        </button>
      </section>

      {exam && (
        <section className="card">
          <h2>{exam.title}</h2>
          <p><strong>Type:</strong> {exam.exam_type}</p>
          <p><strong>Difficulty:</strong> {exam.difficulty}</p>

          {exam.payload?.reading && (
            <div className="section">
              <h3>Reading Section</h3>
              <p>{exam.payload.reading.passage}</p>
              <ul>
                {exam.payload.reading.questions.map((q: any, i: number) => (
                  <li key={i}>{q.question}</li>
                ))}
              </ul>
            </div>
          )}

          {exam.payload?.writing && (
            <div className="section">
              <h3>Writing Task 2</h3>
              <p>{exam.payload.writing.task2.question}</p>
              <textarea
                rows={10}
                placeholder="Write your IELTS essay here..."
                value={writingAnswer}
                onChange={(e) => setWritingAnswer(e.target.value)}
              />
              <button onClick={evaluateWriting} disabled={loading}>
                {loading ? "Evaluating..." : "Auto Evaluate Writing"}
              </button>
            </div>
          )}
        </section>
      )}

      {evalResult && (
        <section className="card result">
          <h2>Automatic Writing Evaluation</h2>
          <p><strong>Raw Score:</strong> {evalResult.score}/100</p>
          <p><strong>Estimated IELTS Band:</strong> {evalResult.band_score}</p>
          <p><strong>Feedback:</strong> {evalResult.feedback}</p>
        </section>
      )}

      <section className="card">
        <h2>Commercial Features Ready</h2>
        <ul>
          <li>AI-created IELTS format exams</li>
          <li>Automatic writing scoring with band estimation</li>
          <li>Speaking upload structure ready via R2</li>
          <li>Student attempts storage in D1 database</li>
          <li>Subscription-ready architecture</li>
          <li>Single Cloudflare deployment</li>
        </ul>
      </section>
    </div>
  );
}
