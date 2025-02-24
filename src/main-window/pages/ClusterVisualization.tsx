import { _ClusterPositionDetail } from "../../lib/models";
import { TitleBar } from "../../components/TitleBar";
import { useEffect, useState } from "react";
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

const getClusterColor = (index: number, totalClusters: number) => {
  if (totalClusters === 0) return "#cccccc";
  const hue = (index * 360) / totalClusters;
  const lightness = 30 + (index % 3) * 10; // Vary between 30-50% lightness
  return `hsl(${hue}, 100%, ${lightness}%)`;
};

export default function ClusterVisualization() {
  const [clusterPositions, setClusterPositions] = useState<
    _ClusterPositionDetail[]
  >([]);
  const [selectedClusters, setSelectedClusters] = useState<number[]>([]);
  const [xRange, setXRange] = useState<number[]>([]);
  const [yRange, setYRange] = useState<number[]>([]);

  useEffect(() => {
    const unsub = window.plots.onReceiveClusterPositions((clusterPositions) => {
      console.log(clusterPositions);
      setClusterPositions(clusterPositions.clusters);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    window.plots.getClusterPositions();
  }, []);

  // Initialize selected clusters when positions update
  useEffect(() => {
    if (clusterPositions.length > 0) {
      setSelectedClusters(clusterPositions.map((c) => c.index));
    }
  }, [clusterPositions]);

  // Initialize plot ranges using max and min values
  useEffect(() => {
    const margin = 2;
    if (clusterPositions.length > 0) {
      const xValues = clusterPositions.flatMap((c) =>
        c.responses.map((r) => r.x)
      );
      const yValues = clusterPositions.flatMap((c) =>
        c.responses.map((r) => r.y)
      );
      setXRange([Math.min(...xValues) - margin, Math.max(...xValues) + margin]);
      setYRange([Math.min(...yValues) - margin, Math.max(...yValues) + margin]);
    }
  }, [clusterPositions]);

  const toggleCluster = (clusterIndex: number) => {
    if (clusterIndex === -1) {
      setSelectedClusters((prev) =>
        prev.length === clusterPositions.length
          ? []
          : clusterPositions.map((c) => c.index)
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
  const plotData = clusterPositions
    .filter((cluster) => selectedClusters.includes(cluster.index))
    .flatMap((cluster) => {
      const color = getClusterColor(cluster.index, clusterPositions.length);

      // Response points trace
      const responsesTrace = {
        x: cluster.responses.map((r) => r.x),
        y: cluster.responses.map((r) => r.y),
        mode: "markers",
        type: "scatter",
        name: `${cluster.index}: ${cluster.name.slice(0, 50)}`,
        marker: {
          color: color,
          opacity: 0.7,
          size: 8,
        },
        hoverinfo: "text",
        text: cluster.responses.map((r) => r.text),
      };

      // Cluster center trace
      const centerTrace = {
        x: [cluster.x],
        y: [cluster.y],
        mode: "text+markers",
        type: "scatter",
        marker: {
          symbol: "star",
          size: 12,
          color: color,
        },
        text: [cluster.index.toString()],
        textposition: "top center",
        textfont: {
          size: 16,
          weight: 400,
          shadow: "auto",
          family: "Poppins",
        },
        textinfo: "text",
        showlegend: false,
        hoverinfo: "none",
      };

      return [responsesTrace, centerTrace];
    });

  return (
    <div className="w-screen h-screen bg-background text-text">
      <TitleBar index={5} />
      <div
        id="mainContent"
        className="dark:dark flex flex-col px-32 pt-6 pb-8 gap-8"
      >
        <div className="flex justify-between items-center">
          <h1 className="text-4xl">Cluster Visualization</h1>
          <Dialog>
            <DialogTrigger>
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
                clusters={clusterPositions}
                selectedClusters={selectedClusters}
                onToggleCluster={toggleCluster}
              />
            </DialogContent>
          </Dialog>
        </div>
        {/* <ClusterLegend
          clusters={clusterPositions}
          selectedClusters={selectedClusters}
          onToggleCluster={toggleCluster}
        /> */}
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
              range: xRange,
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
              range: yRange,
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
            scrollZoom: false,
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
      </div>
    </div>
  );
}

const ClusterLegend = ({
  clusters,
  selectedClusters,
  onToggleCluster,
}: {
  clusters: _ClusterPositionDetail[];
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
                backgroundColor: getClusterColor(
                  cluster.index,
                  clusters.length
                ),
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
