import { createRoot } from "react-dom/client";
import { MemoryRouter as Router, Routes, Route } from "react-router";
import FileSelection from "./pages/FileSelection";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<FileSelection />} />
        <Route path="/file_preview" element={<div>Hello World</div>} />
      </Routes>
    </Router>
  );
};

const root = createRoot(document.getElementById("root") as HTMLElement);
root.render(<App />);
