from langchain_core.prompts import PromptTemplate

CRITERIA_PROMPT = PromptTemplate.from_template(
    """You are a professional QA Engineer. Generate a list of Acceptance Criteria for the following User Story in Given-When-Then format.

User Story:
As a {role}, I want {goal}, so that {benefit}.

Provide scenarios with:
1. Scenario title/description
2. Given state (context)
3. When event (action)
4. Then outcome (expected result)

Respond STRICTLY with a JSON object containing a list of criteria:
{{
  "criteria": [
    {{
      "scenario": "...",
      "given_text": "...",
      "when_text": "...",
      "then_text": "..."
    }}
  ]
}}"""
)
