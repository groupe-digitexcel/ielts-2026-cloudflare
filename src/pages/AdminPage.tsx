import AdminUploadPanel from "../components/AdminUploadPanel";

export default function AdminPage() {
  return (
    <>
      <AdminUploadPanel />
      <div className="card">
        <h2 className="section-title">Admin Notes</h2>
        <p className="small">
          Upload structured reference exams to guide future AI-style generation. These become
          reference sets used to build new variants in line with your standard.
        </p>
      </div>
    </>
  );
}
