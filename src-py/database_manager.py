from sqlmodel import create_engine, SQLModel
import os


class DatabaseManager:
    def __init__(self):
        sql_file_name = os.environ.get("USER_DATA_PATH", "./") + "database.db"
        if not os.path.exists(sql_file_name):
            with open(sql_file_name, "w") as f:
                f.write("")
        self.engine = create_engine(f"sqlite:///{sql_file_name}")
        SQLModel.metadata.create_all(self.engine)
