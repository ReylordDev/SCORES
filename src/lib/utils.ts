import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(timeInSeconds: number, precise = false): string {
  if (timeInSeconds < 1 && !precise) {
    return "<1 sec";
  }
  const hours = Math.floor(timeInSeconds / 3600);
  const minutes = Math.floor((timeInSeconds % 3600) / 60);
  const seconds = timeInSeconds % 60;

  const precision = 2;

  let formattedTime = "";

  if (hours > 0) {
    formattedTime += `${hours}:${minutes.toFixed(0).padStart(2, "0")}:${seconds.toFixed(0).padStart(2, "0")} hr`;
  } else if (minutes > 0) {
    formattedTime += `${minutes}:${seconds.toFixed(0).padStart(2, "0")} min`;
  } else {
    if (precise) {
      formattedTime += `${seconds.toFixed(precision)} sec`;
    } else {
      formattedTime += `${seconds.toFixed(0)} sec`;
    }
  }

  return formattedTime;
}

export function parseCSVLine(line: string, delimiter = ","): string[] {
  const result: string[] = [];
  let currentField = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Double quotes inside a quoted field
        currentField += '"';
        i++;
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      // End of field
      result.push(currentField.trim());
      currentField = "";
    } else {
      currentField += char;
    }
  }

  // Add the last field
  result.push(currentField.trim());

  return result;
}

export function findDelimiter(lines: string[]): string {
  const commonDelimiters = [",", ";", "\t", "|"];
  const sampleSize = Math.min(10, lines.length);
  const sampleLines = lines.slice(0, sampleSize);

  let bestDelimiter = commonDelimiters[0];
  let maxConsistentFields = 0;

  for (const delimiter of commonDelimiters) {
    const fieldCounts = sampleLines.map(
      (line) => parseCSVLine(line, delimiter).length
    );
    const consistentFieldCount = fieldCounts.every(
      (count) => count === fieldCounts[0]
    );
    const uniqueFieldCount = new Set(fieldCounts).size;

    if (consistentFieldCount && fieldCounts[0] > maxConsistentFields) {
      maxConsistentFields = fieldCounts[0];
      bestDelimiter = delimiter;
    } else if (uniqueFieldCount < new Set(fieldCounts).size) {
      // If not consistent, prefer the delimiter that produces fewer unique field counts
      bestDelimiter = delimiter;
    }
  }

  return bestDelimiter;
}

export function formatDate(timestamp: number, locale: string) {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  });
}

export function iterateRecord<K extends string, V>(record: Record<K, V>) {
  return Object.entries(record) as [K, V][];
}
