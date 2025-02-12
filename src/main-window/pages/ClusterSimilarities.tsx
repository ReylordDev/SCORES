import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  Info,
  Search,
  TextCursor,
  AlertCircle,
} from "lucide-react";
import { _ClusterSimilarityDetail } from "../../lib/models";
import { TitleBar } from "../../components/TitleBar";
import { UUID } from "crypto";
import { iterateRecord } from "../../lib/utils";

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
  const [selectedClusterId, setSelectedClusterId] = useState<UUID | null>(null);
  const [comparisonClusterId, setComparisonClusterId] = useState<UUID | null>(
    null
  );
  const [selectedClusterExpanded, setSelectedClusterExpanded] = useState(false);
  const [comparisonClusterExpanded, setComparisonClusterExpanded] =
    useState(false);
  const [expandedSimilarClusters, setExpandedSimilarClusters] = useState<
    UUID[]
  >([]);

  const selectedCluster = clusters.find((c) => c.id === selectedClusterId);
  const comparisonCluster = clusters.find((c) => c.id === comparisonClusterId);

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

  const MainClusterSelector = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [showDropdown, setShowDropdown] = useState(false);

    const filteredClusters = useMemo(() => {
      if (!searchTerm) return [];
      const lowerSearchTerm = searchTerm.toLowerCase();
      return clusters.filter((cluster) =>
        cluster.responses.some((response) =>
          response.text.toLowerCase().includes(lowerSearchTerm)
        )
      );
    }, [searchTerm]);

    return (
      <div className="flex w-full items-center justify-center gap-4">
        <div className="flex h-12 w-1/3 items-center gap-2 rounded-md border-2 border-primary bg-white p-2 dark:bg-zinc-900">
          <TextCursor size={20} className="text-gray-400" />
          <input
            type="number"
            placeholder="Fix me..."
            className="w-full text-center focus:outline-none"
          />
        </div>
        <p>or</p>
        <div className="relative flex w-full flex-col gap-1">
          <div className="flex h-12 items-center gap-2 rounded-md border-2 border-primary bg-white p-2 dark:bg-zinc-900">
            <Search size={20} className="text-gray-400" />
            <input
              type="text"
              className="w-full focus:outline-none"
              placeholder="Search by response content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setShowDropdown(true)}
            />
          </div>
          {showDropdown &&
            filteredClusters.length > 0 &&
            searchTerm.length > 1 && (
              <ul className="scrollbar absolute z-30 mt-12 max-h-96 w-96 overflow-auto rounded-md border border-primary bg-white shadow-lg dark:bg-zinc-900">
                {filteredClusters.map((cluster) => (
                  <li
                    key={cluster.id}
                    className="cursor-pointer p-2 hover:bg-gray-100"
                    onClick={() => setSelectedClusterId(cluster.id)}
                  >
                    <span className="font-medium">{cluster.name}</span>
                    <ul className="mt-1 space-y-1">
                      {cluster.responses.map((response, index) => (
                        <li
                          key={index}
                          className="text-ellipsis text-sm text-gray-600"
                        >
                          {response.text
                            .toLowerCase()
                            .includes(searchTerm.toLowerCase()) ? (
                            <>
                              <div
                                style={{
                                  display:
                                    index > 4 && cluster.responses.length > 5
                                      ? "block"
                                      : "none",
                                }}
                              >
                                <span>
                                  ... <br></br>
                                </span>
                              </div>
                              <span>
                                "
                                {response.text.slice(
                                  0,
                                  response.text
                                    .toLowerCase()
                                    .indexOf(searchTerm.toLowerCase())
                                )}
                              </span>
                              <span className="font-bold text-primary">
                                {response.text.slice(
                                  response.text
                                    .toLowerCase()
                                    .indexOf(searchTerm.toLowerCase()),
                                  response.text
                                    .toLowerCase()
                                    .indexOf(searchTerm.toLowerCase()) +
                                    searchTerm.length
                                )}
                              </span>
                              <span>
                                {response.text.slice(
                                  response.text
                                    .toLowerCase()
                                    .indexOf(searchTerm.toLowerCase()) +
                                    searchTerm.length
                                )}
                                "
                              </span>
                            </>
                          ) : index > 4 ? (
                            <></>
                          ) : (
                            <span>"{response.text}"</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            )}
        </div>
      </div>
    );
  };

  const ComparisonClusterSelector = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [showDropdown, setShowDropdown] = useState(false);

    const filteredClusters = useMemo(() => {
      if (!searchTerm) return [];
      const lowerSearchTerm = searchTerm.toLowerCase();
      return clusters.filter((cluster) => {
        if (cluster.id === selectedClusterId) return false;
        return cluster.responses.some((response) =>
          response.text.toLowerCase().includes(lowerSearchTerm)
        );
      });
    }, [searchTerm]);

    if (selectedClusterId === null) return null;

    return (
      <div className="flex w-full items-center justify-center gap-4">
        <div className="flex h-12 w-1/3 items-center gap-2 rounded-md border-2 border-primary bg-white p-2 dark:bg-zinc-900">
          <TextCursor size={20} className="text-gray-400" />
          <input
            type="number"
            placeholder="Fix Me..."
            className="w-full text-center focus:outline-none"
          />
        </div>
        <p>or</p>
        <div className="relative flex w-full flex-col gap-1">
          <div className="flex h-12 items-center gap-2 rounded-md border-2 border-primary bg-white p-2 dark:bg-zinc-900">
            <Search size={20} className="text-gray-400" />
            <input
              type="text"
              className="w-full focus:outline-none"
              placeholder="Search by response content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setShowDropdown(true)}
            />
          </div>
          {showDropdown &&
            filteredClusters.length > 0 &&
            searchTerm.length > 1 && (
              <ul className="scrollbar absolute z-20 mt-12 max-h-96 w-96 overflow-auto rounded-md border border-primary bg-white shadow-lg dark:bg-zinc-900">
                {filteredClusters.map((cluster) => (
                  <li
                    key={cluster.id}
                    className="cursor-pointer p-2 hover:bg-gray-100"
                    onClick={() => {
                      if (cluster.id === selectedClusterId) return;
                      setComparisonClusterId(cluster.id);
                    }}
                  >
                    <span className="font-medium">{cluster.name}</span>
                    <ul className="mt-1 space-y-1">
                      {cluster.responses.map((response, index) => (
                        <li
                          key={index}
                          className="text-ellipsis text-sm text-gray-600"
                        >
                          {response.text
                            .toLowerCase()
                            .includes(searchTerm.toLowerCase()) ? (
                            <>
                              <div
                                style={{
                                  display:
                                    index > 4 && cluster.responses.length > 5
                                      ? "block"
                                      : "none",
                                }}
                              >
                                <span>
                                  ... <br></br>
                                </span>
                              </div>
                              <span>
                                "
                                {response.text.slice(
                                  0,
                                  response.text
                                    .toLowerCase()
                                    .indexOf(searchTerm.toLowerCase())
                                )}
                              </span>
                              <span className="font-bold text-primary">
                                {response.text.slice(
                                  response.text
                                    .toLowerCase()
                                    .indexOf(searchTerm.toLowerCase()),
                                  response.text
                                    .toLowerCase()
                                    .indexOf(searchTerm.toLowerCase()) +
                                    searchTerm.length
                                )}
                              </span>
                              <span>
                                {response.text.slice(
                                  response.text
                                    .toLowerCase()
                                    .indexOf(searchTerm.toLowerCase()) +
                                    searchTerm.length
                                )}
                                "
                              </span>
                            </>
                          ) : index > 4 ? (
                            <></>
                          ) : (
                            <span>"{response.text}"</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            )}
        </div>
      </div>
    );
  };

  const SimilarClustersList = ({ clusterId }: { clusterId: UUID }) => {
    const similarClusters = getMostSimilarClusters(clusterId);
    console.log("Similar Clusters: ", similarClusters);

    return (
      <div className="mt-4 flex flex-col gap-2">
        <h5 className="mb-2 font-medium">
          {similarClusters.length} Most Similar Clusters:
        </h5>
        {similarClusters.map((otherCluster) => (
          <div
            key={otherCluster.id}
            className="rounded bg-white shadow-sm hover:bg-gray-50 dark:bg-zinc-900 dark:hover:bg-zinc-800"
          >
            <div
              className="flex cursor-pointer items-center justify-between p-4"
              onClick={() =>
                setExpandedSimilarClusters((prev) =>
                  prev.includes(otherCluster.id)
                    ? prev.filter((id) => id !== otherCluster.id)
                    : [...prev, otherCluster.id]
                )
              }
            >
              <span className="w-28">{otherCluster.name}</span>
              <div className="flex flex-grow items-center">
                <SimilarityVisualizer
                  primary={true}
                  similarity={otherCluster.similarity}
                />
                <div className="flex w-28 items-center justify-end gap-2">
                  <span>{(otherCluster.similarity * 100).toFixed(2)}%</span>
                  <button className="focus:outline-none">
                    {expandedSimilarClusters.includes(otherCluster.id) ? (
                      <ChevronUp size={20} className="text-secondary" />
                    ) : (
                      <ChevronDown size={20} className="text-secondary" />
                    )}
                  </button>
                </div>
              </div>
            </div>
            {expandedSimilarClusters.includes(otherCluster.id) && (
              <ClusterDetails cluster={otherCluster} />
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="w-screen h-screen">
      <TitleBar index={4} />
      <div
        id="mainContent"
        className="dark:dark flex flex-col bg-background px-32 pt-6 pb-8 gap-8 text-text"
      >
        <div>
          <div className="border-b p-6 pb-4">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-semibold">Cluster Similarities</h2>
            </div>
            <div className="mt-1 flex items-center px-1">
              <Info size={16} className="mr-2" />
              <p>Select a cluster to view details and compare similarities.</p>
            </div>
          </div>
          <div className="scrollbar h-[70vh] flex-grow overflow-y-auto p-6">
            <div className="flex flex-col justify-start gap-1 px-4 pb-2">
              <h5 className="font-medium">Select a cluster:</h5>
              <MainClusterSelector />
            </div>
            {selectedClusterId !== null && (
              <div className="flex flex-col gap-4 px-4">
                <div className="rounded-lg border bg-white shadow-md hover:bg-gray-50 dark:bg-zinc-900 dark:hover:bg-zinc-800">
                  <button
                    onClick={() => setSelectedClusterExpanded((prev) => !prev)}
                    className="flex w-full items-center justify-between p-4 focus:outline-none"
                  >
                    <h2 className="text-2xl font-semibold">
                      Cluster {selectedClusterId}
                    </h2>
                    {selectedClusterExpanded ? (
                      <ChevronUp size={28} className="text-secondary" />
                    ) : (
                      <ChevronDown size={28} className="text-secondary" />
                    )}
                  </button>
                  {selectedClusterExpanded && (
                    <ClusterDetails cluster={selectedCluster} />
                  )}
                </div>
                <div>
                  <div className="p-4">
                    <h5 className="mb-2 font-medium">
                      Compare with another cluster:
                    </h5>
                    <div className="p-4">
                      <ComparisonClusterSelector />
                    </div>
                  </div>
                  {comparisonClusterId !== null &&
                    comparisonClusterId === selectedClusterId && (
                      <div className="flex w-full items-center gap-2 px-8">
                        <AlertCircle size={20} className="text-red-500" />
                        <p className="text-red-500">
                          Cannot compare a cluster with itself.
                        </p>
                      </div>
                    )}
                  {comparisonClusterId !== null &&
                    comparisonClusterId !== selectedClusterId && (
                      <div className="px-8">
                        <div className="rounded bg-white shadow-sm hover:bg-gray-50 dark:bg-zinc-900 dark:hover:bg-zinc-800">
                          <button
                            onClick={() =>
                              setComparisonClusterExpanded((prev) => !prev)
                            }
                            className="flex w-full items-center justify-between p-4 focus:outline-none"
                          >
                            <h2 className="text-2xl font-semibold">
                              Cluster {comparisonClusterId}
                            </h2>
                            {comparisonClusterExpanded ? (
                              <ChevronUp size={28} className="text-secondary" />
                            ) : (
                              <ChevronDown
                                size={28}
                                className="text-secondary"
                              />
                            )}
                          </button>
                          {comparisonClusterExpanded && (
                            <ClusterDetails cluster={comparisonCluster} />
                          )}
                        </div>
                        <div className="mt-2 rounded bg-white p-4 shadow-md dark:bg-zinc-900">
                          <div className="flex justify-between">
                            <p>Similarity:</p>
                            <p>
                              {(
                                getClusterSimilarity(
                                  selectedClusterId,
                                  comparisonClusterId
                                ) * 100
                              ).toFixed(2)}
                              %
                            </p>
                          </div>
                          <div className="flex items-center">
                            <SimilarityVisualizer
                              similarity={getClusterSimilarity(
                                selectedClusterId,
                                comparisonClusterId
                              )}
                              primary={true}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                </div>
                <SimilarClustersList clusterId={selectedClusterId} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const ClusterDetails: React.FC<{
  cluster: _ClusterSimilarityDetail | null;
}> = ({ cluster }) => {
  console.log("Cluster Details: ", cluster);

  if (!cluster) return null;
  return (
    <div className="overflow-hidden rounded-lg border border-dashed border-accent">
      <div className="p-4">
        <div>
          <h3 className="gap-1 p-1 text-xl font-medium">
            Representative Responses:
          </h3>
          {cluster.responses.slice(0, 5).map((response, index) => (
            <div key={index} className="rounded p-3">
              {/* TODO: Better Line Clamping */}
              <p className="line-clamp-2">"{response.text}"</p>
              <div className="mt-2 flex items-center justify-between px-2 text-sm">
                <p>
                  Similarity to cluster center:{" "}
                  <span className="font-semibold">
                    {(response.similarity * 100).toFixed(1)}%
                  </span>
                </p>
                <div className="h-2.5 w-1/2 rounded-full bg-accent-100">
                  <div
                    className="h-2.5 rounded-full bg-accent"
                    style={{
                      width: `${response.similarity * 100}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
