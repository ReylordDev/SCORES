import { useNavigate } from "react-router";
import { TitleBar } from "../../components/TitleBar";
import {
  Clock,
  Pencil,
  Save,
  Check,
  ChevronUp,
  ChevronDown,
  FileText,
  List,
  GitCompare,
  AlertTriangle,
  GitMerge,
  CheckCheck,
  FolderOpen,
  Play,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { useState, useEffect } from "react";
import { formatTime } from "../../lib/utils";
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
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";

import { TooltipWrapper } from "../../components/Tooltip";
import { Run } from "../../lib/models";

interface TimeStamp {
  name: string;
  time: number;
}

function TotalTimeDropdown({ path }: { path: string }) {
  const [open, setOpen] = useState(false);
  const [timeStamps, setTimeStamps] = useState<TimeStamp[]>([]);

  // useEffect(() => {
  //   window.python
  //     .readJsonFile(path)
  //     .then((data) => {
  //       const obj = data as { timeStamps: TimeStamp[] };
  //       setTimeStamps(obj.timeStamps);
  //     })
  //     .catch((err) => {
  //       console.error(err);
  //     });
  // }, [path]);

  console.log(timeStamps);

  if (!timeStamps || timeStamps.length === 0) {
    return null;
  }

  return (
    <div className="flex w-full flex-col items-center justify-start">
      <Button
        className="w-2/3"
        onClick={() => {
          console.log("Open Total Time");
          setOpen(!open);
        }}
      >
        {<Clock />}
        {`Total Time: ${formatTime(
          Math.floor(
            timeStamps[timeStamps.length - 1].time - timeStamps[0].time
          )
        )}`}
        {open ? <ChevronUp /> : <ChevronDown />}
      </Button>
      {open && (
        <div className="flex w-full flex-col gap-2 p-4">
          {timeStamps.map((step, index) => {
            if (index === 0) {
              return null;
            }
            return (
              <div key={index} className="flex w-full justify-between">
                <div className="flex items-center gap-2">
                  <Check
                    className="rounded bg-accent text-background"
                    size={20}
                  />
                  {step.name}
                </div>
                <div className="flex min-w-28 items-center justify-start gap-2">
                  <Clock size={20} />
                  {formatTime(
                    Math.floor(step.time - timeStamps[index - 1].time)
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Results() {
  const [run, setRun] = useState<Run | undefined>(undefined);
  const [runName, setRunName] = useState<string | undefined>(undefined);
  const [resultsDir, setResultsDir] = useState<string | undefined>(undefined);
  const [runNameInput, setRunNameInput] = useState<string | undefined>(
    undefined
  );
  const [editingRunName, setEditingRunName] = useState(false);
  const [showInputError, setShowInputError] = useState(false);
  const navigate = useNavigate();

  const updateRunName = (newName: string) => {
    window.database.updateRunName(run.id, newName);
    setRunName(newName);
  };

  window.database.onReceiveCurrentRun((run) => {
    setRun(run);
    setRunName(run.name);
  });

  useEffect(() => {
    window.database.requestCurrentRun();
  }, []);

  // useEffect(() => {
  //   window.python
  //     .getRunName()
  //     .then((runName) => {
  //       console.log(`Run name: ${runName}`);
  //       setRunName(runName);
  //     })
  //     .catch((err) => {
  //       console.error(err);
  //     });
  // }, [resultsDir]);

  // useEffect(() => {
  //   if (!resultsDir) return;
  //   try {
  //     window.python
  //       .readJsonFile(`${resultsDir}/args.json`)
  //       .then((args) => {
  //         console.log(args);
  //         setArgs(args as Args);
  //       })
  //       .catch((err) => {
  //         console.error(err);
  //       });
  //   } catch (err) {
  //     console.error(err);
  //   }
  // }, [resultsDir]);

  // This part should probably just redirect to file selection
  // if (!args || !resultsDir) {
  //   return (
  //     <>
  //       <TitleBar index={4} />
  //       <div
  //         id="mainContent"
  //         className="dark:dark flex flex-col items-center justify-start gap-4 bg-background px-24 xl:gap-8 xl:px-32 xl:pb-8"
  //       >
  //         <div className="mt-24 flex w-full justify-center p-8">
  //           <h1 className="text-4xl">No Run Selected</h1>
  //         </div>
  //       </div>
  //     </>
  //   );
  // }

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
            {showInputError && (
              <p className="text-red-500">Input is not a valid file name</p>
            )}
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
                <DropdownMenuContent className="">
                  <DropdownMenuItem className="text-lg">
                    Select New File
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-lg">
                    Change Algorithm Settings
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="grid gap-8 grid-cols-2">
              <Card className="w-96">
                <CardHeader>
                  <CardTitle>Cluster Assignments</CardTitle>
                  <CardDescription>
                    See which responses were grouped together
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => console.log("Open Cluster Assignments")}
                  >
                    <List />
                    Open Cluster Assignments
                  </Button>
                  {/* <p>Card Content</p> */}
                </CardContent>
                {/* <CardFooter>
                <p>Card Footer</p>
              </CardFooter> */}
              </Card>
              <Card className="w-96">
                <CardHeader>
                  <CardTitle>Cluster Similarities</CardTitle>
                  <CardDescription>
                    Compare the similarities between clusters
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => console.log("Open Cluster Similarities")}
                  >
                    <GitCompare />
                    Open Cluster Similarities
                  </Button>
                </CardContent>
              </Card>
              <Card className="w-96">
                <CardHeader>
                  <CardTitle>Outliers</CardTitle>
                  <CardDescription>
                    Identify responses that don't fit into any cluster
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => console.log("Open Outliers")}>
                    <AlertTriangle />
                    Open Outliers
                  </Button>
                </CardContent>
              </Card>
              <Card className="w-96">
                <CardHeader>
                  <CardTitle>Cluster Mergers</CardTitle>
                  <CardDescription>
                    See which clusters were merged together
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => console.log("Open Mergers")}>
                    <GitMerge />
                    Open Cluster Mergers
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
