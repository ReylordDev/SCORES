import { useNavigate } from "react-router";
import { TitleBar } from "../../components/TitleBar";
import { useEffect, useState } from "react";
import { ArrowRightCircle, Check, Info, Square } from "lucide-react";
import { findDelimiter, parseCSVLine, cn } from "../../lib/utils";
import { Button } from "../../components/ui/button";
import { Switch } from "../../components/ui/switch";
import { Input } from "../../components/ui/input";
import { FileSettings } from "../../lib/models";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "../../components/ui/tooltip";

const ColumnHeader = ({
  isOn,
  title,
  onChange,
}: {
  isOn: boolean;
  title: string;
  onChange: (isOn: boolean) => void;
}) => {
  return (
    <div
      className={`flex h-full items-center justify-center gap-2 rounded-md p-2 ${
        isOn ? "bg-accent text-background" : "text-text hover:bg-accent-200"
      }`}
      onClick={() => onChange(!isOn)}
    >
      <Check size={20} className={cn(isOn ? "text-background" : "hidden")} />
      <Square size={20} className={cn(!isOn ? "text-text" : "hidden")} />
      <p className="w-full select-none text-nowrap text-lg font-medium">
        {title}
      </p>
      <Input
        type="checkbox"
        checked={isOn}
        onChange={() => onChange(!isOn)}
        className="hidden"
      ></Input>
    </div>
  );
};

