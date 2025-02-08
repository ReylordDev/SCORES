import {
  Clock1,
  Clock2,
  Clock3,
  Clock4,
  Clock5,
  Clock6,
  Clock7,
  Clock8,
  Clock9,
  Clock10,
  Clock11,
  Clock12,
} from "lucide-react";

function AdaptiveClock({
  size = 24,
  seconds,
  className,
}: {
  size?: number;
  seconds: number;
  className?: string;
}) {
  const clockComponents = [
    Clock1,
    Clock2,
    Clock3,
    Clock4,
    Clock5,
    Clock6,
    Clock7,
    Clock8,
    Clock9,
    Clock10,
    Clock11,
    Clock12,
  ];
  if (seconds < 0) {
    console.warn("Seconds value cannot be negative. Resetting to 0.");
    seconds = 0;
  }

  const index = Math.floor(seconds / 5) % clockComponents.length;
  const ClockComponent = clockComponents[index];

  return <ClockComponent size={size} className={className} />;
}
export default AdaptiveClock;
