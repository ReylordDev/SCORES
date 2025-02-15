import sys
from uuid import UUID  # noqa: F401
from pydantic import ValidationError
from utils.logging import initialize_logger
from models import (
    ClusterSimilaritiesMessage,
    ClusterAssignmentsMessage,
    Command,
    Error,
    FilePathPayload,
    FileSettings,
    AlgorithmSettings,
    ManualClusterCount,
    OutliersMessage,
    Run,
    RunNamePayload,
    CurrentRunMessage,
    ClusterNamePayload,
    RunIdPayload,
    MergersMessage,
)
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
            if not command.data or not isinstance(command.data, FilePathPayload):
                print_message("error", Error(error="File path cannot be empty"))
                return
            self.app_state.set_file_path(command.data.file_path)
        elif command.action == "get_file_path":
            print_message("file_path", self.app_state.get_file_path())
        elif command.action == "set_file_settings":
            if not command.data or not isinstance(command.data, FileSettings):
                print_message("error", Error(error="File settings cannot be empty"))
                return
            self.app_state.set_file_settings(command.data)
        elif command.action == "set_algorithm_settings":
            if not command.data or not isinstance(command.data, AlgorithmSettings):
                print_message(
                    "error", Error(error="Algorithm settings cannot be empty")
                )
                return
            self.app_state.set_algorithm_settings(command.data)
        elif command.action == "run_clustering":
            with self.database_manager.create_session() as session:
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
                self.app_state.set_run_id(run.id)
                self.database_manager.create_output_file(run)
                self.database_manager.create_assignments_file(run)
                self.database_manager.save_run(session, run, result.timesteps)

        elif command.action == "set_run_id":
            if not command.data or not isinstance(command.data, RunIdPayload):
                print_message("error", Error(error="Run ID cannot be empty"))
                return
            self.app_state.set_run_id(command.data.run_id)
        elif command.action == "get_runs":
            with self.database_manager.create_session() as session:
                runs = []
                for run in self.database_manager.get_runs(session):
                    runs.append(run)
                print_message("runs", runs)
        elif command.action == "get_current_run":
            with self.database_manager.create_session() as session:
                run_id = self.app_state.get_run_id()
                if not run_id:
                    logger.warning("Run ID not set")
                    return
                run = self.database_manager.get_run(session, run_id)
                if not run:
                    print_message("error", Error(error="Run not found"))
                    return
                if not run.result:
                    print_message("error", Error(error="Run not finished"))
                    return
                print_message(
                    "run", CurrentRunMessage(run=run, timesteps=run.result.timesteps)
                )
        elif command.action == "update_run_name":
            if not command.data or not isinstance(command.data, RunNamePayload):
                print_message("error", Error(error="Run name cannot be empty"))
                return
            self.database_manager.update_run_name(
                command.data.run_id, command.data.name
            )
        elif command.action == "get_cluster_assignments":
            with self.database_manager.create_session() as session:
                run_id = self.app_state.get_run_id()
                if not run_id:
                    print_message("error", Error(error="Run ID not set"))
                    return
                print_message(
                    "cluster_assignments",
                    ClusterAssignmentsMessage(
                        clusters=[
                            ClusterAssignmentsMessage.ClusterAssignmentDetail(
                                id=cluster.id,
                                index=cluster.index,
                                name=cluster.name,
                                responses=cluster.responses,
                                count=cluster.count,
                                is_merger_result=cluster.is_merger_result,
                            )
                            for cluster in self.database_manager.get_clusters(
                                session, run_id
                            )
                        ]
                    ),
                )
        elif command.action == "get_cluster_similarities":
            with self.database_manager.create_session() as session:
                run_id = self.app_state.get_run_id()
                if not run_id:
                    print_message("error", Error(error="Run ID not set"))
                    return
                print_message(
                    "cluster_similarities",
                    ClusterSimilaritiesMessage(
                        clusters=[
                            ClusterSimilaritiesMessage.ClusterSimilarityDetail(
                                id=cluster.id,
                                index=cluster.index,
                                name=cluster.name,
                                is_merger_result=cluster.is_merger_result,
                                responses=cluster.responses,
                                similarity_pairs=cluster.similarity_pairs,
                                count=cluster.count,
                            )
                            for cluster in self.database_manager.get_cluster_similarities(
                                session, run_id
                            )
                        ]
                    ),
                )
        elif command.action == "get_outliers":
            with self.database_manager.create_session() as session:
                run_id = self.app_state.get_run_id()
                if not run_id:
                    print_message("error", Error(error="Run ID not set"))
                    return
                outlier_stats = self.database_manager.get_outlier_statistics(
                    session, run_id
                )
                print_message(
                    "outliers",
                    OutliersMessage(
                        outliers=[
                            OutliersMessage.OutlierDetail(
                                id=outlier.id,
                                response=outlier.response,
                                similarity=outlier.similarity,
                            )
                            for outlier in outlier_stats.outliers
                        ],
                        threshold=outlier_stats.threshold,
                    ),
                )
        elif command.action == "update_cluster_name":
            if not command.data or not isinstance(command.data, ClusterNamePayload):
                print_message("error", Error(error="Cluster name cannot be empty"))
                return
            with self.database_manager.create_session() as session:
                self.database_manager.update_cluster_name(
                    session, command.data.cluster_id, command.data.name
                )
        elif command.action == "delete_run":
            if not command.data or not isinstance(command.data, RunIdPayload):
                print_message("error", Error(error="Run ID cannot be empty"))
                return
            with self.database_manager.create_session() as session:
                self.database_manager.delete_run(command.data.run_id)
        elif command.action == "reset_run_id":
            self.app_state.reset_run_id()
        elif command.action == "get_mergers":
            with self.database_manager.create_session() as session:
                run_id = self.app_state.get_run_id()
                if not run_id:
                    print_message("error", Error(error="Run ID not set"))
                    return
                merger_stats = self.database_manager.get_merger_statistics(
                    session, run_id
                )
                print_message(
                    "mergers",
                    MergersMessage(
                        threshold=merger_stats.threshold,
                        mergers=[
                            MergersMessage.MergerDetail(
                                id=merger.id,
                                name=merger.name,
                                clusters=[
                                    MergersMessage.MergerDetail.ClusterMergerDetail(
                                        id=cluster.id,
                                        name=cluster.name,
                                        responses=cluster.responses,
                                        count=cluster.count,
                                    )
                                    for cluster in merger.clusters
                                ],
                                similarity_pairs=merger.similarity_pairs,
                            )
                            for merger in merger_stats.mergers
                        ],
                    ),
                )
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
    DEBUG = False
    if DEBUG:
        initialize_logger()
        controller = Controller()
        controller.handle_command(
            Command(
                action="set_file_path",
                data=FilePathPayload(
                    file_path="C:\\Users\\Luis\\Projects\\Word-Clustering-Tool-for-SocPsych\\example_data\\example_short.csv"
                ),
            )
        )
        controller.handle_command(
            Command(
                action="set_file_settings",
                data=FileSettings(
                    delimiter=";",
                    has_header=True,
                    selected_columns=[1, 2, 3, 4, 5, 6, 7, 8, 9],
                ),
            )
        )
        controller.handle_command(
            Command(
                action="set_algorithm_settings",
                data=AlgorithmSettings(method=ManualClusterCount(cluster_count=25)),
            )
        )
        controller.handle_command(Command(action="run_clustering"))
        # controller.handle_command(Command(action="get_mergers"))
    else:
        main()
