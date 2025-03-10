import { useEffect, useState } from "react";

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
