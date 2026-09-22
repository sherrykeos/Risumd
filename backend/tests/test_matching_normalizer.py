import pytest
from app.matching.normalizer import normalize_term, tokenize, extract_phrases_and_tokens


def test_normalization_case_differences():
    assert normalize_term("Python") == "python"
    assert normalize_term("POSTGRESQL") == "postgresql"
    assert normalize_term("FastAPI") == "fastapi"


def test_normalization_whitespace():
    assert normalize_term("   Docker   ") == "docker"
    assert normalize_term("Spring     Boot") == "spring boot"
    assert normalize_term("\tREST   APIs\n") == "rest api"


def test_normalization_punctuation():
    assert normalize_term("Node.js") == "node"
    assert normalize_term("Vue.js") == "vue"
    assert normalize_term("Next.js") == "nextjs"
    assert normalize_term("C++") == "c++"
    assert normalize_term("C#") == "c#"


def test_normalization_technology_aliases():
    assert normalize_term("React.js") == "react"
    assert normalize_term("ReactJS") == "react"
    assert normalize_term("react-js") == "react"
    assert normalize_term("Postgres") == "postgresql"
    assert normalize_term("NodeJS") == "node"
    assert normalize_term("k8s") == "kubernetes"
    assert normalize_term("Kubernetes") == "kubernetes"
    assert normalize_term("ts") == "typescript"
    assert normalize_term("TypeScript") == "typescript"
    assert normalize_term("js") == "javascript"
    assert normalize_term("JavaScript") == "javascript"
    assert normalize_term("py") == "python"
    assert normalize_term("Python") == "python"
    assert normalize_term("golang") == "go"
    assert normalize_term("Go") == "go"
    assert normalize_term("amazon web services") == "aws"
    assert normalize_term("AWS") == "aws"
    assert normalize_term("google cloud platform") == "gcp"
    assert normalize_term("GCP") == "gcp"
    assert normalize_term("SpringBoot") == "spring boot"
    assert normalize_term("Spring Boot") == "spring boot"
    assert normalize_term("RESTful API") == "rest api"
    assert normalize_term("REST APIs") == "rest api"


def test_empty_and_none_term_normalization():
    assert normalize_term("") == ""
    assert normalize_term("   ") == ""


def test_tokenize_stopwords_and_words():
    tokens = tokenize("Scalable backend platform built with Python, FastAPI, and PostgreSQL for high throughput.")
    assert "python" in tokens
    assert "fastapi" in tokens
    assert "postgresql" in tokens
    assert "backend" in tokens
    assert "platform" in tokens
    # Stopwords should be filtered
    assert "with" not in tokens
    assert "and" not in tokens
    assert "for" not in tokens
    assert "a" not in tokens


def test_extract_phrases_and_tokens():
    extracted = extract_phrases_and_tokens("REST APIs")
    assert "rest api" in extracted or "rest" in extracted
