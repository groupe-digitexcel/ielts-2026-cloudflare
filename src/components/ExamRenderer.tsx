import { ExamData } from "../lib/types";

type Props = {
  exam: ExamData;
  answers: Record<string, string>;
  setAnswers: (value: Record<string, string>) => void;
};

export default function ExamRenderer({ exam, answers, setAnswers }: Props) {
  const updateAnswer = (key: string, value: string) => {
    setAnswers({ ...answers, [key]: value });
  };

  const renderMCQ = (prefix: string, questions: any[] = []) =>
    questions.map((q) => (
      <div className="question" key={`${prefix}-${q.id}`}>
        <strong>{q.question}</strong>
        {q.options.map((opt: string) => (
          <label className="option" key={opt}>
            <input
              type="radio"
              name={`${prefix}-${q.id}`}
              checked={answers[`${prefix}-${q.id}`] === opt}
              onChange={() => updateAnswer(`${prefix}-${q.id}`, opt)}
            />{" "}
            {opt}
          </label>
        ))}
      </div>
    ));

  return (
    <div className="card">
      <h2 className="section-title">{exam.title}</h2>
      <div className="small">Domain: {exam.domain}</div>

      <hr />

      <h3>Listening</h3>
      {renderMCQ("listening", exam.sections.listening.questions)}

      <h3>Reading</h3>
      {exam.sections.reading.passage && (
        <p className="small">{exam.sections.reading.passage}</p>
      )}
      {renderMCQ("reading", exam.sections.reading.questions)}

      <h3>Writing</h3>
      <div className="question">
        <strong>Task 1</strong>
        <p>{exam.sections.writing.task1}</p>
        <textarea
          className="textarea"
          rows={5}
          value={answers["writing-task1"] || ""}
          onChange={(e) => updateAnswer("writing-task1", e.target.value)}
          placeholder="Write your Task 1 response..."
        />
      </div>

      <div className="question">
        <strong>Task 2</strong>
        <p>{exam.sections.writing.task2}</p>
        <textarea
          className="textarea"
          rows={7}
          value={answers["writing-task2"] || ""}
          onChange={(e) => updateAnswer("writing-task2", e.target.value)}
          placeholder="Write your Task 2 response..."
        />
      </div>

      <h3>Speaking</h3>
      <div className="question">
        <strong>Part 1</strong>
        <ul>
          {(exam.sections.speaking.part1 || []).map((q, i) => <li key={i}>{q}</li>)}
        </ul>
      </div>
      <div className="question">
        <strong>Part 2</strong>
        <p>{exam.sections.speaking.part2}</p>
      </div>
      <div className="question">
        <strong>Part 3</strong>
        <ul>
          {(exam.sections.speaking.part3 || []).map((q, i) => <li key={i}>{q}</li>)}
        </ul>
      </div>
    </div>
  );
}
