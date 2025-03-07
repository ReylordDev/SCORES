import os
import threading
from loguru import logger
from huggingface_hub import scan_cache_dir, HfApi
from sentence_transformers import SentenceTransformer
from huggingface_hub.utils.tqdm import disable_progress_bars
import huggingface_hub.constants as hfconstants
from models import CachedModel, DownloadStatusType, EmbeddingModel


class DownloadManager:
    def __init__(self):
        logger.debug("Initializing DownloadManager")
        disable_progress_bars()
        os.makedirs(hfconstants.HF_HUB_CACHE, exist_ok=True)

        self.api = HfApi()
        self.compatible_models = list(
            self.api.list_models(
                library="sentence-transformers",
                sort="downloads",
                direction=-1,
                limit=1000,  # The number does not seem to affect the unusually long time it takes to load the models
            )
        )
        self.active_downloads = {}  # Track active download threads
        logger.debug("DownloadManager initialized")
        logger.debug(f"Found {len(self.compatible_models)} compatible models")

    def get_cached_models(self) -> list[CachedModel]:
        hf_cache_info = scan_cache_dir()
        valid_repos: list[CachedModel] = []
        for repo in hf_cache_info.repos:
            if (
                repo.repo_id in [model.id for model in self.compatible_models]
                and self.get_download_status(repo.repo_id) == "downloaded"
            ):
                api_repo = [
                    model
                    for model in self.compatible_models
                    if model.id == repo.repo_id
                ][0]
                cached_repo = CachedModel(
                    id=repo.repo_id,
                    author=api_repo.author,
                    created_at=api_repo.created_at.timestamp()
                    if api_repo.created_at
                    else None,
                    downloads=api_repo.downloads,
                    likes=api_repo.likes,
                    trending_score=api_repo.trending_score,
                    tags=api_repo.tags,
                    status="downloaded",
                    path=str(repo.repo_path),
                    size_on_disk=repo.size_on_disk,
                    last_accessed=repo.last_accessed,
                )
                valid_repos.append(cached_repo)
        return valid_repos

    def get_compatible_models(self) -> list[EmbeddingModel]:
        models = []
        for model in self.compatible_models:
            if model.tags and "custom_code" in model.tags:
                logger.info(f"Skipping model {model.id} due to custom code tag")
                continue
            models.append(
                EmbeddingModel(
                    id=model.id,
                    author=model.author,
                    created_at=model.created_at.timestamp()
                    if model.created_at
                    else None,
                    downloads=model.downloads,
                    likes=model.likes,
                    trending_score=model.trending_score,
                    tags=model.tags,
                    status="not_downloaded",
                )
            )
        return models

    def get_download_status(self, model_name) -> DownloadStatusType:
        # Check if there's an active download thread
        if model_name in self.active_downloads:
            thread = self.active_downloads[model_name]
            if thread.is_alive():
                return "downloading"
            else:
                # Thread completed, clean up
                del self.active_downloads[model_name]

        # Check the regular download status
        if model_name not in [model.repo_id for model in scan_cache_dir().repos]:
            return "not_downloaded"
        try:
            logger.info(f"Checking download status of {model_name}...")
            model = SentenceTransformer(
                model_name, local_files_only=True, trust_remote_code=True
            )
            del model
            return "downloaded"
        except OSError as _e:
            return "partially_downloaded"
        except AttributeError as _e:
            return "partially_downloaded"

    def get_model_info(self, model_name):
        return self.api.model_info(model_name)

    def _download_thread(self, model_name, callback=None):
        """Background thread function to download a model"""
        try:
            logger.info(f"Background download of {model_name} started...")
            model = SentenceTransformer(model_name, trust_remote_code=True)
            del model
            logger.info(f"Background download of {model_name} completed successfully")
            if callback:
                callback(model_name, True)
        except Exception as e:
            logger.error(f"Background download of {model_name} failed: {str(e)}")
            if callback:
                callback(model_name, False)

    def download_model(self, model_name, callback=None):
        """
        Download a model from Hugging Face Hub

        Args:
            model_name: The name of the model to download
            async_download: If True, download in background thread
            callback: Optional callback function to call when download completes
                      Function signature: callback(model_name, success)

        Returns:
            If async_download is True, returns a thread object
            Otherwise, returns None
        """
        logger.info(f"Starting asynchronous download of {model_name}...")
        thread = threading.Thread(
            target=self._download_thread, args=(model_name, callback), daemon=True
        )
        thread.start()
        self.active_downloads[model_name] = thread
        return thread


def main():
    dm = DownloadManager()
    for model in dm.get_cached_models():
        print(model.id, dm.get_download_status(model.id))


if __name__ == "__main__":
    main()
