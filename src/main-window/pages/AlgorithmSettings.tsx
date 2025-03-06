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
import { TooltipWrapper } from "../../components/Tooltip";
import { Input } from "../../components/ui/input";
import {
  ClusterCount,
  AlgorithmSettings as AlgorithmSettingsType,
  AdvancedSettings,
  CachedModel,
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
    null
  );
  const [iterativeAggClustering, setIterativeAggClustering] = useState(false);
  const [advancedSettings, setAdvancedSettings] = useState<AdvancedSettings>({
    embedding_model: null,
    kmeans_method: "spherical_kmeans",
  });
  const [randomState, setRandomState] = useState<number | null>(null);

  const navigate = useNavigate();

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
          settings.agglomerative_clustering !== null
        );
        if (settings.agglomerative_clustering) {
          setSimilarityThreshold(
            settings.agglomerative_clustering.similarity_threshold
          );
          setIterativeAggClustering(
            settings.agglomerative_clustering.iterative
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
        className="dark:dark flex flex-col bg-background px-32 pt-6 pb-8 gap-8 text-text"
      >
        <div className="flex items-center justify-between">
          <h1 className="text-5xl">Algorithm Settings</h1>
          <div className="flex justify-end">
            <Button
              onClick={submitAlgorithmSettings}
              disabled={!settingsAreValid}
            >
              <ChartScatter size={24} />
              Start Clustering
            </Button>
          </div>
        </div>
        <div className="scrollbar pr-4 flex flex-grow flex-col gap-4 overflow-y-auto pt-0 text-lg">
          <TooltipWrapper
            wrappedContent={
              <div className="flex flex-col gap-2 p-4 rounded-lg border border-zinc-200 bg-white text-text shadow-sm dark:border-background-200 dark:bg-background-100">
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
                      !autoChooseClusters && "text-gray-400"
                    )}
                  >
                    <label htmlFor="minClusterCount">
                      <p>Minimum number of clusters to consider</p>
                    </label>
                    <div className="flex items-center gap-2">
                      {minClusters !== null && minClusters < 2 && (
                        <AlertTriangle className="text-red-600" size={28} />
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
                          minClusters && minClusters < 2 && "text-red-600"
                        )}
                        placeholder="5"
                        disabled={!autoChooseClusters}
                      />
                    </div>
                  </div>
                  <div
                    className={cn(
                      "flex items-center justify-between",
                      !autoChooseClusters && "text-gray-400"
                    )}
                  >
                    <label htmlFor="maxClusterCount">
                      <p>Maximum number of clusters to consider</p>
                    </label>
                    <div className="flex items-center gap-2">
                      {maxClusters !== null && minClusters > maxClusters && (
                        <AlertTriangle className="text-red-600" size={28} />
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
                            "text-red-600"
                        )}
                        placeholder="100"
                        disabled={!autoChooseClusters}
                      />
                    </div>
                  </div>
                </div>
              </div>
            }
            tooltipContent={
              <p className="text-left">
                With this setting enabled, the program will decide the number of
                clusters by systematically testing different cluster counts and
                evaluating them using internal cluster validation techniques.
                <br></br>
                This setting can increase the computation time, especially when
                checking a large number of clusters. Therefore, it is
                recommended to set a maximum number of clusters to consider.
              </p>
            }
            placement="bottom-start"
          />
          <TooltipWrapper
            wrappedContent={
              <div
                className={cn(
                  "flex items-center justify-between p-4 rounded-lg border border-zinc-200 bg-white text-text shadow-sm dark:border-background-200 dark:bg-background-100",
                  autoChooseClusters && "text-gray-400"
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
                This option is required when the automatic cluster count setting
                is disabled.
              </p>
            }
            placement="bottom-start"
          />
          <TooltipWrapper
            wrappedContent={
              <div className="flex items-center justify-between p-4 rounded-lg border border-zinc-200 bg-white text-text shadow-sm dark:border-background-200 dark:bg-background-100">
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
            }
            tooltipContent={
              <p className="text-left">
                The excluded words list allows you to specify words that should
                not be considered when clustering responses. This can be useful
                for removing common words or phrases that are not relevant to
                the clustering.
                <br></br>
                This setting is case-insensitive!
              </p>
            }
            placement="bottom-start"
          />
          <TooltipWrapper
            wrappedContent={
              <div className="flex flex-col gap-2 p-4 rounded-lg border border-zinc-200 bg-white text-text shadow-sm dark:border-background-200 dark:bg-background-100">
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
                      !useOutlierDetection && "text-gray-400"
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
                      className="w-24"
                      disabled={!useOutlierDetection}
                      placeholder="3"
                    />
                  </div>
                  <div
                    className={cn(
                      "flex items-center justify-between",
                      !useOutlierDetection && "text-gray-400"
                    )}
                  >
                    <p>Z-Score Threshold</p>
                    <Input
                      type="number"
                      min={0}
                      step={0.1}
                      value={zScoreThreshold || ""}
                      onChange={(e) =>
                        setZScoreThreshold(e.target.valueAsNumber)
                      }
                      className="w-24"
                      disabled={!useOutlierDetection}
                      placeholder="2.5"
                    />
                  </div>
                </div>
              </div>
            }
            tooltipContent={
              <p className="text-left w-full">
                Outlier detection is a technique used to identify items or
                events that deviate significantly from the norm.
                <br></br>
                By enabling this option, you can identify outliers in your data
                which will then be excluded from the analysis. <br></br>
                Outlier detection computes the average similarity to the{" "}
                <span className="font-bold">{nearestNeighbors}</span> nearest
                neighbors of each data point and flags data points that are more
                than{" "}
                <span className={cn(zScoreThreshold && "font-bold")}>
                  {zScoreThreshold || "the z score threshold many"}
                </span>{" "}
                standard deviations away from the average.
              </p>
            }
            placement="bottom-start"
          />
          <TooltipWrapper
            wrappedContent={
              <div className="flex flex-col gap-2 p-4 rounded-lg border border-zinc-200 bg-white text-text shadow-sm dark:border-background-200 dark:bg-background-100">
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
                      !useAgglomerativeClustering && "text-gray-400"
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
                      className="w-24"
                      disabled={!useAgglomerativeClustering}
                      placeholder="0.9"
                    />
                  </div>
                  <div
                    className={cn(
                      "flex items-center justify-between",
                      !useAgglomerativeClustering && "text-gray-400"
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
            }
            tooltipContent={
              <p className="text-left">
                This option adds an additional step to the clustering process to
                merge clusters that are similar to each other.
                <br></br>
                If enabled, merge all clusters that have a similarity value of{" "}
                <span className={cn(similarityThreshold && "font-bold")}>
                  {similarityThreshold || "the similarity threshold"}
                </span>{" "}
                (out of 1) or higher. With repeat merging enabled, the process
                will be repeated until even the mergers are within the
                similarity threshold.
              </p>
            }
            placement="top-start"
          />
          <TooltipWrapper
            wrappedContent={
              <div className="flex items-center justify-between p-4 rounded-lg border border-zinc-200 bg-white text-text shadow-sm dark:border-background-200 dark:bg-background-100">
                <div className="flex flex-col">
                  <p>Advanced Settings</p>
                  <p className="text-base font-normal text-gray-500">
                    Configure advanced algorithm parameters
                  </p>
                </div>
                <AdvancedSettingsDialog
                  settings={advancedSettings}
                  setSettings={setAdvancedSettings}
                />
              </div>
            }
            tooltipContent={
              <p className="text-left">
                Advanced settings for fine-tuning the clustering algorithm.
                These settings should only be modified if you understand their
                impact on the clustering process.
              </p>
            }
            placement="top-start"
          />
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
              <div
                key={word}
                className="flex items-center gap-2 rounded-full bg-accent-100 px-4"
              >
                <span>{word}</span>
                <Button
                  variant="ghost"
                  onClick={() => handleRemoveWord(word)}
                  className="p-0"
                >
                  <X size={16} />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AdvancedSettingsDialog({
  settings,
  setSettings,
}: {
  settings: AdvancedSettings;
  setSettings: (settings: AdvancedSettings) => void;
}) {
  const [modelComboboxOpen, setModelComboboxOpen] = useState(false);
  const [modelComboboxValue, setModelComboboxValue] = useState("");
  const [cachedModels, setCachedModels] = useState<CachedModel[]>([]);

  const handleSave = () => {
    setSettings({
      ...settings,
      embedding_model: modelComboboxValue,
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

  console.log("Advanced settings", settings);

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
            <div className="flex justify-between items-center">
              <label htmlFor="modelName">Embedding Model Name</label>
              <Button
                variant="ghost"
                className="text-sm text-gray-500 flex gap-1"
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
                  {modelComboboxValue
                    ? cachedModels.find(
                        (model) => model.id === modelComboboxValue
                      ).id
                    : "Select Embedding Model..."}
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
                                : currentValue
                            );
                            setModelComboboxOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              modelComboboxValue === model.id
                                ? "opacity-100"
                                : "opacity-0"
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
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label htmlFor="kmeansMethod">
                Use Traditional KMeans Method
              </label>
              <Switch
                id="kmeansMethod"
                checked={settings.kmeans_method === "kmeans"}
                onCheckedChange={(isOn) =>
                  setSettings({
                    ...settings,
                    kmeans_method: isOn ? "kmeans" : "spherical_kmeans",
                  })
                }
              />
            </div>
            <p className="text-sm text-gray-500">
              Use traditional K-Means instead of Spherical K-Means Clustering.
            </p>
          </div>
          <DialogClose asChild>
            <Button onClick={handleSave}>Save Changes</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
