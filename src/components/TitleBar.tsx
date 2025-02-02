import { Settings, Undo } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";

const routes = [
  "",
  "file_preview",
  "algorithm_settings",
  "progress",
  "results",
];

export function TitleBar({
  index,
  resetState,
}: {
  index: number;
  resetState?: () => void;
}) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <div
      id="titleBarContainer"
      className="dark:dark absolute z-30 w-full bg-background text-text"
    >
      <div
        id="titleBar"
        className="draggable absolute top-0 flex h-full select-none items-center justify-between border-accent pl-8"
      >
        <Link to={"/"} className="no-drag flex">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="size-10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--background)"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle
              cx="7.2"
              cy="14.4"
              r="6"
              fill={
                index % 3 === 0
                  ? `var(--accent)`
                  : index % 3 === 1
                    ? `var(--primary)`
                    : `var(--secondary)`
              }
            />
            <circle
              cx="16.8"
              cy="14.4"
              r="6"
              fill={
                index % 3 === 0
                  ? `var(--secondary)`
                  : index % 3 === 1
                    ? `var(--accent)`
                    : `var(--primary)`
              }
            />
            <circle
              cx="12"
              cy="7.2"
              r="6"
              fill={
                index % 3 === 0
                  ? `var(--primary)`
                  : index % 3 === 1
                    ? `var(--secondary)`
                    : `var(--accent)`
              }
            />
          </svg>
        </Link>
        {index > 0 ? (
          <Link
            to={`/${routes[index - 1] === "progress" ? routes[index - 2] : routes[index - 1]}`}
            className="no-drag rounded p-1 hover:bg-background-50"
            onClick={resetState}
          >
            <Undo size={24} />
          </Link>
        ) : (
          <div className="rounded p-1 opacity-25">
            <Undo size={24} />
          </div>
        )}
        <div className="flex">
          <div className="flex flex-col">
            <p className="px-2">File Selection</p>
            {index >= 0 ? (
              <div className="mx-1 h-1 rounded bg-accent"></div>
            ) : (
              <div className="mx-1 h-1 rounded bg-accent opacity-25"></div>
            )}
          </div>
          <div className="flex flex-col">
            <p className="px-2">File Preview</p>
            {index >= 1 ? (
              <div className="mx-1 h-1 rounded bg-accent"></div>
            ) : (
              <div className="mx-1 h-1 rounded bg-accent opacity-25"></div>
            )}
          </div>
          <div className="flex flex-col">
            <p className="px-2">Algorithm Settings</p>
            {index >= 2 ? (
              <div className="mx-1 h-1 rounded bg-accent"></div>
            ) : (
              <div className="mx-1 h-1 rounded bg-accent opacity-25"></div>
            )}
          </div>
          <div className="flex flex-col">
            <p className="px-2">Progress</p>
            {index >= 3 ? (
              <div className="mx-1 h-1 rounded bg-accent"></div>
            ) : (
              <div className="mx-1 h-1 rounded bg-accent opacity-25"></div>
            )}
          </div>
          <div className="flex flex-col">
            <p className="px-2">Results</p>
            {index >= 4 ? (
              <div className="mx-1 h-1 rounded bg-accent"></div>
            ) : (
              <div className="mx-1 h-1 rounded bg-accent opacity-25"></div>
            )}
          </div>
        </div>
        <div id="settings" className="flex items-center">
          <button onClick={() => setIsSettingsOpen(true)}>
            <Settings size={28} />
          </button>
        </div>
        <div></div>
        {/* <div className="flex items-center gap-4">
          <button onClick={window.control.minimize}>
            <Minus size={28} />
          </button>
          <button onClick={window.control.maximize}>
            <Square size={28} />
          </button>
          <button onClick={window.control.close}>
            <X size={28} />
          </button>
        </div> */}
      </div>
    </div>
  );
}
