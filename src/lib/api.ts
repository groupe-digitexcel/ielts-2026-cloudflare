import { API_BASE_URL } from "./constants";
import { ExamData, AttemptResult } from "./types";

export async function fetchDomains(): Promise<string[]> {
  const res = await fetch(`${API_BASE_URL}/domains`);
  if (!res.ok) throw new Error("Failed to fetch domains");
  return res.json();
}

export async function generateExam(payload: {
  domain: string;
  examType: string;
  difficulty: string;
}): Promise<ExamData> {
  const res = await fetch(`${API_BASE_URL}/generate-exam`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error("Failed to generate exam");
  return res.json();
}

export async function submitResult(payload: {
  examId: number;
  userId: string;
  answers: Record<string, string>;
}): Promise<AttemptResult> {
  const res = await fetch(`${API_BASE_URL}/submit-result`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error("Failed to submit result");
  return res.json();
}

export async function fetchReferenceSets() {
  const res = await fetch(`${API_BASE_URL}/admin/reference-sets`);
  if (!res.ok) throw new Error("Failed to fetch references");
  return res.json();
}

export async function uploadReferenceSet(payload: any) {
  const res = await fetch(`${API_BASE_URL}/admin/upload`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error("Failed to upload reference set");
  return res.json();
}

export async function createPayment(payload: {
  userId: string;
  amount: number;
  method: "LOCAL" | "VISA";
  accountNumber?: string;
}) {
  const res = await fetch(`${API_BASE_URL}/payments/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error("Failed to create payment");
  return res.json();
}
