from typing import Any, List, Set, Tuple, Dict, Optional
from datetime import date

from app.matching.normalizer import normalize_term, tokenize, extract_phrases_and_tokens
from app.matching.weights import (
    WEIGHT_TECHNOLOGY,
    WEIGHT_REQUIRED_SKILL,
    WEIGHT_PREFERRED_SKILL,
    WEIGHT_KEYWORD,
    WEIGHT_RESPONSIBILITY_OVERLAP,
    WEIGHT_DESCRIPTION_OVERLAP,
    SCORE_SKILL_REQUIRED_MATCH,
    SCORE_SKILL_PREFERRED_MATCH,
    SCORE_SKILL_KEYWORD_MATCH,
    SCORE_TECH_DIRECT_MATCH,
    SCORE_TECH_KEYWORD_MATCH,
    WEIGHT_ACHIEVEMENT_TECH,
    WEIGHT_ACHIEVEMENT_SKILL,
    WEIGHT_ACHIEVEMENT_KEYWORD,
)
from app.matching.types import (
    MatchBreakdown,
    RankedProject,
    RankedExperience,
    RankedSkill,
    RankedTechnology,
    RankedAchievement,
)


class JDAnalysisContext:
    """Pre-processed and normalized lookup structures for a single JDAnalysis."""

    def __init__(self, analysis: Any):
        # Maps normalized term -> original term
        self.tech_map: Dict[str, str] = {
            normalize_term(t): t for t in (analysis.technologies or []) if normalize_term(t)
        }
        self.req_skills_map: Dict[str, str] = {
            normalize_term(s): s for s in (analysis.required_skills or []) if normalize_term(s)
        }
        self.pref_skills_map: Dict[str, str] = {
            normalize_term(s): s for s in (analysis.preferred_skills or []) if normalize_term(s)
        }
        self.keywords_map: Dict[str, str] = {
            normalize_term(k): k for k in (analysis.keywords or []) if normalize_term(k)
        }

        # Responsibility tokens
        self.resp_tokens: Set[str] = set()
        for resp in (analysis.responsibilities or []):
            self.resp_tokens.update(tokenize(resp))

        # Summary tokens
        self.summary_tokens: Set[str] = tokenize(analysis.summary or "")


def _find_term_matches(candidate_terms: List[str], target_map: Dict[str, str]) -> List[str]:
    """Finds target original terms matched by candidate terms using deterministic normalization."""
    matched = []
    for term in candidate_terms:
        norm = normalize_term(term)
        if norm in target_map:
            matched.append(target_map[norm])
        else:
            # Check if any target term is substring or exact token match
            for target_norm, target_orig in target_map.items():
                if norm == target_norm or target_norm in norm:
                    if target_orig not in matched:
                        matched.append(target_orig)
    # Deduplicate while preserving order
    return list(dict.fromkeys(matched))


def _find_keyword_matches_in_text(text: str, target_map: Dict[str, str]) -> List[str]:
    """Finds keywords from target_map present in text."""
    if not text or not target_map:
        return []

    tokens = tokenize(text)
    norm_text = normalize_term(text)
    matched = []
    for norm_kw, orig_kw in target_map.items():
        if norm_kw in tokens or norm_kw in norm_text:
            matched.append(orig_kw)
    return list(dict.fromkeys(matched))


