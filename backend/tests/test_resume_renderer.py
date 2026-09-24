import os
from pathlib import Path
import pytest

from app.core.exceptions import LaTeXCompilationError
from app.resume.renderer import compile_pdf, latex_escape, render_latex
from app.resume.schemas import ContactInfo, ResumeData, ResumeProjectItem, ResumeSkillGroup


def test_latex_character_escaping():
    raw_text = r"Worked on 100% of C# & C++ code with $10k budget for #1 project_alpha in {sub_folder} ~ ^ " + "\\"
    escaped = latex_escape(raw_text)

    assert r"\&" in escaped
    assert r"\%" in escaped
    assert r"\$" in escaped
    assert r"\#" in escaped
    assert r"\_" in escaped
    assert r"\{" in escaped
    assert r"\}" in escaped
    assert r"\textasciitilde{}" in escaped
    assert r"\textasciicircum{}" in escaped
    assert r"\textbackslash{}" in escaped


def test_render_latex_generates_valid_source():
    data = ResumeData(
        contact=ContactInfo(
            name="Alice Smith",
            email="alice@example.com",
            github="https://github.com/alice",
        ),
        summary="Senior Backend Engineer & Cloud Architect",
        skill_groups=[
            ResumeSkillGroup(category="Languages & Frameworks", items=["Python", "FastAPI", "C#"])
        ],
        projects=[
            ResumeProjectItem(
                id=1,
                name="Project & Co",
                bullets=["Built 100% test-covered microservice with PostgreSQL & Redis"],
            )
        ],
    )

    latex_str = render_latex(data)
    assert r"\documentclass" in latex_str
    assert "Alice Smith" in latex_str
    assert r"alice@example.com" in latex_str
    assert r"Project \& Co" in latex_str
    assert r"100\% test-covered" in latex_str


def test_compile_pdf_with_tectonic(tmp_path):
    latex_source = r"""
\documentclass{article}
\begin{document}
Hello World - Risumd Test PDF
\end{document}
"""
    pdf_file = compile_pdf(latex_source=latex_source, output_dir=tmp_path)
    assert pdf_file.exists()
    assert pdf_file.stat().st_size > 0
    assert pdf_file.name == "resume.pdf"


def test_compile_pdf_raises_error_on_invalid_latex(tmp_path):
    invalid_latex = r"""
\documentclass{article}
\begin{document}
\invalidcommandthatdoesnotexist{
"""
    with pytest.raises(LaTeXCompilationError):
        compile_pdf(latex_source=invalid_latex, output_dir=tmp_path)
