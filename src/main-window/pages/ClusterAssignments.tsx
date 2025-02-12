import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, List, Search, Ellipsis } from "lucide-react";
import { Button } from "../../components/ui/button";
import { TitleBar } from "../../components/TitleBar";
import { _ClusterAssignmentDetail } from "../../lib/models";

export default function ClusterAssignments() {
  const [expandedClusters, setExpandedClusters] = useState<number[]>([]);
  const [clusters, setClusters] = useState<_ClusterAssignmentDetail[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const previewCount = 50;
  const filteredClusters = useMemo(() => {
    if (!searchTerm) return null;
    const lowerSearchTerm = searchTerm.toLowerCase();
    return clusters.filter((cluster) => {
      return cluster.responses.some((response) =>
        response.text.toLowerCase().includes(lowerSearchTerm)
      );
    });
  }, [searchTerm]);

  const previewClusters = filteredClusters || clusters;

  useEffect(() => {
    const unsubscribe = window.database.onReceiveCurrentClusters(
      (clusterAssignments) => {
        console.log("Received current clusters");
        console.log(clusterAssignments);
        clusterAssignments.clusters.forEach((cluster) => {
          cluster.responses.sort((a, b) => b.similarity - a.similarity);
        });
        setClusters(clusterAssignments.clusters);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    console.log("Requesting current clusters");
    window.database.requestCurrentClusters();
  }, []);

  const toggleCluster = (clusterIndex: number) => {
    setExpandedClusters((prev) =>
      prev.includes(clusterIndex)
        ? prev.filter((i) => i !== clusterIndex)
        : [...prev, clusterIndex]
    );
  };

  return (
    <div className="w-screen h-screen">
      <TitleBar index={5} />
      <div
        id="mainContent"
        className="dark:dark flex flex-col bg-background px-32 pt-6 pb-8 gap-8 text-text"
      >
        <div>
          <div className="flex items-center justify-between border-b p-6 pb-4">
            <h2 className="text-3xl font-semibold">Cluster Assignments</h2>
            <div className="flex flex-col items-center justify-center gap-2">
              <Button onClick={() => console.log("Viewing assignments file")}>
                <List />
                View Assignments File
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between border-b p-6 pb-4">
            <div className="flex w-full items-center justify-center gap-4">
              <div className="relative flex w-full flex-col gap-1">
                <div className="flex h-12 items-center gap-2 rounded-md border-2 border-primary bg-white p-2 dark:bg-zinc-900">
                  <Search size={20} className="text-gray-400" />
                  <input
                    type="text"
                    className="w-full focus:outline-none"
                    placeholder="Search by response content..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="scrollbar flex max-h-[65vh] flex-grow flex-col gap-4 overflow-y-auto p-6">
            {previewClusters.map((cluster, index) => (
              <div
                key={cluster.id}
                className="rounded-lg border bg-white shadow-md hover:bg-gray-50 dark:bg-zinc-900 dark:hover:bg-zinc-800"
              >
                <button
                  onClick={() => toggleCluster(index)}
                  className="flex w-full items-center justify-between p-4 px-8 focus:outline-none"
                >
                  <h2 className="text-2xl font-semibold">
                    {cluster.name} ({cluster.responses.length} responses)
                  </h2>
                  {expandedClusters.includes(index) ? (
                    <ChevronUp className="text-primary" size={32} />
                  ) : (
                    <ChevronDown className="text-primary" size={32} />
                  )}
                </button>
                {expandedClusters.includes(index) && (
                  <div className="overflow-hidden rounded-lg border border-dashed border-primary">
                    <div className="flex flex-col gap-2 p-4">
                      {cluster.responses
                        .slice(0, previewCount)
                        .map((response, index) => (
                          <div
                            key={index}
                            className={`rounded p-3 ${response.text.toLocaleLowerCase().includes(searchTerm.toLocaleLowerCase()) && searchTerm.length > 0 && "bg-accent-50"}`}
                          >
                            {/* TODO: Better Line Clamping */}
                            {/* <p className="line-clamp-2">"{response.response}"</p> */}
                            {response.text
                              .toLowerCase()
                              .includes(searchTerm.toLowerCase()) ? (
                              <>
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
                            ) : (
                              <span>"{response.text}"</span>
                            )}
                            <div className="mt-3 flex items-end justify-between">
                              <div className="flex w-full flex-col">
                                <p>Similarity to cluster center: </p>
                                <div className="h-2.5 rounded-full bg-primary-100">
                                  <div
                                    className="h-2.5 rounded-full bg-primary"
                                    style={{
                                      width: `${response.similarity * 100}%`,
                                    }}
                                  ></div>
                                </div>
                              </div>
                              <span className="flex w-28 items-center justify-end gap-2 text-xl">
                                {(response.similarity * 100).toFixed(2)}%
                              </span>
                            </div>
                          </div>
                        ))}
                      {cluster.responses
                        .slice(previewCount)
                        .filter(
                          (response) =>
                            response.text
                              .toLowerCase()
                              .includes(searchTerm.toLowerCase()) &&
                            searchTerm.length > 0
                        ).length > 0 &&
                        cluster.responses
                          .slice(previewCount)
                          .filter(
                            (response) =>
                              response.text
                                .toLowerCase()
                                .includes(searchTerm.toLowerCase()) &&
                              searchTerm.length > 0
                          )
                          .map((response, index) => (
                            <div key={index}>
                              <div className="flex w-full justify-center p-4">
                                <Ellipsis size={24} />
                              </div>
                              <div className="rounded bg-accent-50 p-3">
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
                                <div className="mt-3 flex items-end justify-between">
                                  <div className="flex w-full flex-col">
                                    <p>Similarity to cluster center: </p>
                                    <div className="h-2.5 rounded-full bg-primary-100">
                                      <div
                                        className="h-2.5 rounded-full bg-primary"
                                        style={{
                                          width: `${response.similarity * 100}%`,
                                        }}
                                      ></div>
                                    </div>
                                  </div>
                                  <span className="flex w-28 items-center justify-end gap-2 text-xl">
                                    {(response.similarity * 100).toFixed(2)}%
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                      {cluster.responses.length > previewCount && (
                        <div className="flex items-center justify-center p-4">
                          <p>
                            +{" "}
                            {cluster.responses.length -
                              previewCount -
                              cluster.responses.filter(
                                (response) =>
                                  response.text
                                    .toLowerCase()
                                    .includes(searchTerm.toLowerCase()) &&
                                  searchTerm.length > 0
                              ).length}{" "}
                            more responses in the assignments file
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
