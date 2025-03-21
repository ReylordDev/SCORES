import { createRoot } from "react-dom/client";

const App = () => {
  return (
    <div className="h-screen w-screen flex items-center justify-center bg-background draggable">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin-slow size-44">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#f9f4fd"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="7.2" cy="14.4" r="6" fill="#e15a84" />
            <circle cx="16.8" cy="14.4" r="6" fill="#e986c6" />
            <circle cx="12" cy="7.2" r="6" fill="#932dd8" />
          </svg>
        </div>
        <p className="text-text text-xl">Initializing...</p>
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById("root") as HTMLElement);
root.render(<App />);
