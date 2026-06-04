from app.schemas import NodeContextInput, LearnerContext


def _learner_section(ctx: LearnerContext) -> str:
    parts: list[str] = []
    level = ctx.familiarity_level or "beginner"

    if level == "advanced":
        parts.append("The learner is advanced — skip introductory material, focus on edge cases, patterns, and deeper insights.")
    elif level == "intermediate":
        parts.append("The learner has intermediate knowledge — balance foundational concepts with practical depth.")
    else:
        parts.append("The learner is a beginner — use simple language, concrete analogies, and step-by-step explanations.")

    style = ctx.preferred_learning_style
    if style == "visual":
        parts.append("They prefer visual learning — include diagrams described in text, concrete examples, and comparisons.")
    elif style == "hands_on":
        parts.append("They prefer hands-on learning — include practical code snippets, exercises, and actionable steps.")
    elif style == "video":
        parts.append("They prefer video-style learning — use a conversational tone with clear, sequential walkthrough style.")
    elif style == "reading":
        parts.append("They prefer reading — use well-structured prose with clear headings-style organization.")

    if ctx.learning_goal:
        parts.append(f"Their learning goal is: {ctx.learning_goal}. Slant examples and emphasis accordingly.")
    if ctx.prior_skills:
        parts.append(f"They already know: {ctx.prior_skills}. Skip re-explaining these and build on them where relevant.")
    if ctx.about_self:
        parts.append(f"Additional learner context: {ctx.about_self}")

    if ctx.current_node_attempts > 0:
        score_note = f" (best score: {ctx.current_node_best_score}%)" if ctx.current_node_best_score is not None else ""
        parts.append(f"They have attempted this node {ctx.current_node_attempts} time(s){score_note}. Reinforce areas they may be struggling with.")

    if ctx.total_nodes > 0:
        parts.append(f"Overall progress: {ctx.nodes_completed}/{ctx.total_nodes} nodes completed.")

    return "\n".join(parts)


def build_stream_explanation_prompt(input_data: NodeContextInput) -> str:
    """Prompt for SSE streaming — structured sections instead of JSON."""
    if input_data.learning_outcomes:
        outcomes_block = "After reading this explanation, the learner should understand:\n" + \
            "\n".join(f"{i+1}. {o}" for i, o in enumerate(input_data.learning_outcomes))
    else:
        outcomes_block = "Base the explanation on the topic title and description only."

    learner_block = ""
    if input_data.learner_context:
        learner_block = f"\nLearner profile:\n{_learner_section(input_data.learner_context)}\n"

    weak_block = ""
    if input_data.weak_areas:
        items = "\n".join(f"{i+1}. {w}" for i, w in enumerate(input_data.weak_areas))
        weak_block = f"\nThe learner previously struggled with:\n{items}\nGive extra attention to these areas.\n"

    desc_line = f"Context: {input_data.description}" if input_data.description else ""

    return f"""You are a technical educator. Write a deep-learning explanation for: "{input_data.node_title}".

{desc_line}
{outcomes_block}
{learner_block}{weak_block}
Rules:
- Adapt depth and style to the learner profile above.
- Keep each section concise but substantive.
- Write only about the listed learning outcomes.

Output your response in EXACTLY this format with these section markers on their own lines:

[SUMMARY]
2-3 sentences giving a clear conceptual overview of the topic.

[WHY_IT_MATTERS]
1-2 sentences explaining the real-world relevance: when and why a developer needs this.

[KEY_POINTS]
- Each key point as a complete, specific sentence (3-5 points)
- Focus on the core mechanisms and relationships, not surface definitions

[EXAMPLE]
A concrete, minimal code snippet or scenario that shows the concept in action.
Use a code block with language tag if showing code (e.g. ```python ... ```).

[COMMON_MISTAKES]
- Each mistake starting with a dash (1-3 items, or omit this section if none apply)"""


def build_explanation_prompt(input_data: NodeContextInput) -> str:
    """Prompt for non-streaming burst generation — returns JSON."""
    if input_data.learning_outcomes:
        outcomes_block = "After reading this explanation, the learner should understand:\n" + \
            "\n".join(f"{i+1}. {o}" for i, o in enumerate(input_data.learning_outcomes))
    else:
        outcomes_block = "No learning outcomes were provided. Base the explanation on the topic title and available description only."

    learner_block = ""
    if input_data.learner_context:
        learner_block = f"\nLearner profile:\n{_learner_section(input_data.learner_context)}\n"

    weak_block = ""
    if input_data.weak_areas:
        items = "\n".join(f"{i+1}. {w}" for i, w in enumerate(input_data.weak_areas))
        weak_block = f"\nThe learner previously struggled with these areas:\n{items}\nFocus extra detail and clearer examples on these specific areas.\n"

    desc_line = f"Context: {input_data.description}" if input_data.description else ""

    return f"""You are a technical educator. Write a deep-learning explanation for the topic: "{input_data.node_title}".

{desc_line}
{outcomes_block}
{learner_block}{weak_block}
Rules:
- Write only about concepts within the listed learning outcomes.
- Adapt the depth, tone, and style to match the learner profile above.
- Keep each field concise but substantive.
- For "example": provide a minimal, concrete code snippet or real scenario (use plain text, no nested JSON).

Respond with ONLY valid JSON. No markdown, no prose, no code blocks.

Required format:
{{
  "summary": "2-3 sentence conceptual overview",
  "whyItMatters": "1-2 sentences on real-world relevance and when a developer needs this",
  "keyPoints": ["Core mechanism or relationship 1", "Core mechanism 2", "..."],
  "example": "Minimal code snippet or concrete scenario showing the concept in action",
  "commonMistakes": ["Mistake 1", "..."]
}}"""
