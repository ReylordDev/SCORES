import {
  CornerDownLeft,
  Database,
  FileSearch,
  FileText,
  Upload,
  Trash2,
  Search,
  Bookmark,
} from "lucide-react";
import { TitleBar } from "../../components/TitleBar";
import { Button } from "../../components/ui/button";
import { useEffect, useRef, useState, useMemo, forwardRef } from "react";
import { useNavigate } from "react-router";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Run } from "../../lib/models";
import { formatDate } from "../../lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../../components/ui/alert-dialog";
import { UUID } from "crypto";
import { Input } from "../../components/ui/input";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "../../components/ui/tooltip";

function FileSelector({
  handleFileSelection,
}: {
  handleFileSelection: (path: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const checkFiles = (files: FileList | null) => {
    if (files) {
      const file = files[0];
      if (file && file.size > 0 && file.type === "text/csv") {
        console.log("File selected: ", file);
        const path = window.electron.showFilePath(file);
        handleFileSelection(path);
      }
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    checkFiles(files);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    checkFiles(files);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  return (
    <div onDrop={handleDrop} onDragOver={handleDragOver}>
      <div className="flex flex-col items-center justify-start gap-8 p-4">
        <Upload size={72} className="text-primary" />
        <p className="w-full text-nowrap">Drag and drop your CSV file here</p>
      </div>
      <div className="flex flex-col items-center justify-center gap-4">
        <p>or</p>
        <BrowseButton
          onChange={handleFileChange}
          onClick={handleBrowseClick}
          ref={fileInputRef}
        />
      </div>
    </div>
  );
}

function PreviousRunsDialog() {
  const [previousRuns, setPreviousRuns] = useState<Run[]>([]);
  const [locale, setLocale] = useState("en-US");
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const filteredRuns = useMemo(() => {
    if (!searchTerm) return previousRuns;
    const lowerSearchTerm = searchTerm.toLowerCase();
    return previousRuns.filter(
      (run) =>
        run.name.toLowerCase().includes(lowerSearchTerm) ||
        run.file_path.toLowerCase().includes(lowerSearchTerm),
    );
  }, [previousRuns, searchTerm]);

  const handleRunSelection = (run: Run) => {
    console.log("Selected run: ", run);
    window.state.setRunId(run.id);
    navigate("/results");
  };

  const handleDeleteRun = (runId: UUID) => {
    window.database.deleteRun(runId);
    window.database.requestAllRuns(); // Refresh the list
  };

  useEffect(() => {
    const unsubscribe = window.database.onReceiveAllRuns((runs: Run[]) => {
      setPreviousRuns(runs);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    console.log("Requesting all runs");
    window.database.requestAllRuns();
  }, []);

  useEffect(() => {
    window.electron.getLocale().then((locale) => {
      setLocale(locale);
    });
  }, []);

  console.log(locale);

  return (
    <DialogContent className="flex h-4/5 w-4/5 max-w-full select-none flex-col">
      <DialogHeader className="w-full">
        <DialogTitle className="text-4xl">
          Review Previous Run Result
        </DialogTitle>
        <DialogDescription>
          Choose a previous result to review.
        </DialogDescription>
      </DialogHeader>
      <div className="px-6 pt-2">
        <div className="relative flex items-center">
          <Input
            type="text"
            placeholder="Search by name or file path..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12"
          />
          <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 select-none opacity-50" />
        </div>
      </div>
      <div className="scrollbar max-h-[70vh] overflow-y-auto p-6">
        <Table className="w-full table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[25%]">Name</TableHead>
              <TableHead className="w-[25%] whitespace-nowrap">Date</TableHead>
              <TableHead className="w-[40%]">File Path</TableHead>
              <TableHead className="w-[10%]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRuns
              .sort((a, b) => b.created_at - a.created_at)
              .map((run, index) => (
                <TableRow
                  key={index}
                  className="cursor-default"
                  onClick={() => handleRunSelection(run)}
                >
                  <TableCell className="max-w-0">
                    <div className="truncate">{run.name}</div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatDate(run.created_at, "en-US")}
                  </TableCell>
                  <TableCell className="max-w-0">
                    <div className="truncate">
                      {run.file_path.split(/[/\\]/).pop()}
                    </div>
                  </TableCell>
                  <TableCell className="w-[10%] text-center">
                    <div onClick={(e) => e.stopPropagation()}>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="hover:bg-destructive hover:text-destructive-foreground"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Run</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this run? This
                              action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={() => handleDeleteRun(run.id)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    </DialogContent>
  );
}

export default function FileSelection() {
  const navigate = useNavigate();
  const handleFileSelection = (path: string) => {
    window.file.setPath(path);
    navigate("/file_preview");
  };

  const handleExampleFileSelection = async () => {
    const path = await window.file.getExampleFilePath();
    handleFileSelection(path);
  };

  return (
    <div className="h-screen w-screen">
      <TitleBar index={0} />
      <div
        id="mainContent"
        className="dark:dark flex select-none flex-col gap-8 bg-background px-32 py-8 text-text"
      >
        <div className="flex flex-col gap-2">
          <h1 className="text-5xl">
            <span className="bg-gradient-to-r from-primary-600 via-secondary-500 to-accent bg-clip-text text-transparent">
              Semantic Clustering of Open Responses <br></br>
              via Embedding Similarity
            </span>
          </h1>
          <p>Analyze your free-text survey responses with ease.</p>
        </div>
        <div className="mb-8 mt-16 flex h-full items-center justify-between">
          <Tooltip>
            <TooltipTrigger className="flex h-5/6 w-1/2 cursor-default flex-col items-center justify-evenly gap-4 rounded-3xl border-4 border-dashed border-accent p-4">
              <FileSelector handleFileSelection={handleFileSelection} />
            </TooltipTrigger>
            <TooltipContent className="w-[640px]">
              <div className="flex flex-col gap-2 text-start">
                <p className="text-lg font-semibold">Input File Selection</p>
                <p>
                  SCORES requires a{" "}
                  <span className="italic">comma-separated values</span> (CSV)
                  files as input.
                </p>
                <p>
                  Most survey or statisics tools provide an option to export the
                  data as a CSV file.
                </p>
              </div>
            </TooltipContent>
          </Tooltip>
          <div className="flex h-full w-1/2 flex-col items-center justify-start gap-8 p-4 text-center xl:p-12">
            <div className="flex flex-col items-center justify-center gap-2">
              <h5>Start by selecting an input file.</h5>
              <CornerDownLeft size={36} className="text-accent" />
            </div>
            <div className="flex h-full flex-col justify-evenly gap-2">
              <div className="flex flex-col items-center justify-center gap-2">
                <p className="line-clamp-2 max-w-sm">
                  You can also start with the example file if you just want to
                  try the application out.
                </p>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="secondary"
                      size="lg"
                      onClick={handleExampleFileSelection}
                    >
                      <FileText /> Select Example File
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="w-[640px]" side="bottom">
                    <div className="flex flex-col gap-2 text-start">
                      <p className="text-lg font-semibold">
                        Self-Generated Motives of Social Casino Gamers
                      </p>
                      <p>
                        The example file contains the response data of a study
                        regarding self-generated motives of social casino
                        gamers. Check the citation for more information.
                      </p>
                      <div className="flex items-center gap-2">
                        <Bookmark className="size-6 flex-shrink-0 text-accent" />
                        <p className="select-text text-left">
                          Citation:{" "}
                          <span
                            className="cursor-pointer text-accent underline"
                            onClick={() => {
                              window.electron.openUrl(
                                "https://link.springer.com/article/10.1007/s10899-022-10135-5",
                              );
                            }}
                          >
                            Kim, H.S., Coelho, S., Wohl, M.J. et al.
                            Self-Generated Motives of Social Casino Gamers. J
                            Gambl Stud 39, 299–320 (2023).
                          </span>
                        </p>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <p>Or you could review a previous result</p>
              <Dialog>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DialogTrigger asChild>
                      <Button variant="secondary" size="lg">
                        <Database />
                        Review Previous Result
                      </Button>
                    </DialogTrigger>
                  </TooltipTrigger>
                  <TooltipContent
                    align="center"
                    side="top"
                    className="mr-2 w-[640px]"
                  >
                    <div className="flex flex-col gap-2 text-start">
                      <p className="text-lg font-semibold">Previous Result</p>
                      <p>
                        A core part of SCORES is the ability to load previous
                        results. You can load a previous result and use it as a
                        starting point for a new analysis with different
                        algorithm settings.
                      </p>
                      <p>
                        This is especially useful if you want to fine-tune the
                        settings or compare results.
                      </p>
                      <p>
                        Loading a previous result will also load its random
                        state, meaning that the clustering will be
                        deterministic. If you wish to do a re-run with a
                        different random state, just select the file again.
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
                <PreviousRunsDialog />
              </Dialog>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const BrowseButton = forwardRef(function BrowseButton(
  {
    onChange,
    onClick,
  }: {
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onClick?: () => void;
  },
  ref: React.Ref<HTMLInputElement>,
) {
  return (
    <>
      <div
        onClick={onClick}
        className="flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-8 text-lg text-text-50 hover:bg-primary-600 dark:bg-primary-200 dark:text-primary-900 dark:hover:bg-primary-100"
      >
        <FileSearch />
        Browse Files
      </div>
      <input
        ref={ref}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={onChange}
      />
    </>
  );
});
BrowseButton.displayName = "BrowseButton";
