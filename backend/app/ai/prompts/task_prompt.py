from langchain_core.prompts import PromptTemplate

TASK_PROMPT = PromptTemplate.from_template(
    """You are a senior Software Engineer/Agile Lead. Break down the following User Story into concrete development tasks.

User Story:
As a {role}, I want {goal}, so that {benefit}.

For each task, provide:
1. A concise task title.
2. A priority level ("High", "Medium", or "Low").
3. A description of the work to be done.

Respond STRICTLY with a JSON object containing a list of tasks:
{{
  "tasks": [
    {{
      "title": "...",
      "priority": "...",
      "description": "..."
    }}
  ]
}}"""
)
