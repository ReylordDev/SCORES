import locale
import os
import sys

from loguru import logger
from .utils import get_user_data_path, is_production_environment


def initialize_logger():
    log_level = os.environ.get("LOG_LEVEL", "DEBUG")
    logger.remove()
    if not is_production_environment():
        logger.add(
            sys.stderr,
            level=log_level,
            format="<green>{time:YYYY-MM-DD HH:mm:ss.SSS}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
        )
    logger.add(
        os.path.join(get_user_data_path(), "logs", "python.log"),
        rotation="500 MB",
        level=log_level,
    )
    logger.info(
        f"\nLogger initialized in {'PRODUCTION' if is_production_environment() else 'DEVELOPMENT'} mode, log level: {log_level}",
    )
    logger.info(f"Python default encoding: {sys.getdefaultencoding()}")
    logger.info(f"Python utf-8 mode: {sys.flags.utf8_mode}")
    logger.info(f"Stdout encoding: {sys.stdout.encoding}")
    logger.info(f"File system encoding: {sys.getfilesystemencoding()}")
    logger.info(f"Locale preferred encoding: {locale.getpreferredencoding()}")
    logger.info(f"Locale settings: {locale.getlocale()}")
