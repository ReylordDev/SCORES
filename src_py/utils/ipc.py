from loguru import logger
from models import (
    Message,
    ProgressMessage,
    StepType,
    StatusType,
    MessageType,
    MessageDataType,
)
import time
from pprint import pprint


def print_message(type: MessageType, data: MessageDataType, pretty: bool = False):
    logger.info(f"Printing message: {type} - {data}")
    if pretty:
        pprint(Message(type=type, data=data).model_dump())
    else:
        print(Message(type=type, data=data).model_dump_json(), flush=True, end="\n\n\n")
    time.sleep(0.01)


def print_progress(
    step: StepType,
    status: StatusType,
):
    progress_message = Message(
        type="progress",
        data=ProgressMessage(step=step, status=status, timestamp=time.time()),
    )
    print(progress_message.model_dump_json(), flush=True, end="\n\n\n")
    logger.info(progress_message.model_dump_json())
    time.sleep(0.01)
