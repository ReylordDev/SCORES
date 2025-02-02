import {
  CornerDownLeft,
  Database,
  FileSearch,
  FileText,
  Upload,
} from "lucide-react";
import { TitleBar } from "../../components/TitleBar";
import { Button } from "../../components/ui/button";
import { useRef } from "react";
import { useNavigate } from "react-router";

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
      <div className="flex flex-col items-center justify-start gap-8 p-4">
        <Upload size={72} className="text-primary" />
        <p className="w-full text-nowrap">Drag and drop your CSV file here</p>
      </div>
      <div className="flex flex-col items-center justify-center gap-4">
        <p>or</p>
        <BrowseButton />
      </div>
    </div>
  );
}

export default function FileSelection() {
  const navigate = useNavigate();
  const handleFileSelection = (path: string) => {
    window.file.setPath(path);
    navigate("/file_preview");
  };

  return (
    <>
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
                <Button variant="secondary" size="lg">
                  <FileText /> Select Example File
                </Button>
              </div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <p>Or you could review a previous result</p>
              <Button variant="secondary" size="lg">
                <Database />
                Review Previous Result
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
