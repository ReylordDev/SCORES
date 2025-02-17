import { createRoot } from "react-dom/client";
import { scan } from "react-scan";
import { MemoryRouter as Router, Routes, Route } from "react-router";
import FileSelection from "./pages/FileSelection";
import FilePreview from "./pages/FilePreview";
import AlgorithmSettings from "./pages/AlgorithmSettings";
import Progress from "./pages/Progress";
import Results from "./pages/Results";
import ClusterAssignments from "./pages/ClusterAssignments";
import ClusterSimilarities from "./pages/ClusterSimilarities";
import Outliers from "./pages/Outliers";
import Mergers from "./pages/Mergers";
import { useEffect, useState } from "react";
import { AppSettings } from "../lib/models";
import ClusterVisualization from "./pages/ClusterVisualization";

scan({
  enabled: true,
});

const App = () => {
  const [settings, setSettings] = useState<AppSettings | null>(null);

  useEffect(() => {
    window.settings.getAll().then((settings) => {
      setSettings(settings);
      console.log("settings", settings);
    });
  }, []);

  useEffect(() => {
    const unsubscribe = window.settings.onSettingsChanged((settings) => {
      setSettings(settings);
      console.log("settings changed", settings);
    });

    return () => unsubscribe();
  }, []);

  if (!settings) {
    return <div>Loading...</div>;
  }

  if (settings.darkMode) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }

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
        <Route path="/outliers" element={<Outliers />} />
        <Route path="/mergers" element={<Mergers />} />
        <Route
          path="/cluster_visualization"
          element={<ClusterVisualization />}
        />
      </Routes>
    </Router>
  );
};

const root = createRoot(document.getElementById("root") as HTMLElement);
root.render(<App />);
