import { useState } from "react";
import ExamGeneratorForm from "../components/ExamGeneratorForm";
import ExamRenderer from "../components/ExamRenderer";
import { generateExam, submitResult, createPayment } from "../lib/api";
import { ExamData, AttemptResult } from "../lib/types";

type Props = {
  currentExam: ExamData | null;
  setCurrentExam: (exam: ExamData | null) => void;
  setLastResult: (result: AttemptResult | null) => void;
  onShowResults: () => void;
};

export default function SimulatorPage({
  currentExam,
  setCurrentExam,
  setLastResult,
  onShowResults
}: Props) {
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [paymentStatus, setPaymentStatus] = useState("");

  const handleGenerate = async (config: { domain: string; examType: string; difficulty: string }) => {
    setLoading(true);
    try {
      const exam = await generateExam(config);
      setCurrentExam(exam);
      setAnswers({});
    } catch (err) {
      alert("Failed to generate exam");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!currentExam?.id) {
      alert("No exam loaded");
      return;
    }

    try {
      const result = await submitResult({
        examId: currentExam.id,
        userId: "demo-user",
        answers
      });
      setLastResult(result);
      onShowResults();
    } catch {
      alert("Failed to submit result");
    }
  };

  const handlePayment = async (method: "LOCAL" | "VISA") => {
    try {
      const res = await createPayment({
        userId: "demo-user",
        amount: 5000,
        method,
        accountNumber: method === "VISA" ? "GREY-US-VIRTUAL-LATER" : ""
      });
      setPaymentStatus(res.message || "Payment request created");
    } catch {
      setPaymentStatus("Payment request failed");
    }
  };

  return (
    <>
      <ExamGeneratorForm onGenerate={handleGenerate} loading={loading} />

      <div className="card">
        <h2 className="section-title">Commercial Access / Subscription Test</h2>
        <p className="small">Optional demo payment routes for future monetization.</p>
        <button className="btn" onClick={() => handlePayment("LOCAL")} style={{ marginRight: 8 }}>
          Pay Local
        </button>
        <button className="btn secondary" onClick={() => handlePayment("VISA")}>
          Pay Visa / Grey Placeholder
        </button>
        {paymentStatus && <p className="small" style={{ marginTop: 12 }}>{paymentStatus}</p>}
      </div>

      {currentExam && (
        <>
          <ExamRenderer exam={currentExam} answers={answers} setAnswers={setAnswers} />
          <div className="card">
            <button className="btn success" onClick={handleSubmit}>Submit for Automatic Evaluation</button>
          </div>
        </>
      )}
    </>
  );
}
