from sqlmodel import create_engine, SQLModel, Session, select
from models import Run
import os


class DatabaseManager:
    def __init__(self, echo=False):
        sql_file_name = os.environ.get("USER_DATA_PATH", "./") + "database.db"
        if not os.path.exists(sql_file_name):
            with open(sql_file_name, "w") as f:
                f.write("")
        self.engine = create_engine(f"sqlite:///{sql_file_name}", echo=echo)
        SQLModel.metadata.create_all(self.engine)

    def get_engine(self):
        return self.engine

    def save_to_db(self, obj):
        with Session(self.engine) as session:
            session.add(obj)
            session.commit()

    def get_runs(self):
        with Session(self.engine) as session:
            return session.exec(select(Run)).all()

    def update_run_name(self, run_id, new_name):
        with Session(self.engine) as session:
            run = session.exec(select(Run).where(Run.id == run_id)).one()
            run.name = new_name
            session.add(run)
            session.commit()


if __name__ == "__main__":
    db_manager = DatabaseManager()
    runs = db_manager.get_runs()
    for run in runs:
        print(run)
    db_manager.update_run_name(runs[0].id, "New Name")
    runs = db_manager.get_runs()
    for run in runs:
        print(run)
