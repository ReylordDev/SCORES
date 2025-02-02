from typing import Literal, Optional, Union
from pydantic import BaseModel


ActionType = Literal["quit",]
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
    "error",
]
MessageDataType = Union[
    ProgressMessage,
    Error,
]


class Message(BaseModel):
    type: MessageType
    data: MessageDataType
