class ApplicationState:
    def __init__(self):
        self.file_path = None
        pass

    def set_file_path(self, file_path: str):
        self.file_path = file_path

    def get_file_path(self):
        return self.file_path
