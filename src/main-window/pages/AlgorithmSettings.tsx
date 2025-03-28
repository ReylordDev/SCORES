import { useNavigate } from "react-router";
import { TitleBar } from "../../components/TitleBar";
import { useState, useEffect, useMemo } from "react";
import { Switch } from "../../components/ui/switch";
import { Button } from "../../components/ui/button";
import {
  SquarePen,
  ChartScatter,
  X,
  Settings2,
  Check,
  ChevronsUpDown,
  SquareArrowOutUpRight,
  AlertTriangle,
} from "lucide-react";
import { Card, CardHeader, CardTitle } from "../../components/ui/card";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "../../components/ui/tooltip";
import { Input } from "../../components/ui/input";
import {
  ClusterCount,
  AlgorithmSettings as AlgorithmSettingsType,
  AdvancedSettings,
  CachedModel,
  KSelectionMetric,
} from "../../lib/models";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import { cn } from "../../lib/utils";
import { DialogClose } from "@radix-ui/react-dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../../components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../components/ui/popover";
import { toast } from "sonner";
import { Separator } from "../../components/ui/separator";
import { Checkbox } from "../../components/ui/checkbox";
import { Slider } from "../../components/ui/slider";

export default function AlgorithmSettings() {
  const [autoChooseClusters, setAutoChooseClusters] = useState(true);
  const [clusterCount, setClusterCount] = useState<number | null>(null);
  const [maxClusters, setMaxClusters] = useState<number | null>(null);
  const [minClusters, setMinClusters] = useState<number | null>(null);
  const [excludedWords, setExcludedWords] = useState<string[]>([]);
  const [useOutlierDetection, setUseOutlierDetection] = useState(false);
  const [nearestNeighbors, setNearestNeighbors] = useState<number | null>(null);
  const [zScoreThreshold, setZScoreThreshold] = useState<number | null>(null);
  const [useAgglomerativeClustering, setUseAgglomerativeClustering] =
    useState(false);
  const [similarityThreshold, setSimilarityThreshold] = useState<number | null>(
    null,
  );
  const [iterativeAggClustering, setIterativeAggClustering] = useState(false);
  const [advancedSettings, setAdvancedSettings] = useState<AdvancedSettings>({
    embedding_model: null,
    kmeans_method: "kmeans",
    kselection_metrics: [
      {
        name: "silhouette",
        weight: 0.4,
      },
      {
        name: "calinski_harabasz",
        weight: 0.4,
      },
      {
        name: "davies_bouldin",
        weight: 0.2,
      },
    ],
  });
  const [randomState, setRandomState] = useState<number | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    const storedRunId = localStorage.getItem("runId");
    if (storedRunId) {
      toast.info("Loading previous run settings. Please wait...");
    }
  }, []); // Show toast when the component mounts

  console.log("AlgorithmSettings.AdvancedSettings", advancedSettings);

  useEffect(() => {
    const unsubscribe = window.database.onReceiveCurrentRun(({ run }) => {
      if (run) {
        // Parse the stored algorithm settings
        const settings = JSON.parse(
          run.algorithm_settings,
        ) as AlgorithmSettingsType;

        // Update state based on the loaded settings
        if (settings.method.cluster_count_method === "auto") {
          setAutoChooseClusters(true);
          setMaxClusters(settings.method.max_clusters);
          setMinClusters(settings.method.min_clusters);
          setClusterCount(null);
        } else {
          setAutoChooseClusters(false);
          setClusterCount(settings.method.cluster_count);
          setMaxClusters(null);
          setMinClusters(null);
        }

        setExcludedWords(settings.excluded_words);
        setUseOutlierDetection(settings.outlier_detection !== null);
        if (settings.outlier_detection) {
          setNearestNeighbors(settings.outlier_detection.nearest_neighbors);
          setZScoreThreshold(settings.outlier_detection.z_score_threshold);
        }
        setUseAgglomerativeClustering(
          settings.agglomerative_clustering !== null,
        );
        if (settings.agglomerative_clustering) {
          setSimilarityThreshold(
            settings.agglomerative_clustering.similarity_threshold,
          );
          setIterativeAggClustering(
            settings.agglomerative_clustering.iterative,
          );
        }

        // Load advanced settings if they exist
        setAdvancedSettings(settings.advanced_settings);
        setRandomState(settings.random_state);
      }
    });

    // Request current run data
    window.database.requestCurrentRun();

    return () => unsubscribe();
  }, []);

  const settingsAreValid = useMemo(() => {
    const method: ClusterCount = autoChooseClusters
      ? {
          cluster_count_method: "auto",
          max_clusters: maxClusters,
          min_clusters: minClusters,
        }
      : { cluster_count_method: "manual", cluster_count: clusterCount };

    if (method.cluster_count_method === "manual") {
      if (clusterCount === null) {
        return false;
      }
    } else if (method.cluster_count_method === "auto") {
      if (
        maxClusters === null ||
        minClusters === null ||
        minClusters < 2 ||
        maxClusters < minClusters
      ) {
        return false;
      }
    }

    if (useOutlierDetection) {
      if (
        nearestNeighbors === null ||
        zScoreThreshold === null ||
        zScoreThreshold < 0 ||
        nearestNeighbors < 1
      ) {
        return false;
      }
    }

    if (useAgglomerativeClustering) {
      if (
        similarityThreshold === null ||
        similarityThreshold < 0 ||
        similarityThreshold > 1
      ) {
        return false;
      }
    }

    if (!advancedSettings.kselection_metrics) {
      return false;
    }

    if (advancedSettings.kselection_metrics?.length === 0) {
      return false;
    }

    if (
      advancedSettings.kselection_metrics
        .map((metric) => metric.weight)
        .reduce((a, b) => a + b, 0) === 0
    ) {
      return false;
    }

    return true;
  }, [
    autoChooseClusters,
    clusterCount,
    maxClusters,
    minClusters,
    excludedWords,
    useOutlierDetection,
    nearestNeighbors,
    zScoreThreshold,
    useAgglomerativeClustering,
    similarityThreshold,
    advancedSettings,
  ]);

  const submitAlgorithmSettings = () => {
    console.log("Submitting settings...");
    const method: ClusterCount = autoChooseClusters
      ? {
          cluster_count_method: "auto",
          max_clusters: maxClusters,
          min_clusters: minClusters,
        }
      : { cluster_count_method: "manual", cluster_count: clusterCount };

    window.algorithm.setSettings({
      method: method,
      excluded_words: excludedWords,
      outlier_detection: useOutlierDetection
        ? {
            nearest_neighbors: nearestNeighbors,
            z_score_threshold: zScoreThreshold,
          }
        : null,
      agglomerative_clustering: useAgglomerativeClustering
        ? {
            similarity_threshold: similarityThreshold,
            iterative: iterativeAggClustering,
          }
        : null,
      advanced_settings: advancedSettings,
      random_state: randomState,
    });
    window.algorithm.runClustering();
    navigate("/progress");
  };

  return (
    <div className="h-screen w-screen">
      <TitleBar index={2} />
      <div
        id="mainContent"
        className="dark:dark flex select-none flex-col gap-8 bg-background px-32 pb-8 pt-6 text-text"
      >
        <div className="flex items-center justify-between">
          <h1 className="text-5xl">Algorithm Settings</h1>
          <div className="flex justify-end">
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    onClick={submitAlgorithmSettings}
                    disabled={!settingsAreValid}
                  >
                    <ChartScatter size={24} />
                    Start Clustering
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent
                forceShow={!settingsAreValid}
                align="start"
                side="left"
              >
                {!settingsAreValid && (
                  <div className="flex flex-col gap-2">
                    <p className="text-lg font-semibold">Invalid Settings</p>
                    <p>
                      Some settings are invalid. Please correct the marked input
                      fields.
                    </p>
                  </div>
                )}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
        <div className="scrollbar flex flex-grow flex-col gap-4 overflow-y-auto pr-4 pt-0 text-lg">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex flex-col gap-2 rounded-lg border border-zinc-200 bg-white p-4 text-text shadow-sm dark:border-background-200 dark:bg-background-100">
                <div className="flex items-center justify-between">
                  <p>Automatically choose number of clusters</p>
                  <Switch
                    checked={autoChooseClusters}
                    onCheckedChange={(isOn) => {
                      setAutoChooseClusters(isOn);
                      if (!isOn) {
                        setMaxClusters(null);
                        setClusterCount(null);
                        setMinClusters(null);
                      }
                    }}
                  />
                </div>
                <div className="flex flex-col gap-2 pl-2">
                  <div
                    className={cn(
                      "flex items-center justify-between",
                      !autoChooseClusters && "text-gray-400",
                    )}
                  >
                    <label htmlFor="minClusterCount">
                      <p>Minimum number of clusters to consider</p>
                    </label>
                    <div className="flex items-center gap-2">
                      {minClusters !== null && minClusters < 2 && (
                        <AlertTriangle className="text-rose-500" size={28} />
                      )}
                      <Input
                        type="number"
                        min={2}
                        step={1}
                        value={minClusters || ""}
                        onChange={(e) => setMinClusters(e.target.valueAsNumber)}
                        id="minClusterCount"
                        className={cn(
                          "w-24",
                          minClusters && minClusters < 2 && "text-rose-500",
                          autoChooseClusters &&
                            !minClusters &&
                            "border-rose-500 focus-visible:ring-rose-500 focus-visible:ring-offset-1 dark:border-rose-500 dark:focus-visible:ring-rose-500",
                        )}
                        placeholder="5"
                        disabled={!autoChooseClusters}
                      />
                    </div>
                  </div>
                  <div
                    className={cn(
                      "flex items-center justify-between",
                      !autoChooseClusters && "text-gray-400",
                    )}
                  >
                    <label htmlFor="maxClusterCount">
                      <p>Maximum number of clusters to consider</p>
                    </label>
                    <div className="flex items-center gap-2">
                      {maxClusters !== null && minClusters > maxClusters && (
                        <AlertTriangle className="text-rose-500" size={28} />
                      )}
                      <Input
                        type="number"
                        min={2}
                        step={1}
                        value={maxClusters || ""}
                        onChange={(e) => setMaxClusters(e.target.valueAsNumber)}
                        id="maxClusterCount"
                        className={cn(
                          "w-24",
                          maxClusters &&
                            minClusters > maxClusters &&
                            "text-rose-500",
                          autoChooseClusters &&
                            !maxClusters &&
                            "border-rose-500 focus-visible:ring-rose-500 focus-visible:ring-offset-1 dark:border-rose-500 dark:focus-visible:ring-rose-500",
                        )}
                        placeholder="100"
                        disabled={!autoChooseClusters}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent className="w-[920px]" align="start" side="bottom">
              <div className="flex flex-col gap-2">
                <p className="text-lg font-semibold">
                  Automatic Cluster Count Selection
                </p>
                <p>
                  With this setting enabled, SCORES will decide the number of
                  clusters by systematically testing different cluster counts
                  and evaluating them using internal cluster validation
                  techniques.
                </p>
                <p>
                  To constrain the number of clusters, you need to set the
                  minimum and maximum number of clusters to consider. SCORES
                  will then choose the best number of clusters within this
                  range.
                </p>
                <div className="flex gap-2">
                  <AlertTriangle className="size-6 shrink-0 text-rose-500" />
                  <p>
                    The minimum number of clusters must be at least 2, and the
                    maximum number of clusters must be greater than or equal to
                    the minimum number.
                  </p>
                </div>
                <p>
                  It is highly recommended to check the{" "}
                  <span className="italic">cluster count selection plot</span>{" "}
                  in the results to see which number was selected and which
                  other cluster counts are potential candidates for a re-run.
                </p>
              </div>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  "flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-4 text-text shadow-sm dark:border-background-200 dark:bg-background-100",
                  autoChooseClusters && "text-gray-400",
                )}
              >
                <label htmlFor="clusterCount">
                  <p>Specific cluster count</p>
                </label>
                <Input
                  type="number"
                  step={1}
                  id="clusterCount"
                  min={1}
                  value={clusterCount || ""}
                  onChange={(e) => setClusterCount(e.target.valueAsNumber)}
                  className={cn(
                    "w-24",
                    !autoChooseClusters &&
                      !clusterCount &&
                      "border-rose-500 focus-visible:ring-rose-500 focus-visible:ring-offset-1 dark:border-rose-500 dark:focus-visible:ring-rose-500",
                  )}
                  disabled={autoChooseClusters}
                />
              </div>
            </TooltipTrigger>
            <TooltipContent className="w-[920px]" align="start" side="bottom">
              <div className="flex flex-col gap-2">
                <p className="text-lg font-semibold">
                  Manual Cluster Count Selection
                </p>
                <p>
                  If you want to try a specific cluster count, you use this
                  option instead of the automatic cluster count selection.
                </p>
                <div className="flex gap-2">
                  <AlertTriangle className="text-rose-500" size={24} />
                  <p>
                    This option is required when the automatic cluster count
                    setting is disabled.
                  </p>
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-4 text-text shadow-sm dark:border-background-200 dark:bg-background-100">
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
                <ExcludedWordsDialog
                  excludedWords={excludedWords}
                  setExcludedWords={setExcludedWords}
                />
              </div>
            </TooltipTrigger>
            <TooltipContent className="w-[920px]" align="start" side="bottom">
              <div className="flex flex-col gap-2">
                <p className="text-lg font-semibold">Excluded Words List</p>
                <p>
                  The excluded words list allows you to specify words that
                  should not be considered when clustering responses.
                </p>
                <p>
                  This can be useful for example if the responses contain
                  specific values for "Not Applicable" that would otherwise be
                  included in the clustering.
                </p>
                <div className="flex gap-2">
                  <AlertTriangle className="text-yellow-600" size={24} />
                  <p>This setting is case-insensitive!</p>
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex flex-col gap-2 rounded-lg border border-zinc-200 bg-white p-4 text-text shadow-sm dark:border-background-200 dark:bg-background-100">
                <div className="flex items-center justify-between">
                  <p>Include Outlier Detection</p>
                  <Switch
                    checked={useOutlierDetection}
                    onCheckedChange={(isOn) => {
                      setUseOutlierDetection(isOn);
                      if (!isOn) {
                        setNearestNeighbors(null);
                        setZScoreThreshold(null);
                      }
                    }}
                  />
                </div>
                <div className="flex flex-col gap-2 pl-2">
                  <div
                    className={cn(
                      "flex items-center justify-between",
                      !useOutlierDetection && "text-gray-400",
                    )}
                  >
                    <p>Number of Nearest Neighbors</p>
                    <Input
                      type="number"
                      min={1}
                      step={1}
                      value={nearestNeighbors || ""}
                      onChange={(e) =>
                        setNearestNeighbors(e.target.valueAsNumber)
                      }
                      className={cn(
                        "w-24",
                        useOutlierDetection &&
                          !nearestNeighbors &&
                          "border-rose-500 focus-visible:ring-rose-500 focus-visible:ring-offset-1 dark:border-rose-500 dark:focus-visible:ring-rose-500",
                      )}
                      disabled={!useOutlierDetection}
                      placeholder="3"
                    />
                  </div>
                  <div
                    className={cn(
                      "flex items-center justify-between",
                      !useOutlierDetection && "text-gray-400",
                    )}
                  >
                    <p>Z-Score Threshold</p>
                    <Input
                      type="number"
                      min={0}
                      step={0.1}
                      value={zScoreThreshold === 0 ? 0 : zScoreThreshold || ""}
                      onChange={(e) =>
                        setZScoreThreshold(e.target.valueAsNumber)
                      }
                      className={cn(
                        "w-24",
                        useOutlierDetection &&
                          !zScoreThreshold &&
                          "border-rose-500 focus-visible:ring-rose-500 focus-visible:ring-offset-1 dark:border-rose-500 dark:focus-visible:ring-rose-500",
                      )}
                      disabled={!useOutlierDetection}
                      placeholder="2.5"
                    />
                  </div>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent className="w-[920px]" align="start">
              <div className="flex flex-col gap-2">
                <p className="text-lg font-semibold">Outlier Detection</p>
                <p>
                  By enabling this option, SCORES will attempt to identify
                  outlier responses in your data which will then be excluded
                  from the analysis.
                </p>
                <div className="flex flex-col gap-2">
                  <p>
                    The nearest neighbors parameter determines the number of
                    most similar responses to compare the response against.
                  </p>
                  <div className="flex flex-col gap-2 pl-2 text-sm">
                    <p>
                      A lower number of neighbors (e.g., 3 or 5) means that
                      responses that are only similar to small part of a cluster
                      can still avoid being flagged as outliers.
                    </p>
                    <p>
                      A higher number of neighbors (e.g., 10 or more) means that
                      responses must be similar to a larger part of the cluster
                      to avoid being flagged as outliers.
                    </p>
                    <p>
                      In general, a lower number of neighbors is recommended.
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <p>
                    The z-score threshold determines how much a responses's
                    similarity (compared to its neighbors) must deviate from the
                    mean similarity to be considered an outlier.
                  </p>
                  <div className="flex flex-col gap-2 pl-2 text-sm">
                    <p>
                      A lower z-score threshold (e.g., close to 1 or 2) will
                      result in more results being flagged as outliers. This can
                      lead to false positives, where normal responses with
                      slightly lower similarity are incorrectly flagged as
                      outliers.
                    </p>
                    <p>
                      A higher z-score threshold (e.g., 3 or above) will result
                      in fewer results being flagged as outliers, but may miss
                      more true outliers.
                    </p>
                    <p>
                      If you are unsure, start with a lower z-score threshold
                      and check the outlier view in the results. If you find
                      that too many normal responses are flagged as outliers,
                      you do a re-run with a higher threshold until you find a
                      good balance.
                    </p>
                    <p>
                      Learn more about the z-score on{" "}
                      <span
                        onClick={() =>
                          window.electron.openUrl(
                            "https://en.wikipedia.org/wiki/Standard_score",
                          )
                        }
                        className="cursor-pointer text-accent underline"
                      >
                        Wikipedia
                      </span>
                      .
                    </p>
                  </div>
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex flex-col gap-2 rounded-lg border border-zinc-200 bg-white p-4 text-text shadow-sm dark:border-background-200 dark:bg-background-100">
                <div className="flex items-center justify-between">
                  <p>Merge Similar Clusters</p>
                  <Switch
                    checked={useAgglomerativeClustering}
                    onCheckedChange={(isOn) => {
                      setUseAgglomerativeClustering(isOn);
                      if (!isOn) {
                        setSimilarityThreshold(null);
                      }
                    }}
                  />
                </div>
                <div className="flex flex-col gap-2 pl-2">
                  <div
                    className={cn(
                      "flex items-center justify-between",
                      !useAgglomerativeClustering && "text-gray-400",
                    )}
                  >
                    <p>Minimum Similarity Threshold</p>
                    <Input
                      type="number"
                      min={0}
                      max={1}
                      step={0.01}
                      value={
                        similarityThreshold === 0
                          ? 0
                          : similarityThreshold || ""
                      }
                      onChange={(e) =>
                        setSimilarityThreshold(e.target.valueAsNumber)
                      }
                      className={cn(
                        "w-24",
                        useAgglomerativeClustering &&
                          !similarityThreshold &&
                          "border-rose-500 focus-visible:ring-rose-500 focus-visible:ring-offset-1 dark:border-rose-500 dark:focus-visible:ring-rose-500",
                      )}
                      disabled={!useAgglomerativeClustering}
                      placeholder="0.9"
                    />
                  </div>
                  <div
                    className={cn(
                      "flex items-center justify-between",
                      !useAgglomerativeClustering && "text-gray-400",
                    )}
                  >
                    <p>Repeat Merging</p>
                    <Switch
                      checked={iterativeAggClustering}
                      onCheckedChange={(isOn) =>
                        setIterativeAggClustering(isOn)
                      }
                      disabled={!useAgglomerativeClustering}
                    />
                  </div>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent className="w-[920px]" align="start">
              <div className="flex flex-col gap-2">
                <p className="text-lg font-semibold">Merge Similar Clusters</p>
                <p>
                  This option adds a final additional step to the clustering
                  process to merge clusters that are similar to each other.
                </p>
                <p>
                  The minimum similarity threshold determines how similar two
                  clusters must be to be merged. The value is between 0 and 1,
                  where 0 means no similarity and 1 means identical clusters.
                </p>
                <p>
                  The repeat merging option determines whether the merging
                  process should be repeated until all clusters are outside of
                  the similarity threshold. Otherwise, only one round of merging
                  will be performed.
                </p>
                <p>
                  It is recommended to use the mergers view in the results to
                  make a judgement about the similarity threshold. If you find
                  that too many clusters are merged, you can do a re-run with a
                  higher threshold until you find a good balance.
                </p>
              </div>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-4 text-text shadow-sm dark:border-background-200 dark:bg-background-100">
                <div className="flex flex-col">
                  <p>Advanced Settings</p>
                  <p className="text-base font-normal text-gray-500">
                    Configure advanced algorithm parameters
                  </p>
                </div>
                <AdvancedSettingsDialog
                  advancedSettings={advancedSettings}
                  setAdvancedSettings={setAdvancedSettings}
                />
              </div>
            </TooltipTrigger>
            <TooltipContent className="w-[920px]" align="start">
              <div className="flex flex-col gap-2">
                <p className="text-lg font-semibold">Advanced Settings</p>
                <p>
                  Advanced settings for fine-tuning the clustering algorithm.
                  These settings should only be modified if you understand their
                  impact on the clustering process.
                </p>
                <p>
                  This is also where you can download and/or select a different
                  embedding model.
                </p>
              </div>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}

