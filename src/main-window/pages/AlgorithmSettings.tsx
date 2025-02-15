import { useNavigate } from "react-router";
import { TitleBar } from "../../components/TitleBar";
import { useState, useEffect } from "react";
import { Switch } from "../../components/ui/switch";
import { Button } from "../../components/ui/button";
import { SquarePen, ChartScatter, X } from "lucide-react";
import { TooltipWrapper } from "../../components/Tooltip";
import { Input } from "../../components/ui/input";
import {
  ClusterCount,
  AlgorithmSettings as AlgorithmSettingsType,
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

export default function AlgorithmSettings() {
  const [autoChooseClusters, setAutoChooseClusters] = useState(true);
  const [clusterCount, setClusterCount] = useState<number | null>(null);
  const [maxClusters, setMaxClusters] = useState<number | null>(null);
  const [excludedWords, setExcludedWords] = useState<string[]>([]);
  const [useOutlierDetection, setUseOutlierDetection] = useState(false);
  const [nearestNeighbors, setNearestNeighbors] = useState<number | null>(null);
  const [zScoreThreshold, setZScoreThreshold] = useState<number | null>(null);
  const [useAgglomerativeClustering, setUseAgglomerativeClustering] =
    useState(false);
  const [similarityThreshold, setSimilarityThreshold] = useState<number | null>(
    null
  );

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
          setClusterCount(null);
        } else {
          setAutoChooseClusters(false);
          setClusterCount(settings.method.cluster_count);
          setMaxClusters(null);
        }

        setExcludedWords(settings.excluded_words);
        setUseOutlierDetection(settings.outlier_detection !== undefined);
        if (settings.outlier_detection) {
          setNearestNeighbors(settings.outlier_detection.nearest_neighbors);
          setZScoreThreshold(settings.outlier_detection.z_score_threshold);
        }
        setUseAgglomerativeClustering(
          settings.agglomerative_clustering !== undefined
        );
        if (settings.agglomerative_clustering) {
          setSimilarityThreshold(
            settings.agglomerative_clustering.similarity_threshold
          );
        }
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

    window.algorithm.setSettings({
      method,
      excluded_words: excludedWords,
      outlier_detection: useOutlierDetection
        ? {
            nearest_neighbors: nearestNeighbors,
            z_score_threshold: zScoreThreshold,
          }
        : undefined,
      agglomerative_clustering: useAgglomerativeClustering
        ? { similarity_threshold: similarityThreshold }
        : undefined,
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
              disabled={!autoChooseClusters && !clusterCount}
            >
              <ChartScatter size={24} />
              Start Clustering
            </Button>
          </div>
        </div>
        <div className="scrollbar pr-4 flex flex-grow flex-col gap-4 overflow-y-auto pt-0 text-lg">
          <TooltipWrapper
            wrappedContent={
              <div className="flex items-center justify-between p-4 rounded-lg border border-zinc-200 bg-white text-text shadow-sm dark:border-background-200 dark:bg-background-100">
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
                With this setting enabled, the program will decide the number of
                clusters by systematically testing different cluster counts and
                evaluating them using internal cluster validation techniques.
                <br></br>
                This setting can increase the computation time, especially when
                checking a large number of clusters. Therefore, it is
                recommended to set a maximum number of clusters to consider.
              </p>
            }
          />
          <TooltipWrapper
            wrappedContent={
              <div
                className={cn(
                  "flex items-center justify-between p-4 rounded-lg border border-zinc-200 bg-white text-text shadow-sm dark:border-background-200 dark:bg-background-100",
                  !autoChooseClusters && "text-gray-400"
                )}
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
          />
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
                  value={nearestNeighbors || ""}
                  onChange={(e) => setNearestNeighbors(e.target.valueAsNumber)}
                  className="w-24"
                  disabled={!useOutlierDetection}
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
                  onChange={(e) => setZScoreThreshold(e.target.valueAsNumber)}
                  className="w-24"
                  disabled={!useOutlierDetection}
                />
              </div>
            </div>
          </div>
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
                  step={0.01}
                  value={
                    similarityThreshold === 0 ? 0 : similarityThreshold || ""
                  }
                  onChange={(e) =>
                    setSimilarityThreshold(e.target.valueAsNumber)
                  }
                  className="w-24"
                  disabled={!useAgglomerativeClustering}
                />
              </div>
            </div>
          </div>
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
