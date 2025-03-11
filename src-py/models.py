import os
from typing import Literal, Optional, Union
from pydantic import BaseModel, ConfigDict, computed_field
from pydantic.alias_generators import to_camel
from sqlmodel import JSON, Column, SQLModel, Field, Relationship
import numpy as np
import time
import uuid
from utils.utils import get_user_data_path


class CamelModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel, populate_by_name=True, frozen=True
    )


ActionType = Literal[
    "set_file_path",
    "get_file_path",
    "set_file_settings",
    "set_algorithm_settings",
    "run_clustering",
    "get_runs",
    "get_current_run",
    "set_run_id",
    "reset_run_id",
    "update_run_name",
    "get_cluster_assignments",
    "get_cluster_similarities",
    "get_outliers",
    "get_mergers",
    "get_cluster_positions",
    "get_selection_statistics",
    "update_cluster_name",
    "delete_run",
    "get_download_status",
    "download_model",
    "get_cached_models",
    "get_available_models",
    "fetch_raw_responses",
]
StatusType = Literal["todo", "start", "complete", "error"]
ClusteringStepType = Literal[
    "start",
    "process_input_file",
    "load_model",
    "embed_responses",
    "detect_outliers",
    "find_optimal_k",
    "cluster",
    "merge",
    "save",
]
StepType = Union[
    ActionType,
    Literal["init"],
    ClusteringStepType,
]


class FilePathPayload(CamelModel):
    file_path: str


class RunNamePayload(CamelModel):
    run_id: uuid.UUID
    name: str


class ClusterNamePayload(CamelModel):
    cluster_id: uuid.UUID
    name: str


class RunIdPayload(CamelModel):
    run_id: uuid.UUID


class DownloadStatusPayload(CamelModel):
    model_name: str


class Command(CamelModel):
    action: ActionType
    data: Optional[
        Union[
            FilePathPayload,
            "FileSettings",
            "AlgorithmSettings",
            RunNamePayload,
            ClusterNamePayload,
            RunIdPayload,
            DownloadStatusPayload,
        ]
    ] = None


class ProgressMessage(BaseModel):
    step: StepType
    status: StatusType
    timestamp: float = Field(default_factory=time.time)


class ClusteringProgressMessage(BaseModel):
    step: ClusteringStepType
    status: StatusType
    timestamp: float = Field(default_factory=time.time)


class CurrentRunMessage(BaseModel):
    run: "Run"
    timesteps: "Timesteps"


class ClusterAssignmentsMessage(BaseModel):
    class ClusterAssignmentDetail(BaseModel):
        id: uuid.UUID
        index: int
        name: str
        responses: list["Response"]
        count: int
        is_merger_result: bool

    clusters: list[ClusterAssignmentDetail]


class ClusterSimilaritiesMessage(BaseModel):
    class ClusterSimilarityDetail(BaseModel):
        id: uuid.UUID
        index: int
        name: str
        responses: list["Response"]
        similarity_pairs: dict[uuid.UUID, float]
        count: int
        is_merger_result: bool

    clusters: list[ClusterSimilarityDetail]


class OutliersMessage(BaseModel):
    class OutlierDetail(BaseModel):
        id: uuid.UUID
        response: "Response"
        similarity: float

    outliers: list[OutlierDetail]
    threshold: float


class MergersMessage(BaseModel):
    class MergerDetail(BaseModel):
        class ClusterMergerDetail(BaseModel):
            id: uuid.UUID
            name: str
            responses: list["Response"]
            count: int

        id: uuid.UUID
        name: str
        clusters: list[ClusterMergerDetail]
        similarity_pairs: list["SimilarityPair"]

    mergers: list[MergerDetail]
    threshold: float


class Pos2d(BaseModel):
    x: float
    y: float


class Pos3d(BaseModel):
    x: float
    y: float
    z: float


class ResponsePositionDetail(BaseModel):
    id: uuid.UUID
    text: str
    is_outlier: bool
    count: int
    pos_2d: Pos2d
    pos_3d: Pos3d


class ClusterPositionDetail(BaseModel):
    id: uuid.UUID
    name: str
    index: int
    count: int
    pos_2d: Pos2d
    pos_3d: Pos3d
    responses: list[ResponsePositionDetail]