def score_project(project: Any, ctx: JDAnalysisContext) -> Tuple[float, MatchBreakdown]:
    """Scores a Project against a normalized JDAnalysisContext."""
    # 1. Technologies
    proj_tech_names = [t.name for t in (project.technologies or [])]
    matched_techs = _find_term_matches(proj_tech_names, ctx.tech_map)
    tech_ratio = len(matched_techs) / len(ctx.tech_map) if ctx.tech_map else 0.0

    # 2. Required skills
    proj_skill_names = [s.name for s in (project.skills or [])]
    matched_req_skills = _find_term_matches(proj_skill_names, ctx.req_skills_map)
    req_skill_ratio = len(matched_req_skills) / len(ctx.req_skills_map) if ctx.req_skills_map else 0.0

    # 3. Preferred skills
    matched_pref_skills = _find_term_matches(proj_skill_names, ctx.pref_skills_map)
    pref_skill_ratio = len(matched_pref_skills) / len(ctx.pref_skills_map) if ctx.pref_skills_map else 0.0

    # All matched skills combined
    all_matched_skills = list(dict.fromkeys(matched_req_skills + matched_pref_skills))

    # 4. Keywords in full text
    achievements_text = " ".join(
        f"{a.title} {a.description or ''}" for a in (project.achievements or [])
    )
    full_text = f"{project.name} {project.role or ''} {project.description or ''} {achievements_text}"
    matched_keywords = _find_keyword_matches_in_text(full_text, ctx.keywords_map)
    keyword_ratio = len(matched_keywords) / len(ctx.keywords_map) if ctx.keywords_map else 0.0

    # 5. Responsibility overlap
    item_tokens = tokenize(full_text)
    matched_resp_tokens = item_tokens.intersection(ctx.resp_tokens)
    resp_ratio = (len(matched_resp_tokens) / len(ctx.resp_tokens)) if ctx.resp_tokens else 0.0
    resp_ratio = min(1.0, resp_ratio)

    # 6. Description overlap
    desc_tokens = tokenize(project.description or "")
    matched_desc_tokens = desc_tokens.intersection(ctx.summary_tokens)
    desc_ratio = (len(matched_desc_tokens) / len(ctx.summary_tokens)) if ctx.summary_tokens else 0.0
    desc_ratio = min(1.0, desc_ratio)

    # Dynamic Weight Normalization
    active_weights = 0.0
    weighted_sum = 0.0

    if ctx.tech_map:
        active_weights += WEIGHT_TECHNOLOGY
        weighted_sum += tech_ratio * WEIGHT_TECHNOLOGY

    if ctx.req_skills_map:
        active_weights += WEIGHT_REQUIRED_SKILL
        weighted_sum += req_skill_ratio * WEIGHT_REQUIRED_SKILL

    if ctx.pref_skills_map:
        active_weights += WEIGHT_PREFERRED_SKILL
        weighted_sum += pref_skill_ratio * WEIGHT_PREFERRED_SKILL

    if ctx.keywords_map:
        active_weights += WEIGHT_KEYWORD
        weighted_sum += keyword_ratio * WEIGHT_KEYWORD

    if ctx.resp_tokens:
        active_weights += WEIGHT_RESPONSIBILITY_OVERLAP
        weighted_sum += resp_ratio * WEIGHT_RESPONSIBILITY_OVERLAP

    if ctx.summary_tokens:
        active_weights += WEIGHT_DESCRIPTION_OVERLAP
        weighted_sum += desc_ratio * WEIGHT_DESCRIPTION_OVERLAP

    raw_score = (weighted_sum / active_weights) if active_weights > 0 else 0.0
    score = round(min(1.0, max(0.0, raw_score)), 4)

    # Explanation reasons
    reasons = []
    if matched_techs:
        reasons.append(f"Matched {len(matched_techs)} JD technologies: {', '.join(matched_techs)}")
    if matched_req_skills:
        reasons.append(f"Matched {len(matched_req_skills)} required skills: {', '.join(matched_req_skills)}")
    if matched_pref_skills:
        reasons.append(f"Matched {len(matched_pref_skills)} preferred skills: {', '.join(matched_pref_skills)}")
    if matched_keywords:
        reasons.append(f"Matched {len(matched_keywords)} JD keywords: {', '.join(matched_keywords)}")
    if matched_resp_tokens:
        reasons.append(f"Aligned with {len(matched_resp_tokens)} responsibility terms")

    if not reasons:
        reasons.append("No matching skills, technologies, or keywords found")

    breakdown = MatchBreakdown(
        score=score,
        matched_technologies=matched_techs,
        matched_skills=all_matched_skills,
        matched_keywords=matched_keywords,
        reasons=reasons,
    )
    return score, breakdown


