import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import { _OutlierDetail } from "../../lib/models";
import { TitleBar } from "../../components/TitleBar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";

const OutlierCard = ({
  outlier,
  threshold,
}: {
  outlier: _OutlierDetail;
  threshold: number;
}) => {
  const precision = 2;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          <AlertCircle className="text-accent" size={24} />
          <CardTitle className="text-lg text-text font-semibold">
            "{outlier.response.text}"
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between px-2">
          <p>
            Similarity:{" "}
            <span className="font-semibold">
              {(outlier.similarity * 100).toFixed(precision)}%
            </span>
          </p>
          <p style={{ width: `${100 - threshold * 100}%` }}>
            Threshold:{" "}
            <span className="font-semibold">
              {(threshold * 100).toFixed(precision)}%
            </span>
          </p>
        </div>
        <div className="mt-2 h-2.5 w-full rounded-full bg-gray-200 dark:bg-background-100">
          <div
            className="h-2.5 rounded-full bg-yellow-400"
            style={{
              width: `${threshold * 100}%`,
            }}
          >
            <div
              className="h-2.5 rounded-full bg-accent"
              style={{
                width: `${(outlier.similarity / threshold) * 100}%`,
              }}
            ></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function Outliers() {
  const [outliers, setOutliers] = useState<_OutlierDetail[]>([]);
  const [outlierThreshold, setOutlierThreshold] = useState<number | null>(null);

  const nearestNeighbors = 5;
  const zScoreThreshold = 1.5;

  useEffect(() => {
    const unsubscribe = window.database.onReceiveCurrentOutliers(
      (outliersMessage) => {
        setOutliers(
          outliersMessage.outliers.sort((a, b) => b.similarity - a.similarity)
        );
        setOutlierThreshold(outliersMessage.threshold);
      }
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    window.database.requestCurrentOutliers();
  }, []);

  return (
    <div className="w-screen h-screen">
      <TitleBar index={5} />
      <div
        id="mainContent"
        className="dark:dark flex flex-col bg-background px-32 pt-6 text-text gap-4"
      >
        <div className="flex items-center justify-start">
          <h1 className="text-4xl">Response Outliers</h1>
        </div>
        <div>
          <p text-lg>
            Displaying <span className="font-semibold">{outliers.length}</span>{" "}
            outlier responses.
          </p>
          <p className="text-base">
            These responses have a lower similarity to their{" "}
            <span className="font-semibold">{nearestNeighbors}</span> nearest
            neighbors compared to the threshold (Z-score:{" "}
            <span className="font-semibold">{zScoreThreshold}</span>).
          </p>
        </div>
        <div className="scrollbar pr-4 flex flex-grow flex-col gap-4 overflow-y-auto pt-0 pb-4">
          {outliers.map((outlier, index) => (
            <OutlierCard
              key={index}
              outlier={outlier}
              threshold={outlierThreshold || 0}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