class ClusterPositionsMessage(BaseModel):
    clusters: list[ClusterPositionDetail]


class Error(BaseModel):
    error: str


class DownloadStatusMessage(BaseModel):
    model_name: str
    status: "DownloadStatusType"


class CachedModelsMessage(BaseModel):
    models: list["CachedModel"]


class AvailableModelsMessage(BaseModel):
    models: list["EmbeddingModel"]


class RawResponsesMessage(BaseModel):
    responses: list[str]


MessageType = Literal[
    "progress",
    "file_path",
    "error",
    "runs",
    "run",
    "cluster_assignments",
    "cluster_similarities",
    "outliers",
    "mergers",
    "cluster_positions",
    "selection_statistics",
    "download_status",
    "cached_models",
    "available_models",
    "raw_responses",
]
MessageDataType = Union[
    ProgressMessage,
    list["Run"],
    Error,
    CurrentRunMessage,
    ClusterAssignmentsMessage,
    ClusterSimilaritiesMessage,
    OutliersMessage,
    MergersMessage,
    ClusterPositionsMessage,
    list["KSelectionStatistic"],
    DownloadStatusMessage,
    CachedModelsMessage,
    AvailableModelsMessage,
    RawResponsesMessage,
    str,
    None,
]


class Message(BaseModel):
    type: MessageType
    data: MessageDataType


class FileSettings(CamelModel):
    delimiter: str
    has_header: bool
    selected_columns: list[int] = Field(..., sa_column=Column(JSON))


class AutomaticClusterCount(CamelModel):
    cluster_count_method: Literal["auto"] = "auto"
    max_clusters: int
    min_clusters: int


class ManualClusterCount(CamelModel):
    cluster_count_method: Literal["manual"] = "manual"
    cluster_count: int


class OutlierDetectionSettings(CamelModel):
    nearest_neighbors: int
    z_score_threshold: float


class AgglomerativeClusteringSettings(CamelModel):
    similarity_threshold: float
    iterative: bool = False


class AdvancedSettings(CamelModel):
    embedding_model: Optional[str] = None
    kmeans_method: Literal["kmeans", "spherical_kmeans"] = "spherical_kmeans"


class AlgorithmSettings(CamelModel):
    method: Union[AutomaticClusterCount, ManualClusterCount] = Field(
        discriminator="cluster_count_method",
    )
    excluded_words: list[str] = Field(default=[])
    outlier_detection: Optional[OutlierDetectionSettings] = None
    agglomerative_clustering: Optional[AgglomerativeClusteringSettings] = None
    advanced_settings: AdvancedSettings
    random_state: Optional[int] = None


