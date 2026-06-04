from pydantic import BaseModel, Field, ConfigDict
from pydantic.alias_generators import to_camel


def _camel(s: str) -> str:
    """snake_case → camelCase for JSON interop with the TypeScript services."""
    parts = s.split("_")
    return parts[0] + "".join(p.capitalize() for p in parts[1:])


# All models accept both snake_case field names and camelCase aliases so the
# TypeScript learning-service can send camelCase without any adapter layer.
class _CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=_camel, populate_by_name=True)


class LearnerContext(_CamelModel):
    familiarity_level: str | None = None
    learning_goal: str | None = None
    weekly_hours: int | None = None
    about_self: str | None = None
    preferred_learning_style: str | None = None
    prior_skills: str | None = None
    current_node_attempts: int = 0
    current_node_best_score: float | None = None
    current_node_mastery_state: str = "not_started"
    overall_avg_score: float | None = None
    nodes_completed: int = 0
    total_nodes: int = 0


class ExplanationContext(_CamelModel):
    summary: str
    key_points: list[str]
    why_it_matters: str | None = None
    example: str | None = None
    common_mistakes: list[str] | None = None


class NodeContextInput(_CamelModel):
    node_id: str
    node_title: str
    description: str | None = None
    learning_outcomes: list[str] = Field(default_factory=list)
    difficulty_level: int | None = Field(None, ge=1, le=5)
    adapted_difficulty: int | None = Field(None, ge=1, le=5)
    question_count: int | None = Field(None, ge=2, le=8)
    explanation: ExplanationContext | None = None
    weak_areas: list[str] | None = None
    learner_context: LearnerContext | None = None


class AskQuestionInput(_CamelModel):
    node_id: str
    node_title: str
    question: str = Field(min_length=3, max_length=5000)
    description: str | None = None
    learning_outcomes: list[str] | None = None
    explanation: ExplanationContext | None = None
    learner_context: LearnerContext | None = None


class GeneratedQuestion(_CamelModel):
    question_text: str
    options: list[str]
    correct_answer: str
    explanation: str


class GeneratedQuiz(_CamelModel):
    questions: list[GeneratedQuestion]
    generated_by: str = "ai_tutor"


class GeneratedExplanation(_CamelModel):
    summary: str
    key_points: list[str]
    why_it_matters: str | None = None
    example: str | None = None
    common_mistakes: list[str] | None = None
