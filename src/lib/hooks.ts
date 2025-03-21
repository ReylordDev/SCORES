import { useEffect, useState } from "react";
import { AlgorithmSettings as AlgorithmSettingsType } from "../lib/models";

export function useTutorialMode() {
  const [tutorialMode, setTutorialMode] = useState(false);

  useEffect(() => {
    window.settings.getAll().then((settings) => {
      setTutorialMode(settings.tutorialMode);
    });
    const unsubscribe = window.settings.onSettingsChanged((settings) => {
      setTutorialMode(settings.tutorialMode);
    });
    return () => unsubscribe();
  }, []);

  return tutorialMode;
}

export function useAlgorithmSettings() {
  const [algorithmSettings, setAlgorithmSettings] =
    useState<AlgorithmSettingsType>(null);

  useEffect(() => {
    window.database.requestCurrentRun();
  }, []);

  useEffect(() => {
    const unsubscribe = window.database.onReceiveCurrentRun((runMessage) => {
      // Parse the stored algorithm settings
      const settings = JSON.parse(
        runMessage.run.algorithm_settings,
      ) as AlgorithmSettingsType;

      console.log("Algorithm settings:", settings);
      // Update the state with the parsed settings
      setAlgorithmSettings(settings);
    });
    return () => unsubscribe();
  }, []);

  return algorithmSettings;
}
