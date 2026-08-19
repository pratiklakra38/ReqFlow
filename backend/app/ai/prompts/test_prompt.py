from langchain_core.prompts import PromptTemplate

TEST_PROMPT = PromptTemplate.from_template(
    """You are a professional Test Automation Engineer. Write test scenarios (happy path and edge cases) for the following User Story.

User Story:
As a {role}, I want {goal}, so that {benefit}.

For each test scenario, provide:
1. Scenario title.
2. Steps to execute.
3. Expected result.

Respond STRICTLY with a JSON object containing a list of test scenarios:
{{
  "test_scenarios": [
    {{
      "title": "...",
      "steps": "...",
      "expected_result": "..."
    }}
  ]
}}"""
)
