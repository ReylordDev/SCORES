import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  GitMerge,
  List,
  Loader2,
  Pencil,
  Save,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { TitleBar } from "../../components/TitleBar";
import { _ClusterAssignmentDetail } from "../../lib/models";
import ClusterSearchbar from "../../components/ClusterSearchbar";
import { UUID } from "crypto";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { cn } from "../../lib/utils";

function ClusterAssignment({
  cluster,
  searchTerm,
  isExpanded,
  handleClusterClick,
}: {
  cluster: _ClusterAssignmentDetail;
  searchTerm: string;
  isExpanded: boolean;
  handleClusterClick: (clusterId: string) => void;
}) {
  const [previewCount, setPreviewCount] = useState(25);
  const [isEditing, setIsEditing] = useState(false);
  const [nameInput, setNameInput] = useState(cluster.name);

  const handleNameUpdate = () => {
    if (!nameInput || nameInput === cluster.name) {
      setIsEditing(false);
      return;
    }
    window.database.updateClusterName({
      clusterId: cluster.id,
      name: nameInput,
    });
    setIsEditing(false);
  };

  return (
    <Card
      onClick={() => handleClusterClick(cluster.id)}
      className={cn(
        "cursor-default",
        isExpanded && "border-2 border-dashed border-accent",
        !isExpanded && "hover:bg-background-50 dark:hover:bg-background-100",
      )}
    >
      <CardHeader>
        <div className="flex w-full items-center justify-between">
          <div className="flex flex-col gap-1">
            {isEditing ? (
              <div
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-4"
              >
                <Input
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="rounded-md border border-secondary p-2 text-xl focus:outline-none focus:ring focus:ring-secondary focus:ring-opacity-50"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleNameUpdate();
                    if (e.key === "Escape") {
                      setNameInput(cluster.name);
                      setIsEditing(false);
                    }
                  }}
                />
                <Button onClick={handleNameUpdate}>
                  <Save className="text-white" size={24} />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <CardTitle>{nameInput}</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditing(true);
                  }}
                >
                  <Pencil className="text-secondary" size={16} />
                </Button>
              </div>
            )}
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
          {isExpanded ? (
            <Button variant="ghost" size="icon">
              <ChevronUp className="text-primary" size={32} />
            </Button>
          ) : (
            <Button variant="ghost" size="icon">
              <ChevronDown className="text-primary" size={32} />
            </Button>
          )}
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent>
          {cluster.responses.slice(0, previewCount).map((response, index) => (
            <div
              key={index}
              className="flex cursor-default flex-col items-center justify-start gap-3 p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex w-full items-center justify-between">
                <p className="line-clamp-2 cursor-text select-text bg-background px-2">
                  "
                  {response.text
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()) &&
                  searchTerm.length > 0 ? (
                    <>
                      <span>
                        {response.text.slice(
                          0,
                          response.text
                            .toLowerCase()
                            .indexOf(searchTerm.toLowerCase()),
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
                            searchTerm.length,
                        )}
                      </span>
                      <span>
                        {response.text.slice(
                          response.text
                            .toLowerCase()
                            .indexOf(searchTerm.toLowerCase()) +
                            searchTerm.length,
                        )}
                      </span>
                    </>
                  ) : (
                    response.text
                  )}
                  "
                </p>
                {response.count > 1 && (
                  <p className="text-sm text-muted-foreground">
                    {response.count} occurences
                  </p>
                )}
              </div>
              <div className="flex w-full items-end justify-between gap-4">
                <div className="flex w-full flex-col gap-1">
                  <p>Similarity to cluster center:</p>
                  <div className="h-2.5 rounded-full bg-primary-100">
                    <div
                      className="h-2.5 rounded-full bg-primary"
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
              className="flex cursor-default items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <Button onClick={() => setPreviewCount(previewCount + 25)}>
                + {cluster.count - previewCount} more responses in the
                assignments file
              </Button>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export default function ClusterAssignments() {
  const [expandedClusters, setExpandedClusters] = useState<UUID[]>([]);
  const [clusters, setClusters] = useState<_ClusterAssignmentDetail[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [assignmentsFilePath, setAssignmentsFilePath] = useState("");
  const filteredClusters = useMemo(() => {
    if (!searchTerm) return null;
    const lowerSearchTerm = searchTerm.toLowerCase();
    return clusters.filter((cluster) => {
      return (
        cluster.responses.some((response) =>
          response.text.toLowerCase().includes(lowerSearchTerm),
        ) || cluster.name.toLowerCase().includes(lowerSearchTerm)
      );
    });
  }, [searchTerm]);

  const previewClusters = filteredClusters || clusters;

  useEffect(() => {
    const unsubscribe = window.database.onReceiveCurrentClusterAssignments(
      (clusterAssignments) => {
        console.log("Received current clusters");
        console.log(clusterAssignments);
        clusterAssignments.clusters.forEach((cluster) => {
          cluster.responses.sort((a, b) => b.similarity - a.similarity);
        });
        setClusters(clusterAssignments.clusters);
      },
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    console.log("Requesting current clusters");
    window.database.requestCurrentClusterAssignments();
  }, []);

  useEffect(() => {
    const unsubscribe = window.database.onReceiveCurrentRun((currentRun) => {
      setAssignmentsFilePath(currentRun.run.assignments_file_path);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    window.database.requestCurrentRun();
  }, []);

  const toggleCluster = (clusterId: UUID) => {
    setExpandedClusters((prev) =>
      prev.includes(clusterId)
        ? prev.filter((i) => i !== clusterId)
        : [...prev, clusterId],
    );
  };

  return (
    <div className="h-screen w-screen">
      <TitleBar index={5} />
      <div
        id="mainContent"
        className="dark:dark flex select-none flex-col gap-8 bg-background px-32 pb-8 pt-6 text-text"
      >
        <div className="flex items-center justify-between">
          <h1 className="text-4xl">Cluster Assignments</h1>
          <div className="flex flex-col items-center justify-center gap-2">
            <Button
              onClick={() => {
                window.electron.showItemInFolder(assignmentsFilePath);
              }}
            >
              <List />
              View Assignments File
            </Button>
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <ClusterSearchbar
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            placeholder={"Search by response content or cluster name"}
          />
          <div className="flex items-center justify-between">
            {clusters.length > 0 && (
              <p className="px-4 text-xl">{previewClusters.length} Clusters</p>
            )}
            {searchTerm && (
              <p className="px-4 text-xl">
                {previewClusters.reduce(
                  (acc, cluster) => acc + cluster.count,
                  0,
                )}{" "}
                matching responses
              </p>
            )}
          </div>
        </div>
        {clusters.length === 0 ? (
          <div className="flex w-full items-start justify-center p-4">
            <p className="text-lg">Loading Cluster Assignments</p>
            <Loader2 className="ml-2 animate-spin" />
          </div>
        ) : (
          <div className="scrollbar flex flex-grow flex-col gap-4 overflow-y-auto pr-4 pt-0">
            {previewClusters.map((cluster) => (
              <div key={cluster.id}>
                <ClusterAssignment
                  cluster={cluster}
                  searchTerm={searchTerm}
                  isExpanded={expandedClusters.includes(cluster.id)}
                  handleClusterClick={toggleCluster}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
