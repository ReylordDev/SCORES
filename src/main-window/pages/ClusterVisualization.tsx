import { ClusterPositionDetail } from "../../lib/models";
import { TitleBar } from "../../components/TitleBar";
import { useEffect, useMemo, useState } from "react";
import Plot from "react-plotly.js";
import { Data } from "plotly.js";
import { Input } from "../../components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Label } from "../../components/ui/label";
import { Switch } from "../../components/ui/switch";
import { Separator } from "../../components/ui/separator";
import { cn } from "../../lib/utils";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const getClusterColor = (index: number, totalClusters: number) => {
  if (totalClusters === 0) return "#cccccc";
  // Use modulo to wrap around if index exceeds total clusters
  const hue = ((index % totalClusters) * 360) / totalClusters;
  return `hsl(${hue}, 80%, 50%)`;
};

interface Range2d {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

interface Range3d {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
}

export default function ClusterVisualization() {
  const [clusters, setClusters] = useState<ClusterPositionDetail[]>([]);
  const [selectedClusters, setSelectedClusters] = useState<number[]>([]);
  const [range2d, setRange2d] = useState<Range2d>({
    minX: 0,
    maxX: 0,
    minY: 0,
    maxY: 0,
  });
  const [range3d, setRange3d] = useState<Range3d>({
    minX: 0,
    maxX: 0,
    minY: 0,
    maxY: 0,
    minZ: 0,
    maxZ: 0,
  });
  const [use3d, setUse3d] = useState(false);

  useEffect(() => {
    const unsub = window.plots.onReceiveClusterPositions((clusterPositions) => {
      console.log("clusterPositions", clusterPositions);
      const clusters = clusterPositions.clusters.map((c) => ({
        ...c,
        color: getClusterColor(c.index, clusterPositions.clusters.length),
      }));
      setClusters(clusters);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    window.plots.getClusterPositions();
  }, []);

  // Initialize selected clusters when positions update
  useEffect(() => {
    if (clusters.length > 0) {
      setSelectedClusters(clusters.map((c) => c.index));
    }
  }, [clusters]);

  // Initialize plot ranges using max and min values
  useEffect(() => {
    const margin = 2;
    if (clusters.length > 0) {
      const xValues2d = clusters.flatMap((c) =>
        c.responses.map((r) => r.pos_2d.x),
      );
      const yValues2d = clusters.flatMap((c) =>
        c.responses.map((r) => r.pos_2d.y),
      );
      setRange2d({
        minX: Math.min(...xValues2d) - margin,
        maxX: Math.max(...xValues2d) + margin,
        minY: Math.min(...yValues2d) - margin,
        maxY: Math.max(...yValues2d) + margin,
      });
      const xValues3d = clusters.flatMap((c) =>
        c.responses.map((r) => r.pos_3d.x),
      );
      const yValues3d = clusters.flatMap((c) =>
        c.responses.map((r) => r.pos_3d.y),
      );
      const zValues3d = clusters.flatMap((c) =>
        c.responses.map((r) => r.pos_3d.z),
      );
      setRange3d({
        minX: Math.min(...xValues3d) - margin,
        maxX: Math.max(...xValues3d) + margin,
        minY: Math.min(...yValues3d) - margin,
        maxY: Math.max(...yValues3d) + margin,
        minZ: Math.min(...zValues3d) - margin,
        maxZ: Math.max(...zValues3d) + margin,
      });
    }
  }, [clusters]);

  const toggleCluster = (clusterIndex: number) => {
    if (clusterIndex === -1) {
      setSelectedClusters((prev) =>
        prev.length === clusters.length ? [] : clusters.map((c) => c.index),
      );
      return;
    }
    setSelectedClusters((prev) =>
      prev.includes(clusterIndex)
        ? prev.filter((i) => i !== clusterIndex)
        : [...prev, clusterIndex],
    );
  };

  // Generate plot data dynamically from cluster positions
  const plotData2d = useMemo(() => {
    return clusters
      .filter((cluster) => selectedClusters.includes(cluster.index))
      .flatMap((cluster) => {
        const color = cluster.color;

        // Response points trace
        const responsesTrace = {
          x: cluster.responses.map((r) => r.pos_2d.x),
          y: cluster.responses.map((r) => r.pos_2d.y),
          mode: "markers",
          type: "scatter",
          marker: { color, opacity: 0.7, size: 8 },
          hoverinfo: "text",
          text: cluster.responses.map((r) => r.text),
        };

        // Cluster center trace
        const centerTrace = {
          x: [cluster.pos_2d.x],
          y: [cluster.pos_2d.y],
          mode: "text+markers",
          type: "scatter",
          marker: { symbol: "star", size: 12, color },
          text: [cluster.index.toString()],
          textposition: "top center",
          textfont: { size: 16, weight: 400, family: "Poppins" },
          showlegend: false,
          hoverinfo: "name",
          name: `${cluster.index}: ${cluster.name.slice(0, 50)}`,
          hoverlabel: {
            align: "left",
            namelength: -1,
            font: {
              family: "Poppins",
              size: 16,
            },
            bgcolor: "white",
            bordercolor: "black",
          },
        };

        return [responsesTrace, centerTrace];
      });
  }, [clusters, selectedClusters]);

  const plotData3d = useMemo(() => {
    return clusters
      .filter((cluster) => selectedClusters.includes(cluster.index))
      .flatMap((cluster) => {
        const color = cluster.color;

        // Response points trace
        const responsesTrace = {
          x: cluster.responses.map((r) => r.pos_3d.x),
          y: cluster.responses.map((r) => r.pos_3d.y),
          z: cluster.responses.map((r) => r.pos_3d.z),
          mode: "markers",
          type: "scatter3d",
          name: `${cluster.index}: ${cluster.name.slice(0, 50)}`,
          marker: { color, opacity: 0.7, size: 6 },
          hoverinfo: "text",
          text: cluster.responses.map((r) => r.text),
        };

        // Cluster center trace
        const centerTrace = {
          x: [cluster.pos_3d.x],
          y: [cluster.pos_3d.y],
          z: [cluster.pos_3d.z],
          mode: "text+markers",
          type: "scatter3d",
          marker: { symbol: "star", size: 10, color },
          text: [cluster.index.toString()],
          textposition: "top center",
          textfont: { size: 16, weight: 400, family: "Poppins" },
          showlegend: false,
          hoverinfo: "name",
          name: `${cluster.index}: ${cluster.name.slice(0, 50)}`,
          hoverlabel: {
            align: "left",
            namelength: -1,
            font: {
              family: "Poppins",
              size: 16,
            },
            bgcolor: "white",
            bordercolor: "black",
          },
        };

        return [responsesTrace, centerTrace];
      });
  }, [clusters, selectedClusters]);

  return (
    <div className="h-screen w-screen bg-background text-text">
      <TitleBar index={5} />
      <div
        id="mainContent"
        className="dark:dark flex select-none flex-col gap-8 px-32 pb-8 pt-6"
      >
        <div className="flex items-center justify-between">
          <h1 className="text-4xl">Cluster Visualization</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-text shadow-sm dark:border-background-200 dark:bg-background-100">
              2D
              <Switch
                checked={use3d}
                onCheckedChange={() => {
                  toast.promise(
                    new Promise((resolve) => {
                      setTimeout(() => {
                        setUse3d((prev) => !prev);
                        resolve(true);
                      }, 100);
                    }),
                    {
                      loading: `Switching to ${use3d ? "2D" : "3D"}...`,
                      success: `Switched to ${use3d ? "2D" : "3D"}!`,
                      error: `Failed to switch to ${use3d ? "2D" : "3D"}.`,
                    },
                  );
                }}
              ></Switch>
              3D
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="default">Show Interaction Instructions</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="text-xl">Interaction</DialogTitle>
                  <DialogDescription>
                    How to interact with the plot.
                  </DialogDescription>
                </DialogHeader>
                <div className={cn("flex flex-col items-start gap-2")}>
                  <h2 className="text-lg font-semibold">2D Instructions</h2>
                  <ul className="list-inside list-disc">
                    <li>Click and drag to select an area to zoom into.</li>
                    <li>Double-click to reset the zoom.</li>
                  </ul>
                </div>
                <Separator className="my-2" />
                <div className={cn("flex flex-col items-start gap-2")}>
                  <h2 className="text-lg font-semibold">3D Instructions</h2>
                  <ul className="list-inside list-disc">
                    <li>Click and drag to rotate the plot.</li>
                    <li>Scroll to zoom in/out.</li>
                    <li>Right-click and drag to pan.</li>
                  </ul>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="default">Show Legend</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Cluster Legend</DialogTitle>
                  <DialogDescription>
                    Toggle the visibility of clusters in the plot.
                  </DialogDescription>
                </DialogHeader>
                <ClusterLegend
                  clusters={clusters}
                  selectedClusters={selectedClusters}
                  onToggleCluster={toggleCluster}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <Card>
          <CardContent>
            {clusters.length === 0 ? (
              <div className="flex h-[70vh] w-full items-center justify-center">
                <p>Loading Cluster Positions</p>
                <Loader2 className="ml-2 animate-spin" />
              </div>
            ) : (
              <div className="h-[70vh] w-full">
                {use3d ? (
                  <Plot3d plotData={plotData3d as Data[]} range3d={range3d} />
                ) : (
                  <Plot2d
                    plotData={plotData2d as Data[]}
                    range2d={range2d}
                    setRange2d={setRange2d}
                  />
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

const Plot2d = ({
  plotData,
  range2d,
  setRange2d,
}: {
  plotData: Data[];
  range2d: Range2d;
  setRange2d: (range: Range2d) => void;
}) => {
  return (
    <Plot
      data={plotData as Data[]}
      layout={{
        showlegend: false,
        hoverlabel: {
          bgcolor: "white",
          font: {
            family: "Poppins",
            size: 14,
          },
        },
        hovermode: "closest",
        autosize: true,
        xaxis: {
          title: "X",
          showgrid: true,
          zeroline: false,
          rangeselector: {
            font: {
              family: "Poppins",
              size: 14,
            },
          },
          autorange: false,
          range: [range2d.minX, range2d.maxX],
        },
        yaxis: {
          title: "Y",
          showgrid: true,
          zeroline: false,
          rangeselector: {
            font: {
              family: "Poppins",
              size: 14,
            },
          },
          autorange: false,
          range: [range2d.minY, range2d.maxY],
        },
        margin: {
          l: 25,
          r: 25,
          b: 25,
          t: 25,
          pad: 0,
        },
      }}
      config={{
        displayModeBar: false,
        staticPlot: false,
        showAxisDragHandles: false,
        showTips: false,
        doubleClick: false,
      }}
      style={{
        width: "100%",
        height: "100%",
      }}
      onDoubleClick={() => {
        console.log("Double click detected");
        // This is strange but functional
        setRange2d({
          minX: range2d.minX,
          maxX: range2d.maxX,
          minY: range2d.minY,
          maxY: range2d.maxY,
        });
      }}
      onRelayout={(eventData) => {
        console.log("Re Layout eventData", eventData);
        const xaxisRange = eventData["xaxis.range"];
        const yaxisRange = eventData["yaxis.range"];
        if (xaxisRange && yaxisRange) {
          const [minX, maxX] = xaxisRange;
          const [minY, maxY] = yaxisRange;
          setRange2d({
            minX: minX as number,
            maxX: maxX as number,
            minY: minY as number,
            maxY: maxY as number,
          });
        }
      }}
    />
  );
};

const Plot3d = ({
  plotData,
  range3d,
}: {
  plotData: Data[];
  range3d: Range3d;
}) => {
  return (
    <Plot
      data={plotData}
      layout={{
        showlegend: false,
        hoverlabel: {
          bgcolor: "white",
          font: {
            family: "Poppins",
            size: 14,
          },
        },
        hovermode: "closest",
        autosize: true,
        scene: {
          xaxis: { title: "X", range: [range3d.minX, range3d.maxX] },
          yaxis: { title: "Y", range: [range3d.minY, range3d.maxY] },
          zaxis: { title: "Z", range: [range3d.minZ, range3d.maxZ] },
        },
        margin: {
          l: 25,
          r: 25,
          b: 25,
          t: 25,
          pad: 0,
        },
      }}
      config={{
        displayModeBar: false,
        staticPlot: false,
        showAxisDragHandles: false,
      }}
      style={{ width: "100%", height: "100%" }}
    />
  );
};

const ClusterLegend = ({
  clusters,
  selectedClusters,
  onToggleCluster,
}: {
  clusters: ClusterPositionDetail[];
  selectedClusters: number[];
  onToggleCluster: (clusterIndex: number) => void;
}) => {
  const maxLabelLength = 30;

  return (
    <Card className="flex flex-col gap-4 overflow-y-auto">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle>Visible Clusters</CardTitle>
          <Button
            variant="secondary"
            onClick={() => {
              onToggleCluster(-1);
            }}
          >
            {selectedClusters.length === clusters.length
              ? "Hide All"
              : "Show All"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex max-h-96 flex-col items-start justify-start gap-1 overflow-y-auto pb-1">
        {clusters.map((cluster) => (
          <Label
            key={cluster.id}
            className="flex w-full items-center gap-2 rounded px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Input
              type="checkbox"
              checked={selectedClusters.includes(cluster.index)}
              onChange={() => onToggleCluster(cluster.index)}
              className="size-4"
            />
            <span
              className="size-4 rounded-full"
              style={{
                backgroundColor: cluster.color,
              }}
            />
            <span className="text-base">
              {cluster.index}: {cluster.name.slice(0, maxLabelLength)}
              {cluster.name.length > maxLabelLength && "..."}
            </span>
            <span className="ml-1 text-xs text-gray-500">
              ({cluster.count})
            </span>
          </Label>
        ))}
      </CardContent>
    </Card>
  );
};
