import {
  AlertTriangle,
  Check,
  Download,
  ExternalLink,
  ExternalLinkIcon,
  Loader2,
  Search,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { CachedModel, DownloadStatusType, EmbeddingModel } from "../lib/models";
import { Badge } from "../components/ui/badge";
import { formatBytes, formatDate } from "../lib/utils";
import { TitleBar } from "./TitleBarDownloadManager";
import ProgressIndicator from "../components/IndeterminateProgressIndicator";

const StatusRecord: Record<DownloadStatusType, string> = {
  downloading: "Downloading...",
  downloaded: "Installed",
  not_downloaded: "Not installed",
  partially_downloaded: "Partially downloaded",
};

export function DownloadManager() {
  const [downloadedModels, setDownloadedModels] = useState<CachedModel[]>([]);
  const [availableModels, setAvailableModels] = useState<EmbeddingModel[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sliceAmount, setSliceAmount] = useState(10);
  const [locale, setLocale] = useState("en-US");
  const [defaultModel, setDefaultModel] = useState<EmbeddingModel | null>(null);
  const [defaultModelName, setDefaultModelName] = useState("");

  console.log("Default model name:", defaultModelName);
  console.log("Default model:", defaultModel);

  useEffect(() => {
    window.settings.getAll().then((settings) => {
      setDefaultModelName(settings.defaultModel);
      window.models.requestModelStatus(settings.defaultModel);
    });
  }, []);

  useEffect(() => {
    window.electron.getLocale().then((locale) => {
      setLocale(locale);
    });
  }, []);

  const filteredModels = useMemo(() => {
    return availableModels.filter(
      (model) =>
        model.id.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !downloadedModels.map((model) => model.id).includes(model.id)
    );
  }, [availableModels, searchQuery, downloadedModels]);

  const slicedModels = useMemo(() => {
    return filteredModels.slice(0, sliceAmount);
  }, [filteredModels, sliceAmount]);

  useEffect(() => {
    const unsubscribe = window.models.onDownloadStatus((message) => {
      console.log("Download status:", message);
      if (message.model_name === defaultModelName) {
        setDefaultModel((prev) => ({
          ...prev,
          status: message.status,
        }));
      }
      setDownloadedModels((prev) =>
        prev.map((model) => {
          if (model.id === message.model_name) {
            return { ...model, status: message.status };
          }
          return model;
        })
      );
      setAvailableModels((prev) =>
        prev.map((model) => {
          if (model.id === message.model_name) {
            return { ...model, status: message.status };
          }
          return model;
        })
      );
    });
    return () => unsubscribe();
  }, [defaultModelName]);

  useEffect(() => {
    console.log("Requesting cached models");
    window.models.requestCachedModels();
  }, []);

  useEffect(() => {
    console.log("Requesting available models");
    window.models.requestAvailableModels();
  }, []);

  useEffect(() => {
    const unsubscribe = window.models.onReceiveCachedModels((message) => {
      console.log("Received cached models:", message);
      setDownloadedModels(message.models);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = window.models.onReceiveAvailableModels((message) => {
      console.log("Received available models:", message.models);
      setAvailableModels(message.models);
      setDefaultModel(
        message.models.find((model) => model.id === defaultModelName)
      );
    });
    return () => unsubscribe();
  }, [defaultModelName]);

  const handleDownload = (model: EmbeddingModel) => {
    if (model.tags.includes("custom_code")) {
      window.electron
        .showMessageBox({
          title: "Warning: Custom Code Execution",
          message:
            "This model contains custom code that will be executed. Please ensure you trust the source of this model before proceeding.",
          buttons: ["Cancel", "Proceed with Download"],
          cancelId: 0,
          noLink: true,
          type: "warning",
          icon: "warning",
        })
        .then((result) => {
          if (!result) return;
          if (result.response === 1) {
            console.log("Downloading model:", model);
            window.models.downloadModel(model.id);
          }
        });
    } else {
      console.log("Downloading model:", model);
      window.models.downloadModel(model.id);
    }
  };

  if (!defaultModel) {
    return (
      <div className="h-full w-full bg-background">
        <TitleBar />
        <div className="flex flex-col gap-8 pr-8 py-8 px-12" id="mainContent">
          <Card>
            <CardHeader>
              <CardTitle>Loading...</CardTitle>
              <CardDescription>
                Please wait while the app loads the available models.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProgressIndicator />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-y-scroll">
      <TitleBar />
      <div
        id="mainContent"
        className="flex flex-col gap-8 bg-background pr-8 py-8 px-12"
      >
        {defaultModel && defaultModel.status !== "downloaded" && (
          <Card className="border-red-500 border-dashed border-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <span className="text-red-500 mr-2">
                  <AlertTriangle />
                </span>
                Default Model
              </CardTitle>
              <CardDescription>
                Before using the app for the first time, you need to download
                the default embedding model.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AvailableModel
                model={defaultModel}
                locale={locale}
                handleDownload={handleDownload}
              />
            </CardContent>
          </Card>
        )}
        <Card>
          <CardHeader>
            <CardTitle>Installed Models</CardTitle>
            <CardDescription>
              Models available for use in the app
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {downloadedModels.map((model, index) => (
              <div
                key={index}
                className="flex justify-between items-center p-4 py-2 border rounded-lg bg-white dark:bg-background-50"
              >
                <div className="flex flex-col gap-2">
                  <div>{model.id}</div>
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="secondary">
                      {StatusRecord[model.status]}
                    </Badge>
                    <Badge variant="secondary">
                      {formatBytes(model.size_on_disk)}
                    </Badge>
                    <Badge variant="secondary">
                      {model.downloads?.toLocaleString(locale) ?? 0} downloads
                    </Badge>
                    <Badge variant="secondary">{model.likes} likes</Badge>
                    <Badge variant="secondary">
                      Created on {formatDate(model.created_at, locale)}
                    </Badge>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    variant="link"
                    className="p-1 flex items-center gap-2 text-sm"
                    onClick={() =>
                      window.electron.openUrl(
                        "https://huggingface.co/" + model.id
                      )
                    }
                  >
                    <ExternalLinkIcon size={16} />
                    View on Huggingface
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => window.electron.showItemInFolder(model.path)}
                  >
                    Open Location
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Available Models</CardTitle>
            <CardDescription>
              Search and download embedding models from Hugging Face. For a
              comprehensive model benchmark, visit the{" "}
              <Button
                variant="link"
                className="p-0"
                onClick={() =>
                  window.electron.openUrl(
                    "https://huggingface.co/spaces/mteb/leaderboard"
                  )
                }
              >
                MTEB leaderboard
              </Button>
              .<br></br>
              You can resume downloads at a later time.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search models by name..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {filteredModels.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No models found matching your search
              </p>
            ) : (
              <div className="flex-col gap-2 flex">
                <div className="flex flex-col gap-2">
                  {slicedModels.map((model, index) => {
                    return (
                      <AvailableModel
                        key={index}
                        model={model}
                        locale={locale}
                        handleDownload={handleDownload}
                      />
                    );
                  })}
                </div>
                {slicedModels.length < filteredModels.length && (
                  <div className="flex justify-center items-center">
                    <Button
                      variant="secondary"
                      className="mt-4 w-[200px]"
                      onClick={() => setSliceAmount(sliceAmount + 10)}
                    >
                      Show more...
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AvailableModel({
  model,
  locale,
  handleDownload,
}: {
  model: EmbeddingModel;
  locale: string;
  handleDownload: (model: EmbeddingModel) => void;
}) {
  return (
    <div className="flex items-center justify-between p-4 py-2 border rounded-lg">
      <div className="flex flex-col gap-2 w-full">
        <div>{model.id}</div>
        <div className="flex gap-2 flex-wrap h-full">
          <Badge variant="secondary">{StatusRecord[model.status]}</Badge>
          <Badge variant="secondary">
            {model.downloads?.toLocaleString(locale) ?? 0} downloads
          </Badge>
          <Badge variant="secondary">{model.likes} likes</Badge>
          <Badge variant="secondary">
            Created on {formatDate(model.created_at, locale)}
          </Badge>
        </div>
        {model.status === "downloading" && (
          <div className="w-full">
            <ProgressIndicator />
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="link"
          onClick={() =>
            window.electron.openUrl("https://huggingface.co/" + model.id)
          }
          className="flex items-center text-sm text-primary"
        >
          <ExternalLink className="h-4 w-4 mr-1" />
          View
        </Button>
        <Button
          variant="default"
          size="sm"
          disabled={model.status === "downloading"}
          onClick={() => handleDownload(model)}
        >
          {model.status === "downloading" ? (
            <>
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              Downloading...
            </>
          ) : model.status === "downloaded" ? (
            <>
              <Check className="h-4 w-4 mr-1" />
              Installed
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-1" />
              Download
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
