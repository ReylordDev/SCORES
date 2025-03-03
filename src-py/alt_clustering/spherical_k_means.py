from sklearn.base import BaseEstimator, ClusterMixin
from sklearn.utils import check_random_state, check_array
import numpy as np


class SphericalKMeans(BaseEstimator, ClusterMixin):
    """Spherical K-Means with sample_weight support and scikit-learn compatibility."""

    def __init__(
        self,
        n_clusters,
        init="k-means++",
        max_iter=300,
        chain_length=100,
        random_state=None,
        tol=1e-4,
    ):
        self.n_clusters = n_clusters
        self.init = init
        self.max_iter = max_iter
        self.chain_length = chain_length
        self.random_state = random_state
        self.tol = tol  # Convergence tolerance

    def fit(self, X, y=None, sample_weight=None):
        # Input validation
        X = check_array(X, accept_sparse=False)
        N, n = X.shape

        if sample_weight is None:
            sample_weight = np.ones(N)
        else:
            sample_weight = check_array(sample_weight, ensure_2d=False)
            if sample_weight.shape != (N,):
                raise ValueError("sample_weight must be of shape (n_samples,).")
            if np.any(sample_weight < 0):
                raise ValueError("sample_weight must be non-negative.")

        if self.n_clusters > N:
            raise ValueError(f"n_clusters={self.n_clusters} > n_samples={N}.")

        # Normalize input vectors to unit length
        X = X / np.linalg.norm(X, axis=1, keepdims=True)

        # Initialize random state
        rng = check_random_state(self.random_state)

        # Handle trivial case
        if self.n_clusters <= 1:
            self.labels_ = np.zeros(N, dtype=int)
            self.cluster_centers_ = np.mean(X, axis=0, keepdims=True)
            self.cluster_centers_ /= np.linalg.norm(
                self.cluster_centers_, axis=1, keepdims=True
            )
            return self

        # Initialize cluster centers
        self.cluster_centers_ = np.zeros((self.n_clusters, n))

        # Initialization methods with sample_weight integration
        if self.init == "k-means++":
            # First center: weighted by sample_weight
            prob = sample_weight / sample_weight.sum()
            i = rng.choice(N, p=prob)
            self.cluster_centers_[0] = X[i]

            # Subsequent centers
            for k in range(1, self.n_clusters):
                # Compute distances to nearest cluster
                S = X @ self.cluster_centers_[:k].T
                d_min = 1 - S.max(axis=1)
                d_min = np.clip(d_min, 0, None)  # Ensure non-negative

                # Selection probabilities
                prob = d_min * sample_weight
                prob_sum = prob.sum()
                if prob_sum <= 0:
                    prob = sample_weight.copy()
                    prob_sum = prob.sum()
                prob /= prob_sum

                i = rng.choice(N, p=prob)
                self.cluster_centers_[k] = X[i]

        elif self.init == "MCMC":
            # First center: weighted by sample_weight
            prob = sample_weight / sample_weight.sum()
            i = rng.choice(N, p=prob)
            self.cluster_centers_[0] = X[i]

            # Prepare MCMC chain
            for k in range(1, self.n_clusters):
                # Current distances to existing clusters
                S = X @ self.cluster_centers_[:k].T
                d_current = 1 - S.max(axis=1)
                d_current = np.clip(d_current, 0, None)

                # Build proposal distribution q
                sum_d = np.dot(d_current, sample_weight)
                sum_sw = sample_weight.sum()
                q = (d_current * sample_weight) / (2 * sum_d) + sample_weight / (
                    2 * sum_sw
                )

                # Start MCMC sampling
                i = rng.choice(N, p=q)
                best_score = np.min(1 - X[i] @ self.cluster_centers_[:k].T)
                best_score = max(best_score, 1e-8)

                for _ in range(self.chain_length):
                    j = rng.choice(N, p=q)
                    candidate_score = np.min(1 - X[j] @ self.cluster_centers_[:k].T)
                    candidate_score = max(candidate_score, 1e-8)

                    # Metropolis-Hastings acceptance ratio
                    if (candidate_score * q[i]) / (best_score * q[j]) > rng.rand():
                        i, best_score = j, candidate_score

                self.cluster_centers_[k] = X[i]

        else:
            raise ValueError(f"Unsupported initialization: {self.init}")

        # Main optimization loop with sample_weight
        labels = np.zeros(N, dtype=int)
        it = 0
        self.inertia_ = np.inf
        for it in range(self.max_iter):
            # E-step: Assign clusters
            S = X @ self.cluster_centers_.T
            labels = np.argmax(S, axis=1)
            max_sim = S[np.arange(N), labels]
            inertia_new = np.sum((1 - max_sim) * sample_weight)

            # Check convergence
            if np.abs(self.inertia_ - inertia_new) < self.tol * self.inertia_:
                break
            self.inertia_ = inertia_new

            # M-step: Update centers with sample_weight
            for k in range(self.n_clusters):
                mask = labels == k
                sw_k = sample_weight[mask]

                if sw_k.sum() == 0:  # Empty cluster handling
                    # Select new point using d_min * sample_weight
                    S_all = X @ self.cluster_centers_.T
                    d_min = 1 - S_all.max(axis=1)
                    prob = d_min * sample_weight
                    prob_sum = prob.sum()
                    if prob_sum == 0:
                        prob = sample_weight.copy()
                    prob /= prob.sum()
                    i = rng.choice(N, p=prob)
                    self.cluster_centers_[k] = X[i]
                else:
                    # Weighted mean of cluster members
                    self.cluster_centers_[k] = np.average(
                        X[mask], axis=0, weights=sample_weight[mask]
                    )

            # Normalize centroids
            self.cluster_centers_ = self.cluster_centers_ / np.linalg.norm(
                self.cluster_centers_, axis=1, keepdims=True
            )

        self.labels_ = labels
        self.n_iter_ = it + 1
        self.n_features_in_ = n
        return self
