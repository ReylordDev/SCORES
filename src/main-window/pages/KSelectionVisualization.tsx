import { KSelectionStatistic } from "../../lib/models";
import { TitleBar } from "../../components/TitleBar";
import { useEffect, useState } from "react";
import Plot from "react-plotly.js";
import { Data } from "plotly.js";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogHeader,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "../../components/ui/dialog";

export default function KSelectionVisualization() {
  const [stats, setStats] = useState<KSelectionStatistic[]>([]);
  const [optimalK, setOptimalK] = useState<number | null>(null);

  useEffect(() => {
    const unsubscribe = window.plots.onReceiveSelectionStats(
      (stats: KSelectionStatistic[]) => {
        console.log("stats", stats);
        setStats(stats); // Update state with received stats
      },
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    window.plots.requestSelectionStats();
  }, []);

  useEffect(() => {
    if (stats.length > 0) {
      const optimal = stats.reduce((prev, current) =>
        prev.combined > current.combined ? prev : current,
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
    <div className="h-screen w-screen">
      <TitleBar index={5} />
      <div
        id="mainContent"
        className="dark:dark flex select-none flex-col gap-8 bg-background px-32 pb-8 pt-6 text-text"
      >
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl">Cluster Count Visualization</h1>
            <p>
              The selected number of clusters is{" "}
              <span className="font-bold">{optimalK}</span>, based on the{" "}
              <span className="font-bold text-primary">combined score</span> of
              the evaluation metrics.
            </p>
            <p>
              Use this view to find other viable cluster counts based on the
              peaks of the combined score metric.
            </p>
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
              <ul className="flex list-inside list-disc flex-col items-start gap-2">
                <li>Click and drag to select an area to zoom into.</li>
                <li>Double-click to reset the zoom.</li>
                <li>
                  Hover over a point on a metric curve to see the tested cluster
                  count and metric's score for that cluster count.
                </li>
                <li>
                  Click on the legend to toggle the visibility of a metric
                  curve.
                </li>
              </ul>
            </DialogContent>
          </Dialog>
        </div>
        <Card>
          <CardContent>
            <div className="h-[70vh] w-full">
              <Plot
                data={traces as Data[]}
                layout={{
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
                  scrollZoom: false,
                  showAxisDragHandles: false,
                  showTips: false,
                }}
                style={{ width: "100%", height: "100%" }}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
