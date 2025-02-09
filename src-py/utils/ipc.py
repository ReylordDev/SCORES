from loguru import logger
from models import (
    Message,
    ProgressMessage,
    StepType,
    StatusType,
    MessageType,
    MessageDataType,
)
import sys
import time


def print_message(type: MessageType, data: MessageDataType):
    logger.info(f"Printing message: {type} - {data}")
    print(Message(type=type, data=data).model_dump_json(), flush=True)


def print_progress(
    step: StepType,
    status: StatusType,
):
    progress_message = Message(
        type="progress",
        data=ProgressMessage(step=step, status=status, timestamp=time.time()),
    )
    print(progress_message.model_dump_json())
    logger.info(f"Progress: {step} - {status}")
    sys.stdout.flush()
    time.sleep(0.01)
