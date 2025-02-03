from models import FileSettings


class ApplicationState:
    def __init__(self):
        self.file_path = None
        self.file_settings = None

    def set_file_path(self, file_path: str):
        self.file_path = file_path

    def get_file_path(self):
        return self.file_path

    def set_file_settings(self, file_settings: FileSettings):
        self.file_settings = file_settings

    def get_file_settings(self):
        return self.file_settings
