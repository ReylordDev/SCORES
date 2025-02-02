import os
import sys

from loguru import logger
from .utils import get_user_data_path, is_production_environment


def initialize_logger():
    log_level = os.environ.get("LOG_LEVEL", "DEBUG")
    logger.remove()
    logger.add(
        sys.stderr,
        level=log_level,
        format="<green>{time:YYYY-MM-DD HH:mm:ss.SSS}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
    )
    logger.add(
        os.path.join(get_user_data_path(), "logs", "python.log"),
        rotation="500 MB",
        level=log_level,
        encoding="utf-8",
    )
    logger.info(
        f"\nLogger initialized in {'PRODUCTION' if is_production_environment() else 'DEVELOPMENT'} mode",
    )
