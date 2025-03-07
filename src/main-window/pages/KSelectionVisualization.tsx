import { KSelectionStatistic } from "../../lib/models";
import { TitleBar } from "../../components/TitleBar";
import { useEffect, useState } from "react";
import Plot from "react-plotly.js";
import { Data, ScatterData } from "plotly.js";

export default function KSelectionVisualization() {
  const [stats, setStats] = useState<KSelectionStatistic[]>([]);
  const [optimalK, setOptimalK] = useState<number | null>(null);

  useEffect(() => {
    const unsubscribe = window.plots.onReceiveSelectionStats(
      (stats: KSelectionStatistic[]) => {
        console.log("stats", stats);
        setStats(stats); // Update state with received stats
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    window.plots.requestSelectionStats();
  }, []);

  useEffect(() => {
    if (stats.length > 0) {
      const optimal = stats.reduce((prev, current) =>
        prev.combined > current.combined ? prev : current
      );
      setOptimalK(optimal.k);
    }
  }, [stats]);

  // Generate plot traces for each metric
  const traces = [
    {
      x: stats.filter((s) => s.silhouette !== null).map((s) => s.k),
      y: stats.filter((s) => s.silhouette !== null).map((s) => s.silhouette),
      type: "scatter",
      mode: "lines+markers",
      name: "Silhouette Score",
      opacity: 0.5,
    },
    {
      x: stats.filter((s) => s.davies_bouldin !== null).map((s) => s.k),
      y: stats
        .filter((s) => s.davies_bouldin !== null)
        .map((s) => s.davies_bouldin),
      type: "scatter",
      mode: "lines+markers",
      name: "Davies-Bouldin Index",
      opacity: 0.5,
    },
    {
      x: stats.filter((s) => s.calinski_harabasz !== null).map((s) => s.k),
      y: stats
        .filter((s) => s.calinski_harabasz !== null)
        .map((s) => s.calinski_harabasz),
      type: "scatter",
      mode: "lines+markers",
      name: "Calinski-Harabasz Score",
      opacity: 0.5,
    },
    {
      x: stats.filter((s) => s.combined !== null).map((s) => s.k),
      y: stats.filter((s) => s.combined !== null).map((s) => s.combined),
      type: "scatter",
      mode: "lines+markers",
      name: "Combined Score",
      opacity: 1,
      line: {
        color: "rgb(137, 44, 211)",
        width: 2,
      },
    },
    {
      x: [optimalK, optimalK],
      y: [0, 1],
      type: "scatter",
      mode: "lines",
      line: {
        dash: "dot",
        color: "red",
      },
      name: "Selected Cluster Count",
    },
  ];

  return (
    <div className="w-screen h-screen">
      <TitleBar index={5} />
      <div
        id="mainContent"
        className="dark:dark flex flex-col bg-background px-32 pt-6 pb-8 gap-8 text-text select-none"
      >
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl">Cluster Count Visualization</h1>
          <p>
            The selected number of clusters is{" "}
            <span className="font-bold">{optimalK}</span>, based on the combined
            score of the evaluation metrics.
          </p>
        </div>
        <Plot
          data={traces as Data[]}
          layout={{
            title: "Cluster Evaluation Metrics vs. Number of Clusters (k)",
            xaxis: { title: "Number of Clusters (k)", dtick: 5 },
            yaxis: {
              title: "Score",
              dtick: 0.1,
            },
            legend: {
              font: {
                family: "Poppins",
                size: 14,
                weight: 100,
              },
            },
            showlegend: true,
            autosize: true,
            paper_bgcolor: "#f9f4fd",
            plot_bgcolor: "#f9f4fd",
            margin: {
              l: 50,
              r: 0,
              b: 50,
              t: 50,
              pad: 0,
            },
          }}
          config={{
            displayModeBar: false,
            staticPlot: false,
            scrollZoom: false,
            showAxisDragHandles: false,
            showTips: false,
          }}
          style={{ width: "100%", height: "600px" }}
        />
      </div>
    </div>
  );
}
