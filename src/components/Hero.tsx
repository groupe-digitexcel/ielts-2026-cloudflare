type Props = {
  onStart: () => void;
};

export default function Hero({ onStart }: Props) {
  return (
    <div className="card hero">
      <h1>IELTS 2026 Version Format Exams Simulator</h1>
      <p>
        AI-powered website app for realistic IELTS-style exam generation, automatic evaluation,
        admin-uploaded reference sets, domain-based training, and mixed life/professional scenario simulation.
      </p>
      <div style={{ marginTop: 16 }}>
        <button className="btn" onClick={onStart}>Start Simulation</button>
      </div>
    </div>
  );
}
