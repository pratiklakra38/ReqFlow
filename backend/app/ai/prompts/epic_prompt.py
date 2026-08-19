from langchain_core.prompts import PromptTemplate

EPIC_PROMPT = PromptTemplate.from_template(
    """You are a professional Product Owner. Read the following requirements document and identify the major Epics (large features or modules).

Requirements Document:
{requirements}

Respond STRICTLY with a JSON object containing a list of epics, each with a title and a description:
{{
  "epics": [
    {{
      "title": "...",
      "description": "..."
    }}
  ]
}}"""
)
