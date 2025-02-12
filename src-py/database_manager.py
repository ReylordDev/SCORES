import csv
import time
import uuid
from sqlmodel import create_engine, SQLModel, Session, select
from sqlalchemy.orm import selectinload, joinedload
from models import (
    Cluster,
    ClusteringResult,
    FileSettings,
    Run,
    Timesteps,
    SimilarityPair,
)
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

    def create_session(self):
        return Session(self.engine)

    def save_to_db(self, obj):
        with Session(self.engine) as session:
            session.add(obj)
            session.commit()

    def save_run(self, session: Session, run: Run, timesteps: Timesteps):
        print_progress("save", "start")
        try:
            session.add(run)
            print_progress("save", "complete")
            timesteps.steps["save"] = time.time()
            session.commit()
        except:
            print_progress("save", "error")
            raise

    def get_runs(self, session: Session):
        return session.exec(select(Run)).all()

    def get_run(self, session: Session, run_id: uuid.UUID):
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

    def get_run_result(self, session: Session, run_id: uuid.UUID):
        return session.exec(
            select(ClusteringResult).where(ClusteringResult.run_id == run_id)
        ).one()

    def get_clusters(self, session: Session, run_id: uuid.UUID):
        return session.exec(
            select(Cluster)
            .join(ClusteringResult)
            .where(ClusteringResult.run_id == run_id)
        ).all()

    def get_cluster_similarities(self, session: Session, run_id: uuid.UUID):
        return (
            session.exec(
                select(Cluster)
                .join(ClusteringResult)
                .where(ClusteringResult.run_id == run_id)
            )
            .unique()
            .all()
        )

    def create_output_file(self, run: Run):
        if not run.result:
            raise ValueError("Run result is empty")

        file_settings = FileSettings.model_validate_json(run.file_settings)

        responses = run.result.get_all_responses()
        response_text_map = {response.text: response for response in responses}
        rows = []
        with open(run.file_path, "r", encoding="utf-8") as f:
            reader = csv.reader(f, delimiter=file_settings.delimiter)
            if file_settings.has_header:
                header = next(reader)
                rows.append(header)
            for row in reader:
                for i in file_settings.selected_columns:
                    # get the next response provided by the current participant
                    text = row[i]
                    response = response_text_map.get(text.strip().lower())
                    if response is None or response.cluster is None:
                        row.append("")
                        continue
                    # TODO: need an index for the cluster
                    row.append(response.cluster.id.hex)
                rows.append(row)

        with open(run.output_file_path, "w", encoding="utf-8") as f:
            writer = csv.writer(
                f, delimiter=file_settings.delimiter, lineterminator="\n"
            )
            if file_settings.has_header:
                # add the new columns to the header
                new_header = rows[0].copy()
                for i in file_settings.selected_columns:
                    selected_header = rows[0][i]
                    new_header.append(f"{selected_header}_cluster_index")

                # write the header
                writer.writerow(new_header)
                writer.writerows(rows[1:])
            else:
                writer.writerows(rows)


if __name__ == "__main__":
    db_manager = DatabaseManager()
    session = db_manager.create_session()
    with session:
        runs = db_manager.get_runs(session=session)
        for run in runs:
            print(run)
        db_manager.update_run_name(runs[0].id, "New Name")
        runs = db_manager.get_runs(session=session)
        for run in runs:
            print(run)
