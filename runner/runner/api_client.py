import httpx
from typing import Any


class ApiClient:
    """Client for communicating with the backend API."""

    def __init__(self, base_url: str, token: str):
        self.base_url = base_url.rstrip("/")
        self.token = token

    def _headers(self) -> dict[str, str]:
        return {"Authorization": f"Bearer {self.token}"}

    def list_active_runs(self, project_id: str) -> list[dict[str, Any]]:
        """List active runs for a project."""
        r = httpx.get(
            f"{self.base_url}/api/projects/{project_id}/runs?limit=50",
            headers=self._headers(),
            timeout=30.0,
        )
        r.raise_for_status()
        return r.json()

    def get_run(self, run_id: str) -> dict[str, Any]:
        """Get details of a specific run."""
        r = httpx.get(
            f"{self.base_url}/api/runs/{run_id}",
            headers=self._headers(),
            timeout=30.0,
        )
        r.raise_for_status()
        return r.json()

    def get_task(self, task_id: str) -> dict[str, Any]:
        """Get details of a specific task."""
        r = httpx.get(
            f"{self.base_url}/api/tasks/{task_id}",
            headers=self._headers(),
            timeout=30.0,
        )
        r.raise_for_status()
        return r.json()

    def get_project(self, project_id: str) -> dict[str, Any]:
        """Get project details including repo path."""
        r = httpx.get(
            f"{self.base_url}/api/projects/{project_id}",
            headers=self._headers(),
            timeout=30.0,
        )
        r.raise_for_status()
        return r.json()

    def get_agent(self, agent_id: str) -> dict[str, Any]:
        """Get agent details including config."""
        r = httpx.get(
            f"{self.base_url}/api/agents/{agent_id}",
            headers=self._headers(),
            timeout=30.0,
        )
        r.raise_for_status()
        return r.json()

    def append_run_log(self, run_id: str, seq: int, stream: str, message: str) -> None:
        """Append a log entry to a run."""
        r = httpx.post(
            f"{self.base_url}/api/runs/{run_id}/logs",
            json={"seq": seq, "stream": stream, "message": message},
            headers=self._headers(),
            timeout=30.0,
        )
        r.raise_for_status()

    def complete_run(self, run_id: str, status: str, exit_code: int, summary: str) -> None:
        """Mark a run as complete."""
        r = httpx.post(
            f"{self.base_url}/api/runs/{run_id}/complete",
            json={"status": status, "exit_code": exit_code, "summary": summary},
            headers=self._headers(),
            timeout=30.0,
        )
        r.raise_for_status()
