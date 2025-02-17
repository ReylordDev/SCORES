import csv
import os
import random
import time

from sklearn.metrics import (
    silhouette_score,
    calinski_harabasz_score,
    davies_bouldin_score,
)
from utils.ipc import print_progress
from matplotlib import pyplot as plt
import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.cluster import AgglomerativeClustering, KMeans
from application_state import ApplicationState
from loguru import logger
from collections import Counter
from models import (
    Cluster,
    Merger,
    MergingStatistics,
    OutlierStatistic,
    Response,
    OutlierStatistics,
    SimilarityPair,
    Timesteps,
    ClusteringResult,
)


class Clusterer:
    def __init__(self, app_state: ApplicationState):
        file_path = app_state.get_file_path()
        file_settings = app_state.get_file_settings()
        algorithm_settings = app_state.get_algorithm_settings()
        if not file_path or not file_settings or not algorithm_settings:
            raise ValueError("Invalid Application State")
        self.file_path = file_path
        self.file_settings = file_settings
        self.algorithm_settings = algorithm_settings
        self.timesteps = Timesteps(steps={})
        self._random_state = random.randint(0, 1000)
        self.result_dir = app_state.get_results_dir()
        print_progress("process_input_file", "todo")
        print_progress("load_model", "todo")
        print_progress("embed_responses", "todo")
        if self.algorithm_settings.outlier_detection:
            print_progress("detect_outliers", "todo")
        if self.algorithm_settings.method.cluster_count_method == "auto":
            print_progress("find_optimal_k", "todo")
        print_progress("cluster", "todo")
        if self.algorithm_settings.agglomerative_clustering:
            print_progress("merge", "todo")
        print_progress("save", "todo")

    def get_random_state(self):
        return self._random_state

    def process_input_file(self, excluded_words: list[str]):
        print_progress("process_input_file", "start")
        response_counter: Counter[str] = Counter()
        try:
            with open(self.file_path, encoding="utf-8") as f:
                reader = csv.reader(f, delimiter=self.file_settings.delimiter)
                if self.file_settings.has_header:
                    reader.__next__()

                for row in reader:
                    for column_index in self.file_settings.selected_columns:
                        if column_index >= len(row):
                            logger.warning(
                                f"Skipping invalid column {column_index} in row {reader.line_num}"
                            )
                            continue
                        # get the next entry provided by the current participant
                        response = row[column_index].strip().lower()
                        if response == "" or response is None:
                            continue
                        for excluded_word in excluded_words:
                            if (
                                excluded_word != ""
                                and excluded_word.lower() in response.lower()
                            ):
                                logger.info(
                                    f"Excluded word found: {excluded_word} in response: {response}"
                                )
                                break
                        # otherwise, count the response
                        response_counter[response] += 1
            responses = list(response_counter.keys())
            responses = [
                Response(text=response, count=count)
                for response, count in response_counter.items()
            ]
            print_progress("process_input_file", "complete")
            self.timesteps.steps["process_input_file"] = time.time()
            return responses
        except Exception as e:
            print_progress("process_input_file", "error")
            logger.error(f"Error reading file: {e}")
            return []

    def load_embedding_model(self, language_model: str):
        print_progress("load_model", "start")
        try:
            model = SentenceTransformer(language_model)
            print_progress("load_model", "complete")
            self.timesteps.steps["load_model"] = time.time()
            return model
        except Exception as e:
            print_progress("load_model", "error")
            logger.error(f"Error loading embedding model: {e}")
            raise

    def embed_responses(
        self, responses: list[Response], embedding_model: SentenceTransformer
    ):
        print_progress("embed_responses", "start")
        # Side Effect: Embeds the responses and sets the embeddings in the Response objects
        norm_embeddings = embedding_model.encode(
            [response.text for response in responses], normalize_embeddings=True
        )
        embeddings_map: dict[str, np.ndarray] = {}
        for i, response in enumerate(responses):
            embeddings_map[response.text] = norm_embeddings[i]
        print_progress("embed_responses", "complete")
        self.timesteps.steps["embed_responses"] = time.time()
        return embeddings_map

    def detect_outliers(
        self,
        responses: list[Response],
        embeddings: np.ndarray,
        outlier_k: int,
        z_score_threshold: float,
    ):
        print_progress("detect_outliers", "start")
        # Potential for visualization: plot the distribution of average neighbor similarities
        if len(responses) == 0:
            logger.warning("No responses to analyze for outliers")
            print_progress("detect_outliers", "complete")
            self.timesteps.steps["detect_outliers"] = time.time()
            return OutlierStatistics(threshold=0.0, outliers=[])
        if outlier_k >= len(responses) - 1:
            outlier_k = len(responses) - 2
        similarity_matrix = np.dot(embeddings, embeddings.T)
        partition = np.partition(-similarity_matrix, outlier_k + 1, axis=1)
        sorted_neighborhood_partition = np.copy(partition)
        sorted_neighborhood_partition[:, : outlier_k + 1] = np.sort(
            partition[:, : outlier_k + 1], axis=1
        )
        avg_neighbor_sim = np.mean(
            -sorted_neighborhood_partition[:, 1 : outlier_k + 1], axis=1
        )

        outlier_threshold = np.mean(avg_neighbor_sim) - z_score_threshold * np.std(
            avg_neighbor_sim
        )

        outlier_stats = []
        outlier_bools = avg_neighbor_sim < outlier_threshold

        for index in np.where(outlier_bools)[0]:
            responses[index].is_outlier = True

        outliers = [response for response in responses if response.is_outlier]

        outlier_statistics_summary = OutlierStatistics(
            threshold=outlier_threshold, outliers=[]
        )

        for i, response in enumerate(outliers):
            sim = avg_neighbor_sim[np.where(outlier_bools)[0][i]]
            outlier_stats.append(
                OutlierStatistic(
                    similarity=sim,
                    response=response,
                    response_id=response.id,
                    outlier_statistics_id=outlier_statistics_summary.id,
                )
            )

        outlier_statistics_summary.outliers = outlier_stats

        print_progress("detect_outliers", "complete")
        self.timesteps.steps["detect_outliers"] = time.time()
        return outlier_statistics_summary

    def find_optimal_k(
        self,
        embeddings: np.ndarray,
        weights: np.ndarray,
    ):
        """
        Finds the optimal number of clusters (K) using a combination of the Elbow method
        and the silhouette score for weighted K-means.

        Parameters:
        - embeddings (np.ndarray): Input embeddings of shape (n_samples, n_features).
        - weights (np.ndarray): Sample weights of shape (n_samples,).
        - max_clusters (int): Maximum number of clusters to consider.

        Returns:
        - int: Optimal number of clusters.
        """
        print_progress("find_optimal_k", "start")
        assert self.algorithm_settings.method.cluster_count_method == "auto"
        max_clusters = self.algorithm_settings.method.max_clusters
        # Validate inputs
        if max_clusters < 2:
            raise ValueError("max_clusters must be at least 2")
        if len(embeddings) != len(weights):
            raise ValueError(
                "embeddings and weights must have the same number of samples"
            )

        silhouttes = []
        ch_scores = []
        db_scores = []
        for k in range(2, max_clusters + 1):
            # Fit K-means with sample weights
            kmeans = KMeans(
                n_clusters=k, n_init="auto", random_state=self._random_state
            )
            kmeans.fit(embeddings, sample_weight=weights)
            labels = kmeans.labels_

            silhouette_avg = silhouette_score(
                X=embeddings, labels=labels, random_state=self._random_state
            )
            silhouttes.append(silhouette_avg)

            ch_score = calinski_harabasz_score(X=embeddings, labels=labels)
            ch_scores.append(ch_score)

            db_score = davies_bouldin_score(X=embeddings, labels=labels)
            db_scores.append(db_score)

            logger.debug(f"Silhouette score for K={k}: {silhouette_avg}")
            logger.debug(f"Calinski-Harabasz score for K={k}: {ch_score}")
            logger.debug(f"Davies-Bouldin score for K={k}: {db_score}")

        # Normalize scores for comparison
        silhouttes_normalized = (silhouttes - np.min(silhouttes)) / (
            np.max(silhouttes) - np.min(silhouttes)
        )
        ch_scores_normalized = (ch_scores - np.min(ch_scores)) / (
            np.max(ch_scores) - np.min(ch_scores)
        )
        db_scores_normalized = (db_scores - np.min(db_scores)) / (
            np.max(db_scores) - np.min(db_scores)
        )

        combined_scores = (
            1 / 3 * ch_scores_normalized
            + 1 / 3 * silhouttes_normalized
            + 1 / 3 * (1 - db_scores_normalized)
        )

        # Find the K with the maximum combined score
        optimal_k = int(
            np.argmax(combined_scores) + 2
        )  # +2 because we started from k=2

        # Plot the metrics
        plt.figure(figsize=(10, 6))
        k_values = list(range(2, max_clusters + 1))
        plt.plot(k_values, silhouttes_normalized, "b-", label="Normalized Silhouette")
        plt.plot(
            k_values, ch_scores_normalized, "g-", label="Normalized Calinski-Harabasz"
        )
        plt.plot(
            k_values, db_scores_normalized, "y-", label="Normalized Davies-Bouldin"
        )
        plt.plot(k_values, combined_scores, "r-", label="Combined Score")
        plt.xlabel("Number of Clusters (K)")
        plt.ylabel("Score")
        plt.title("Cluster Count Selection Metrics")
        plt.legend()
        plt.grid(True)
        os.makedirs(self.result_dir, exist_ok=True)
        plt.savefig(f"{self.result_dir}/cluster_count_selection_metrics.png")
        plt.close()

        logger.debug(f"Optimal K: {optimal_k}")

        # Fallback to max_clusters if no elbow is found
        print_progress("find_optimal_k", "complete")
        self.timesteps.steps["find_optimal_k"] = time.time()
        return optimal_k if optimal_k is not None else max_clusters

    def start_clustering(
        self,
        responses: list[Response],
        embeddings: np.ndarray,
        embeddings_map: dict[str, np.ndarray],
        K: int,
        response_weights: np.ndarray,
    ):
        print_progress("cluster", "start")
        # Side Effect: Assigns cluster IDs to responses
        clustering = KMeans(
            n_clusters=K, n_init="auto", random_state=self._random_state
        ).fit(embeddings, sample_weight=response_weights)
        cluster_indices = np.copy(clustering.labels_)
        valid_clusters = [i for i in range(K) if np.sum(cluster_indices == i) > 0]
        K = len(valid_clusters)
        cluster_indices = np.array(
            [valid_clusters.index(idx) for idx in cluster_indices]
        )
        cluster_centers = clustering.cluster_centers_ / np.linalg.norm(
            clustering.cluster_centers_, axis=1, keepdims=True, ord=2
        )

        clusters = []
        for i in range(K):
            cluster = Cluster(
                center=cluster_centers[i].tolist(),
                responses=[],
                index=i,
            )
            clusters.append(cluster)

        for i, response in enumerate(responses):
            cluster_index = cluster_indices[i]
            response.cluster_id = clusters[cluster_index].id
            response.similarity = clusters[cluster_index].similarity_to_response(
                response, embeddings_map
            )
            clusters[cluster_index].responses.append(response)

        print_progress("cluster", "complete")
        self.timesteps.steps["cluster"] = time.time()
        return clusters

    def merge_clusters(
        self,
        clusters: list[Cluster],
        similarity_threshold: float,
        embeddings_map: dict[str, np.ndarray],
    ):
        print_progress("merge", "start")
        cluster_centers = np.asarray(
            [np.asarray(cluster.center) for cluster in clusters]
        )

        # merge the closest clusters using Agglomorative Clustering
        # until everything is closer than the threshold
        meta_clustering = AgglomerativeClustering(
            n_clusters=None,
            distance_threshold=1 - similarity_threshold,
            linkage="complete",
            metric="cosine",
        ).fit(cluster_centers)

        meta_clustering_indices = meta_clustering.labels_

        mergers: list[Merger] = []
        post_merge_cluster_ids = [cluster.id for cluster in clusters]
        for meta_clustering_index in np.unique(meta_clustering_indices):
            merged_cluster_indices = np.where(
                meta_clustering_indices == meta_clustering_index
            )[0].tolist()
            assert isinstance(merged_cluster_indices, list)
            if len(merged_cluster_indices) > 1:
                S = np.dot(
                    cluster_centers[merged_cluster_indices, :],
                    cluster_centers[merged_cluster_indices, :].T,
                )
                triu_indices = np.triu_indices(len(S), k=1)
                similarity_pairs = []
                merged_clusters: list[Cluster] = [
                    clusters[i]  # type: ignore
                    for i in merged_cluster_indices
                ]
                for i, j in zip(triu_indices[0], triu_indices[1]):
                    similarity_pairs.append(
                        SimilarityPair(
                            cluster_1_id=merged_clusters[i].id,
                            cluster_2_id=merged_clusters[j].id,
                            similarity=S[i, j],
                        )
                    )
                similarity_pairs.sort(key=lambda x: x.similarity, reverse=True)
                merger = Merger(
                    clusters=merged_clusters,
                    similarity_pairs=similarity_pairs,
                )
                mergers.append(merger)

                new_center = np.average(
                    [cluster.center for cluster in merged_clusters],
                    axis=0,
                    weights=[cluster.count for cluster in merged_clusters],
                )

                merged_cluster = Cluster(
                    center=new_center.tolist(),
                    index=merged_clusters[0].index,
                    is_merger_result=True,
                )

                merged_cluster.responses = [
                    Response(
                        text=response.text,
                        cluster_id=merged_cluster.id,
                        count=response.count,
                        similarity=merged_cluster.similarity_to_response(
                            response, embeddings_map
                        ),
                    )
                    for cluster in merged_clusters
                    for response in cluster.responses
                ]

                post_merge_cluster_ids.append(merged_cluster.id)
                clusters.append(merged_cluster)

                for cluster in merged_clusters:
                    post_merge_cluster_ids.remove(cluster.id)

        clusters = [
            cluster for cluster in clusters if cluster.id in post_merge_cluster_ids
        ]
        merging_statistics = MergingStatistics(
            mergers=mergers, threshold=similarity_threshold
        )
        print_progress("merge", "complete")
        self.timesteps.steps["merge"] = time.time()
        return merging_statistics, clusters

    def calculate_inter_cluster_similarities(self, clusters: list[Cluster]):
        # Calculate the similarity between all pairs of clusters
        cluster_centers = np.asarray(
            [np.asarray(cluster.center) for cluster in clusters]
        )
        S = np.dot(cluster_centers, cluster_centers.T)
        triu_indices = np.triu_indices(len(S), k=1)
        cluster_similarity_pairs = []
        for i, j in zip(triu_indices[0], triu_indices[1]):
            cluster_similarity_pairs.append(
                SimilarityPair(
                    cluster_1_id=clusters[i].id,
                    cluster_2_id=clusters[j].id,
                    similarity=S[i, j],
                )
            )
        return cluster_similarity_pairs

    def run(self) -> ClusteringResult:
        print_progress("start", "start")
        self.timesteps.steps["start"] = time.time()
        responses = self.process_input_file([])

        embedding_model = self.load_embedding_model("BAAI/bge-large-en-v1.5")

        embeddings_map = self.embed_responses(responses, embedding_model)
        embeddings = np.asarray(list(embeddings_map.values()))

        if self.algorithm_settings.outlier_detection:
            outlier_stats = self.detect_outliers(
                responses,
                embeddings,
                outlier_k=self.algorithm_settings.outlier_detection.nearest_neighbors,
                z_score_threshold=self.algorithm_settings.outlier_detection.z_score_threshold,
            )
            # Update responses to exclude outliers
            responses = [response for response in responses if not response.is_outlier]
            embeddings_map = {
                response.text: embeddings_map[response.text] for response in responses
            }
            embeddings = np.asarray(list(embeddings_map.values()))
        else:
            outlier_stats = None

        response_weights = np.array([response.count for response in responses])

        if self.algorithm_settings.method.cluster_count_method == "auto":
            K = self.find_optimal_k(embeddings, response_weights)
        else:
            K = self.algorithm_settings.method.cluster_count

        clusters = self.start_clustering(
            responses, embeddings, embeddings_map, K, response_weights
        )

        if self.algorithm_settings.agglomerative_clustering:
            merger_stats, clusters = self.merge_clusters(
                clusters,
                similarity_threshold=self.algorithm_settings.agglomerative_clustering.similarity_threshold,
                embeddings_map=embeddings_map,
            )
        else:
            merger_stats = None

        for cluster in clusters:
            cluster.center = (
                np.asarray(cluster.center)
                / np.linalg.norm(
                    np.asarray(cluster.center),
                    ord=2,
                    axis=0,
                )
            ).tolist()
            for response in cluster.responses:
                response.cluster_id = cluster.id
                response.similarity = cluster.similarity_to_response(
                    response, embeddings_map
                )
            cluster.responses.sort(key=lambda x: x.similarity or 0, reverse=True)
            cluster.name = f'Cluster "{cluster.responses[0].text}"'

        return ClusteringResult(
            clusters=clusters,
            outlier_statistics=outlier_stats,
            merger_statistics=merger_stats,
            inter_cluster_similarities=self.calculate_inter_cluster_similarities(
                clusters
            ),
            timesteps=self.timesteps,
        )


if __name__ == "__main__":
    pass
