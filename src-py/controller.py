import sys
from pydantic import ValidationError
from utils.logging import initialize_logger
from models import Command, Error, FileSettings, AlgorithmSettings, Run
from utils.ipc import print_message, print_progress
from loguru import logger
from application_state import ApplicationState
from database_manager import DatabaseManager
from clusterer import Clusterer


class Controller:
    def __init__(self):
        print_progress("init", "start")
        self.app_state = ApplicationState()
        self.database_manager = DatabaseManager()

        print_progress("init", "complete")

    def handle_command(self, command: Command):
        logger.info(f"Received command: {command}")
        if command.action == "set_file_path":
            if not command.data or not command.data["filePath"]:
                print_message("error", Error(error="File path cannot be empty"))
                return
            self.app_state.set_file_path(command.data["filePath"])
        elif command.action == "get_file_path":
            print_message("file_path", self.app_state.get_file_path())
        elif command.action == "set_file_settings":
            if not command.data:
                print_message("error", Error(error="File settings cannot be empty"))
                return
            self.app_state.set_file_settings(FileSettings(**command.data))
        elif command.action == "set_algorithm_settings":
            if not command.data:
                print_message(
                    "error", Error(error="Algorithm settings cannot be empty")
                )
                return
            self.app_state.set_algorithm_settings(AlgorithmSettings(**command.data))
        elif command.action == "run_clustering":
            file_settings = self.app_state.get_file_settings()
            if not file_settings:
                print_message("error", Error(error="File settings not set"))
                return
            algorithm_settings = self.app_state.get_algorithm_settings()
            if not algorithm_settings:
                print_message("error", Error(error="Algorithm settings not set"))
                return
            clusterer = Clusterer(self.app_state)
            result = clusterer.run()
            run = Run(
                file_path=self.app_state.get_file_path(),
                file_settings=file_settings.model_dump_json(),
                algorithm_settings=algorithm_settings.model_dump_json(),
                result=result,
            )
            self.database_manager.save_run(run)

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
