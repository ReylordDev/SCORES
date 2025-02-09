import uuid
from sqlmodel import create_engine, SQLModel, Session, select
from models import Run
import os
from utils.utils import get_user_data_path
from utils.ipc import print_progress


class DatabaseManager:
    def __init__(self, echo=False):
        sql_file_name = get_user_data_path() + "/database.db"
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

    def save_run(self, run: Run):
        print_progress("save", "start")
        try:
            self.save_to_db(run)
            print_progress("save", "complete")
            return
        except:
            print_progress("save", "error")
            raise

    def get_runs(self):
        with Session(self.engine) as session:
            return session.exec(select(Run)).all()

    def get_run(self, run_id: uuid.UUID):
        with Session(self.engine) as session:
            return session.exec(select(Run).where(Run.id == run_id)).one()

    def update_run_name(self, run_id: uuid.UUID, new_name: str):
        with Session(self.engine) as session:
            run = session.exec(select(Run).where(Run.id == run_id)).one()
            run.name = new_name
            session.add(run)
            session.commit()

    def delete_run(self, run_id: uuid.UUID):
        with Session(self.engine) as session:
            run = session.exec(select(Run).where(Run.id == run_id)).one()
            session.delete(run)
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
