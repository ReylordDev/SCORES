import random
from typing import Optional
from uuid import UUID

from loguru import logger
from models import FileSettings, AlgorithmSettings
from utils.utils import get_user_data_path, is_production_environment

DEBUG_RUN_ID = ""


class ApplicationState:
    def __init__(self):
        self.file_path = None
        self.file_settings = None
        self.algorithm_settings = None
        self.random_state = 0

        if DEBUG_RUN_ID and not is_production_environment():
            logger.debug("Using debug run ID")
            self._current_run_id = UUID(DEBUG_RUN_ID)
        else:
            self._current_run_id: Optional[UUID] = None

    def set_file_path(self, file_path: str):
        self.file_path = file_path

    def get_file_path(self):
        return self.file_path

    def set_file_settings(self, file_settings: FileSettings):
        self.file_settings = file_settings

    def get_file_settings(self):
        return self.file_settings

    def set_algorithm_settings(self, algorithm_settings: AlgorithmSettings):
        self.algorithm_settings = algorithm_settings
        self.random_state = algorithm_settings.random_state or random.randint(1, 1000)
        logger.debug(f"Random state: {self.random_state}")

    def get_algorithm_settings(self):
        return self.algorithm_settings

    def get_random_state(self):
        return self.random_state

    def set_run_id(self, run_id: UUID):
        if isinstance(run_id, str):
            logger.warning("Run ID is a string, converting to UUID")
            run_id = UUID(run_id)
        self._current_run_id = run_id

    def get_run_id(self):
        return self._current_run_id

    def reset_run_id(self):
        """Reset the current run ID to None"""
        self._current_run_id = None

    def get_results_dir(self):
        if not self._current_run_id:
            raise ValueError("Run ID is not set")
        results_dir = f"{get_user_data_path()}/results/{self._current_run_id}"
        return results_dir