class ManifoldPosition2d(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    x: float
    y: float

    response_id: Optional[uuid.UUID] = Field(default=None, foreign_key="response.id")
    response: Optional["Response"] = Relationship(back_populates="manifold_position2d")

    cluster_id: Optional[uuid.UUID] = Field(default=None, foreign_key="cluster.id")
    cluster: Optional["Cluster"] = Relationship(back_populates="manifold_position2d")


class ManifoldPosition3d(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    x: float
    y: float
    z: float

    response_id: Optional[uuid.UUID] = Field(default=None, foreign_key="response.id")
    response: Optional["Response"] = Relationship(back_populates="manifold_position3d")

    cluster_id: Optional[uuid.UUID] = Field(default=None, foreign_key="cluster.id")
    cluster: Optional["Cluster"] = Relationship(back_populates="manifold_position3d")


class Response(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    text: str
    is_outlier: bool = False
    similarity: Optional[float] = None
    count: int = 0
    manifold_position2d: Optional[ManifoldPosition2d] = Relationship(
        back_populates="response"
    )
    manifold_position3d: Optional[ManifoldPosition3d] = Relationship(
        back_populates="response"
    )

    cluster_id: Optional[uuid.UUID] = Field(default=None, foreign_key="cluster.id")
    cluster: Optional["Cluster"] = Relationship(back_populates="responses")

    # outlier_statistic_id: uuid.UUID = Field(foreign_key="outlier_statistic.id")
    outlier_statistic: "OutlierStatistic" = Relationship(back_populates="response")


class OutlierStatistic(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    similarity: float

    response_id: uuid.UUID = Field(foreign_key="response.id")
    response: Response = Relationship(back_populates="outlier_statistic")

    outlier_statistics_id: uuid.UUID = Field(foreign_key="outlierstatistics.id")
    outlier_statistics: "OutlierStatistics" = Relationship(back_populates="outliers")


class OutlierStatistics(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    threshold: float
    outliers: list[OutlierStatistic] = Relationship(back_populates="outlier_statistics")

    clustering_result_id: Optional[uuid.UUID] = Field(
        default=None, foreign_key="clusteringresult.id"
    )
    clustering_result: "ClusteringResult" = Relationship(
        back_populates="outlier_statistics"
    )


class SimilarityPair(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    similarity: float

    cluster_1_id: uuid.UUID = Field(foreign_key="cluster.id")
    cluster_2_id: uuid.UUID = Field(foreign_key="cluster.id")

    cluster_1: "Cluster" = Relationship(
        back_populates="similarity_pairs_as_cluster_1",
        sa_relationship_kwargs={
            "primaryjoin": "SimilarityPair.cluster_1_id==Cluster.id"
        },
    )
    cluster_2: "Cluster" = Relationship(
        back_populates="similarity_pairs_as_cluster_2",
        sa_relationship_kwargs={
            "primaryjoin": "SimilarityPair.cluster_2_id==Cluster.id"
        },
    )

    merger_id: Optional[uuid.UUID] = Field(default=None, foreign_key="merger.id")
    merger: Optional["Merger"] = Relationship(back_populates="similarity_pairs")

    result_id: Optional[uuid.UUID] = Field(
        default=None, foreign_key="clusteringresult.id"
    )
    result: Optional["ClusteringResult"] = Relationship(
        back_populates="inter_cluster_similarities"
    )


class Cluster(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    index: int
    name: str = ""
    center: list[float] = Field(sa_column=Column(JSON))
    responses: list[Response] = Relationship(back_populates="cluster")
    is_merger_result: bool = False
    manifold_position2d: Optional[ManifoldPosition2d] = Relationship(
        back_populates="cluster"
    )
    manifold_position3d: Optional[ManifoldPosition3d] = Relationship(
        back_populates="cluster"
    )

    def __init__(self, **data):
        super().__init__(**data)
        # self.name = f"Cluster {self.id}"
        self.__dict__["name"] = (
            f"Cluster {self.index}"  # Bypass frozen for initialization
        )

    @computed_field
    @property
    def count(self) -> int:
        return sum(response.count for response in self.responses)

    def similarity_to_response(
        self, response: Response, embeddings_map: dict[str, np.ndarray]
    ) -> float:
        return np.dot(self.center, embeddings_map[response.text])

    def similarity_to_cluster(self, cluster: "Cluster") -> float:
        return np.dot(self.center, cluster.center)

    result_id: Optional[uuid.UUID] = Field(
        default=None, foreign_key="clusteringresult.id"
    )
    result: "ClusteringResult" = Relationship(back_populates="clusters")

    merger_id: Optional[uuid.UUID] = Field(default=None, foreign_key="merger.id")
    merger: Optional["Merger"] = Relationship(back_populates="clusters")

    similarity_pairs_as_cluster_1: list[SimilarityPair] = Relationship(
        back_populates="cluster_1",
        sa_relationship_kwargs={
            "primaryjoin": "SimilarityPair.cluster_1_id==Cluster.id"
        },
    )
    similarity_pairs_as_cluster_2: list[SimilarityPair] = Relationship(
        back_populates="cluster_2",
        sa_relationship_kwargs={
            "primaryjoin": "SimilarityPair.cluster_2_id==Cluster.id"
        },
    )

    @computed_field
    @property
    def similarity_pairs(self) -> dict[uuid.UUID, float]:
        # return self.similarity_pairs_as_cluster_1 + self.similarity_pairs_as_cluster_2
        dict_1 = {
            pair.cluster_2.id: pair.similarity
            for pair in self.similarity_pairs_as_cluster_1
        }
        dict_2 = {
            pair.cluster_1.id: pair.similarity
            for pair in self.similarity_pairs_as_cluster_2
        }
        dict_1.update(dict_2)
        return dict_1

    def normalize_center(self):
        self.center = (
            np.asarray(self.center)
            / np.linalg.norm(
                np.asarray(self.center),
                ord=2,
                axis=0,
            )
        ).tolist()


class Merger(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = ""
    clusters: list[Cluster] = Relationship(back_populates="merger")
    similarity_pairs: list[SimilarityPair] = Relationship(back_populates="merger")

    merging_statistics_id: uuid.UUID = Field(foreign_key="mergingstatistics.id")
    merging_statistics: "MergingStatistics" = Relationship(back_populates="mergers")

    def __init__(self, **data):
        super().__init__(**data)
        # self.name = f"Merger {self.id}"
        self.__dict__["name"] = f"Merger {self.id}"  # Bypass frozen for initialization


class MergingStatistics(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    threshold: float
    mergers: list[Merger] = Relationship(back_populates="merging_statistics")

    clustering_result_id: Optional[uuid.UUID] = Field(
        default=None, foreign_key="clusteringresult.id"
    )
    clustering_result: "ClusteringResult" = Relationship(
        back_populates="merger_statistics"
    )


class Timesteps(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    steps: dict[ClusteringStepType, float] = Field(sa_column=Column(JSON))

    @computed_field
    @property
    def total_duration(self) -> float:
        if "start" not in self.steps or "save" not in self.steps:
            return 0
        start_time = self.steps["start"]
        end_time = self.steps["save"]
        return end_time - start_time

    clustering_result_id: Optional[uuid.UUID] = Field(
        default=None, foreign_key="clusteringresult.id"
    )
    clustering_result: "ClusteringResult" = Relationship(back_populates="timesteps")


class KSelectionStatistic(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    k: int
    silhouette: Optional[float] = None
    davies_bouldin: Optional[float] = None
    calinski_harabasz: Optional[float] = None
    combined: Optional[float] = None

    result_id: Optional[uuid.UUID] = Field(
        default=None, foreign_key="clusteringresult.id"
    )
    result: Optional["ClusteringResult"] = Relationship(
        back_populates="k_selection_statistics"
    )


class ClusteringResult(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    clusters: list[Cluster] = Relationship(back_populates="result")
    outlier_statistics: Optional[OutlierStatistics] = Relationship(
        back_populates="clustering_result"
    )
    merger_statistics: Optional[MergingStatistics] = Relationship(
        back_populates="clustering_result"
    )
    inter_cluster_similarities: list[SimilarityPair] = Relationship(
        back_populates="result"
    )
    timesteps: Timesteps = Relationship(back_populates="clustering_result")

    k_selection_statistics: list[KSelectionStatistic] = Relationship(
        back_populates="result"
    )

    run_id: Optional[uuid.UUID] = Field(default=None, foreign_key="run.id")
    run: "Run" = Relationship(back_populates="result")

    def get_all_responses(self) -> list[Response]:
        responses = []
        for cluster in self.clusters:
            responses.extend(cluster.responses)
        return responses


class Run(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str
    file_path: str
    created_at: float = Field(default_factory=time.time)

    file_settings: str = Field(sa_column=Column(JSON))

    algorithm_settings: str = Field(sa_column=Column(JSON))

    result: Optional[ClusteringResult] = Relationship(back_populates="run")

    def __init__(self, **data):
        super().__init__(**data)
        # self.name = f"Cluster {self.id}"
        self.__dict__["name"] = f"Run {self.id}"

    @computed_field
    @property
    def output_file_path(self) -> str:
        results_dir = f"{get_user_data_path()}/results/{self.id}"
        os.makedirs(results_dir, exist_ok=True)
        output_file_path = f"{results_dir}/output.csv"
        return output_file_path

    @computed_field
    @property
    def assignments_file_path(self) -> str:
        results_dir = f"{get_user_data_path()}/results/{self.id}"
        os.makedirs(results_dir, exist_ok=True)
        assignments_file_path = f"{results_dir}/assignments.csv"
        return assignments_file_path


DownloadStatusType = Literal[
    "not_downloaded", "partially_downloaded", "downloading", "downloaded"
]


class EmbeddingModel(CamelModel):
    id: str
    author: str | None
    created_at: float | None
    downloads: int | None
    likes: int | None
    trending_score: int | None
    tags: list[str] | None
    status: DownloadStatusType


class CachedModel(EmbeddingModel):
    path: str
    size_on_disk: int
    last_accessed: float
