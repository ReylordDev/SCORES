from typing import Literal, Optional, Union
from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


ActionType = Literal["set_file_path", "get_file_path", "set_file_settings"]
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
