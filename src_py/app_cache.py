import os
import json
import pickle
import hashlib
import time
from typing import Dict, List, Optional, Any, Mapping
import numpy as np
from loguru import logger
from utils.utils import get_user_data_path


class EmbeddingCache:
    """
    Cache for storing embeddings to avoid recalculating them.
    The cache is stored on disk and is keyed by model name and text content.
    """

    def __init__(self):
        logger.debug("Initializing EmbeddingCache")
        self.cache_dir = os.path.join(get_user_data_path(), "cache", "embeddings")
        os.makedirs(self.cache_dir, exist_ok=True)
        self.metadata_file = os.path.join(self.cache_dir, "metadata.json")
        self.metadata = self._load_metadata()
        logger.debug(f"Loaded embedding cache metadata: {self.metadata}")

    def _load_metadata(self) -> Dict[str, Any]:
        """Load metadata from disk or create a new metadata dict"""
        if os.path.exists(self.metadata_file):
            try:
                with open(self.metadata_file, "r") as f:
                    return json.load(f)
            except Exception as e:
                logger.warning(f"Failed to load embedding cache metadata: {e}")
                return {"models": {}}
        return {"models": {}}

    def _save_metadata(self):
        """Save metadata to disk"""
        try:
            with open(self.metadata_file, "w") as f:
                json.dump(self.metadata, f)
        except Exception as e:
            logger.warning(f"Failed to save embedding cache metadata: {e}")

    def _get_cache_file_path(self, model_name: str) -> str:
        """Get the path to the cache file for a model"""
        # Create a safe filename from the model name
        safe_name = model_name.replace("/", "_").replace("\\", "_")
        return os.path.join(self.cache_dir, f"{safe_name}.pkl")

    def _get_text_hash(self, text: str) -> str:
        """Generate a hash for the text to use as a cache key"""
        return hashlib.md5(text.encode("utf-8")).hexdigest()

    def get_embeddings(
        self, model_name: str, texts: List[str]
    ) -> Mapping[str, Optional[np.ndarray]]:
        """
        Get embeddings from cache.

        Args:
            model_name: Name of the embedding model
            texts: List of texts to get embeddings for

        Returns:
            Dictionary mapping text to embedding or None if not in cache
        """
        result: Dict[str, Optional[np.ndarray]] = {text: None for text in texts}

        # Check if model exists in cache
        if model_name not in self.metadata["models"]:
            return result

        cache_file = self._get_cache_file_path(model_name)
        if not os.path.exists(cache_file):
            return result

        try:
            with open(cache_file, "rb") as f:
                cache_data = pickle.load(f)

            # Get embeddings for each text if available
            for text in texts:
                text_hash = self._get_text_hash(text)
                if text_hash in cache_data:
                    result[text] = cache_data[text_hash]
        except Exception as e:
            logger.warning(f"Failed to load embeddings from cache: {e}")

        return result

    def save_embeddings(self, model_name: str, embeddings: Dict[str, np.ndarray]):
        """
        Save embeddings to cache.

        Args:
            model_name: Name of the embedding model
            embeddings: Dictionary mapping text to embedding
        """
        cache_file = self._get_cache_file_path(model_name)

        # Load existing cache data if available
        cache_data = {}
        if os.path.exists(cache_file):
            try:
                with open(cache_file, "rb") as f:
                    cache_data = pickle.load(f)
            except Exception as e:
                logger.warning(f"Failed to load existing cache data: {e}")

        # Add new embeddings to cache
        for text, embedding in embeddings.items():
            text_hash = self._get_text_hash(text)
            cache_data[text_hash] = embedding

        # Save cache data
        try:
            with open(cache_file, "wb") as f:
                pickle.dump(cache_data, f)

            # Update metadata
            self.metadata["models"][model_name] = {
                "count": len(cache_data),
                "last_updated": os.path.getmtime(cache_file),
            }
            self._save_metadata()

            logger.info(
                f"Saved {len(embeddings)} embeddings to cache for model {model_name}"
            )
        except Exception as e:
            logger.warning(f"Failed to save embeddings to cache: {e}")

    def clear_cache(self, model_name: Optional[str] = None):
        """
        Clear the cache for a specific model or all models.

        Args:
            model_name: Name of the model to clear cache for, or None to clear all
        """
        if model_name is None:
            # Clear all caches
            for model in list(self.metadata["models"].keys()):
                cache_file = self._get_cache_file_path(model)
                if os.path.exists(cache_file):
                    os.remove(cache_file)
            self.metadata["models"] = {}
            self._save_metadata()
            logger.info("Cleared all embedding caches")
        elif model_name in self.metadata["models"]:
            # Clear specific model cache
            cache_file = self._get_cache_file_path(model_name)
            if os.path.exists(cache_file):
                os.remove(cache_file)
            del self.metadata["models"][model_name]
            self._save_metadata()
            logger.info(f"Cleared embedding cache for model {model_name}")

    def clear_expired_caches(self, max_age_days: float = 30.0):
        """
        Clear any model caches that are older than the specified age.

        Args:
            max_age_days: Maximum age in days before a cache is considered expired
        """
        current_time = time.time()
        max_age_seconds = max_age_days * 24 * 60 * 60

        for model_name, metadata in list(self.metadata["models"].items()):
            cache_age = current_time - metadata["last_updated"]
            if cache_age > max_age_seconds:
                self.clear_cache(model_name)
                logger.info(
                    f"Cleared expired cache for model {model_name} (age: {cache_age / (24 * 60 * 60):.1f} days)"
                )
            else:
                logger.info(
                    f"Skipping cache for model {model_name} (age: {cache_age / (24 * 60 * 60):.1f} days)"
                )
