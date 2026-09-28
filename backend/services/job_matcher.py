"""Compare listing skills with the skills the user actually provided."""

from backend.tools.skill_extractor import RELATED


def match_skills(job_skills: list[str], candidate_skills: list[str]) -> dict[str, object]:
    """Return an estimated overlap. The score is not a hiring decision."""
    candidate = set(candidate_skills)
    matched = [skill for skill in job_skills if skill in candidate]
    partial: list[str] = []
    missing: list[str] = []
    for skill in job_skills:
        if skill in candidate:
            continue
        related = RELATED.get(skill, set())
        if related & candidate:
            partial.append(skill)
        else:
            missing.append(skill)

    if not job_skills:
        return {
            "matched_skills": [],
            "partial_skills": [],
            "missing_skills": [],
            "compatibility_score": None,
            "explanation": (
                "Estimated compatibility was not calculated because this public listing "
                "did not mention recognizable skills. This is not a hiring decision."
            ),
        }

    score = round(100 * len(matched) / len(job_skills))
    explanation = (
        f"Estimated compatibility: {score}%. "
        f"{len(matched)} of {len(job_skills)} skills named on the public listing "
        "also appear in your resume or the skills you entered. "
        "This is an overlap estimate, not a decision about whether a company will hire you."
    )
    if not candidate_skills:
        explanation += " Add a resume or skills to make the estimate more specific."
    return {
        "matched_skills": matched,
        "partial_skills": partial,
        "missing_skills": missing,
        "compatibility_score": score,
        "explanation": explanation,
    }
