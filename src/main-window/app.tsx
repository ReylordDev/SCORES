import { createRoot } from "react-dom/client";
import { MemoryRouter as Router, Routes, Route } from "react-router";
import FileSelection from "./pages/FileSelection";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<FileSelection />} />
      </Routes>
    </Router>
  );
};

const root = createRoot(document.getElementById("root") as HTMLElement);
root.render(<App />);
