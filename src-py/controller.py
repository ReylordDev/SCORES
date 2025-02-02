import sys
from pydantic import ValidationError
from utils.logging import initialize_logger
from models import (
    Command,
    Error,
)
from utils.ipc import print_message, print_progress
from loguru import logger


class Controller:
    def __init__(self):
        print_progress("init", "start")

        print_progress("init", "complete")

    def handle_command(self, command: Command):
        logger.info(f"Received command: {command}")
        pass


@logger.catch
def main():
    initialize_logger()
    controller = Controller()
    while True:
        message = input()
        try:
            data = Command.model_validate_json(message)
            controller.handle_command(data)
        except ValidationError as e:
            logger.error(f"Invalid data: {e}")
            print_message("error", Error(error=f"Invalid data: {e}"))
            sys.stdout.flush()


if __name__ == "__main__":
    main()
