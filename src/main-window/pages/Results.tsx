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

import { TooltipWrapper } from "../../components/Tooltip";
import { progressionMessages, Run, Timesteps } from "../../lib/models";
import { Progress } from "../../components/ui/progress";

export default function Results() {
  const [run, setRun] = useState<Run | null>(null);
  const [timesteps, setTimesteps] = useState<Timesteps | null>(null);
  const [runName, setRunName] = useState<string | null>(null);
  const [runNameInput, setRunNameInput] = useState<string | null>(null);
  const [editingRunName, setEditingRunName] = useState(false);
  const navigate = useNavigate();

  const updateRunName = (newName: string) => {
    window.database.updateRunName(run.id, newName);
    setRunName(newName);
  };

  const handleNewRun = useCallback(
    (action: "new_file" | "change_settings") => {
      if (action === "new_file") {
        window.state.resetRunId();
        navigate("/");
      } else {
        window.state.setRunId(run.id);
        navigate("/algorithm_settings");
      }
    },
    [navigate, run?.id]
  );

  useEffect(() => {
    console.log("Subscribing to current run");
    const unsubscribe = window.database.onReceiveCurrentRun(
      ({ run, timesteps }) => {
        console.log("Received current run", run);
        setRun(run);
        setRunName(run.name);
        setTimesteps(timesteps);
      }
    );
    return () => {
      unsubscribe(); // Assuming the subscription returns a cleanup function
    };
  }, []);

  useEffect(() => {
    console.log("Requesting current run");
    window.database.requestCurrentRun();
  }, []);

  if (!run) {
    return <div>Loading</div>;
  }

  return (
    <div className="w-screen h-screen">
      <TitleBar index={4} />
      <div
        id="mainContent"
        className="dark:dark flex flex-col bg-background px-32 pt-6 pb-8 gap-8 text-text"
      >
        <div className="flex flex-col">
          <div className="flex w-full flex-col justify-start gap-2">
            <div className="flex w-full items-center gap-4">
              {editingRunName ? (
                <input
                  value={runNameInput}
                  onChange={(e) => setRunNameInput(e.target.value)}
                  className="rounded-md border border-secondary p-2 pl-5 text-4xl font-bold focus:outline-none focus:ring focus:ring-secondary focus:ring-opacity-50 disabled:border-gray-300"
                />
              ) : (
                <h1 className="text-ellipsis p-2 pl-5 text-4xl">{runName}</h1>
              )}
              {editingRunName ? (
                <Button
                  onClick={() => {
                    if (!runNameInput) return;
                    if (runNameInput === runName) {
                      setEditingRunName(false);
                      return;
                    }
                    updateRunName(runNameInput);
                    setEditingRunName(false);
                  }}
                >
                  <Save className="text-secondary" size={32} />
                </Button>
              ) : (
                <TooltipWrapper
                  placement="bottom"
                  small
                  wrappedContent={
                    <button
                      onClick={() => {
                        setEditingRunName(true);
                        setRunNameInput(runName);
                      }}
                    >
                      <Pencil className="text-secondary" size={32} />
                    </button>
                  }
                  tooltipContent={
                    <p className="text-left">
                      Click to edit the name of the run.
                    </p>
                  }
                />
              )}
            </div>
            <div className="flex items-center gap-2 pb-4 pl-5 text-accent">
              <CheckCheck className="rounded bg-background" size={24} />
              <p className="text-xl font-semibold">
                Your results have been saved.
              </p>
            </div>
          </div>
          <div className="flex flex-col items-center justify-start gap-8 xl:gap-12">
            <div className="flex gap-8 w-full justify-start">
              <TooltipWrapper
                wrappedContent={
                  <Button
                    onClick={() =>
                      window.electron.showItemInFolder(run.output_file_path)
                    }
                  >
                    <FolderOpen />
                    Open Output Location
                  </Button>
                }
                tooltipContent={
                  <p className="text-left">
                    Click to show the results directory in the file explorer.
                  </p>
                }
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button>
                    <Play />
                    New Run
                    <ChevronDown />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem
                    className="text-lg"
                    onClick={() => handleNewRun("new_file")}
                  >
                    Select New File
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-lg"
                    onClick={() => handleNewRun("change_settings")}
                  >
                    Change Algorithm Settings
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="grid gap-8 grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Cluster Assignments</CardTitle>
                  <CardDescription>
                    See which responses were grouped together
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => navigate("/cluster_assignments")}>
                    <List />
                    Open Cluster Assignments
                  </Button>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Cluster Similarities</CardTitle>
                  <CardDescription>
                    Compare the similarities between clusters
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => navigate("/cluster_similarities")}>
                    <GitCompare />
                    Open Cluster Similarities
                  </Button>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Outliers</CardTitle>
                  <CardDescription>
                    Identify responses that don't fit into any cluster
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => navigate("/outliers")}>
                    <AlertTriangle />
                    Open Outliers
                  </Button>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Cluster Mergers</CardTitle>
                  <CardDescription>
                    See which clusters were merged together
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => navigate("/mergers")}>
                    <GitMerge />
                    Open Cluster Mergers
                  </Button>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Run Duration</CardTitle>
                  <CardDescription>
                    Total Duration: {formatTime(timesteps.total_duration)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {iterateRecord(timesteps.steps).map(
                    ([step, timestamp], index) => {
                      if (step !== "start")
                        return (
                          <div key={step} className="flex flex-col">
                            <div className="flex justify-between">
                              <p>{progressionMessages[step]}</p>
                              <p>
                                {formatTime(
                                  timestamp -
                                    iterateRecord(timesteps.steps)[index - 1][1]
                                )}
                              </p>
                            </div>
                            <Progress
                              value={
                                ((timestamp -
                                  iterateRecord(timesteps.steps)[
                                    index - 1
                                  ][1]) *
                                  100) /
                                timesteps.total_duration
                              }
                              max={timesteps.total_duration}
                            />
                          </div>
                        );
                    }
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
