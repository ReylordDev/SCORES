import { useNavigate } from "react-router";
import { TitleBar } from "../../components/TitleBar";
import {
  Pencil,
  Save,
  ChevronDown,
  List,
  GitCompare,
  AlertTriangle,
  GitMerge,
  CheckCheck,
  FolderOpen,
  Play,
  Loader,
  Eye,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { useState, useEffect, useCallback } from "react";
import { formatTime, iterateRecord } from "../../lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";

import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "../../components/ui/tooltip";
import {
  AlgorithmSettings,
  progressionMessages,
  Run,
  Timesteps,
} from "../../lib/models";
import { Progress } from "../../components/ui/progress";
import { Input } from "../../components/ui/input";

export default function Results() {
  const [run, setRun] = useState<Run | null>(null);
  const [timesteps, setTimesteps] = useState<Timesteps | null>(null);
  const [algorithmSettings, setAlgorithmSettings] =
    useState<AlgorithmSettings | null>(null);
  const [runNameInput, setRunNameInput] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isValidRunName, setIsValidRunName] = useState(false);
  const navigate = useNavigate();

  function validateRunName(newName: string) {
    if (!newName) return false;
    if (newName.length > 255) return false;
    return true;
  }

  const updateRunName = (newName: string) => {
    if (!isValidRunName) return;
    window.database.updateRunName(run.id, newName);
    setIsEditing(false);
  };

  const handleNewRun = useCallback(
    (action: "new_file" | "change_settings") => {
      if (action === "new_file") {
        window.state.resetRunId();
        localStorage.removeItem("runId");
        navigate("/");
      } else {
        window.state.setRunId(run.id);
        localStorage.setItem("runId", run.id);
        navigate("/algorithm_settings", {
          state: {
            runId: run.id,
          },
        });
      }
    },
    [navigate, run?.id],
  );

  useEffect(() => {
    console.log("Subscribing to current run");
    const unsubscribe = window.database.onReceiveCurrentRun(
      ({ run, timesteps }) => {
        console.log("Received current run", run);
        setRun(run);
        setRunNameInput(run.name);

        setTimesteps(timesteps);

        const algorithm_settings = JSON.parse(run.algorithm_settings);
        setAlgorithmSettings(algorithm_settings);
      },
    );
    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    console.log("Requesting current run");
    window.database.requestCurrentRun();
  }, []);

  if (!run) {
    return (
      <div className="h-screen w-screen bg-background text-text">
        <TitleBar index={4} />
        <div className="flex h-full flex-col items-center justify-center">
          <Loader className="animate-spin" size={64} />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen">
      <TitleBar index={4} />
      <div
        id="mainContent"
        className="dark:dark flex select-none flex-col gap-8 bg-background px-32 pb-8 pt-6 text-text"
      >
        <div className="flex flex-col gap-8">
          <div className="flex w-full justify-between gap-2">
            <div className="flex flex-col gap-2">
              <div className="flex w-full items-center gap-4">
                {isEditing ? (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-4"
                  >
                    <Input
                      value={runNameInput}
                      onChange={(e) => {
                        setRunNameInput(e.target.value);
                        setIsValidRunName(validateRunName(e.target.value));
                      }}
                      className="min-w-[500px] text-3xl"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") updateRunName(runNameInput);
                        if (e.key === "Escape") {
                          setRunNameInput(run.name);
                          setIsEditing(false);
                        }
                      }}
                    />
                    <Button
                      onClick={() => updateRunName(runNameInput)}
                      disabled={!isValidRunName}
                    >
                      <Save className="text-white" size={24} />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <h1 className="text-4xl">{runNameInput}</h1>
                    <Button
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsEditing(true);
                      }}
                    >
                      <Pencil className="text-secondary" size={28} />
                    </Button>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 pb-4 pl-5 text-accent">
                <CheckCheck className="rounded bg-background" size={24} />
                <p className="text-xl font-semibold">
                  Your results have been saved.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() =>
                      window.electron.showItemInFolder(run.output_file_path)
                    }
                  >
                    <FolderOpen />
                    Open Output Location
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <div className="flex flex-col gap-2 text-start">
                    <p>
                      Click to show the results directory in the file explorer.
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button>
                        <Play />
                        New Run
                        <ChevronDown />
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="left">
                    <p>Click to show the options for starting a new run.</p>
                  </TooltipContent>
                </Tooltip>
                <DropdownMenuContent>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuItem
                        className="w-full text-lg"
                        onClick={() => handleNewRun("new_file")}
                      >
                        Select New File
                      </DropdownMenuItem>
                    </TooltipTrigger>
                    <TooltipContent side="left">
                      <div className="flex flex-col gap-2 text-start">
                        <p>Start a new run with a different file.</p>
                        <p>
                          This will reset the current run and all its settings.
                        </p>
                        <p>Returns to the file selection screen.</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                  <DropdownMenuSeparator />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuItem
                        className="text-lg"
                        onClick={() => handleNewRun("change_settings")}
                      >
                        Change Algorithm Settings
                      </DropdownMenuItem>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="w-[440px]">
                      <div className="flex flex-col gap-2 text-start">
                        <p>
                          Do a re-run of the current file with different
                          algorithm settings.
                        </p>
                        <p>
                          Because the embeddings are already calculated, this
                          will be much faster (Unless you change the embedding
                          model).
                        </p>
                        <p>Returns to the algorithm settings.</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div className="flex h-full w-full justify-between gap-8">
            <div className="grid grid-cols-2 gap-8">
              <ResultsCard
                title="Cluster Assignments"
                description="See which responses were grouped together"
                onClick={() => navigate("/cluster_assignments")}
                icon={<List />}
              />
              <ResultsCard
                title="Cluster Similarities"
                description="Compare the similarities between clusters"
                onClick={() => navigate("/cluster_similarities")}
                icon={<GitCompare />}
              />
              {algorithmSettings.outlier_detection && (
                <ResultsCard
                  title="Outliers"
                  description="Identify responses that don't fit into any cluster"
                  onClick={() => navigate("/outliers")}
                  icon={<AlertTriangle />}
                />
              )}
              {algorithmSettings.agglomerative_clustering && (
                <ResultsCard
                  title="Cluster Mergers"
                  description="See which clusters were merged together"
                  onClick={() => navigate("/mergers")}
                  icon={<GitMerge />}
                />
              )}
              <ResultsCard
                title="Cluster Visualization"
                description="Visualize the clusters"
                onClick={() => navigate("/cluster_visualization")}
                icon={<Eye />}
              />
              {algorithmSettings.method.cluster_count_method === "auto" && (
                <ResultsCard
                  title="Cluster Count Visualization"
                  description="Visualize the cluster count selection process"
                  onClick={() => navigate("/k_selection")}
                  icon={<Eye />}
                />
              )}
            </div>
            <Card className="h-full w-1/3">
              <CardHeader>
                <CardTitle>Run Duration</CardTitle>
                <CardDescription>
                  Total Duration: {formatTime(timesteps.total_duration, true)}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {iterateRecord(timesteps.steps).map(
                  ([step, timestamp], index) => {
                    if (step !== "start")
                      return (
                        <div key={step} className="flex flex-col gap-2">
                          <div className="flex justify-between">
                            <p>{progressionMessages[step]}</p>
                            <p>
                              {formatTime(
                                timestamp -
                                  iterateRecord(timesteps.steps)[index - 1][1],
                                true,
                              )}
                            </p>
                          </div>
                          <Progress
                            value={
                              ((timestamp -
                                iterateRecord(timesteps.steps)[index - 1][1]) *
                                100) /
                              timesteps.total_duration
                            }
                            max={timesteps.total_duration}
                          />
                        </div>
                      );
                  },
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function ResultsCard({
  title,
  description,
  onClick,
  icon,
}: {
  title: string;
  description: string;
  onClick: () => void;
  icon: React.ReactNode;
}) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription className="h-8">{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex h-full flex-col items-center justify-end">
        <Button onClick={onClick}>
          {icon}
          {title}
        </Button>
      </CardContent>
    </Card>
  );
}
