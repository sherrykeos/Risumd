import re
from typing import Set, List

# Compact and maintainable alias dictionary
TECH_ALIASES: dict[str, str] = {
    "react.js": "react",
    "reactjs": "react",
    "node.js": "node",
    "nodejs": "node",
    "postgresql": "postgresql",
    "postgres": "postgresql",
    "fastapi": "fastapi",
    "docker": "docker",
    "vue.js": "vue",
    "vuejs": "vue",
    "next.js": "nextjs",
    "nextjs": "nextjs",
    "typescript": "typescript",
    "ts": "typescript",
    "javascript": "javascript",
    "js": "javascript",
    "python": "python",
    "py": "python",
    "golang": "go",
    "go": "go",
    "aws": "aws",
    "amazon web services": "aws",
    "k8s": "kubernetes",
    "kubernetes": "kubernetes",
    "gcp": "gcp",
    "google cloud": "gcp",
    "google cloud platform": "gcp",
    "rest": "rest",
    "rest api": "rest api",
    "rest apis": "rest api",
    "restful api": "rest api",
    "restful apis": "rest api",
    "spring boot": "spring boot",
    "springboot": "spring boot",
}

STOPWORDS: Set[str] = {
    "a", "an", "the", "and", "or", "in", "on", "at", "to", "for",
    "with", "by", "of", "from", "as", "is", "are", "was", "were",
    "it", "its", "our", "we", "you", "your", "their", "that", "this",
    "these", "those", "into", "over", "such", "using", "used", "via",
}


def normalize_term(term: str) -> str:
    """
    Normalizes a skill, technology, or keyword term:
    - Lowercase
    - Whitespace normalization
    - Punctuation cleanup while preserving valid programming symbols (e.g. c++, c#, .net)
    - Alias resolution
    """
    if not term:
        return ""

    text = term.strip().lower()

    # Direct check against aliases before punctuation cleanup (handles 'react.js', 'node.js', etc.)
    if text in TECH_ALIASES:
        return TECH_ALIASES[text]

    # Normalize whitespace (replace tabs/newlines/multiple spaces with single space)
    text = re.sub(r"\s+", " ", text)

    # Clean standard punctuation unless it's part of c++, c#, or .net
    # Preserve alphanumeric, spaces, +, #, and periods inside words
    cleaned = re.sub(r"[^\w\s+#.-]", "", text)
    cleaned = cleaned.strip()

    # Re-check aliases after cleanup
    if cleaned in TECH_ALIASES:
        return TECH_ALIASES[cleaned]

    # Try checking without dots or dashes if still unmapped (e.g. 'react-js' -> 'reactjs')
    no_punct = re.sub(r"[-.]", "", cleaned)
    if no_punct in TECH_ALIASES:
        return TECH_ALIASES[no_punct]

    # Collapse any remaining spaces
    return re.sub(r"\s+", " ", cleaned).strip()


def tokenize(text: str) -> Set[str]:
    """
    Splits arbitrary text into a set of normalized, non-stopword tokens.
    """
    if not text:
        return set()

    # Split on non-alphanumeric except +, #, -
    raw_tokens = re.split(r"[^\w+#-]+", text.lower())
    result: Set[str] = set()
    for token in raw_tokens:
        token = token.strip()
        if not token:
            continue
        normalized = normalize_term(token)
        if normalized and normalized not in STOPWORDS and len(normalized) > 1:
            result.add(normalized)
    return result


def extract_phrases_and_tokens(text: str) -> Set[str]:
    """
    Extracts both individual normalized tokens and normalized multi-word chunks.
    """
    tokens = tokenize(text)
    normalized_full = normalize_term(text)
    if normalized_full and len(normalized_full) > 1 and normalized_full not in STOPWORDS:
        tokens.add(normalized_full)
    return tokens
