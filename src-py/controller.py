import sys
from pydantic import ValidationError
from utils.logging import initialize_logger
from models import (
    Command,
    Error,
)
from utils.ipc import print_message, print_progress
from loguru import logger
from application_state import ApplicationState


class Controller:
    def __init__(self):
        print_progress("init", "start")
        self.app_state = ApplicationState()

        print_progress("init", "complete")

    def handle_command(self, command: Command):
        logger.info(f"Received command: {command}")
        if command.action == "set_file_path":
            self.app_state.set_file_path(command.data["file_path"])
        else:
            logger.error(f"Invalid action: {command.action}")
            print_message("error", Error(error=f"Invalid action: {command.action}"))


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
