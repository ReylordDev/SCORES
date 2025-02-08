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
} from "lucide-react";
import { Button } from "../../components/ui/button";
// import ExpandableButton from "./ExpandableButton";
import { useState, useEffect } from "react";
import { formatTime } from "../../lib/utils";
// import { Args } from "../models";

// import ClusterAssignmentModal from "./ClusterAssignmentModal";
// import ClusterSimilarityModal from "./ClusterSimilaritiesModal";
// import OutliersModal from "./OutliersModal";
// import MergedClustersModal from "./MergedClustersModal";
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

const isValidFileName = (name: string) => {
  const condition =
    name.length > 0 &&
    !name.includes("/") &&
    !name.includes("\\") &&
    !name.includes(":") &&
    !name.includes("*") &&
    !name.includes("?") &&
    !name.includes('"') &&
    !name.includes("<") &&
    !name.includes(">") &&
    !name.includes("|");
  return condition;
};

export default function Results() {
  const [run, setRun] = useState<Run | undefined>(undefined);
  const [resultsDir, setResultsDir] = useState<string | undefined>(undefined);
  const [runNameInput, setRunNameInput] = useState<string | undefined>(
    undefined
  );
  const [editingRunName, setEditingRunName] = useState(false);
  const [showInputError, setShowInputError] = useState(false);
  const [clusterAssignmentsModalOpen, setClusterAssignmentsModalOpen] =
    useState(false);
  const [clusterSimilarityModalOpen, setClusterSimilarityModalOpen] =
    useState(false);
  const [outliersModalOpen, setOutliersModalOpen] = useState(false);
  const [mergedClustersModalOpen, setMergedClustersModalOpen] = useState(false);

  const navigate = useNavigate();
  const anyModalOpen =
    outliersModalOpen ||
    mergedClustersModalOpen ||
    clusterSimilarityModalOpen ||
    clusterAssignmentsModalOpen;

  const updateRunName = (newName: string) => {
    // Todo: Implement this
    console.log(`Updating run name to ${newName}`);
  };

  window.database.onReceiveCurrentRun((run) => {
    setRun(run);
  });

  useEffect(() => {
    window.database.requestCurrentRun();
  }, []);

  // useEffect(() => {
  //   window.python
  //     .getResultsDir()
  //     .then((resultsDir) => {
  //       console.log(`Results dir: ${resultsDir}`);
  //       setResultsDir(resultsDir);
  //     })
  //     .catch((err) => {
  //       console.error(err);
  //     });
  // }, []);

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
    <>
      <TitleBar index={4} />
      <div
        id="mainContent"
        className="dark:dark flex flex-col bg-background px-24 pt-6 text-text xl:gap-8 xl:px-32 xl:pb-8"
      >
        {/* <ClusterAssignmentModal
          path={`${resultsDir}/cluster_assignments.csv`}
          delimiter={args.fileSettings.delimiter}
          isOpen={clusterAssignmentsModalOpen}
          setIsOpen={setClusterAssignmentsModalOpen}
        />
        <ClusterSimilarityModal
          similaritiesPath={`${resultsDir}/pairwise_similarities.json`}
          clusterAssignmentsPath={`${resultsDir}/cluster_assignments.csv`}
          delimiter={args.fileSettings.delimiter}
          isOpen={clusterSimilarityModalOpen}
          setIsOpen={setClusterSimilarityModalOpen}
        /> */}
        {/* {args.algorithmSettings.advancedOptions.nearestNeighbors &&
          args.algorithmSettings.advancedOptions.zScoreThreshold && (
            <OutliersModal
              path={`${resultsDir}/outliers.json`}
              nearestNeighbors={
                args.algorithmSettings.advancedOptions.nearestNeighbors
              }
              zScoreThreshold={
                args.algorithmSettings.advancedOptions.zScoreThreshold
              }
              isOpen={outliersModalOpen}
              setIsOpen={setOutliersModalOpen}
            />
          )}
        {args.algorithmSettings.advancedOptions.similarityThreshold && (
          <MergedClustersModal
            path={`${resultsDir}/merged_clusters.json`}
            mergeThreshold={
              args.algorithmSettings.advancedOptions.similarityThreshold
            }
            isOpen={mergedClustersModalOpen}
            setIsOpen={setMergedClustersModalOpen}
          />
        )} */}
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
                <h1 className="text-ellipsis p-2 pl-5 text-4xl">{run.name}</h1>
              )}
              {editingRunName ? (
                <Button
                  onClick={() => {
                    if (!runNameInput) return;
                    if (runNameInput === run.name) {
                      setEditingRunName(false);
                      return;
                    }
                    if (!isValidFileName(runNameInput)) {
                      setShowInputError(true);
                      return;
                    }
                    // window.python.setRunName(runNameInput);
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
                        setRunNameInput(run.name);
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
          <div className="mt-4 flex justify-between">
            <div className="flex w-1/2 flex-col items-center justify-start gap-8 xl:gap-12">
              <TooltipWrapper
                wrappedContent={
                  <Button
                    // onClick={() => window.python.showItemInFolder(resultsDir)}
                    className="w-2/3"
                  >
                    <FileText />
                    Results Directory
                  </Button>
                }
                tooltipContent={
                  <p className="text-left">
                    Click to show the results directory in the file explorer.
                  </p>
                }
              />
              <TooltipWrapper
                wrappedContent={
                  <div className="w-2/3">
                    <Button
                      onClick={() => setClusterAssignmentsModalOpen(true)}
                      className="w-full"
                    >
                      <List />
                      Cluster Assignments
                    </Button>
                  </div>
                }
                tooltipContent={
                  <p className="text-left">
                    Click to view the created clusters and their assigned
                    responses.
                  </p>
                }
              />
              <TooltipWrapper
                wrappedContent={
                  <div className="w-2/3">
                    <Button
                      onClick={() => setClusterSimilarityModalOpen(true)}
                      className="w-full"
                    >
                      <GitCompare />
                      Cluster Similarities
                    </Button>
                  </div>
                }
                tooltipContent={
                  <p className="text-left">
                    Click to view the similarities between clusters.
                  </p>
                }
              />
              <TooltipWrapper
                wrappedContent={
                  <div className="w-2/3">
                    <Button
                      onClick={() => setOutliersModalOpen(true)}
                      className="w-full"
                      // disabled={
                      //   !args.algorithmSettings.advancedOptions
                      //     .nearestNeighbors ||
                      //   !args.algorithmSettings.advancedOptions.zScoreThreshold
                      // }
                    >
                      <AlertTriangle />
                      Outliers
                    </Button>
                  </div>
                }
                tooltipContent={
                  <p className="text-left">
                    Click to view the outliers in the data that were excluded
                    from the clusters.
                  </p>
                }
              />
              <TooltipWrapper
                wrappedContent={
                  <div className="w-2/3">
                    <Button
                      onClick={() => setMergedClustersModalOpen(true)}
                      className="w-full"
                      // disabled={
                      //   !args.algorithmSettings.advancedOptions
                      //     .similarityThreshold
                      // }
                    >
                      <GitMerge />
                      Merged Clusters
                    </Button>
                  </div>
                }
                tooltipContent={
                  <p className="text-left">
                    Click to view the clusters that were merged during the
                    agglomerative clustering process.
                  </p>
                }
              />
            </div>
            <div className="flex w-2/3 flex-col items-center justify-start gap-8 xl:gap-12">
              {/* <ExpandableButton
                text="Start a new run"
                option1="Change the algorithm settings"
                onClick1={() => {
                  window.python.resetClusterProgress();
                  navigate("/algorithm_settings");
                }}
                option2="Select a new input file"
                onClick2={() => {
                  window.python.resetClusterProgress();
                  resetFileSettings();
                  resetAlgorithmSettings();
                  navigate("/");
                }}
              /> */}
              <Button
                onClick={() => {
                  // window.python.resetClusterProgress();
                  navigate("/algorithm_settings");
                }}
              >
                Change the algorithm settings
              </Button>
              <TotalTimeDropdown path={`${resultsDir}/timestamps.json`} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
