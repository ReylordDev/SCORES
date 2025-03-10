import { Button } from "./ui/button";
import { GraduationCap, Info, Moon, Settings, Undo } from "lucide-react";
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
import { Toaster } from "../components/ui/sonner";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "../components/ui/tooltip";

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

  if (settings !== null && settings.tutorialMode && index === 0) {
    toast(
      <div className="flex items-center gap-2">
        <GraduationCap size={20} className="text-accent" />
        Tutorial mode is enabled.
      </div>,
      {
        description: (
          <div className="flex items-center gap-2">
            You can disable it in the settings.
            <div className="flex items-center gap-0">
              (<Settings size={16} />)
            </div>
          </div>
        ),
        closeButton: true,
        duration: 8000,
      },
    );
  }

  return (
    <div
      id="titleBarContainer"
      className="absolute z-30 w-full bg-background text-text"
    >
      <div
        id="titleBar"
        className="draggable absolute top-0 flex h-full select-none items-center justify-between border-accent pl-8"
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              onClick={() => {
                window.state.resetRunId();
                localStorage.removeItem("runId");
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
          </TooltipTrigger>
          <TooltipContent className="ml-2 flex items-center gap-4">
            <Info className="size-6 shrink-0 text-accent" />
            <p>Return to the starting point (file selection)</p>
          </TooltipContent>
        </Tooltip>
        {index > 0 && index !== 4 ? (
          <Link
            to={`/${routes[index - 1] === "progress" ? routes[index - 2] : routes[index - 1]}`}
            className="no-drag cursor-default"
          >
            <Button variant="ghost">
              <Undo size={24} />
            </Button>
          </Link>
        ) : (
          <div className="cursor-default px-4 py-2 opacity-25">
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
            <Tooltip>
              <TooltipTrigger asChild>
                <DialogTrigger asChild>
                  <Button variant="ghost">
                    <Settings size={28} className="text-text" />
                  </Button>
                </DialogTrigger>
              </TooltipTrigger>
              <TooltipContent className="flex items-center gap-4">
                <Info className="size-6 shrink-0 text-accent" />
                <p>Open the settings menu</p>
              </TooltipContent>
            </Tooltip>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="text-3xl text-text">
                  Settings
                </DialogTitle>
                <DialogDescription></DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <p className="flex items-center gap-2 text-lg text-text">
                    <Moon size={24} />
                    Dark Mode
                  </p>
                  <Switch
                    checked={settings?.darkMode}
                    onCheckedChange={(checked) => {
                      window.settings.setDarkMode(checked);
                      setSettings({ ...settings, darkMode: checked });
                    }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <p className="flex items-center gap-2 text-lg text-text">
                    <GraduationCap size={24} />
                    Tutorial Mode
                  </p>
                  <Switch
                    checked={settings?.tutorialMode}
                    onCheckedChange={(checked) => {
                      window.settings.setTutorialMode(checked);
                      setSettings({ ...settings, tutorialMode: checked });
                    }}
                  />
                </div>
                <div className="mt-4 flex items-center justify-between border-t pt-4 text-sm text-muted-foreground">
                  <span>Made by Luis Klocke</span>
                  <Button
                    className="cursor-pointer hover:text-text"
                    variant="ghost"
                    onClick={() => {
                      window.electron.openUrl(
                        "https://github.com/ReylordDev/SCORES",
                      );
                    }}
                  >
                    View on GitHub
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <div></div>
        <Toaster
          position="top-right"
          offset={{
            top: "70px",
          }}
          toastOptions={{
            style: {
              background: "white",
              color: "var(--text)",
              border: "2px solid var(--accent)",
              borderRadius: "1rem",
              padding: "1rem",
              width: "auto",
            },
          }}
          visibleToasts={1}
        />
      </div>
    </div>
  );
}
