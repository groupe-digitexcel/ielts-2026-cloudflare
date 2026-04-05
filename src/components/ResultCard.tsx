import { AttemptResult } from "../lib/types";

type Props = {
  result: AttemptResult | null;
};

export default function ResultCard({ result }: Props) {
  if (!result) {
    return (
      <div className="card">
        <h2 className="section-title">No Results Yet</h2>
        <p className="small">Complete and submit an exam to see results here.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="section-title">Your Evaluation Result</h2>
      <p><strong>Listening Score:</strong> {result.listeningScore}</p>
      <p><strong>Reading Score:</strong> {result.readingScore}</p>
      <p><strong>Writing Band:</strong> {result.writingBand}</p>
      <p><strong>Speaking Band:</strong> {result.speakingBand}</p>
      <p><strong>Overall Band:</strong> {result.overallBand}</p>
      <p><strong>Feedback:</strong> {result.feedback}</p>
    </div>
  );
}