def score_experience(experience: Any, ctx: JDAnalysisContext) -> Tuple[float, MatchBreakdown]:
    """Scores an Experience against a normalized JDAnalysisContext."""
    # 1. Technologies
    exp_tech_names = [t.name for t in (experience.technologies or [])]
    matched_techs = _find_term_matches(exp_tech_names, ctx.tech_map)
    tech_ratio = len(matched_techs) / len(ctx.tech_map) if ctx.tech_map else 0.0

    # 2. Required skills
    exp_skill_names = [s.name for s in (experience.skills or [])]
    matched_req_skills = _find_term_matches(exp_skill_names, ctx.req_skills_map)
    req_skill_ratio = len(matched_req_skills) / len(ctx.req_skills_map) if ctx.req_skills_map else 0.0

    # 3. Preferred skills
    matched_pref_skills = _find_term_matches(exp_skill_names, ctx.pref_skills_map)
    pref_skill_ratio = len(matched_pref_skills) / len(ctx.pref_skills_map) if ctx.pref_skills_map else 0.0

    all_matched_skills = list(dict.fromkeys(matched_req_skills + matched_pref_skills))

    # 4. Keywords in full text
    achievements_text = " ".join(
        f"{a.title} {a.description or ''}" for a in (experience.achievements or [])
    )
    full_text = f"{experience.company} {experience.role} {experience.description or ''} {achievements_text}"
    matched_keywords = _find_keyword_matches_in_text(full_text, ctx.keywords_map)
    keyword_ratio = len(matched_keywords) / len(ctx.keywords_map) if ctx.keywords_map else 0.0

    # 5. Responsibility overlap
    item_tokens = tokenize(full_text)
    matched_resp_tokens = item_tokens.intersection(ctx.resp_tokens)
    resp_ratio = (len(matched_resp_tokens) / len(ctx.resp_tokens)) if ctx.resp_tokens else 0.0
    resp_ratio = min(1.0, resp_ratio)

    # 6. Description overlap
    desc_tokens = tokenize(experience.description or "")
    matched_desc_tokens = desc_tokens.intersection(ctx.summary_tokens)
    desc_ratio = (len(matched_desc_tokens) / len(ctx.summary_tokens)) if ctx.summary_tokens else 0.0
    desc_ratio = min(1.0, desc_ratio)

    # Dynamic Weight Normalization
    active_weights = 0.0
    weighted_sum = 0.0

    if ctx.tech_map:
        active_weights += WEIGHT_TECHNOLOGY
        weighted_sum += tech_ratio * WEIGHT_TECHNOLOGY

    if ctx.req_skills_map:
        active_weights += WEIGHT_REQUIRED_SKILL
        weighted_sum += req_skill_ratio * WEIGHT_REQUIRED_SKILL

    if ctx.pref_skills_map:
        active_weights += WEIGHT_PREFERRED_SKILL
        weighted_sum += pref_skill_ratio * WEIGHT_PREFERRED_SKILL

    if ctx.keywords_map:
        active_weights += WEIGHT_KEYWORD
        weighted_sum += keyword_ratio * WEIGHT_KEYWORD

    if ctx.resp_tokens:
        active_weights += WEIGHT_RESPONSIBILITY_OVERLAP
        weighted_sum += resp_ratio * WEIGHT_RESPONSIBILITY_OVERLAP

    if ctx.summary_tokens:
        active_weights += WEIGHT_DESCRIPTION_OVERLAP
        weighted_sum += desc_ratio * WEIGHT_DESCRIPTION_OVERLAP

    raw_score = (weighted_sum / active_weights) if active_weights > 0 else 0.0
    score = round(min(1.0, max(0.0, raw_score)), 4)

    reasons = []
    if matched_techs:
        reasons.append(f"Matched {len(matched_techs)} JD technologies: {', '.join(matched_techs)}")
    if matched_req_skills:
        reasons.append(f"Matched {len(matched_req_skills)} required skills: {', '.join(matched_req_skills)}")
    if matched_pref_skills:
        reasons.append(f"Matched {len(matched_pref_skills)} preferred skills: {', '.join(matched_pref_skills)}")
    if matched_keywords:
        reasons.append(f"Matched {len(matched_keywords)} JD keywords: {', '.join(matched_keywords)}")
    if matched_resp_tokens:
        reasons.append(f"Aligned with {len(matched_resp_tokens)} responsibility terms")

    if not reasons:
        reasons.append("No matching skills, technologies, or keywords found")

    breakdown = MatchBreakdown(
        score=score,
        matched_technologies=matched_techs,
        matched_skills=all_matched_skills,
        matched_keywords=matched_keywords,
        reasons=reasons,
    )
    return score, breakdown


