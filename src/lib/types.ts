export type ExamQuestion = {
  id: number;
  type: "mcq";
  question: string;
  options: string[];
  answer?: string;
};

export type ExamSection = {
  title?: string;
  questions?: ExamQuestion[];
  passage?: string;
  task1?: string;
  task2?: string;
  part1?: string[];
  part2?: string;
  part3?: string[];
};

export type ExamData = {
  id?: number;
  title: string;
  domain: string;
  exam_type?: string;
  difficulty?: string;
  sections: {
    listening: ExamSection;
    reading: ExamSection;
    writing: ExamSection;
    speaking: ExamSection;
  };
};

export type AttemptResult = {
  examId: number;
  listeningScore: number;
  readingScore: number;
  writingBand: number;
  speakingBand: number;
  overallBand: number;
  feedback: string;
};

export type PaymentInfo = {
  method: "LOCAL" | "VISA";
  accountNumber?: string;
  amount: number;
  userId: string;
};
