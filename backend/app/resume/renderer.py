import logging
import os
from pathlib import Path
import subprocess
from typing import Any, Dict, List, Union
import jinja2

from app.core.config import settings
from app.core.exceptions import LaTeXCompilationError
from app.resume.schemas import ResumeData

logger = logging.getLogger(__name__)

TEMPLATE_DIR = Path(__file__).resolve().parent / "templates"


def latex_escape(value: Any) -> str:
    """
    Safely escapes special LaTeX characters in user text.
    Handles: &, %, $, #, _, {, }, ~, ^, \\
    """
    if value is None:
        return ""
    text = str(value)

    # Use an alphanumeric placeholder without special characters (no underscores)
    placeholder = "\x00LATEXBACKSLASHPLACEHOLDER\x00"
    text = text.replace("\\", placeholder)

    replacements = [
        ("&", r"\&"),
        ("%", r"\%"),
        ("$", r"\$"),
        ("#", r"\#"),
        ("_", r"\_"),
        ("{", r"\{"),
        ("}", r"\}"),
        ("~", r"\textasciitilde{}"),
        ("^", r"\textasciicircum{}"),
    ]
    for orig, repl in replacements:
        text = text.replace(orig, repl)

    text = text.replace(placeholder, r"\textbackslash{}")
    return text


def deep_latex_escape(obj: Any) -> Any:
    """
    Recursively applies latex_escape to all string values in dicts, lists, and Pydantic models.
    """
    if obj is None:
        return None
    if isinstance(obj, str):
        return latex_escape(obj)
    if isinstance(obj, (int, float, bool)):
        return obj
    if isinstance(obj, list):
        return [deep_latex_escape(item) for item in obj]
    if isinstance(obj, dict):
        return {k: deep_latex_escape(v) for k, v in obj.items()}
    if hasattr(obj, "model_dump"):
        return deep_latex_escape(obj.model_dump())
    return obj


def get_jinja_env() -> jinja2.Environment:
    """
    Constructs a Jinja2 Environment configured with LaTeX-friendly delimiters.
    """
    env = jinja2.Environment(
        block_start_string=r"\BLOCK{",
        block_end_string=r"}",
        variable_start_string=r"\VAR{",
        variable_end_string=r"}",
        comment_start_string=r"\#{",
        comment_end_string=r"}",
        line_statement_prefix="%%",
        line_comment_prefix="%#",
        trim_blocks=True,
        lstrip_blocks=True,
        autoescape=False,
        loader=jinja2.FileSystemLoader(str(TEMPLATE_DIR)),
    )
    env.filters["latex_escape"] = latex_escape
    return env


def render_latex(data: ResumeData, template_name: str = "default.tex") -> str:
    """
    Renders structured ResumeData into a LaTeX source string using Jinja2.
    Applies deep LaTeX escaping to guarantee invalid special characters don't crash the compiler.
    """
    env = get_jinja_env()
    template = env.get_template(template_name)
    escaped_data = deep_latex_escape(data)
    return template.render(**escaped_data)


def compile_pdf(latex_source: str, output_dir: Path) -> Path:
    """
    Writes LaTeX source to resume.tex and compiles it to resume.pdf using Tectonic or pdflatex.
    Raises LaTeXCompilationError if compilation fails or compiler is unavailable.
    """
    output_dir.mkdir(parents=True, exist_ok=True)
    tex_file = output_dir / "resume.tex"
    pdf_file = output_dir / "resume.pdf"

    # Write .tex source file
    tex_file.write_text(latex_source, encoding="utf-8")

    # Locate compiler
    tectonic_bin = Path(settings.TECTONIC_PATH)
    compiler_cmd: List[str] = []

    if tectonic_bin.exists() or os.path.exists(settings.TECTONIC_PATH):
        compiler_cmd = [
            str(tectonic_bin),
            "--outdir", str(output_dir),
            str(tex_file),
        ]
    else:
        # Fallback to system pdflatex/tectonic on PATH
        compiler_cmd = [
            "tectonic",
            "--outdir", str(output_dir),
            str(tex_file),
        ]

    try:
        result = subprocess.run(
            compiler_cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=60,
        )
    except FileNotFoundError:
        logger.error(f"LaTeX compiler executable not found at '{compiler_cmd[0]}'")
        raise LaTeXCompilationError(
            f"LaTeX compiler '{compiler_cmd[0]}' is not installed or available on PATH."
        )
    except subprocess.TimeoutExpired:
        logger.error("LaTeX compilation timed out after 60 seconds")
        raise LaTeXCompilationError("LaTeX compilation timed out.")
    except Exception as e:
        logger.error(f"Unexpected error during LaTeX compilation: {e}")
        raise LaTeXCompilationError(f"Unexpected error running LaTeX compiler: {str(e)}")

    if result.returncode != 0:
        logger.error(f"LaTeX compiler exited with code {result.returncode}. Stderr: {result.stderr}")
        raise LaTeXCompilationError(f"LaTeX compilation failed: {result.stderr or result.stdout}")

    if not pdf_file.exists() or pdf_file.stat().st_size == 0:
        logger.error("LaTeX compilation reported success but resume.pdf was not produced or is 0 bytes.")
        raise LaTeXCompilationError("Compilation completed but output PDF is missing or empty.")

    return pdf_file.resolve()
