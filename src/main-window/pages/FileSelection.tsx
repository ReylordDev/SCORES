import {
  CornerDownLeft,
  Database,
  FileSearch,
  FileText,
  Upload,
  Trash2,
  Search,
} from "lucide-react";
import { TitleBar } from "../../components/TitleBar";
import { Button } from "../../components/ui/button";
import { useEffect, useRef, useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { TooltipWrapper } from "../../components/Tooltip";
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

function FileSelector({ selectFile }: { selectFile: (path: string) => void }) {
  const checkFiles = (files: FileList | null) => {
    if (files) {
      const file = files[0];
      if (file && file.size > 0 && file.type === "text/csv") {
        console.log("File selected: ", file);
        const path = window.electron.showFilePath(file);
        selectFile(path);
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

  function BrowseButton() {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleClick = () => {
      fileInputRef.current?.click();
    };

    return (
      <>
        <Button size="lg" onClick={handleClick}>
          <FileSearch />
          Browse Files
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleFileChange}
        />
      </>
    );
  }

  return (
    <div
      className="flex h-full w-fit flex-col items-center justify-evenly gap-4 rounded-3xl border-4 border-dashed border-accent xl:w-1/2"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <TooltipWrapper
        wrappedContent={
          <div className="flex flex-col items-center justify-start gap-8 p-4">
            <Upload size={72} className="text-primary" />
            <p className="w-full text-nowrap">
              Drag and drop your CSV file here
            </p>
          </div>
        }
        tooltipContent={
          <p className="text-left">
            The program requires comma-separated values (CSV) files as input.
            <br></br>
            Most survey or statisics tools provide an option to export the data
            as a CSV file.
          </p>
        }
      />
      <div className="flex flex-col items-center justify-center gap-4">
        <p>or</p>
        <BrowseButton />
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
        run.file_path.toLowerCase().includes(lowerSearchTerm)
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
    <DialogContent className="max-w-full w-4/5 h-4/5 select-none flex flex-col">
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
      <div className="scrollbar max-h-[70vh] flex-grow overflow-y-auto p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>File Path</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRuns
              .sort((a, b) => b.created_at - a.created_at)
              .map((run, index) => (
                <TableRow
                  key={index}
                  className="cursor-pointer"
                  // Or use an alert dialog to confirm the selection
                  onClick={() => handleRunSelection(run)}
                >
                  <TableCell>
                    <p>{run.name}</p>
                  </TableCell>
                  <TableCell>
                    <p>{formatDate(run.created_at, "en-US")}</p>
                  </TableCell>
                  <TableCell>
                    <p className="select-text">{run.file_path}</p>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
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

  return (
    <div className="h-screen w-screen">
      <TitleBar index={0} />
      <div
        id="mainContent"
        className="dark:dark flex flex-col bg-background px-24 pt-8 text-text xl:px-32 xl:pb-8 2xl:px-48 2xl:pb-16"
      >
        <div className="mb-8 flex w-full flex-col gap-2">
          <h1 className="text-5xl">
            <span className="bg-gradient-to-l from-accent-300 to-accent-600 bg-clip-text text-transparent">
              Response Clustering
            </span>
            <br></br>
            based on{" "}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              LLM Embeddings
            </span>
          </h1>
          <p>Analyze your open-ended survey responses with ease.</p>
        </div>
        <div className="mb-8 flex h-full items-center justify-between">
          <FileSelector selectFile={handleFileSelection} />
          <div className="flex h-full flex-col items-center justify-start gap-8 p-4 text-center xl:p-12 w-1/2">
            <div className="flex flex-col items-center justify-center gap-2">
              <h5>Start by selecting an input file.</h5>
              <CornerDownLeft size={36} className="text-accent" />
            </div>
            <div className="flex flex-col gap-2 justify-evenly h-full">
              <div className="flex flex-col items-center justify-center gap-2">
                <p className="line-clamp-2 max-w-sm">
                  You can also start with the example file if you just want to
                  try the application out.
                </p>
                <TooltipWrapper
                  wrappedContent={
                    <Button variant="secondary" size="lg">
                      <FileText /> Select Example File
                    </Button>
                  }
                  tooltipContent={
                    <p className="text-left">
                      The example file contains the response data of a study
                      regarding self-generated motives of social casino gamers.
                      <br></br>
                      Full citation: Kim, H.S., Coelho, S., Wohl, M.J. et al.
                      Self-Generated Motives of Social Casino Gamers. J Gambl
                      Stud 39, 299–320 (2023).
                    </p>
                  }
                />
              </div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <p>Or you could review a previous result</p>
              <Dialog>
                <TooltipWrapper
                  wrappedContent={
                    <DialogTrigger asChild>
                      <Button variant="secondary" size="lg">
                        <Database />
                        Review Previous Result
                      </Button>
                    </DialogTrigger>
                  }
                  tooltipContent={
                    <p className="text-left">
                      Reviewing a previous result will load the settings from
                      the previous run.<br></br>This is especially useful if you
                      want to fine-tune the settings or compare the results.
                    </p>
                  }
                />
                <PreviousRunsDialog />
              </Dialog>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
