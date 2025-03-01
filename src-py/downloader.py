import os
import threading
from loguru import logger
from utils.logging import initialize_logger
import argparse
from huggingface_hub import scan_cache_dir, HfApi
from sentence_transformers import SentenceTransformer
from huggingface_hub.utils.tqdm import disable_progress_bars
import huggingface_hub.constants as hfconstants
from models import DownloadStatusType


class DownloadManager:
    def __init__(self):
        disable_progress_bars()
        os.makedirs(hfconstants.HF_HUB_CACHE, exist_ok=True)

        self.api = HfApi()
        self.compatible_models = list(
            self.api.list_models(
                library="sentence-transformers",
            )
        )
        self.active_downloads = {}  # Track active download threads

    def get_cached_models(self):
        hf_cache_info = scan_cache_dir()
        return hf_cache_info.repos

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
        if model_name not in [model.repo_id for model in self.get_cached_models()]:
            return "not_downloaded"
        try:
            model = SentenceTransformer(model_name, local_files_only=True)
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
            model = SentenceTransformer(model_name)
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
    initialize_logger()
    parser = argparse.ArgumentParser(
        description="Download models from Hugging Face Hub"
    )
    parser.add_argument(
        "-m",
        "--model",
        type=str,
        required=True,
        help="The model name to download from Hugging Face Hub.",
    )
    args = parser.parse_args()

    def download_callback(model_name, success):
        if success:
            logger.info(f"Download of {model_name} completed!")
        else:
            logger.error(f"Download of {model_name} failed!")

    dm = DownloadManager()
    dm.download_model(args.model, callback=download_callback)

    logger.info(
        f"Download of {args.model} started in background. You can continue using the application."
    )
    input()


if __name__ == "__main__":
    main()
