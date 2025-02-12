import { createRoot } from "react-dom/client";
import { MemoryRouter as Router, Routes, Route } from "react-router";
import FileSelection from "./pages/FileSelection";
import FilePreview from "./pages/FilePreview";
import AlgorithmSettings from "./pages/AlgorithmSettings";
import Progress from "./pages/Progress";
import Results from "./pages/Results";
import ClusterAssignments from "./pages/ClusterAssignments";
import ClusterSimilarities from "./pages/ClusterSimilarities";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<FileSelection />} />
        <Route path="/file_preview" element={<FilePreview />} />
        <Route path="/algorithm_settings" element={<AlgorithmSettings />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/results" element={<Results />} />
        <Route path="/cluster_assignments" element={<ClusterAssignments />} />
        <Route path="/cluster_similarities" element={<ClusterSimilarities />} />
      </Routes>
    </Router>
  );
};

const root = createRoot(document.getElementById("root") as HTMLElement);
root.render(<App />);
