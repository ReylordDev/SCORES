import os
from huggingface_hub import scan_cache_dir, HfApi
from sentence_transformers import SentenceTransformer
from huggingface_hub.utils.tqdm import disable_progress_bars
import huggingface_hub.constants as hfconstants

DEFAULT_MODEL = "BAAI/bge-base-en-v1.5"

disable_progress_bars()

os.makedirs(hfconstants.HF_HUB_CACHE, exist_ok=True)

hf_cache_info = scan_cache_dir()

cached_repos = hf_cache_info.repos

api = HfApi()
# There is an alternative approach to this, which checks for the model.json file in the repo, refer to the Sentence Transformers implementation
compatible_models = api.list_models(library="sentence-transformers")


compatible_cached_models = []
for model in compatible_models:
    for repo in cached_repos:
        if model.id == repo.repo_id:
            compatible_cached_models.append(model)
            break

default_model_info = api.model_info(DEFAULT_MODEL)


def download_model(model_name):
    model = SentenceTransformer(model_name)
    del model
    print(f"Model {model_name} downloaded.")


def get_sentence_transformer_models():
    return api.list_models(library="sentence-transformers")


print(hfconstants.HF_HUB_CACHE)

if DEFAULT_MODEL not in [model.repo_id for model in cached_repos]:
    print("Default model is not downloaded.")
else:
    try:
        model = SentenceTransformer(DEFAULT_MODEL, local_files_only=True)
        print("Default model is cached.")
        del model
    except OSError as _e:
        print("Default model not fully downloaded")
        download_model(DEFAULT_MODEL)
    except AttributeError as _e:
        print("Default model not fully downloaded")
        download_model(DEFAULT_MODEL)
