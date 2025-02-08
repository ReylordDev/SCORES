import React, { useEffect, useRef } from "react";

const ProgressIndicator = () => {
  const foregroundRef = useRef(null);

  useEffect(() => {
    const foregroundElement =
      foregroundRef.current as unknown as HTMLDivElement;
    let start: number | undefined;

    const step: FrameRequestCallback = (timestamp) => {
      if (start === undefined) {
        start = timestamp;
      }
      const elapsed = timestamp - start;

      const duration = 4000;
      const progress = (elapsed % duration) / duration;
      const translateX = -150 + progress * 450;

      foregroundElement.style.transform = `translateX(${translateX}%)`;

      requestAnimationFrame(step);
    };

    const animationId = requestAnimationFrame(step);

    return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <div
      className={`h-1 w-full overflow-hidden rounded-full bg-primary-100 xl:h-2`}
    >
      <div
        ref={foregroundRef}
        className={"z-40 h-full rounded-full bg-primary"}
        style={{
          width: "50%", // Width of the moving bar
        }}
      ></div>
    </div>
  );
};

export default ProgressIndicator;
