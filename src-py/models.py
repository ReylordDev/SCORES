from itertools import count
from typing import Literal, Optional, Union
from pydantic import BaseModel, ConfigDict, computed_field
from pydantic.alias_generators import to_camel
from sqlmodel import JSON, Column, SQLModel, Field, Relationship
import numpy as np
import time
import uuid


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
]
StatusType = Literal["start", "complete", "error"]
StepType = Union[
    ActionType,
    Literal["init",],
]


class Command(BaseModel):
    action: ActionType
    data: Optional[dict] = None


class ProgressMessage(BaseModel):
    step: StepType
    status: StatusType
    timestamp: float


class Error(BaseModel):
    error: str


MessageType = Literal[
    "progress",
    "file_path",
    "error",
]
MessageDataType = Union[
    ProgressMessage,
    Error,
    str,
    None,
]


class Message(BaseModel):
    type: MessageType
    data: MessageDataType


class FileSettings(SQLModel):
    delimiter: str
    has_header: bool
    selected_columns: list[int] = Field(..., sa_column=Column(JSON))


class AutomaticClusterCount(BaseModel):
    cluster_count_method: Literal["auto"] = "auto"
    max_clusters: int


class ManualClusterCount(BaseModel):
    cluster_count_method: Literal["manual"] = "manual"
    cluster_count: int


class AlgorithmSettings(SQLModel):
    # can be improved
    method: Union[AutomaticClusterCount, ManualClusterCount] = Field(
        default=AutomaticClusterCount(max_clusters=10),
        discriminator="cluster_count_method",
    )


response_id_counter = count(0)


class Response(SQLModel, table=True):
    id: int = Field(default_factory=lambda: next(response_id_counter), primary_key=True)
    text: str
    embedding: Optional[list[float]] = Field(default=None, sa_column=Column(JSON))
    is_outlier: bool = False
    similarity: Optional[float] = None
    count: int = 0

    cluster_id: Optional[int] = Field(default=None, foreign_key="cluster.id")
    cluster: Optional["Cluster"] = Relationship(back_populates="responses")

    # outlier_statistic_id: uuid.UUID = Field(foreign_key="outlier_statistic.id")
    outlier_statistic: "OutlierStatistic" = Relationship(back_populates="response")


class OutlierStatistic(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    similarity: float

    response_id: int = Field(foreign_key="response.id")
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


class Cluster(SQLModel, table=True):
    id: int = Field(default_factory=lambda: next(response_id_counter), primary_key=True)
    name: str = ""
    center: list[float] = Field(sa_column=Column(JSON))
    responses: list[Response] = Relationship(back_populates="cluster")

    def __init__(self, **data):
        super().__init__(**data)
        # self.name = f"Cluster {self.id}"
        self.__dict__["name"] = f"Cluster {self.id}"  # Bypass frozen for initialization

    @computed_field
    @property
    def count(self) -> int:
        return len(self.responses)

    @computed_field
    @property
    def most_representative_responses(self) -> list[Response]:
        """Responses sorted by similarity descending"""
        return sorted(self.responses, key=lambda r: r.similarity or -1, reverse=True)

    def similarity_to_response(self, response: Response) -> float:
        if not response.embedding:
            raise ValueError("Response does not have an embedding")
        return np.dot(self.center, response.embedding)

    def similarity_to_cluster(self, cluster: "Cluster") -> float:
        return np.dot(self.center, cluster.center)

    result_id: Optional[uuid.UUID] = Field(
        default=None, foreign_key="clusteringresult.id"
    )
    result: "ClusteringResult" = Relationship(back_populates="clusters")

    merger_id: Optional[int] = Field(default=None, foreign_key="merger.id")
    merger: Optional["Merger"] = Relationship(back_populates="clusters")

    similarity_pair_id: Optional[uuid.UUID] = Field(
        default=None, foreign_key="clustersimilaritypair.id"
    )
    similarity_pair: Optional["ClusterSimilarityPair"] = Relationship(
        back_populates="clusters"
    )


class ClusterSimilarityPair(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    similarity: float
    clusters: list[Cluster] = Relationship(back_populates="similarity_pair")

    merger_id: Optional[int] = Field(default=None, foreign_key="merger.id")
    merger: Optional["Merger"] = Relationship(back_populates="similarity_pairs")

    result_id: Optional[uuid.UUID] = Field(
        default=None, foreign_key="clusteringresult.id"
    )
    result: Optional["ClusteringResult"] = Relationship(
        back_populates="inter_cluster_similarities"
    )


merger_id_counter = count(0)


class Merger(SQLModel, table=True):
    id: int = Field(default_factory=lambda: next(merger_id_counter), primary_key=True)
    name: str = ""
    clusters: list[Cluster] = Relationship(back_populates="merger")
    similarity_pairs: list[ClusterSimilarityPair] = Relationship(
        back_populates="merger"
    )

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


class ClusteringResult(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    clusters: list[Cluster] = Relationship(back_populates="result")
    outlier_statistics: OutlierStatistics = Relationship(
        back_populates="clustering_result"
    )
    merger_statistics: MergingStatistics = Relationship(
        back_populates="clustering_result"
    )
    inter_cluster_similarities: list[ClusterSimilarityPair] = Relationship(
        back_populates="result"
    )

    run_id: Optional[uuid.UUID] = Field(default=None, foreign_key="run.id")
    run: "Run" = Relationship(back_populates="result")


class Run(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    file_path: str
    created_at: float = Field(default_factory=time.time)

    # file_settings_id: uuid.UUID = Field(foreign_key="filesettings.id")
    # file_settings: FileSettings = Relationship(back_populates="run")
    file_settings: FileSettings = Field(sa_column=Column(JSON))

    # algorithm_settings_id: uuid.UUID = Field(foreign_key="algorithmsettings.id")
    # algorithm_settings: AlgorithmSettings = Relationship(back_populates="run")
    algorithm_settings: AlgorithmSettings = Field(sa_column=Column(JSON))

    result: Optional[ClusteringResult] = Relationship(back_populates="run")