def score_skill(skill: Any, ctx: JDAnalysisContext) -> Tuple[float, MatchBreakdown]:
    """Scores an individual Skill against a JDAnalysisContext."""
    norm_name = normalize_term(skill.name)
    score = 0.0
    reasons = []
    matched_skills = []
    matched_keywords = []

    req_matches = [
        orig for norm, orig in ctx.req_skills_map.items()
        if norm == norm_name or norm in norm_name or norm_name in norm
    ]
    pref_matches = [
        orig for norm, orig in ctx.pref_skills_map.items()
        if norm == norm_name or norm in norm_name or norm_name in norm
    ]
    kw_matches = [
        orig for norm, orig in ctx.keywords_map.items()
        if norm == norm_name or norm in norm_name or norm_name in norm
    ]

    if req_matches:
        score = SCORE_SKILL_REQUIRED_MATCH
        matched_skills.extend(req_matches)
        reasons.append(f"Direct match for required skill: {', '.join(req_matches)}")
    elif pref_matches:
        score = SCORE_SKILL_PREFERRED_MATCH
        matched_skills.extend(pref_matches)
        reasons.append(f"Direct match for preferred skill: {', '.join(pref_matches)}")
    elif kw_matches:
        score = SCORE_SKILL_KEYWORD_MATCH
        matched_keywords.extend(kw_matches)
        reasons.append(f"Matches JD keyword: {', '.join(kw_matches)}")
    elif any(token in ctx.resp_tokens for token in tokenize(skill.name)):
        score = 0.30
        reasons.append("Matches term in JD responsibilities")
    else:
        # Check description if present
        desc_tokens = tokenize(skill.description or "")
        matched_desc_kw = desc_tokens.intersection(set(ctx.keywords_map.keys()))
        if matched_desc_kw:
            score = 0.20
            reasons.append("Skill description overlaps with JD keywords")
        else:
            reasons.append("Not directly mentioned in JD analysis")

    breakdown = MatchBreakdown(
        score=score,
        matched_technologies=[],
        matched_skills=matched_skills,
        matched_keywords=matched_keywords,
        reasons=reasons,
    )
    return score, breakdown


def score_technology(technology: Any, ctx: JDAnalysisContext) -> Tuple[float, MatchBreakdown]:
    """Scores an individual Technology against a JDAnalysisContext."""
    norm_name = normalize_term(technology.name)
    score = 0.0
    reasons = []
    matched_techs = []
    matched_keywords = []

    tech_matches = [
        orig for norm, orig in ctx.tech_map.items()
        if norm == norm_name or norm in norm_name or norm_name in norm
    ]
    kw_matches = [
        orig for norm, orig in ctx.keywords_map.items()
        if norm == norm_name or norm in norm_name or norm_name in norm
    ]

    if tech_matches:
        score = SCORE_TECH_DIRECT_MATCH
        matched_techs.extend(tech_matches)
        reasons.append(f"Direct match for target technology: {', '.join(tech_matches)}")
    elif kw_matches:
        score = SCORE_TECH_KEYWORD_MATCH
        matched_keywords.extend(kw_matches)
        reasons.append(f"Matches JD keyword: {', '.join(kw_matches)}")
    elif any(token in ctx.resp_tokens for token in tokenize(technology.name)):
        score = 0.30
        reasons.append("Matches term in JD responsibilities")
    else:
        reasons.append("Not directly mentioned in JD analysis")

    breakdown = MatchBreakdown(
        score=score,
        matched_technologies=matched_techs,
        matched_skills=[],
        matched_keywords=matched_keywords,
        reasons=reasons,
    )
    return score, breakdown


def score_achievement(achievement: Any, ctx: JDAnalysisContext) -> Tuple[float, MatchBreakdown]:
    """Scores an Achievement based on technology, skill, and keyword mentions."""
    text = f"{achievement.title} {achievement.description or ''}"
    matched_techs = _find_keyword_matches_in_text(text, ctx.tech_map)
    all_skills_map = {**ctx.req_skills_map, **ctx.pref_skills_map}
    matched_skills = _find_keyword_matches_in_text(text, all_skills_map)
    matched_keywords = _find_keyword_matches_in_text(text, ctx.keywords_map)

    # Overlap with responsibilities
    ach_tokens = tokenize(text)
    matched_resp_tokens = ach_tokens.intersection(ctx.resp_tokens)

    active_weights = 0.0
    weighted_sum = 0.0

    if ctx.tech_map:
        active_weights += WEIGHT_ACHIEVEMENT_TECH
        weighted_sum += (len(matched_techs) / len(ctx.tech_map)) * WEIGHT_ACHIEVEMENT_TECH

    if all_skills_map:
        active_weights += WEIGHT_ACHIEVEMENT_SKILL
        weighted_sum += (len(matched_skills) / len(all_skills_map)) * WEIGHT_ACHIEVEMENT_SKILL

    if ctx.keywords_map:
        active_weights += WEIGHT_ACHIEVEMENT_KEYWORD
        weighted_sum += (len(matched_keywords) / len(ctx.keywords_map)) * WEIGHT_ACHIEVEMENT_KEYWORD

    if ctx.resp_tokens:
        active_weights += WEIGHT_RESPONSIBILITY_OVERLAP
        weighted_sum += (len(matched_resp_tokens) / len(ctx.resp_tokens)) * WEIGHT_RESPONSIBILITY_OVERLAP

    raw_score = (weighted_sum / active_weights) if active_weights > 0 else 0.0
    score = round(min(1.0, max(0.0, raw_score)), 4)

    reasons = []
    if matched_techs:
        reasons.append(f"Mentions target technologies: {', '.join(matched_techs)}")
    if matched_skills:
        reasons.append(f"Mentions relevant skills: {', '.join(matched_skills)}")
    if matched_keywords:
        reasons.append(f"Mentions JD keywords: {', '.join(matched_keywords)}")
    if matched_resp_tokens:
        reasons.append(f"Aligned with {len(matched_resp_tokens)} responsibility terms")

    if not reasons:
        reasons.append("No direct overlap with JD technologies, skills, or keywords")

    breakdown = MatchBreakdown(
        score=score,
        matched_technologies=matched_techs,
        matched_skills=matched_skills,
        matched_keywords=matched_keywords,
        reasons=reasons,
    )
    return score, breakdown



