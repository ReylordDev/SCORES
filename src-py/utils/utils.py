import os


def get_user_data_path():
    return os.environ.get("USER_DATA_PATH", "./")


def is_production_environment():
    return os.environ.get("PRODUCTION") == "true"
