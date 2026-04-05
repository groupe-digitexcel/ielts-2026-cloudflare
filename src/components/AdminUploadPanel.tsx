import { useState } from "react";
import { uploadReferenceSet } from "../lib/api";

export default function AdminUploadPanel() {
  const [title, setTitle] = useState("");
  const [domain, setDomain] = useState("business");
  const [jsonText, setJsonText] = useState("");
  const [status, setStatus] = useState("");

  const handleUpload = async () => {
    try {
      const parsed = JSON.parse(jsonText);
      const result = await uploadReferenceSet({ title, domain, sections: parsed });
      setStatus(`Uploaded successfully. Reference Set ID: ${result.referenceSetId}`);
    } catch (err: any) {
      setStatus(`Upload failed: ${err.message}`);
    }
  };

  return (
    <div className="card">
      <h2 className="section-title">Admin Upload Reference Set</h2>

      <label className="label">Title</label>
      <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />

      <label className="label">Domain</label>
      <input className="input" value={domain} onChange={(e) => setDomain(e.target.value)} />

      <label className="label">Sections JSON</label>
      <textarea
        className="textarea"
        rows={12}
        value={jsonText}
        onChange={(e) => setJsonText(e.target.value)}
        placeholder='Paste JSON like {"listening": {...}, "reading": {...}, "writing": {...}, "speaking": {...}}'
      />

      <button className="btn success" onClick={handleUpload}>Upload Reference</button>

      {status && <p className="small" style={{ marginTop: 12 }}>{status}</p>}
    </div>
  );
}
