from typing import Optional
from uuid import UUID

from loguru import logger
from models import FileSettings, AlgorithmSettings

DEBUG_RUN_ID = "ce08b1ce48df4452861a65ab3936ed36"


class ApplicationState:
    def __init__(self):
        self.file_path = None
        self.file_settings = None
        self.algorithm_settings = None

        if DEBUG_RUN_ID:
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

    def get_algorithm_settings(self):
        return self.algorithm_settings

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
