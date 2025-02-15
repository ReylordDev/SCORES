import React, { useState, useCallback, useEffect } from "react";
import {
  ChevronDown,
  ChevronUp,
  Info,
  AlertCircle,
  GitMerge,
  Check,
  ChevronsUpDown,
} from "lucide-react";
import { _ClusterSimilarityDetail } from "../../lib/models";
import { TitleBar } from "../../components/TitleBar";
import { UUID } from "crypto";
import { iterateRecord, cn } from "../../lib/utils";
import { Input } from "../../components/ui/input";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "../../components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../components/ui/popover";

const SimilarityVisualizer: React.FC<{
  similarity: number;
  primary: boolean;
}> = ({ similarity, primary = true }) => (
  <div
    className={`h-2 w-full rounded-full ${primary ? "bg-primary-100" : "bg-secondary-100"}`}
  >
    <div
      className={`h-2 rounded-full ${primary ? "bg-primary" : "bg-secondary"}`}
      style={{ width: `${similarity * 100}%` }}
    />
  </div>
);

export default function ClusterSimilarities() {
  const [clusters, setClusters] = useState<_ClusterSimilarityDetail[]>([]);
  const [selectedCluster, setSelectedCluster] =
    useState<_ClusterSimilarityDetail | null>(null);
  const [comparisonCluster, setComparisonCluster] =
    useState<_ClusterSimilarityDetail | null>(null);
  const [selectedClusterExpanded, setSelectedClusterExpanded] = useState(false);
  const [comparisonClusterExpanded, setComparisonClusterExpanded] =
    useState(false);
  const [expandedSimilarClusters, setExpandedSimilarClusters] = useState<
    UUID[]
  >([]);

  console.log(clusters);

  useEffect(() => {
    const unsubscribe = window.database.onReceiveCurrentClusterSimilarities(
      (clusterSimilaritiesMessage) => {
        console.log(
          "Received current cluster similarities: ",
          clusterSimilaritiesMessage
        );
        clusterSimilaritiesMessage.clusters.forEach((cluster) => {
          cluster.responses = cluster.responses.sort(
            (a, b) => b.similarity - a.similarity
          );
        });
        setClusters(clusterSimilaritiesMessage.clusters);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    console.log("Requesting current cluster similarities...");
    window.database.requestCurrentClusterSimilarities();
  }, []);

  const getMostSimilarClusters = useCallback(
    (clusterId: UUID, count = 5) => {
      const cluster = clusters.filter((c) => c.id === clusterId)[0];
      return iterateRecord(cluster.similarity_pairs)
        .sort((a, b) => b[1] - a[1])
        .slice(0, count)
        .map(([cluster2_id, similarity]) => {
          const matchingCluster = clusters.find((c) => c.id === cluster2_id);
          return {
            ...matchingCluster,
            similarity,
          };
        });
    },
    [clusters]
  );

  function getClusterSimilarity(clusterId1: UUID, clusterId2: UUID) {
    const cluster1 = clusters.find((c) => c.id === clusterId1);
    const cluster2 = clusters.find((c) => c.id === clusterId2);

    if (!cluster1 || !cluster2) return 0;

    return cluster1.similarity_pairs[clusterId2] || 0;
  }

  return (
    <div className="w-screen h-screen">
      <TitleBar index={5} />
      <div
        id="mainContent"
        className="dark:dark flex flex-col bg-background px-32 pt-6 pb-8 gap-8 text-text"
      >
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl">Cluster Similarities</h1>
          <div className="flex items-center px-1">
            <Info size={16} className="mr-2" />
            <p>Select a cluster to view details and compare similarities.</p>
          </div>
        </div>
        <div className="scrollbar pr-4 flex flex-grow flex-col gap-4 overflow-y-auto pt-0">
          <div className="flex flex-col justify-start gap-1 px-4 pb-2">
            <h5 className="font-medium">Select a cluster:</h5>
            <div className="flex items-center justify-between gap-4">
              <ClusterSelector
                clusters={clusters}
                setSelectedCluster={setSelectedCluster}
              />
            </div>
          </div>
          {selectedCluster && (
            <div className="flex flex-col gap-4 px-4">
              <ClusterDetails
                cluster={selectedCluster}
                handleClusterClick={() =>
                  setSelectedClusterExpanded(!selectedClusterExpanded)
                }
                isExpanded={selectedClusterExpanded}
              />
              <div>
                <div className="p-4">
                  <h5 className="mb-2 font-medium">
                    Compare with another cluster:
                  </h5>
                  <ClusterSelector
                    clusters={clusters}
                    setSelectedCluster={setComparisonCluster}
                  />
                </div>
                {comparisonCluster &&
                  comparisonCluster.id === selectedCluster.id && (
                    <div className="flex w-full items-center gap-2 px-8">
                      <AlertCircle size={20} className="text-red-500" />
                      <p className="text-red-500">
                        Cannot compare a cluster with itself.
                      </p>
                    </div>
                  )}
                {comparisonCluster &&
                  comparisonCluster.id !== selectedCluster.id && (
                    <div className="px-4 flex flex-col gap-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between">
                          <h5 className="font-medium">
                            Similarity between {selectedCluster.name} and{" "}
                            {comparisonCluster.name}:
                          </h5>
                          <p className="text-xl">
                            {(
                              getClusterSimilarity(
                                selectedCluster.id,
                                comparisonCluster.id
                              ) * 100
                            ).toFixed(2)}
                            %
                          </p>
                        </div>
                        <div className="flex items-center">
                          <SimilarityVisualizer
                            similarity={getClusterSimilarity(
                              selectedCluster.id,
                              comparisonCluster.id
                            )}
                            primary={true}
                          />
                        </div>
                      </div>
                      <ClusterDetails
                        cluster={comparisonCluster}
                        handleClusterClick={() =>
                          setComparisonClusterExpanded(
                            !comparisonClusterExpanded
                          )
                        }
                        isExpanded={comparisonClusterExpanded}
                      />
                    </div>
                  )}
              </div>
              <div className="flex flex-col gap-4 px-4">
                <h5 className="font-medium">
                  5 most similar clusters to {selectedCluster.name}:
                </h5>
                <div className="flex flex-col gap-4">
                  {getMostSimilarClusters(selectedCluster.id, 5).map(
                    (cluster) => (
                      <ClusterDetails
                        key={cluster.id}
                        cluster={cluster}
                        similarity={cluster.similarity}
                        handleClusterClick={() =>
                          setExpandedSimilarClusters((prev) =>
                            prev.includes(cluster.id)
                              ? prev.filter((id) => id !== cluster.id)
                              : [...prev, cluster.id]
                          )
                        }
                        isExpanded={expandedSimilarClusters.includes(
                          cluster.id
                        )}
                      />
                    )
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const ClusterDetails: React.FC<{
  cluster: _ClusterSimilarityDetail;
  similarity?: number;
  handleClusterClick: (clusterId: UUID) => void;
  isExpanded: boolean;
}> = ({ cluster, similarity, handleClusterClick, isExpanded }) => {
  console.log("Cluster Details: ", cluster);

  const [previewCount, setPreviewCount] = useState(5);

  if (!cluster) return null;
  return (
    <Card
      onClick={() => handleClusterClick(cluster.id)}
      className={cn(
        "cursor-pointer",
        isExpanded && "border-accent border-2 border-dashed",
        !isExpanded && "hover:bg-background-50 dark:hover:bg-background-100"
      )}
    >
      <CardHeader>
        <div className="flex justify-between items-center w-full gap-4">
          <div className="flex flex-col gap-1 w-1/3">
            <div className="flex items-center gap-2">
              <CardTitle>{cluster.name}</CardTitle>
            </div>
            <CardDescription className="flex gap-2">
              <p>{cluster.count} responses</p>
              {cluster.is_merger_result && (
                <div className="flex items-center gap-2">
                  <GitMerge size={16} />
                  <p className="text-muted-foreground">merger result</p>
                </div>
              )}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 w-3/5">
            {similarity && (
              <SimilarityVisualizer similarity={similarity} primary={true} />
            )}
          </div>
          <div className="flex items-center gap-2">
            {similarity && (
              <p className="text-xl">{(similarity * 100).toFixed(2)}%</p>
            )}
            {isExpanded ? (
              <ChevronUp className="text-accent" size={32} />
            ) : (
              <ChevronDown className="text-accent" size={32} />
            )}
          </div>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent>
          {cluster.responses.slice(0, previewCount).map((response, index) => (
            <div
              key={index}
              className="flex flex-col gap-3 justify-start items-center p-4 cursor-default"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between w-full">
                <p className="line-clamp-2 bg-background px-2">
                  "{response.text}"
                </p>
                {response.count > 1 && (
                  <p className="text-sm text-muted-foreground">
                    {response.count} occurences
                  </p>
                )}
              </div>
              <div className="flex justify-between items-end gap-4 w-full">
                <div className="flex flex-col gap-1 w-full">
                  <p>Similarity to cluster center:</p>
                  <div className="h-2.5 bg-accent-100 rounded-full">
                    <div
                      className="h-2.5 bg-accent rounded-full"
                      style={{ width: `${response.similarity * 100}%` }}
                    ></div>
                  </div>
                </div>
                <span className="text-xl">
                  {(response.similarity * 100).toFixed(2)}%
                </span>
              </div>
            </div>
          ))}
          {cluster.count > previewCount && (
            <div
              className="flex items-center justify-center p-4 cursor-default"
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                variant="accent"
                onClick={() => setPreviewCount(previewCount + 25)}
              >
                + {cluster.count - previewCount} more responses in the
                assignments file
              </Button>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

const ClusterSelector = ({
  clusters,
  setSelectedCluster,
}: {
  clusters: _ClusterSimilarityDetail[];
  setSelectedCluster: (cluster: _ClusterSimilarityDetail) => void;
}) => {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");

  useEffect(() => {
    if (value) {
      setSelectedCluster(clusters.find((cluster) => cluster.name === value));
    } else {
      setSelectedCluster(null);
    }
  }, [value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[500px] justify-between"
        >
          {value
            ? clusters.find((cluster) => cluster.name === value)?.name
            : "Select cluster..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[500px] p-0">
        <Command shouldFilter={false}>
          <Input
            placeholder="Search cluster by name or response content..."
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="focus-visible:ring-0 text-sm"
          />
          <CommandList>
            <CommandEmpty>No cluster found.</CommandEmpty>
            <CommandGroup>
              {clusters
                .filter(
                  (cluster) =>
                    cluster.responses.some((response) =>
                      response.text.toLowerCase().includes(value.toLowerCase())
                    ) ||
                    cluster.name.toLowerCase().includes(value.toLowerCase())
                )
                .sort((a, b) => a.index - b.index)
                .map((cluster) => (
                  <CommandItem
                    key={cluster.id}
                    value={cluster.name}
                    onSelect={(currentValue) => {
                      setValue(currentValue === value ? "" : currentValue);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === cluster.name ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {cluster.name}
                  </CommandItem>
                ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
