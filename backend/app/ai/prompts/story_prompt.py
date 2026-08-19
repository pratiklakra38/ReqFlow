from langchain_core.prompts import PromptTemplate

STORY_PROMPT = PromptTemplate.from_template(
    """You are a professional Agile Product Owner. For the given Epic and requirements document, generate a list of User Stories.

Requirements Document:
{requirements}

Epic:
Title: {epic_title}
Description: {epic_description}

Generate user stories that fit this Epic. Each story MUST be in standard format: "As a [role], I want [goal], so that [benefit]".
Provide a concise title and map the components (role, goal, benefit) explicitly.

Respond STRICTLY with a JSON object containing a list of user stories:
{{
  "stories": [
    {{
      "title": "...",
      "role": "...",
      "goal": "...",
      "benefit": "..."
    }}
  ]
}}"""
)
