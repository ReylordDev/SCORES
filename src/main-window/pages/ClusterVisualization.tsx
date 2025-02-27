import { ClusterPositionDetail } from "../../lib/models";
import { TitleBar } from "../../components/TitleBar";
import { useEffect, useMemo, useState } from "react";
import Plot from "react-plotly.js";
import { Data, ScatterData } from "plotly.js";
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
        c.responses.map((r) => r.pos_2d.x)
      );
      const yValues2d = clusters.flatMap((c) =>
        c.responses.map((r) => r.pos_2d.y)
      );
      setRange2d({
        minX: Math.min(...xValues2d) - margin,
        maxX: Math.max(...xValues2d) + margin,
        minY: Math.min(...yValues2d) - margin,
        maxY: Math.max(...yValues2d) + margin,
      });
      const xValues3d = clusters.flatMap((c) =>
        c.responses.map((r) => r.pos_3d.x)
      );
      const yValues3d = clusters.flatMap((c) =>
        c.responses.map((r) => r.pos_3d.y)
      );
      const zValues3d = clusters.flatMap((c) =>
        c.responses.map((r) => r.pos_3d.z)
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
        prev.length === clusters.length ? [] : clusters.map((c) => c.index)
      );
      return;
    }
    setSelectedClusters((prev) =>
      prev.includes(clusterIndex)
        ? prev.filter((i) => i !== clusterIndex)
        : [...prev, clusterIndex]
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
          name: `${cluster.index}: ${cluster.name.slice(0, 50)}`,
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
          name: `${cluster.index}: ${cluster.name.slice(0, 50)}`,
          hoverinfo: "name",
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
          name: `${cluster.index}: ${cluster.name.slice(0, 50)}`,
          hoverinfo: "name",
        };

        return [responsesTrace, centerTrace];
      });
  }, [clusters, selectedClusters]);

  return (
    <div className="w-screen h-screen bg-background text-text">
      <TitleBar index={5} />
      <div
        id="mainContent"
        className="dark:dark flex flex-col px-32 pt-6 pb-8 gap-8"
      >
        <div className="flex justify-between items-center">
          <h1 className="text-4xl">Cluster Visualization</h1>
          <div className="flex items-center gap-2">
            2D
            <Switch checked={use3d} onCheckedChange={setUse3d}></Switch>
            3D
          </div>
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
        {use3d ? (
          <Plot3d plotData={plotData3d as Data[]} range3d={range3d} />
        ) : (
          <Plot2d plotData={plotData2d as Data[]} range2d={range2d} />
        )}
      </div>
    </div>
  );
}

const Plot2d = ({
  plotData,
  range2d,
}: {
  plotData: Data[];
  range2d: Range2d;
}) => {
  return (
    <Plot
      data={plotData as Data[]}
      layout={{
        title: "Cluster Positions with Response Points",
        paper_bgcolor: "#f9f4fd",
        plot_bgcolor: "#f9f4fd",
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
          l: 50,
          r: 0,
          b: 50,
          t: 0,
          pad: 0,
        },
      }}
      config={{
        displayModeBar: false,
        staticPlot: false,
        showAxisDragHandles: false,
      }}
      style={{
        width: "100%",
        height: "100%",
      }}
      onClick={(event) => {
        const points = event.points;
        if (points[0]?.curveNumber % 2 === 1) {
          // Center traces are odd indices
          const clusterIndex = points[0].data.text[0];
          // Not doing anything with this yet.
          // toggleCluster(Number(clusterIndex));
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
        title: "Cluster Positions with Response Points (3D)",
        paper_bgcolor: "#f9f4fd",
        plot_bgcolor: "#f9f4fd",
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
        margin: { l: 50, r: 0, b: 50, t: 0, pad: 0 },
      }}
      config={{
        displayModeBar: false,
        staticPlot: false,
        showAxisDragHandles: false,
      }}
      style={{ width: "100%", height: "100%" }}
      onClick={(event) => {
        const points = event.points;
        if (points[0]?.curveNumber % 2 === 1) {
          const clusterIndex = points[0].data.text[0];
          // toggleCluster(Number(clusterIndex)); // Uncomment if needed
        }
      }}
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
        <div className="flex justify-between items-center">
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
      <CardContent className="flex flex-col justify-start items-start gap-1 overflow-y-auto max-h-96 pb-1">
        {clusters.map((cluster) => (
          <Label
            key={cluster.id}
            className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded py-2 px-4 w-full"
          >
            <Input
              type="checkbox"
              checked={selectedClusters.includes(cluster.index)}
              onChange={() => onToggleCluster(cluster.index)}
              className="cursor-pointer size-4"
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
            <span className="text-xs text-gray-500 ml-1">
              ({cluster.count})
            </span>
          </Label>
        ))}
      </CardContent>
    </Card>
  );
};
