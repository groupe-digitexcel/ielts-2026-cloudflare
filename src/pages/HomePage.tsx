import Hero from "../components/Hero";

type Props = {
  onStart: () => void;
};

export default function HomePage({ onStart }: Props) {
  return (
    <>
      <Hero onStart={onStart} />

      <div className="grid grid-2">
        <div className="card">
          <h2 className="section-title">Features</h2>
          <span className="badge">AI Exam Generator</span>
          <span className="badge">IELTS 2026 Format</span>
          <span className="badge">Automatic Evaluation</span>
          <span className="badge">Admin Reference Upload</span>
          <span className="badge">D1 + KV + R2</span>
          <span className="badge">Cloudflare Deploy</span>
        </div>

        <div className="card">
          <h2 className="section-title">Commercial Use Ready</h2>
          <p className="small">
            This version is structured for future monetization with local payment methods and
            Visa / Grey virtual US bank integration placeholder.
          </p>
        </div>
      </div>
    </>
  );
}
