import ResultCard from "../components/ResultCard";
import { AttemptResult } from "../lib/types";

type Props = {
  result: AttemptResult | null;
};

export default function ResultsPage({ result }: Props) {
  return <ResultCard result={result} />;
}
