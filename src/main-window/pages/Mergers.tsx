import { _ClusterMergerDetail, _MergerDetail } from "../../lib/models";
import { useEffect, useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { UUID } from "crypto";
import { TitleBar } from "../../components/TitleBar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { cn } from "../../lib/utils";

function MergedCluster({
  cluster,
  isExpanded,
  handleClusterClick,
}: {
  cluster: _ClusterMergerDetail;
  isExpanded: boolean;
  handleClusterClick: (clusterId: string) => void;
}) {
  const representativeResponsesCount = 10;

  return (
    <Card
      onClick={() => handleClusterClick(cluster.id)}
      className={cn(
        "cursor-pointer",
        isExpanded ? "h-full border-accent border-dashed" : "h-fit"
      )}
    >
      <CardHeader>
        <div className="flex justify-between items-center w-full">
          <div className="flex flex-col gap-1">
            <CardTitle className="text-xl font-medium line-clamp-1">
              {cluster.name}
            </CardTitle>
          </div>
          {isExpanded ? (
            <ChevronUp className="text-accent" size={32} />
          ) : (
            <ChevronDown className="text-accent" size={32} />
          )}
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent>
          <h3 className="text-lg font-medium">Representative Responses:</h3>
          {cluster.responses
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, representativeResponsesCount)
            .map((response, index) => (
              <div
                key={index}
                className="flex flex-col gap-3 justify-start items-center p-4 cursor-default"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between w-full">
                  <p className="line-clamp-2 bg-background px-2 select-text">
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
        </CardContent>
      )}
    </Card>
  );
}

export default function Mergers() {
  const [mergers, setMergers] = useState<_MergerDetail[]>([]);
  const [mergeThreshold, setMergeThreshold] = useState<number | null>(null);
  const [expandedClusters, setExpandedClusters] = useState<UUID[]>([]);
  const [expandedClusterGroups, setExpandedClusterGroups] = useState<UUID[]>(
    []
  );

  useEffect(() => {
    const unsubscribe = window.database.onReceiveCurrentMergers(
      (mergersMessage) => {
        console.log(mergersMessage);
        setMergers(mergersMessage.mergers);
        setMergeThreshold(mergersMessage.threshold);
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    console.log("requesting mergers");
    window.database.requestCurrentMergers();
  }, []);

  const toggleCluster = (id: UUID) => {
    setExpandedClusters((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleClusterGroup = (id: UUID) => {
    setExpandedClusterGroups((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="w-screen h-screen">
      <TitleBar index={5} />
      <div
        id="mainContent"
        className="dark:dark flex flex-col bg-background px-32 pt-6 text-text gap-4 select-none"
      >
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl">Merged Clusters</h1>
          <p className="text-lg">
            Displaying <span className="font-semibold">{mergers.length}</span>{" "}
            {mergers.length === 1 ? "merged cluster" : "merged clusters"}.
          </p>
          <p>
            Clusters that were more than{" "}
            <span className="font-semibold">{mergeThreshold * 100}%</span>{" "}
            similar to each other were merged.
          </p>
        </div>
        <div className="scrollbar pr-4 flex flex-grow flex-col gap-4 overflow-y-auto pt-0 pb-4">
          {mergers.length > 0 ? (
            mergers
              .sort(
                (a, b) =>
                  b.similarity_pairs.reduce(
                    (acc, pair) => acc + pair.similarity,
                    0
                  ) -
                  a.similarity_pairs.reduce(
                    (acc, pair) => acc + pair.similarity,
                    0
                  )
              )
              .map((merger, index) => (
                <Card key={merger.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Merged Group {index + 1}</CardTitle>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          toggleClusterGroup(merger.id);
                          merger.clusters.forEach((cluster) =>
                            setExpandedClusters((prev) =>
                              expandedClusterGroups.includes(merger.id)
                                ? prev.filter((i) => i !== cluster.id)
                                : [...prev, cluster.id]
                            )
                          );
                        }}
                      >
                        {expandedClusterGroups.includes(merger.id) ? (
                          <ChevronUp size={32} />
                        ) : (
                          <ChevronDown size={32} />
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      {merger.clusters.map((cluster) => (
                        <MergedCluster
                          key={cluster.id}
                          cluster={cluster}
                          isExpanded={expandedClusters.includes(cluster.id)}
                          handleClusterClick={() => toggleCluster(cluster.id)}
                        />
                      ))}
                    </div>
                    <div className="px-4 pt-4 flex flex-col gap-4">
                      <h3 className="text-lg font-medium">Similarity Pairs</h3>
                      <div className="flex flex-col gap-4">
                        {merger.similarity_pairs.map((pair) => (
                          <div key={pair.id}>
                            <div className="flex items-center justify-start gap-4">
                              <p className="w-1/4">
                                <span className="font-semibold">
                                  {
                                    merger.clusters.find(
                                      (c) => c.id === pair.cluster_1_id
                                    )?.name
                                  }
                                </span>{" "}
                                and{" "}
                                <span className="font-semibold">
                                  {
                                    merger.clusters.find(
                                      (c) => c.id === pair.cluster_2_id
                                    )?.name
                                  }
                                </span>
                                :
                              </p>
                              <div className="h-2.5 w-3/4 rounded-full bg-primary-100">
                                <div
                                  className="h-2.5 rounded-full bg-primary"
                                  style={{
                                    width: `${pair.similarity * 100}%`,
                                  }}
                                ></div>
                              </div>
                              <p className="w-24 text-xl">
                                {(pair.similarity * 100).toFixed(1)}%
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
          ) : (
            <div className="flex items-center justify-center">
              <p className="text-xl font-semibold">No clusters were merged.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
