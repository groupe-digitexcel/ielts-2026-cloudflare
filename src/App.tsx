import { useState } from "react";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import SimulatorPage from "./pages/SimulatorPage";
import ResultsPage from "./pages/ResultsPage";
import AdminPage from "./pages/AdminPage";
import ReferenceLibraryPage from "./pages/ReferenceLibraryPage";
import { ExamData, AttemptResult } from "./lib/types";

type Page = "home" | "simulator" | "results" | "admin" | "references";

export default function App() {
  const [page, setPage] = useState<Page>("home");
  const [currentExam, setCurrentExam] = useState<ExamData | null>(null);
  const [lastResult, setLastResult] = useState<AttemptResult | null>(null);

  return (
    <div className="app-shell">
      <Navbar currentPage={page} onNavigate={setPage} />
      <main className="container">
        {page === "home" && <HomePage onStart={() => setPage("simulator")} />}
        {page === "simulator" && (
          <SimulatorPage
            currentExam={currentExam}
            setCurrentExam={setCurrentExam}
            setLastResult={setLastResult}
            onShowResults={() => setPage("results")}
          />
        )}
        {page === "results" && <ResultsPage result={lastResult} />}
        {page === "admin" && <AdminPage />}
        {page === "references" && <ReferenceLibraryPage />}
      </main>
    </div>
  );
}
