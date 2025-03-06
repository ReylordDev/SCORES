import { useNavigate } from "react-router";
import { TitleBar } from "../../components/TitleBar";
import { useState, useEffect } from "react";
import { Check, Square, TriangleAlert, FileClock } from "lucide-react";
import { formatTime } from "../../lib/utils";
import ProgressIndicator from "../../components/IndeterminateProgressIndicator";
import { Button } from "../../components/ui/button";
import AdaptiveClock from "../../components/AdaptiveClock";
import { ClusteringStep, progressionMessages } from "../../lib/models";

export default function Progress() {
  const [startTime, setStartTime] = useState<number | null>(null);
  const [timeElapsed, setTimeElapsed] = useState<number>(0);
  const [pendingTasks, setPendingTasks] = useState<ClusteringStep[]>([]);
  const [currentTask, setCurrentTask] = useState<{
    step: ClusteringStep;
    timestamp: number;
  } | null>(null);
  const [completedTasks, setCompletedTasks] = useState<
    { step: ClusteringStep; timestamp: number }[]
  >([]);
  const [errorEncountered, setErrorEncountered] = useState(false);
  const navigate = useNavigate();
  const [logsPath, setLogsPath] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = window.progress.onClusteringUpdate((progress) => {
      console.log(progress);
      if (progress.step === "start") {
        setStartTime(progress.timestamp);
        return;
      }
      if (progress.status === "todo") {
        // TODO: if sort problems occurr, use timestamp information for sorting
        setPendingTasks((tasks) => [...tasks, progress.step]);
      } else if (progress.status === "start") {
        setCurrentTask({ step: progress.step, timestamp: progress.timestamp });
        setPendingTasks((tasks) =>
          tasks.filter((task) => task !== progress.step)
        );
      } else if (progress.status === "complete") {
        setCompletedTasks((tasks) => [
          ...tasks,
          { step: progress.step, timestamp: progress.timestamp },
        ]);
        setCurrentTask(null);
      } else if (progress.status === "error") {
        setErrorEncountered(true);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (
      pendingTasks.length === 0 &&
      !currentTask &&
      completedTasks.filter((task) => task.step === "save").length > 0
    ) {
      console.log("Clustering complete");
      navigate("/results");
    }
  }, [pendingTasks, currentTask, completedTasks]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (startTime) {
        setTimeElapsed(Math.floor(Date.now() / 1000 - startTime));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  useEffect(() => {
    window.electron.getLogsPath().then((path) => {
      setLogsPath(path);
    });
  }, []);

  if (!startTime) {
    return (
      <>
        <TitleBar index={3} />
        <div
          id="mainContent"
          className="dark:dark flex flex-col items-center justify-start gap-4 bg-background px-24 text-text"
        >
          <div className="flex w-full items-center justify-between p-8">
            <h1 className="text-4xl">No Clustering in Progress</h1>
          </div>
        </div>
      </>
    );
  }

  if (errorEncountered) {
    return (
      <>
        <TitleBar index={3} />
        <div
          id="mainContent"
          className="dark:dark flex flex-col items-center justify-start gap-4 bg-background px-24"
        >
          <div className="mt-24 flex w-full justify-center p-4">
            <div className="flex items-center gap-2">
              <TriangleAlert size={32} className="text-red-600" />
              <h1 className="text-4xl">Error Encountered</h1>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center gap-2">
            <p>
              Try again or check the logs for more information on the error
              encountered.
            </p>
            <Button
              onClick={() =>
                window.electron.showItemInFolder(logsPath + "/python.log" || "")
              }
              disabled={!logsPath}
            >
              <FileClock />
              View Logs
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <TitleBar index={3} />
      <div
        id="mainContent"
        className="dark:dark flex flex-col items-center justify-start gap-4 bg-background px-24 text-text"
      >
        <div className="flex w-full items-center justify-between p-8">
          <h1 className="text-4xl">Clustering in Progress</h1>
          <div className="flex items-center justify-start gap-2">
            <AdaptiveClock size={32} seconds={timeElapsed} />
            <p className="min-w-32 text-xl">{formatTime(timeElapsed)}</p>
          </div>
        </div>
        <div className="flex min-w-[500px] min-h-[600px] flex-col justify-start gap-4 p-4">
          <div className="flex w-full flex-col gap-2">
            {completedTasks.map((message, index) => {
              const previousTime = completedTasks[index - 1]
                ? completedTasks[index - 1].timestamp
                : startTime;
              return (
                <div
                  key={index}
                  className="flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-4">
                    <Check
                      size={24}
                      className="rounded bg-text-800 text-background"
                    />
                    <div className="text-lg line-through">
                      {progressionMessages[message.step]}
                    </div>
                  </div>
                  <div className="flex justify-start gap-2">
                    <AdaptiveClock
                      seconds={Math.floor(message.timestamp - previousTime)}
                    />
                    <p className="min-w-28">
                      {formatTime(Math.floor(message.timestamp - previousTime))}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          {currentTask && (
            <div className="flex flex-col justify-start gap-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-4">
                  <Square
                    size={24}
                    className="rounded border-2 border-primary bg-background text-background"
                  />
                  <div className="text-lg">
                    {progressionMessages[currentTask.step]}
                  </div>
                </div>
                <div className="flex justify-start gap-2">
                  <AdaptiveClock
                    className="text-primary"
                    seconds={Math.floor(
                      startTime + timeElapsed + 1 - currentTask.timestamp
                    )}
                  />
                  <p className="min-w-28">
                    {formatTime(
                      Math.floor(
                        startTime + timeElapsed + 1 - currentTask.timestamp
                      )
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}
          <div className="flex flex-col justify-start gap-2">
            {pendingTasks.map((message, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex gap-4">
                  <Check
                    size={24}
                    className="rounded border-2 border-text-800 bg-background text-background"
                  />
                  <div className="text-lg">{progressionMessages[message]}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="w-full px-24">
          <ProgressIndicator />
        </div>
      </div>
    </>
  );
}
