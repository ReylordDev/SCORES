import { Button } from "./ui/button";
import { Settings, Undo } from "lucide-react";
import { Link, useNavigate } from "react-router";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Switch } from "./ui/switch";
import { AppSettings } from "../lib/models";
import { useEffect, useState } from "react";

const routes = [
  "",
  "file_preview",
  "algorithm_settings",
  "progress",
  "results",
  "result_details",
];

export function TitleBar({ index }: { index: number }) {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    window.settings.getAll().then((settings) => {
      setSettings(settings);
    });
  }, []);

  return (
    <div
      id="titleBarContainer"
      className="absolute z-30 w-full bg-background text-text"
    >
      <div
        id="titleBar"
        className="draggable absolute top-0 flex h-full select-none items-center justify-between border-accent pl-8"
      >
        <Button
          variant="ghost"
          onClick={() => {
            window.state.resetRunId();
            navigate("/");
          }}
          className="no-drag flex"
        >
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
        </Button>
        {index > 0 && index !== 4 ? (
          <Link
            to={`/${routes[index - 1] === "progress" ? routes[index - 2] : routes[index - 1]}`}
            className="no-drag rounded p-1 hover:bg-background-50"
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
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost">
                <Settings size={28} className="text-text" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="text-text text-3xl">
                  Settings
                </DialogTitle>
                <DialogDescription></DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <p className="text-text">Dark Mode</p>
                  <Switch
                    checked={settings?.darkMode}
                    onCheckedChange={(checked) => {
                      window.settings.setDarkMode(checked);
                      setSettings({ ...settings, darkMode: checked });
                    }}
                  />
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <div></div>
      </div>
    </div>
  );
}
