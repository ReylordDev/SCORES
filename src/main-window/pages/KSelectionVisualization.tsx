import { KSelectionStatistic } from "../../lib/models";
import { TitleBar } from "../../components/TitleBar";
import { useEffect, useState } from "react";
import Plot from "react-plotly.js";
import { Data } from "plotly.js";

export default function KSelectionVisualization() {
  const [stats, setStats] = useState<KSelectionStatistic[]>([]);

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

  // Generate plot traces for each metric
  const traces = [
    {
      x: stats.filter((s) => s.silhouette !== null).map((s) => s.k),
      y: stats.filter((s) => s.silhouette !== null).map((s) => s.silhouette),
      type: "scatter",
      mode: "lines+markers",
      name: "Silhouette Score",
    },
    {
      x: stats.filter((s) => s.davies_bouldin !== null).map((s) => s.k),
      y: stats
        .filter((s) => s.davies_bouldin !== null)
        .map((s) => s.davies_bouldin),
      type: "scatter",
      mode: "lines+markers",
      name: "Davies-Bouldin Index",
    },
    {
      x: stats.filter((s) => s.calinski_harabasz !== null).map((s) => s.k),
      y: stats
        .filter((s) => s.calinski_harabasz !== null)
        .map((s) => s.calinski_harabasz),
      type: "scatter",
      mode: "lines+markers",
      name: "Calinski-Harabasz Score",
    },
    {
      x: stats.filter((s) => s.combined !== null).map((s) => s.k),
      y: stats.filter((s) => s.combined !== null).map((s) => s.combined),
      type: "scatter",
      mode: "lines+markers",
      name: "Combined Score",
    },
  ];

  return (
    <div className="w-screen h-screen">
      <TitleBar index={5} />
      <div
        id="mainContent"
        className="dark:dark flex flex-col bg-background px-32 pt-6 pb-8 gap-8 text-text"
      >
        <h1 className="text-4xl">Cluster Count Visualization</h1>
        <Plot
          data={traces as Data[]}
          layout={{
            title: "Cluster Evaluation Metrics vs. Number of Clusters (k)",
            xaxis: { title: "Number of Clusters (k)" },
            yaxis: { title: "Score" },
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
          }}
          style={{ width: "100%", height: "600px" }}
        />
      </div>
    </div>
  );
}
