from itertools import count
from typing import Literal, Optional, Union
from pydantic import BaseModel, ConfigDict, Field, computed_field
from pydantic.alias_generators import to_camel
import numpy as np


class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


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


class FileSettings(CamelModel):
    delimiter: str
    has_header: bool
    selected_columns: list[int]


class AlgorithmSettings(CamelModel):
    # can be improved
    cluster_count: Union[int, Literal["auto"]]
    max_clusters: Optional[int] = None


response_id_counter = count(0)


class Response(CamelModel):
    text: str
    embedding: Optional[list[float]] = None
    is_outlier: bool = False
    cluster_id: Optional[int] = None
    count: int
    id: int = Field(default_factory=lambda: next(response_id_counter))


class OutlierStatistic(CamelModel):
    response: Response
    similarity: float


class OutlierStatistics(CamelModel):
    threshold: float
    outliers: list[OutlierStatistic]


class Cluster(CamelModel):
    id: int
    name: str = ""
    center: list[float]
    responses: list[Response]

    def __init__(self, **data):
        super().__init__(**data)
        self.name = f"Cluster {self.id}"

    @computed_field
    @property
    def count(self) -> int:
        return len(self.responses)

    def similarity_to_response(self, response: Response) -> float:
        if not response.embedding:
            raise ValueError("Response does not have an embedding")
        return np.dot(self.center, response.embedding)

    def similarity_to_cluster(self, cluster: "Cluster") -> float:
        return np.dot(self.center, cluster.center)


class ClusterSimilarityPair(CamelModel):
    cluster_ids: tuple[int, int]
    similarity: float


merger_id_counter = count(0)


class Merger(CamelModel):
    id: int = Field(default_factory=lambda: next(merger_id_counter))
    name: str = ""
    clusters: list[Cluster]
    similarity_pairs: list[ClusterSimilarityPair]

    def __init__(self, **data):
        super().__init__(**data)
        self.name = f"Merger {self.id}"


class MergingStatistics(CamelModel):
    threshold: float
    mergers: list[Merger]


class ClusteringResult(CamelModel):
    clusters: list[Cluster]
    outlier_statistics: OutlierStatistics
    merger_statistics: MergingStatistics
