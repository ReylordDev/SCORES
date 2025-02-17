import { _ClusterPositionDetail } from "../../lib/models";
import { TitleBar } from "../../components/TitleBar";
import { useEffect, useState } from "react";
import Plot from "react-plotly.js";
import { Data, ScatterData } from "plotly.js";

// Define a color sequence for clusters
const CLUSTER_COLORS = [
  "#1f77b4",
  "#ff7f0e",
  "#2ca02c",
  "#d62728",
  "#9467bd",
  "#8c564b",
  "#e377c2",
  "#7f7f7f",
  "#bcbd22",
  "#17becf",
];

export default function ClusterVisualization() {
  const [clusterPositions, setClusterPositions] = useState<
    _ClusterPositionDetail[]
  >([]);

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

  // Generate plot data dynamically from cluster positions
  const plotData = clusterPositions.flatMap((cluster, idx) => {
    const color = CLUSTER_COLORS[idx % CLUSTER_COLORS.length];

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
        size: 14,
        weight: 100,
        family: "Poppins",
      },
      showlegend: false,
      hoverinfo: "none",
    };

    return [responsesTrace, centerTrace];
  });

  return (
    <div className="w-screen h-screen">
      <TitleBar index={5} />
      <div
        id="mainContent"
        className="dark:dark flex flex-col bg-background px-32 pt-6 pb-8 gap-8 text-text"
      >
        <h1 className="text-4xl">Cluster Visualization</h1>
        <Plot
          data={plotData as Data[]}
          layout={{
            title: "Cluster Positions with Response Points",
            paper_bgcolor: "#f9f4fd",
            plot_bgcolor: "#f9f4fd",
            showlegend: true,
            legend: {
              x: 1.05,
              xanchor: "left",
              y: 1,
              font: {
                family: "Poppins",
                size: 14,
                weight: 100,
              },
            },
            hovermode: "closest",
            autosize: true,
          }}
          style={{ width: "100%", height: "80vh" }}
        />
      </div>
    </div>
  );
}
