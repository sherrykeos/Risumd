"""
Centralized scoring weights and constants for the Career Matching Engine.
All weights and scaling constants live here to ensure deterministic, explainable calculations.
"""

# Project & Experience Component Weights (Sum to 1.00)
WEIGHT_TECHNOLOGY = 0.35
WEIGHT_REQUIRED_SKILL = 0.25
WEIGHT_PREFERRED_SKILL = 0.10
WEIGHT_KEYWORD = 0.15
WEIGHT_RESPONSIBILITY_OVERLAP = 0.10
WEIGHT_DESCRIPTION_OVERLAP = 0.05

# Supporting Item Matching Scores
# Skill matches
SCORE_SKILL_REQUIRED_MATCH = 1.00
SCORE_SKILL_PREFERRED_MATCH = 0.75
SCORE_SKILL_KEYWORD_MATCH = 0.40

# Technology matches
SCORE_TECH_DIRECT_MATCH = 1.00
SCORE_TECH_KEYWORD_MATCH = 0.50

# Achievement weights
WEIGHT_ACHIEVEMENT_TECH = 0.40
WEIGHT_ACHIEVEMENT_SKILL = 0.35
WEIGHT_ACHIEVEMENT_KEYWORD = 0.25