# --- Ranking Functions with Deterministic Tie-Breaking ---

def rank_projects(projects: List[Any], analysis: Any) -> List[RankedProject]:
    ctx = JDAnalysisContext(analysis)
    scored = []
    for p in projects:
        score, breakdown = score_project(p, ctx)
        scored.append((p, score, breakdown))

    # Tie-break: highest score, most matched techs, most matched skills, project name (alpha), id
    scored.sort(
        key=lambda item: (
            -item[1],
            -len(item[2].matched_technologies),
            -len(item[2].matched_skills),
            item[0].name.lower(),
            item[0].id,
        )
    )

    return [
        RankedProject(
            id=p.id,
            name=p.name,
            role=p.role,
            score=score,
            match_breakdown=breakdown,
            matched_technologies=breakdown.matched_technologies,
            matched_skills=breakdown.matched_skills,
        )
        for p, score, breakdown in scored
    ]


def rank_experiences(experiences: List[Any], analysis: Any) -> List[RankedExperience]:
    ctx = JDAnalysisContext(analysis)
    scored = []
    for exp in experiences:
        score, breakdown = score_experience(exp, ctx)
        scored.append((exp, score, breakdown))

    # Tie-break: highest score, most matched techs, most matched skills, start_date (newest), company (alpha), id
    scored.sort(
        key=lambda item: (
            -item[1],
            -len(item[2].matched_technologies),
            -len(item[2].matched_skills),
            -(item[0].start_date.toordinal() if item[0].start_date else 0),
            item[0].company.lower(),
            item[0].id,
        )
    )

    return [
        RankedExperience(
            id=exp.id,
            company=exp.company,
            role=exp.role,
            score=score,
            match_breakdown=breakdown,
            matched_technologies=breakdown.matched_technologies,
            matched_skills=breakdown.matched_skills,
        )
        for exp, score, breakdown in scored
    ]


def rank_skills(skills: List[Any], analysis: Any) -> List[RankedSkill]:
    ctx = JDAnalysisContext(analysis)
    scored = []
    for s in skills:
        score, breakdown = score_skill(s, ctx)
        scored.append((s, score, breakdown))

    # Tie-break: highest score, skill name (alpha), id
    scored.sort(
        key=lambda item: (
            -item[1],
            item[0].name.lower(),
            item[0].id,
        )
    )

    return [
        RankedSkill(
            id=s.id,
            name=s.name,
            category=s.category,
            score=score,
            match_breakdown=breakdown,
        )
        for s, score, breakdown in scored
    ]


def rank_technologies(technologies: List[Any], analysis: Any) -> List[RankedTechnology]:
    ctx = JDAnalysisContext(analysis)
    scored = []
    for t in technologies:
        score, breakdown = score_technology(t, ctx)
        scored.append((t, score, breakdown))

    # Tie-break: highest score, technology name (alpha), id
    scored.sort(
        key=lambda item: (
            -item[1],
            item[0].name.lower(),
            item[0].id,
        )
    )

    return [
        RankedTechnology(
            id=t.id,
            name=t.name,
            score=score,
            match_breakdown=breakdown,
        )
        for t, score, breakdown in scored
    ]


def rank_achievements(achievements: List[Any], analysis: Any) -> List[RankedAchievement]:
    ctx = JDAnalysisContext(analysis)
    scored = []
    for a in achievements:
        score, breakdown = score_achievement(a, ctx)
        scored.append((a, score, breakdown))

    # Tie-break: highest score, achievement title (alpha), id
    scored.sort(
        key=lambda item: (
            -item[1],
            item[0].title.lower(),
            item[0].id,
        )
    )

    return [
        RankedAchievement(
            id=a.id,
            title=a.title,
            score=score,
            match_breakdown=breakdown,
        )
        for a, score, breakdown in scored
    ]
