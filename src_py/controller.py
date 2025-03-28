import csv
import sys
import traceback
import uuid
from pydantic import ValidationError
from utils.logging import initialize_logger
from utils.utils import preprocess_response
from models import (
    AdvancedSettings,
    AutomaticClusterCount,
    AvailableModelsMessage,
    CachedModelsMessage,
    ClusterPositionDetail,
    ClusterPositionsMessage,
    ClusterSimilaritiesMessage,
    ClusterAssignmentsMessage,
    Command,
    DownloadStatusMessage,
    DownloadStatusPayload,
    Error,
    FilePathPayload,
    FileSettings,
    AlgorithmSettings,
    OutliersMessage,
    Pos2d,
    Pos3d,
    RawResponsesMessage,
    ResponsePositionDetail,
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
from app_cache import EmbeddingCache
from downloader import DownloadManager


class Controller:
    def __init__(self):
        print_progress("init", "start")
        self.app_state = ApplicationState()
        self.database_manager = DatabaseManager()
        self.download_manager = DownloadManager()
        self.embedding_cache = EmbeddingCache()
        self.embedding_cache.clear_expired_caches()

        print_progress("init", "complete")

    def fetch_raw_responses(self):
        assert self.app_state.file_path is not None
        assert self.app_state.file_settings is not None
        responses = []
        with open(self.app_state.file_path, encoding="utf-8") as f:
            reader = csv.reader(f, delimiter=self.app_state.file_settings.delimiter)
            if self.app_state.file_settings.has_header:
                reader.__next__()

            for row in reader:
                for column_index in self.app_state.file_settings.selected_columns:
                    if column_index >= len(row):
                        logger.warning(
                            f"Skipping invalid column {column_index} in row {reader.line_num}"
                        )
                        continue
                    # get the next entry provided by the current participant
                    response = preprocess_response(row[column_index])
                    if response == "" or response is None:
                        continue
                    responses.append(response)
        return responses

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
                run_id = uuid.uuid4()
                self.app_state.set_run_id(run_id)
                clusterer = Clusterer(self.app_state)
                try:
                    result = clusterer.run()
                except Exception as e:
                    logger.error(traceback.format_exc())
                    logger.error(f"Error running clustering: {e}")
                    print_message("error", Error(error=str(e)))
                    raise
                algorithm_settings_dict = algorithm_settings.model_dump()
                algorithm_settings_dict["random_state"] = (
                    self.app_state.get_random_state()
                )
                algorithm_settings = AlgorithmSettings(**algorithm_settings_dict)

                run = Run(
                    id=run_id,
                    file_path=self.app_state.get_file_path(),
                    file_settings=file_settings.model_dump_json(),
                    algorithm_settings=algorithm_settings.model_dump_json(),
                    result=result,
                )
                self.database_manager.create_output_file(run)
                self.database_manager.create_assignments_file(run)
                self.database_manager.save_run(session, run, result.timesteps)
                print_progress("save", "complete")

        elif command.action == "set_run_id":
            if not command.data or not isinstance(command.data, RunIdPayload):
                print_message("error", Error(error="Run ID cannot be empty"))
                return
            self.app_state.set_run_id(command.data.run_id)
            with self.database_manager.create_session() as session:
                self.app_state.set_file_settings(
                    self.database_manager.get_file_settings(
                        session, command.data.run_id
                    )
                )
                self.app_state.set_algorithm_settings(
                    self.database_manager.get_algorithm_settings(
                        session, command.data.run_id
                    )
                )
                self.app_state.set_file_path(
                    self.database_manager.get_file_path(session, command.data.run_id)
                )
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
        elif command.action == "get_cluster_positions":
            with self.database_manager.create_session() as session:
                run_id = self.app_state.get_run_id()
                if not run_id:
                    print_message("error", Error(error="Run ID not set"))
                    return
                print_message(
                    "cluster_positions",
                    ClusterPositionsMessage(
                        clusters=[
                            ClusterPositionDetail(
                                id=cluster.id,
                                name=cluster.name,
                                index=cluster.index,
                                count=cluster.count,
                                pos_2d=Pos2d(
                                    x=cluster.manifold_position2d.x,
                                    y=cluster.manifold_position2d.y,
                                ),
                                pos_3d=Pos3d(
                                    x=cluster.manifold_position3d.x,
                                    y=cluster.manifold_position3d.y,
                                    z=cluster.manifold_position3d.z,
                                ),
                                responses=[
                                    ResponsePositionDetail(
                                        id=response.id,
                                        text=response.text,
                                        is_outlier=response.is_outlier,
                                        count=response.count,
                                        pos_2d=Pos2d(
                                            x=response.manifold_position2d.x,
                                            y=response.manifold_position2d.y,
                                        ),
                                        pos_3d=Pos3d(
                                            x=response.manifold_position3d.x,
                                            y=response.manifold_position3d.y,
                                            z=response.manifold_position3d.z,
                                        ),
                                    )
                                    for response in cluster.responses
                                    if response.manifold_position2d is not None
                                    and response.manifold_position3d is not None
                                ],
                            )
                            for cluster in self.database_manager.get_clusters(
                                session, run_id
                            )
                            if cluster.manifold_position2d is not None
                            and cluster.manifold_position3d is not None
                        ]
                    ),
                )

        elif command.action == "get_selection_statistics":
            with self.database_manager.create_session() as session:
                run_id = self.app_state.get_run_id()
                if not run_id:
                    print_message("error", Error(error="Run ID not set"))
                    return
                result = self.database_manager.get_run_result(session, run_id)
                if not result:
                    print_message("error", Error(error="Run result not found"))
                    return
                print_message(
                    "selection_statistics",
                    result.k_selection_statistics,
                )
        elif command.action == "get_download_status":
            if not command.data or not isinstance(command.data, DownloadStatusPayload):
                print_message("error", Error(error="Model name cannot be empty"))
                return
            status = self.download_manager.get_download_status(command.data.model_name)
            print_message(
                "download_status",
                DownloadStatusMessage(
                    status=status, model_name=command.data.model_name
                ),
            )
        elif command.action == "download_model":
            if not command.data or not isinstance(command.data, DownloadStatusPayload):
                print_message("error", Error(error="Model name cannot be empty"))
                return

            def callback(model_name, success):
                if success:
                    status = "downloaded"
                    print_message(
                        "download_status",
                        DownloadStatusMessage(status=status, model_name=model_name),
                    )
                else:
                    status = "error"
                    print_message(
                        "error", Error(error=f"Error downloading {model_name}")
                    )

            self.download_manager.download_model(
                command.data.model_name, callback=callback
            )
            print_message(
                "download_status",
                DownloadStatusMessage(
                    status="downloading", model_name=command.data.model_name
                ),
            )
        elif command.action == "get_cached_models":
            models = self.download_manager.get_cached_models()
            print_message(
                "cached_models",
                CachedModelsMessage(models=[model for model in models]),
            )

        elif command.action == "get_available_models":
            models = self.download_manager.get_compatible_models()
            print_message(
                "available_models",
                AvailableModelsMessage(models=[model for model in models]),
            )

        elif command.action == "fetch_raw_responses":
            responses = self.fetch_raw_responses()
            print_message("raw_responses", RawResponsesMessage(responses=responses))

        else:
            logger.error(f"Invalid action: {command.action}")
            print_message("error", Error(error=f"Invalid action: {command.action}"))


@logger.catch
def main():
    initialize_logger()
    controller = Controller()
    while True:
        message = sys.stdin.readline()
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
        print("Running in debug mode")
        initialize_logger()
        controller = Controller()
        controller.handle_command(
            Command(
                action="set_file_path",
                data=FilePathPayload(file_path="./example_data/example.csv"),
            )
        )
        controller.handle_command(
            Command(
                action="set_file_settings",
                data=FileSettings(
                    delimiter=";",
                    has_header=True,
                    selected_columns=[7, 8, 9],
                ),
            )
        )
        controller.handle_command(
            Command(
                action="set_algorithm_settings",
                data=AlgorithmSettings(
                    method=AutomaticClusterCount(max_clusters=100, min_clusters=10),
                    advanced_settings=AdvancedSettings(
                        embedding_model="intfloat/multilingual-e5-large-instruct"
                    ),
                ),
            )
        )
        # controller.handle_command(Command(action="run_clustering"))
        controller.handle_command(Command(action="fetch_raw_responses"))
    else:
        main()
