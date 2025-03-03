import { createRoot } from "react-dom/client";
import { DownloadManager } from "../download-window/DownloadManager";
import { scan } from "react-scan";

scan({
  enabled: true,
});

const App = () => {
  return (
    <div className="h-screen w-screen text-text select-none">
      <DownloadManager />
    </div>
  );
};

const root = createRoot(document.getElementById("root") as HTMLElement);
root.render(<App />);