function ExcludedWordsDialog({
  excludedWords,
  setExcludedWords,
}: {
  excludedWords: string[];
  setExcludedWords: (words: string[]) => void;
}) {
  const [newWord, setNewWord] = useState("");
  const [rawResponses, setRawResponses] = useState<string[]>([]);

  useEffect(() => {
    const unsubscribe = window.file.onReceiveRawResponses((message) => {
      setRawResponses(message.responses);
      console.log("Received raw responses", message.responses);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    window.file.requestRawResponses();
  }, []);

  const handleAddWord = () => {
    if (
      newWord.trim() &&
      !excludedWords.includes(newWord.trim().toLowerCase())
    ) {
      setExcludedWords([...excludedWords, newWord.trim().toLowerCase()]);
      setNewWord("");
    }
  };

  const handleRemoveWord = (wordToRemove: string) => {
    setExcludedWords(excludedWords.filter((word) => word !== wordToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddWord();
    }
  };

  function getMatchingResponseCount(word: string): number {
    return rawResponses.filter(
      (response) =>
        response.toLowerCase() === word.toLowerCase() ||
        response.includes(`${word} `) ||
        response.includes(` ${word}`),
    ).length;
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary">
          <SquarePen size={16} />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Excluded Words</DialogTitle>
          <DialogDescription>
            Add words that should be excluded from the clustering analysis.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            <Input
              type="text"
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type a word to exclude"
            />
            <Button onClick={handleAddWord} disabled={!newWord.trim()}>
              Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {excludedWords.map((word) => (
              <Card key={word} className="p-1">
                <CardHeader className="p-0">
                  <CardTitle>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col gap-1 p-2">
                        <span className="text-base">{word}</span>
                        <span className="text-xs text-gray-500">
                          {getMatchingResponseCount(word) === 1
                            ? "1 matching response"
                            : `${getMatchingResponseCount(word)} matching responses`}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveWord(word)}
                        className="p-0"
                      >
                        <X />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AdvancedSettingsDialog({
  advancedSettings,
  setAdvancedSettings,
}: {
  advancedSettings: AdvancedSettings;
  setAdvancedSettings: (settings: AdvancedSettings) => void;
}) {
  const [modelComboboxOpen, setModelComboboxOpen] = useState(false);
  const [modelComboboxValue, setModelComboboxValue] = useState("");
  const [cachedModels, setCachedModels] = useState<CachedModel[]>([]);
  const [useSphericalKMeans, setUseSphericalKMeans] = useState(
    advancedSettings.kmeans_method === "spherical_kmeans",
  );
  const [useSilhouette, setUseSilhouette] = useState(true);
  const [useCalinski, setUseCalinski] = useState(true);
  const [useDaviesBouldin, setUseDaviesBouldin] = useState(false);

  const [silhouetteWeight, setSilhouetteWeight] = useState(0);
  const [calinskiHarabaszWeight, setCalinskiHarabaszWeight] = useState(0);
  const [daviesBouldinWeight, setDaviesBouldinWeight] = useState(0);
  const epsilon = 0.005;

  useEffect(() => {
    const localUseSilhouette =
      advancedSettings.kselection_metrics?.filter(
        (metric) => metric.name === "silhouette",
      ).length > 0;
    setUseSilhouette(localUseSilhouette);
    setSilhouetteWeight(
      localUseSilhouette
        ? advancedSettings.kselection_metrics?.filter(
            (metric) => metric.name === "silhouette",
          )[0].weight
        : 0,
    );

    const localUseDaviesBouldin =
      advancedSettings.kselection_metrics?.filter(
        (metric) => metric.name === "davies_bouldin",
      ).length > 0;
    setUseDaviesBouldin(localUseDaviesBouldin);
    setDaviesBouldinWeight(
      localUseDaviesBouldin
        ? advancedSettings.kselection_metrics?.filter(
            (metric) => metric.name === "davies_bouldin",
          )[0].weight
        : 0,
    );

    const localUseCalinskiHarabasz =
      advancedSettings.kselection_metrics?.filter(
        (metric) => metric.name === "calinski_harabasz",
      ).length > 0;
    setUseCalinski(localUseCalinskiHarabasz);
    setCalinskiHarabaszWeight(
      localUseCalinskiHarabasz
        ? advancedSettings.kselection_metrics?.filter(
            (metric) => metric.name === "calinski_harabasz",
          )[0].weight
        : 0,
    );
  }, [advancedSettings.kselection_metrics]);

  useEffect(() => {
    setModelComboboxValue(advancedSettings.embedding_model);
  }, [advancedSettings.embedding_model]);

  const kselectionMetrics = useMemo(() => {
    const metrics = [] as KSelectionMetric[];
    if (useSilhouette) {
      metrics.push({
        name: "silhouette",
        weight: silhouetteWeight,
      });
    }

    if (useCalinski) {
      metrics.push({
        name: "calinski_harabasz",
        weight: calinskiHarabaszWeight,
      });
    }

    if (useDaviesBouldin) {
      metrics.push({
        name: "davies_bouldin",
        weight: daviesBouldinWeight,
      });
    }
    return metrics;
  }, [
    useSilhouette,
    silhouetteWeight,
    useCalinski,
    calinskiHarabaszWeight,
    useDaviesBouldin,
    daviesBouldinWeight,
  ]);

  const totalWeight = useMemo(() => {
    const weights = [
      useSilhouette ? silhouetteWeight : 0,
      useCalinski ? calinskiHarabaszWeight : 0,
      useDaviesBouldin ? daviesBouldinWeight : 0,
    ];
    const total = weights.reduce((a, b) => a + b, 0) + epsilon;
    console.log("Total weight", total);
    return total;
  }, [
    useSilhouette,
    silhouetteWeight,
    useCalinski,
    calinskiHarabaszWeight,
    useDaviesBouldin,
    daviesBouldinWeight,
  ]);

  const advancedSettingsAreValid = useMemo(() => {
    if (totalWeight > 1 + epsilon || totalWeight - epsilon <= 0) {
      return false;
    }

    if (kselectionMetrics?.length === 0) {
      return false;
    }

    if (modelComboboxValue === "") {
      return false;
    }
    return true;
  }, [modelComboboxValue, totalWeight]);

  const handleSave = () => {
    setAdvancedSettings({
      ...advancedSettings,
      embedding_model: modelComboboxValue,
      kmeans_method: useSphericalKMeans ? "spherical_kmeans" : "kmeans",
      kselection_metrics: kselectionMetrics,
    });
  };

  useEffect(() => {
    window.models.requestCachedModels();
  }, []);

  useEffect(() => {
    const unsubscribe = window.models.onReceiveCachedModels((message) => {
      console.log("Received cached models", message.models);
      setCachedModels(message.models);
    });

    return () => unsubscribe();
  }, []);

  function updateMetricWeight(weight: number, metricName: string) {
    console.log("Updating metric weight", weight, metricName);

    if (totalWeight > 1) {
      const remainingWeight = 1 - weight;

      let metricCount = 0;
      if (useSilhouette) metricCount++;
      if (useCalinski) metricCount++;
      if (useDaviesBouldin) metricCount++;
      if (metricCount === 0) return;

      const balancingWeight = remainingWeight / (metricCount - 1);
      console.log(
        "Remaining weight",
        remainingWeight,
        "Balancing weight",
        balancingWeight,
      );
      if (metricName === "silhouette") {
        if (useCalinski && balancingWeight < calinskiHarabaszWeight) {
          setCalinskiHarabaszWeight(balancingWeight);
        }
        if (useDaviesBouldin && balancingWeight < daviesBouldinWeight) {
          setDaviesBouldinWeight(balancingWeight);
        }
      } else if (metricName === "calinski_harabasz") {
        if (useSilhouette && balancingWeight < silhouetteWeight) {
          setSilhouetteWeight(balancingWeight);
        }
        if (useDaviesBouldin && balancingWeight < daviesBouldinWeight) {
          setDaviesBouldinWeight(balancingWeight);
        }
      } else if (metricName === "davies_bouldin") {
        if (useSilhouette && balancingWeight < silhouetteWeight) {
          setSilhouetteWeight(balancingWeight);
        }
        if (useCalinski && balancingWeight < calinskiHarabaszWeight) {
          setCalinskiHarabaszWeight(balancingWeight);
        }
      }
    }
    if (metricName === "silhouette") {
      setSilhouetteWeight(weight);
    }
    if (metricName === "calinski_harabasz") {
      setCalinskiHarabaszWeight(weight);
    }
    if (metricName === "davies_bouldin") {
      setDaviesBouldinWeight(weight);
    }
  }

  const balanceWeights = () => {
    let metricCount = 0;
    if (useSilhouette) metricCount++;
    if (useCalinski) metricCount++;
    if (useDaviesBouldin) metricCount++;
    if (metricCount === 0) return;

    const weight = 1 / metricCount;

    if (useSilhouette) {
      setSilhouetteWeight(weight);
    }
    if (useCalinski) {
      setCalinskiHarabaszWeight(weight);
    }
    if (useDaviesBouldin) {
      setDaviesBouldinWeight(weight);
    }
  };

  console.log("Advanced settings", advancedSettings);
  console.log("Silhouette weight", silhouetteWeight);
  console.log("Calinski weight", calinskiHarabaszWeight);
  console.log("Davies-Bouldin weight", daviesBouldinWeight);

  console.log("modelComboboxValue", modelComboboxValue);
  console.log("cachedModels", cachedModels);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary">
          <Settings2 size={16} />
          Configure
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Advanced Settings</DialogTitle>
          <DialogDescription>
            Configure advanced algorithm parameters. Only modify these if you
            understand their impact on the clustering process.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label htmlFor="modelName">Embedding Model Name</label>
              <Button
                variant="ghost"
                className="flex gap-1 text-sm text-gray-500"
                onClick={() => window.electron.openDownloadManager()}
              >
                <SquareArrowOutUpRight className="size-4" />
                get more models
              </Button>
            </div>
            <Popover
              open={modelComboboxOpen}
              onOpenChange={setModelComboboxOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  id="modelName"
                  role="combobox"
                  aria-expanded={modelComboboxOpen}
                  className="w-[450px] justify-between"
                >
                  {modelComboboxValue || "Select Embedding Model..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[450px] p-0">
                <Command>
                  <CommandInput placeholder="Search Downloaded Models..." />
                  <CommandList>
                    <CommandEmpty>No model found.</CommandEmpty>
                    <CommandGroup>
                      {cachedModels.map((model, index) => (
                        <CommandItem
                          key={index}
                          value={model.id}
                          onSelect={(currentValue) => {
                            setModelComboboxValue(
                              currentValue === modelComboboxValue
                                ? ""
                                : currentValue,
                            );
                            setModelComboboxOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              modelComboboxValue === model.id
                                ? "opacity-100"
                                : "opacity-0",
                            )}
                          />
                          {model.id}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <p className="text-sm text-gray-500">
              Leave empty to use the default model.
            </p>
          </div>
          <Separator orientation="horizontal" />
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label htmlFor="kmeansMethod">Use Spherical K-Means Method</label>
              <Switch
                id="kmeansMethod"
                checked={useSphericalKMeans}
                onCheckedChange={(isOn) => setUseSphericalKMeans(isOn)}
              />
            </div>
            <p className="text-sm text-gray-500">
              Use spherical K-Means instead of traditional K-Means Clustering.
            </p>
          </div>
          <Separator orientation="horizontal" />
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">K-Selection Metrics</h3>
                <Button
                  variant="outline"
                  onClick={() => balanceWeights()}
                  className="text-sm text-gray-500"
                >
                  Balance Weights
                </Button>
              </div>
              <p className="text-sm text-gray-500">
                Select the metrics to use for K-selection (You must select at
                least one).
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <label htmlFor="silhouette">Silhouette Score</label>
                <Checkbox
                  id="silhouette"
                  checked={useSilhouette}
                  onCheckedChange={(isOn) => {
                    if (isOn) {
                      setUseSilhouette(true);
                    } else {
                      setUseSilhouette(false);
                      setSilhouetteWeight(0);
                    }
                  }}
                />
              </div>
              <div className="flex items-center justify-between pl-4">
                <label
                  className="text-sm text-gray-500"
                  htmlFor="silhouette_weight"
                >
                  Weight
                </label>
                <div className="flex w-full items-center justify-end gap-2">
                  <Slider
                    disabled={!useSilhouette}
                    max={1}
                    min={0}
                    step={0.01}
                    value={[silhouetteWeight]}
                    onValueChange={(value) => {
                      updateMetricWeight(value[0], "silhouette");
                    }}
                    className="w-[200px]"
                  />
                  <p className="w-8 text-sm text-gray-500">
                    {Math.round(silhouetteWeight * 100)}%
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <label htmlFor="calinski_harabasz">
                  <p>Calinski-Harabasz Score</p>
                  <p className="text-sm text-gray-500">
                    (aka Variance Ratio Criterion)
                  </p>
                </label>
                <Checkbox
                  id="calinski_harabasz"
                  checked={useCalinski}
                  onCheckedChange={(isOn) => {
                    if (isOn) {
                      setUseCalinski(true);
                    } else {
                      setUseCalinski(false);
                      setCalinskiHarabaszWeight(0);
                    }
                  }}
                />
              </div>
              <div className="flex items-center justify-between pl-4">
                <label
                  className="text-sm text-gray-500"
                  htmlFor="calinski_weight"
                >
                  Weight
                </label>
                <div className="flex w-full items-center justify-end gap-2">
                  <Slider
                    disabled={!useCalinski}
                    max={1}
                    min={0}
                    step={0.01}
                    value={[calinskiHarabaszWeight]}
                    onValueChange={(value) => {
                      updateMetricWeight(value[0], "calinski_harabasz");
                    }}
                    className="w-[200px]"
                  />
                  <p className="w-8 text-sm text-gray-500">
                    {Math.round(calinskiHarabaszWeight * 100)}%
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <label htmlFor="davies_bouldin">Davies-Bouldin Score</label>
                <Checkbox
                  id="davies_bouldin"
                  checked={useDaviesBouldin}
                  onCheckedChange={(isOn) => {
                    if (isOn) {
                      setUseDaviesBouldin(true);
                    } else {
                      setUseDaviesBouldin(false);
                      setDaviesBouldinWeight(0);
                    }
                  }}
                />
              </div>
            </div>
            <div className="flex items-center justify-between pl-4">
              <label
                className="text-sm text-gray-500"
                htmlFor="davies_bouldin_weight"
              >
                Weight
              </label>
              <div className="flex w-full items-center justify-end gap-2">
                <Slider
                  disabled={!useDaviesBouldin}
                  max={1}
                  min={0}
                  step={0.01}
                  value={[daviesBouldinWeight]}
                  onValueChange={(value) => {
                    updateMetricWeight(value[0], "davies_bouldin");
                  }}
                  className="w-[200px]"
                />
                <p className="w-8 text-sm text-gray-500">
                  {Math.round(daviesBouldinWeight * 100)}%
                </p>
              </div>
            </div>
          </div>
          <DialogClose asChild>
            <Button disabled={!advancedSettingsAreValid} onClick={handleSave}>
              Save Changes
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