export default function FilePreview() {
  const [filePath, setFilePath] = useState<string | null>(null);
  const [hasHeader, setHasHeader] = useState(true);
  const [delimiter, setDelimiter] = useState<string | null>(null);
  const [selectedColumns, setSelectedColumns] = useState<number[]>([]);
  const [previewData, setPreviewData] = useState<string[][]>([]);
  const navigate = useNavigate();

  const exampleLineCount = 10;

  useEffect(() => {
    const unsubscribe = window.file.onReceivePath((path) => {
      console.log("Received file path: ", path);
      setFilePath(path);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    console.log("Requesting file path");
    window.file.requestPath();
  }, []);

  useEffect(() => {
    const findBestDelimiter = async () => {
      if (!filePath) {
        return;
      }
      try {
        const input = await window.electron.readFile(filePath);
        const lines = input.split("\n");
        const bestDelimiter = findDelimiter(lines);
        console.log("Best delimiter: ", bestDelimiter);
        setDelimiter(bestDelimiter);
      } catch (error) {
        console.error("Error finding best delimiter:", error);
      }
    };

    findBestDelimiter();
  }, [filePath]);

  useEffect(() => {
    const fetchPreviewData = async () => {
      if (!delimiter || !filePath) {
        return;
      }
      try {
        const input = await window.electron.readFile(filePath);
        const lines = input.split("\n");
        const parsedData = lines
          .slice(0, lines.length > 100 ? 100 : lines.length)
          .map((line) => parseCSVLine(line, delimiter));
        // Fill in missing values by copying the last non-empty value
        const fillIndexes = Array(parsedData.length).fill(
          parsedData.length - 1,
        );
        for (let i = 0; i < parsedData.length; i++) {
          for (let j = 0; j < parsedData[i].length; j++) {
            if (!parsedData[i][j]) {
              for (let k = fillIndexes[j]; k >= 0; k--) {
                if (parsedData[k][j]) {
                  parsedData[i][j] = parsedData[k][j];
                  fillIndexes[j] = k - 1;
                  break;
                }
              }
            }
          }
        }
        setPreviewData(parsedData.slice(0, exampleLineCount + 1));
      } catch (error) {
        console.error("Error fetching preview data:", error);
      }
    };

    fetchPreviewData();
  }, [filePath, delimiter]);

  useEffect(() => {
    const unsubscribe = window.database.onReceiveCurrentRun(({ run }) => {
      if (run) {
        // Parse the stored file settings
        const settings = JSON.parse(run.file_settings) as FileSettings;
        console.log("File settings: ", settings);

        // Update state based on the loaded settings
        setHasHeader(settings.has_header);
        setDelimiter(settings.delimiter);
        setSelectedColumns(settings.selected_columns);

        // Set file path
        setFilePath(run.file_path);
      }
    });

    // Request current run data
    window.database.requestCurrentRun();

    return () => unsubscribe();
  }, []);

  const displayData = hasHeader
    ? previewData.slice(1)
    : previewData.slice(0, exampleLineCount);
  const headers = hasHeader ? previewData[0] : [];
  const columnCount = displayData.length > 0 ? displayData[0].length : 0;

  const toggleColumn = (index: number) => {
    selectedColumns.includes(index)
      ? setSelectedColumns(selectedColumns.filter((col) => col !== index))
      : setSelectedColumns([...selectedColumns, index]);
  };

  console.log("File path: ", filePath);
  console.log("Selected columns: ", selectedColumns);
  console.log("Has header: ", hasHeader);
  console.log("Display data: ", displayData);

  if (!filePath) {
    return (
      <div className="h-screen w-screen">
        <TitleBar index={1} />
        <div
          id="mainContent"
          className="dark:dark flex select-none flex-col items-center justify-start gap-4 bg-background px-24 text-text"
        >
          <div className="mt-24 flex w-full justify-center p-8">
            <h1 className="text-4xl">
              No file selected. Please select a file first.
            </h1>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen">
      <TitleBar index={1} />
      <div
        id="mainContent"
        className="dark:dark flex select-none flex-col justify-start gap-8 bg-background px-32 pb-8 pt-8 text-text"
      >
        <h1 className="flex w-full flex-col text-5xl">File Preview</h1>
        <div className="flex flex-col gap-2 border-b pb-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex w-full items-start justify-between">
                <div className="flex flex-col">
                  <p>Header row</p>
                  <p className="text-wrap text-base font-normal text-gray-500">
                    Whether the first line of data already contains responses.
                  </p>
                </div>
                <Switch checked={hasHeader} onCheckedChange={setHasHeader} />
              </div>
            </TooltipTrigger>
            <TooltipContent align="start" side="bottom">
              <div className="flex flex-col gap-2">
                <p className="text-lg font-semibold">Header Row</p>
                <p className="text-left">
                  The header row is the first row of the file that contains the
                  names of each column.
                </p>
                <p>
                  Some CSV files may not have a header row. In that case,
                  disable this option.
                </p>
                <p>
                  To check if the settings is correct, check that there are no
                  column names in the preview data below.
                </p>
              </div>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center justify-between">
                <label htmlFor="delimiter">
                  <div className="flex flex-col">
                    <p>Line separator</p>
                    <p className="text-base font-normal text-gray-500">
                      Enter the character that separates each column
                    </p>
                  </div>
                </label>
                <Input
                  id="delimiter"
                  value={delimiter || ""}
                  onChange={(e) => setDelimiter(e.target.value)}
                  className="w-20 text-center"
                />
              </div>
            </TooltipTrigger>
            <TooltipContent className="w-[800px]" align="start" side="bottom">
              <div className="flex flex-col gap-2">
                <p className="text-lg font-semibold">Line Separator</p>
                <p>
                  The line separator is the character that separates each column
                  in the file.
                </p>
                <p>
                  Common separators include{" "}
                  <span className="font-bold">commas (",")</span>,{" "}
                  <span className="font-bold">semicolons (";")</span> and{" "}
                  <span className="font-bold">tabs ("\t")</span>.
                </p>
                <p>
                  The application will attempt to automatically detect the
                  separator for you based on the first few lines of the file.
                </p>
                <p>
                  If the preview data looks incorrect, try changing the
                  separator to any of the common values. If the issue persists,
                  the file may not have a valid CSV format.
                </p>
              </div>
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="flex h-full flex-col gap-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center justify-between">
                <p>
                  Select all columns that contain responses to open-ended
                  questions:
                </p>
                <div>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setSelectedColumns(
                        selectedColumns.length === 0
                          ? [...Array(headers.length).keys()]
                          : [],
                      );
                    }}
                  >
                    Toggle all
                  </Button>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent className="flex items-center gap-4" align="start">
              <Info className="size-6 shrink-0 text-accent" />
              <p>Only the selected columns will be used in the analysis.</p>
            </TooltipContent>
          </Tooltip>
          <div className="scrollbar overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-background">
                  {hasHeader &&
                    headers &&
                    headers.map((header, index) => (
                      <TableHead key={index} className="m-0 border px-1">
                        <ColumnHeader
                          key={index}
                          onChange={() => toggleColumn(index)}
                          title={header}
                          isOn={selectedColumns.includes(index)}
                        />
                      </TableHead>
                    ))}
                  {!hasHeader &&
                    Array(columnCount)
                      .fill(0)
                      .map((_, index) => (
                        <TableHead key={index} className="m-0 border px-1">
                          <ColumnHeader
                            key={index}
                            onChange={() => toggleColumn(index)}
                            title={`Column ${index}`}
                            isOn={selectedColumns.includes(index)}
                          />
                        </TableHead>
                      ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayData &&
                  displayData.map((row, rowIndex) => (
                    <TableRow key={rowIndex} className="hover:bg-background">
                      {row.map((cell, cellIndex) => (
                        <TableCell
                          key={cellIndex}
                          className="m-0 border-x px-1 py-2"
                        >
                          <p className="line-clamp-1">{cell}</p>
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </div>
        <div className="flex items-center justify-end gap-4">
          {selectedColumns.length !== 1 ? (
            <p>{selectedColumns.length} columns selected</p>
          ) : (
            <p>{selectedColumns.length} column selected</p>
          )}

          <Button
            onClick={() => {
              window.file.setSettings({
                delimiter: delimiter || ",",
                has_header: hasHeader,
                selected_columns: selectedColumns,
              });
              navigate("/algorithm_settings");
            }}
            disabled={selectedColumns.length <= 0}
            size="lg"
          >
            Continue
            <ArrowRightCircle />
          </Button>
        </div>
      </div>
    </div>
  );
}
