type Props = {
  currentPage: string;
  onNavigate: (page: any) => void;
};

export default function Navbar({ currentPage, onNavigate }: Props) {
  const pages = [
    ["home", "Home"],
    ["simulator", "Simulator"],
    ["results", "Results"],
    ["references", "References"],
    ["admin", "Admin"]
  ];

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <div className="brand">IELTS 2026 AI Simulator</div>
        <div className="nav-links">
          {pages.map(([key, label]) => (
            <button
              key={key}
              className={`nav-btn ${currentPage === key ? "active" : ""}`}
              onClick={() => onNavigate(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
