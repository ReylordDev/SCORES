import csv
import os
import time
import numpy as np


from alt_clustering.spherical_k_means import SphericalKMeans
from sklearn.cluster import AgglomerativeClustering, KMeans
from sklearn.manifold import TSNE
from sklearn.decomposition import PCA
from sklearn.metrics import (
    silhouette_score,
    calinski_harabasz_score,
    davies_bouldin_score,
)
from utils.ipc import print_progress
from matplotlib import pyplot as plt
from sentence_transformers import SentenceTransformer
from application_state import ApplicationState
from loguru import logger
from collections import Counter
from models import (
    Cluster,
    KSelectionStatistic,
    ManifoldPosition2d,
    ManifoldPosition3d,
    Merger,
    MergingStatistics,
    OutlierStatistic,
    Response,
    OutlierStatistics,
    SimilarityPair,
    Timesteps,
    ClusteringResult,
)
from utils.utils import preprocess_response
from app_cache import EmbeddingCache


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
        self._random_state = app_state.get_random_state()
        logger.debug(f"Random state: {self._random_state}")

        self.result_dir = app_state.get_results_dir()
        os.makedirs(self.result_dir, exist_ok=True)

        if algorithm_settings.advanced_settings.embedding_model:
            self.embedding_model_name = (
                algorithm_settings.advanced_settings.embedding_model
            )
        else:
            self.embedding_model_name = "BAAI/bge-large-en-v1.5"

        # Initialize the embedding cache
        self.embedding_cache = EmbeddingCache()

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
                        response = preprocess_response(row[column_index])
                        if response == "" or response is None:
                            continue
                        for excluded_word in excluded_words:
                            if (
                                response == excluded_word
                                or f"{excluded_word} " in response
                            ):
                                logger.info(
                                    f"Excluded word found: {excluded_word} in response: {response}"
                                )

                                # skip the response if it contains an excluded word
                                break
                        else:
                            # if the response is not an excluded word, count it
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

    def load_embedding_model(self, model_name: str):
        print_progress("load_model", "start")
        try:
            model = SentenceTransformer(model_name)
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

        # Get the list of texts to embed
        texts = [response.text for response in responses]

        # Try to get embeddings from cache first
        cached_embeddings = self.embedding_cache.get_embeddings(
            self.embedding_model_name, texts
        )

        # Convert to a mutable dictionary since Mapping doesn't support __setitem__
        cached_embeddings_dict = dict(cached_embeddings)

        # Identify which texts need to be embedded
        texts_to_embed = [
            text for text in texts if cached_embeddings_dict[text] is None
        ]

        if texts_to_embed:
            logger.info(
                f"Embedding {len(texts_to_embed)} texts (found {len(texts) - len(texts_to_embed)} in cache)"
            )
            # Embed only the texts that weren't in the cache
            new_embeddings = embedding_model.encode(
                texts_to_embed, normalize_embeddings=True
            )

            # Create a dictionary of new embeddings
            new_embeddings_dict = {
                text: new_embeddings[i] for i, text in enumerate(texts_to_embed)
            }

            # Save the new embeddings to the cache
            self.embedding_cache.save_embeddings(
                self.embedding_model_name, new_embeddings_dict
            )

            # Update the cached embeddings with the new ones
            # TODO: This is a hack to get the embeddings map to work
            for text, embedding in new_embeddings_dict.items():
                cached_embeddings_dict[text] = embedding
        else:
            logger.info(f"All {len(texts)} texts found in cache")

        # Create the final embeddings map
        embeddings_map = {
            text: embedding
            for text, embedding in cached_embeddings_dict.items()
            if embedding is not None
        }

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
        print_progress("find_optimal_k", "start")
        assert self.algorithm_settings.method.cluster_count_method == "auto"
        max_clusters = self.algorithm_settings.method.max_clusters
        min_clusters = self.algorithm_settings.method.min_clusters

        # Validate inputs
        if max_clusters < 2:
            raise ValueError("max_clusters must be at least 2")
        if min_clusters < 2:
            raise ValueError("min_clusters must be at least 2")
        if min_clusters > max_clusters:
            raise ValueError("min_clusters must be less than max_clusters")
        if len(embeddings) != len(weights):
            raise ValueError(
                "embeddings and weights must have the same number of samples"
            )
        if max_clusters >= len(embeddings):
            logger.info(
                f"Number of clusters ({max_clusters}) exceeds number of responses ({len(embeddings)}); reducing to {len(embeddings)}"
            )
            max_clusters = len(embeddings)

        # Calculate metrics for each cluster count
        silhouttes = []
        ch_scores = []
        db_scores = []
        k_values = [k for k in range(min_clusters, max_clusters + 1)]
        for k in k_values:
            # Fit K-means with sample weights
            if (
                self.algorithm_settings.advanced_settings.kmeans_method
                == "spherical_kmeans"
            ):
                kmeans = SphericalKMeans(n_clusters=k, random_state=self._random_state)
            else:
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

        optimal_k = k_values[np.argmax(combined_scores)]

        # Plot the metrics
        plt.figure(figsize=(10, 6))
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
        plt.savefig(f"{self.result_dir}/cluster_count_selection_metrics.png")
        plt.close()

        logger.debug(f"Optimal K: {optimal_k}")

        selection_stats = []
        for i, k in enumerate(k_values):
            selection_stats.append(
                KSelectionStatistic(
                    k=k,
                    silhouette=silhouttes_normalized[i],
                    calinski_harabasz=ch_scores_normalized[i],
                    davies_bouldin=db_scores_normalized[i],
                    combined=combined_scores[i],
                )
            )

        print_progress("find_optimal_k", "complete")
        self.timesteps.steps["find_optimal_k"] = time.time()
        if not optimal_k:
            optimal_k = max_clusters
        return optimal_k, selection_stats

    def start_clustering(
        self,
        responses: list[Response],
        embeddings: np.ndarray,
        embeddings_map: dict[str, np.ndarray],
        K: int,
        response_weights: np.ndarray,
    ):
        print_progress("cluster", "start")
        if len(embeddings) < K:
            logger.warning(
                f"Number of clusters ({K}) exceeds number of responses ({len(embeddings)}); reducing to {len(embeddings)}"
            )
            K = len(embeddings)
        # Side Effect: Assigns cluster IDs to responses
        if (
            self.algorithm_settings.advanced_settings.kmeans_method
            == "spherical_kmeans"
        ):
            kmeans = SphericalKMeans(n_clusters=K, random_state=self._random_state).fit(
                embeddings, sample_weight=response_weights
            )
        else:
            kmeans = KMeans(
                n_clusters=K, n_init="auto", random_state=self._random_state
            )
        clustering = kmeans.fit(embeddings, sample_weight=response_weights)
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

        assert self.algorithm_settings.agglomerative_clustering is not None

        current_max_index = max([cluster.index for cluster in clusters])

        total_mergers = []
        while True:
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

            iteration_mergers: list[Merger] = []
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
                    iteration_mergers.append(merger)

                    new_center = np.average(
                        [cluster.center for cluster in merged_clusters],
                        axis=0,
                        weights=[cluster.count for cluster in merged_clusters],
                    )

                    merged_cluster = Cluster(
                        center=new_center.tolist(),
                        index=current_max_index + 1,
                        is_merger_result=True,
                    )
                    current_max_index += 1

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
                    merged_cluster.normalize_center()

                    post_merge_cluster_ids.append(merged_cluster.id)
                    clusters.append(merged_cluster)

                    for cluster in merged_clusters:
                        post_merge_cluster_ids.remove(cluster.id)

            clusters = [
                cluster for cluster in clusters if cluster.id in post_merge_cluster_ids
            ]

            total_mergers.extend(iteration_mergers)

            if (
                len(iteration_mergers) == 0
                or len(clusters) == 1
                or not self.algorithm_settings.agglomerative_clustering.iterative
            ):
                break
        merging_statistics = MergingStatistics(
            mergers=total_mergers, threshold=similarity_threshold
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
        logger.error
        print_progress("start", "start")
        self.timesteps.steps["start"] = time.time()
        responses = self.process_input_file(self.algorithm_settings.excluded_words)

        embedding_model = self.load_embedding_model(self.embedding_model_name)

        embeddings_map = self.embed_responses(responses, embedding_model)
        original_embeddings_map = embeddings_map.copy()
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
            K, selection_stats = self.find_optimal_k(embeddings, response_weights)
        else:
            K = self.algorithm_settings.method.cluster_count
            selection_stats = []

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

        print_progress("save", "start")  # continues in the controller
        for cluster in clusters:
            cluster.normalize_center()
            for response in cluster.responses:
                response.cluster_id = cluster.id
                response.similarity = cluster.similarity_to_response(
                    response, embeddings_map
                )
            cluster.responses.sort(key=lambda x: x.similarity or 0, reverse=True)
            max_chars = 70
            cluster.name = f'Cluster "{cluster.responses[0].text[:max_chars]}{"..." if len(cluster.responses[0].text) > max_chars else ""}"'

        clusters = self.reduce_dimensionality(
            clusters, outlier_stats, original_embeddings_map
        )

        result = ClusteringResult(
            clusters=clusters,
            outlier_statistics=outlier_stats,
            merger_statistics=merger_stats,
            inter_cluster_similarities=self.calculate_inter_cluster_similarities(
                clusters
            ),
            timesteps=self.timesteps,
            k_selection_statistics=selection_stats,
        )
        return result

    def reduce_dimensionality(
        self,
        clusters: list[Cluster],
        outlier_stats: OutlierStatistics | None,
        embeddings_map: dict[str, np.ndarray],
    ):
        responses = [response for cluster in clusters for response in cluster.responses]
        if outlier_stats is not None:
            for outlier in outlier_stats.outliers:
                responses.append(outlier.response)
        embeddings = np.array([embeddings_map[response.text] for response in responses])
        centers = np.array([cluster.center for cluster in clusters])

        pca = PCA(n_components=50, random_state=self._random_state)
        embeddings_pca = pca.fit_transform(embeddings)
        centers_pca = pca.transform(centers)
        combined = np.concatenate([embeddings_pca, centers_pca], axis=0)

        tsne_2d = TSNE(n_components=2, random_state=self._random_state)
        combined_tsne2d = tsne_2d.fit_transform(combined)

        responses_tsne2d = combined_tsne2d[: len(embeddings), :]
        centers_tsne2d = combined_tsne2d[len(embeddings) :, :]

        for i, response in enumerate(responses):
            x, y = responses_tsne2d[i][0], responses_tsne2d[i][1]
            response.manifold_position2d = ManifoldPosition2d(x=float(x), y=float(y))

        for i, cluster in enumerate(clusters):
            x, y = centers_tsne2d[i][0], centers_tsne2d[i][1]
            cluster.manifold_position2d = ManifoldPosition2d(x=float(x), y=float(y))

        tsne_3d = TSNE(n_components=3, random_state=self._random_state)
        combined_tsne3d = tsne_3d.fit_transform(combined)

        responses_tsne3d = combined_tsne3d[: len(embeddings), :]
        centers_tsne3d = combined_tsne3d[len(embeddings) :, :]

        for i, response in enumerate(responses):
            x, y, z = (
                responses_tsne3d[i][0],
                responses_tsne3d[i][1],
                responses_tsne3d[i][2],
            )
            response.manifold_position3d = ManifoldPosition3d(
                x=float(x), y=float(y), z=float(z)
            )

        for i, cluster in enumerate(clusters):
            x, y, z = centers_tsne3d[i][0], centers_tsne3d[i][1], centers_tsne3d[i][2]
            cluster.manifold_position3d = ManifoldPosition3d(
                x=float(x), y=float(y), z=float(z)
            )

        return clusters

    def plot_clusters(
        self, clustering_result: ClusteringResult, embeddings_map: dict[str, np.ndarray]
    ):
        # Collect all non-outlier responses and outliers
        non_outlier_responses = clustering_result.get_all_responses()
        outlier_responses = []
        if clustering_result.outlier_statistics is not None:
            outlier_responses = [
                os.response for os in clustering_result.outlier_statistics.outliers
            ]
        all_responses = non_outlier_responses + outlier_responses

        # Prepare data for plotting
        texts = [response.text for response in all_responses]
        if not texts:
            logger.warning("No responses to plot")
            return

        # Check for missing embeddings
        missing = [text for text in texts if text not in embeddings_map]
        if missing:
            logger.warning(
                f"Missing embeddings for {len(missing)} responses; skipping plot"
            )
            return

        embeddings = np.array([embeddings_map[text] for text in texts])

        clusters = clustering_result.clusters
        centers = np.array([cluster.center for cluster in clustering_result.clusters])

        # Reduce dimensionality with PCA
        pca = PCA(n_components=50, random_state=self._random_state)
        embeddings_pca = pca.fit_transform(embeddings)
        centers_pca = pca.transform(centers)

        combined = np.concatenate([embeddings_pca, centers_pca], axis=0)

        # # Reduce dimensionality with t-SNE
        tsne = TSNE(n_components=2, random_state=self._random_state)
        combined_tsne = tsne.fit_transform(combined)

        responses_tsne = combined_tsne[: len(embeddings), :]
        centers_tsne = combined_tsne[len(embeddings) :, :]

        # Generate cluster labels and outlier flags
        cluster_id_to_label = {cluster.id: idx for idx, cluster in enumerate(clusters)}
        labels = []
        is_outlier = []
        for response in all_responses:
            if response in outlier_responses:
                is_outlier.append(True)
                labels.append(-1)  # -1 indicates outlier
            else:
                if response.cluster_id is None:
                    logger.warning(f"Missing cluster ID for response: {response.text}")
                    labels.append(-1)
                else:
                    is_outlier.append(False)
                    labels.append(cluster_id_to_label.get(response.cluster_id, -1))

        colors = plt.cm.get_cmap("viridis", len(clusters))

        # Create plot
        plt.figure(figsize=(10, 8))

        for idx, cluster in enumerate(clusters):
            cluster_responses = responses_tsne[
                np.where(np.array(labels) == cluster_id_to_label[cluster.id])
            ]

            plt.scatter(
                cluster_responses[:, 0],
                cluster_responses[:, 1],
                color=colors(cluster_id_to_label[cluster.id]),
                s=30,
                alpha=0.6,
            )

            center = centers_tsne[idx]

            plt.scatter(
                center[0],
                center[1],
                color=colors(cluster_id_to_label[cluster.id]),
                marker="x",
                s=100,
                linewidths=1.5,
                label=f"{cluster.index}: {cluster.name}",
            )

            plt.annotate(
                str(cluster.index),
                (center[0], center[1]),
                textcoords="offset points",
                xytext=(0, 5),
                ha="center",
            )

        plt.legend(title="Clusters", bbox_to_anchor=(1.05, 1), loc="upper left")
        plt.xlabel("t-SNE Dimension 1")
        plt.ylabel("t-SNE Dimension 2")
        plt.title("t-SNE Visualization of Clusters and Their Centers")
        plt.tight_layout()
        plt.savefig(f"{self.result_dir}/cluster_visualization.png")
        plt.close()


if __name__ == "__main__":
    pass
