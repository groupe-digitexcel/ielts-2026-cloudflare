type Props = {
  items: any[];
};

export default function ReferenceList({ items }: Props) {
  return (
    <div className="card">
      <h2 className="section-title">Reference Library</h2>
      {items.length === 0 ? (
        <p className="small">No references found.</p>
      ) : (
        items.map((item) => (
          <div className="question" key={item.id}>
            <strong>{item.title}</strong>
            <div className="small">Domain: {item.domain}</div>
            <div className="small">Source: {item.source_type}</div>
            <div className="small">Created: {item.created_at}</div>
          </div>
        ))
      )}
    </div>
  );
}
