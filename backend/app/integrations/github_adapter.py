import requests
import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

def generate_issue_markdown(story: Dict[str, Any], epic_title: str) -> str:
    body = f"## User Story\n"
    body += f"**As a** {story.get('role', '')}\n"
    body += f"**I want to** {story.get('goal', '')}\n"
    body += f"**So that** {story.get('benefit', '')}\n\n"
    body += "---\n\n"

    body += "## Acceptance Criteria\n"
    criteria = story.get("criteria", [])
    if criteria:
        for idx, crit in enumerate(criteria, 1):
            body += f"### Scenario {idx}: {crit.get('scenario', 'GWT Scenario')}\n"
            body += f"- **Given** {crit.get('given_text', '')}\n"
            body += f"- **When** {crit.get('when_text', '')}\n"
            body += f"- **Then** {crit.get('then_text', '')}\n\n"
    else:
        body += "*No acceptance criteria defined.*\n\n"
    body += "---\n\n"

    body += "## Suggested Development Tasks\n"
    tasks = story.get("tasks", [])
    if tasks:
        for tsk in tasks:
            body += f"- [ ] **{tsk.get('title', '')}** (Priority: *{tsk.get('priority', 'Medium')}*)\n"
            if tsk.get("description"):
                body += f"  > {tsk.get('description', '')}\n"
    else:
        body += "*No tasks generated.*\n\n"
    body += "\n---\n\n"

    body += "## Initial Test Scenarios\n"
    tests = story.get("test_scenarios", [])
    if tests:
        for tst in tests:
            body += f"### {tst.get('title', 'Test Case')}\n"
            body += f"**Steps:**\n{tst.get('steps', '')}\n\n"
            body += f"**Expected Result:** {tst.get('expected_result', '')}\n\n"
    else:
        body += "*No test scenarios generated.*\n\n"

    body += "\n*Generated automatically by ReqFlow Backlog Generator.*"
    return body

def clean_repo_name(repo: str) -> str:
    """Cleans up repository string to ensure 'owner/repo' format."""
    repo = repo.strip()
    for prefix in ["https://github.com/", "http://github.com/", "git@github.com:", "github.com/"]:
        if repo.startswith(prefix):
            repo = repo[len(prefix):]
            break
    if repo.endswith(".git"):
        repo = repo[:-4]
    return repo.strip("/")

def push_story_to_github(repo: str, token: str, story: Dict[str, Any], epic_title: str) -> Dict[str, Any]:
    cleaned_repo = clean_repo_name(repo)
    if "/" not in cleaned_repo or len(cleaned_repo.split("/")) != 2:
        return {
            "success": False,
            "error": f"Invalid repository format '{repo}'. Please use 'owner/repo' format (e.g., 'username/my-project')."
        }

    url = f"https://api.github.com/repos/{cleaned_repo}/issues"
    headers = {
        "Authorization": f"Bearer {token.strip()}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-API-Version": "2022-11-28",
        "User-Agent": "ReqFlow-App"
    }

    title = f"Story: {story.get('title', 'User Story')}"
    body = generate_issue_markdown(story, epic_title)
    
    labels = ["user-story"]
    
    has_high = any(t.get("priority") == "High" for t in story.get("tasks", []))
    if has_high:
        labels.append("priority:high")
    else:
        labels.append("priority:medium")

    if epic_title:
        labels.append(f"epic:{epic_title}")

    payload = {
        "title": title,
        "body": body,
        "labels": labels
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=15)
        
        if response.status_code == 201:
            data = response.json()
            return {
                "success": True,
                "url": data.get("html_url"),
                "number": data.get("number")
            }
        elif response.status_code == 404:
            err_msg = (
                f"Repository '{cleaned_repo}' not found (404). "
                "Please verify that: 1) The repository name is correct ('owner/repo'), "
                "2) The repo exists on GitHub, "
                "3) Your GitHub Token has the 'repo' scope, and "
                "4) 'Issues' are enabled in the repository settings."
            )
            logger.error(f"GitHub API Error (404): {err_msg}")
            return {"success": False, "error": err_msg}
        elif response.status_code == 401:
            err_msg = "GitHub Authentication failed (401 Bad credentials). Please check your GITHUB_TOKEN."
            logger.error(f"GitHub API Error (401): {err_msg}")
            return {"success": False, "error": err_msg}
        elif response.status_code == 403:
            err_msg = f"GitHub Permission Denied (403). Your token does not have permission to create issues in '{cleaned_repo}'."
            logger.error(f"GitHub API Error (403): {err_msg}")
            return {"success": False, "error": err_msg}
        else:
            err_detail = "Unknown error"
            try:
                err_detail = response.json().get("message", response.text)
            except Exception:
                err_detail = response.text
            
            logger.error(f"GitHub API Error ({response.status_code}): {err_detail}")
            return {
                "success": False,
                "error": f"GitHub API Error {response.status_code}: {err_detail}"
            }
    except Exception as e:
        logger.error(f"GitHub Connection Error: {str(e)}")
        return {
            "success": False,
            "error": f"Failed to connect to GitHub API: {str(e)}"
        }

