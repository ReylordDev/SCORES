import { useNavigate } from "react-router";
import { TitleBar } from "../../components/TitleBar";
import { useState, useEffect } from "react";
import { Switch } from "../../components/ui/switch";
import { Button } from "../../components/ui/button";
import { SquarePen, ChartScatter } from "lucide-react";
import { TooltipWrapper } from "../../components/Tooltip";
import { Input } from "../../components/ui/input";
import {
  ClusterCount,
  AlgorithmSettings as AlgorithmSettingsType,
} from "../../lib/models";

export default function AlgorithmSettings() {
  const [autoChooseClusters, setAutoChooseClusters] = useState(true);
  const [clusterCount, setClusterCount] = useState<number | null>(null);
  const [maxClusters, setMaxClusters] = useState<number | null>(null);
  const [seed, setSeed] = useState<number | null>(null);
  const [excludedWords, setExcludedWords] = useState<string[]>([]);

  const [isExcludedWordsEditorOpen, setIsExcludedWordsEditorOpen] =
    useState(false);
  const [isAdvancedOptionsEditorOpen, setIsAdvancedOptionsEditorOpen] =
    useState(false);
  const navigate = useNavigate();
  const anyModalOpen = isExcludedWordsEditorOpen || isAdvancedOptionsEditorOpen;
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  useEffect(() => {
    const unsubscribe = window.database.onReceiveCurrentRun(({ run }) => {
      if (run) {
        // Parse the stored algorithm settings
        const settings = JSON.parse(
          run.algorithm_settings
        ) as AlgorithmSettingsType;

        // Update state based on the loaded settings
        if (settings.method.cluster_count_method === "auto") {
          setAutoChooseClusters(true);
          setMaxClusters(settings.method.max_clusters);
          setClusterCount(null);
        } else {
          setAutoChooseClusters(false);
          setClusterCount(settings.method.cluster_count);
          setMaxClusters(null);
        }

        // TODO: Set other settings if they exist
      }
    });

    // Request current run data
    window.database.requestCurrentRun();

    return () => unsubscribe();
  }, []);

  const submitAlgorithmSettings = () => {
    console.log("Submitting settings...");
    const method: ClusterCount = autoChooseClusters
      ? { cluster_count_method: "auto", max_clusters: maxClusters }
      : { cluster_count_method: "manual", cluster_count: clusterCount };

    if (method.cluster_count_method === "manual" && clusterCount === null) {
      console.error("Cluster count must be specified when using manual mode.");
      return;
    } else if (method.cluster_count_method === "auto" && maxClusters === null) {
      console.error(
        "Max clusters must be specified when using automatic mode."
      );
      return;
    }

    window.algorithm.setSettings({ method });
    window.algorithm.runClustering();
    navigate("/progress");
  };

  return (
    <div className="h-screen w-screen">
      <TitleBar index={2} />
      <div id="mainContent" className="dark:dark bg-background text-text">
        <div className="mt-8 flex flex-col gap-6 px-24 xl:gap-8 xl:px-32 xl:pb-8">
          <h1 className="flex w-full flex-col text-5xl">Algorithm Settings</h1>
          <div className="flex flex-col gap-4 text-lg xl:gap-8">
            <TooltipWrapper
              wrappedContent={
                <div className="flex items-center justify-between">
                  <p>Automatically choose number of clusters</p>
                  <Switch
                    checked={autoChooseClusters}
                    onCheckedChange={(isOn) => {
                      setAutoChooseClusters(isOn);
                      if (isOn) {
                        setClusterCount(undefined);
                        setMaxClusters(null);
                      } else {
                        setMaxClusters(undefined);
                        setClusterCount(null);
                      }
                    }}
                  />
                </div>
              }
              tooltipContent={
                <p className="text-left">
                  With this setting enabled, the program will decide the number
                  of clusters by systematically testing different cluster counts
                  and evaluating them using internal cluster validation
                  techniques.
                  <br></br>
                  This setting can increase the computation time, especially
                  when checking a large number of clusters. Therefore, it is
                  recommended to set a maximum number of clusters to consider.
                </p>
              }
            />
            <TooltipWrapper
              wrappedContent={
                <div
                  className={`flex items-center justify-between ${!autoChooseClusters && "text-gray-400"}`}
                >
                  <label htmlFor="maxClusterCount">
                    <p>Maximum number of clusters to consider</p>
                  </label>
                  <Input
                    type="number"
                    min={1}
                    value={maxClusters || ""}
                    onChange={(e) => setMaxClusters(e.target.valueAsNumber)}
                    id="maxClusterCount"
                    className="w-24 "
                    disabled={!autoChooseClusters}
                  />
                </div>
              }
              tooltipContent={
                <p className="text-left">
                  The maximum number of clusters to consider when automatically
                  choosing the number of clusters.
                  <br></br>
                  If not set, the program will consider all possible cluster
                  counts up to the number of data points divided by 2.
                </p>
              }
            />
            <TooltipWrapper
              wrappedContent={
                <div
                  className={`flex items-center justify-between ${autoChooseClusters && "text-gray-400"}`}
                >
                  <label htmlFor="clusterCount">
                    <p>Specific cluster count</p>
                  </label>
                  <Input
                    type="number"
                    id="clusterCount"
                    min={1}
                    value={clusterCount || ""}
                    onChange={(e) => setClusterCount(e.target.valueAsNumber)}
                    className="w-24 "
                    disabled={autoChooseClusters}
                  />
                </div>
              }
              tooltipContent={
                <p className="text-left">
                  The specific number of clusters to use when not automatically
                  choosing the number of clusters.
                  <br></br>
                  This option is required when the automatic cluster count
                  setting is disabled.
                </p>
              }
            />
            <TooltipWrapper
              wrappedContent={
                <div className="flex items-center justify-between">
                  <label htmlFor="seed">
                    <div className="flex flex-col">
                      <p>Deterministic Seed</p>
                    </div>
                  </label>
                  <Input
                    id="seed"
                    type="number"
                    value={seed || ""}
                    onChange={(e) => setSeed(parseInt(e.target.value))}
                    className="w-24 "
                  />
                </div>
              }
              tooltipContent={
                <p className="text-left">
                  The seed to use for the random number generator. This allows
                  for deterministic results when the same seed is used.
                  <br></br>
                  When not set, the seed is randomly generated.
                </p>
              }
            />
            <TooltipWrapper
              wrappedContent={
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <p>
                      Excluded Words{" "}
                      {excludedWords.length > 0
                        ? `(${excludedWords.length})`
                        : ""}
                    </p>
                    <p className="text-base font-normal text-gray-500">
                      Disregard any responses containing these words
                    </p>
                  </div>
                  <Button
                    onClick={() => setIsExcludedWordsEditorOpen(true)}
                    variant="secondary"
                  >
                    <SquarePen size={24} />
                    Edit
                  </Button>
                </div>
              }
              tooltipContent={
                <p className="text-left">
                  The excluded words list allows you to specify words that
                  should not be considered when clustering responses. This can
                  be useful for removing common words or phrases that are not
                  relevant to the clustering.
                  <br></br>
                  This setting is case-insensitive!
                </p>
              }
            />
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <div className="flex items-center gap-4">
                  <p>Advanced algorithm options</p>
                  {unsavedChanges && (
                    <p className="text-base font-normal text-primary">
                      Unsaved changes
                    </p>
                  )}
                </div>
                <p className="text-base font-normal text-gray-500">
                  More granular control over the algorithm
                </p>
              </div>
              <Button
                onClick={() => setIsAdvancedOptionsEditorOpen(true)}
                variant="secondary"
              >
                <SquarePen size={24} />
                Edit
              </Button>
            </div>
          </div>
          <div className="flex w-full justify-end">
            <Button
              onClick={submitAlgorithmSettings}
              disabled={!autoChooseClusters && !clusterCount}
            >
              <ChartScatter size={24} />
              Start Clustering
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
