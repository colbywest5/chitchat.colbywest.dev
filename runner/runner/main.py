import os
import re
import time
from .config import RunnerConfig
from .api_client import ApiClient
from .executor import run_shell_streaming
from .sandbox import assert_allowed_path, is_safe_command


def main() -> None:
    """
    Main entry point for the runner.

    The runner polls for started runs and executes tasks in local repositories.

    Environment variables:
        RUNNER_API_BASE_URL: Backend API URL (default: http://localhost:8000)
        RUNNER_TOKEN: Authentication token (required)
        RUNNER_ALLOWED_ROOTS: Comma-separated list of allowed repo directories (required)
        RUNNER_PROJECT_ID: Project ID to poll for runs (required)
    """
    api_base_url = os.environ.get("RUNNER_API_BASE_URL", "http://localhost:8000")
    token = os.environ.get("RUNNER_TOKEN", "")
    allowed_roots = os.environ.get("RUNNER_ALLOWED_ROOTS", "").split(",")
    allowed_roots = [x.strip() for x in allowed_roots if x.strip()]
    project_id = os.environ.get("RUNNER_PROJECT_ID", "")

    if not token:
        raise RuntimeError("RUNNER_TOKEN is required")
    if not allowed_roots:
        raise RuntimeError("RUNNER_ALLOWED_ROOTS is required")
    if not project_id:
        raise RuntimeError("RUNNER_PROJECT_ID is required")

    cfg = RunnerConfig(
        api_base_url=api_base_url,
        token=token,
        allowed_roots=allowed_roots
    )
    api = ApiClient(cfg.api_base_url, cfg.token)

    print(f"Runner started for project {project_id}")
    print(f"Allowed roots: {allowed_roots}")
    print(f"Poll interval: {cfg.poll_interval_seconds}s")

    while True:
        try:
            runs = api.list_active_runs(project_id)

            for run in runs:
                if run.get("status") != "started":
                    continue

                run_id = run["id"]
                task_id = run.get("task_id")
                agent_id = run.get("agent_id")

                if not task_id:
                    print(f"Run {run_id} has no task, skipping")
                    continue

                try:
                    task = api.get_task(task_id)
                    project = api.get_project(project_id)
                    agent = api.get_agent(agent_id) if agent_id else None
                    execute_task(api, cfg, project_id, run_id, task, project, agent)
                except Exception as e:
                    print(f"Error executing run {run_id}: {e}")
                    try:
                        api.complete_run(run_id, "failed", 1, f"Runner error: {str(e)}")
                    except Exception:
                        pass

        except Exception as e:
            print(f"Error polling runs: {e}")

        time.sleep(cfg.poll_interval_seconds)


def execute_task(
    api: ApiClient,
    cfg: RunnerConfig,
    project_id: str,
    run_id: str,
    task: dict,
    project: dict,
    agent: dict | None
) -> None:
    """
    Execute a task by running shell commands in the project repo.

    Command resolution order:
    1. Explicit command in task description (```bash ... ``` or ```sh ... ```)
    2. Command from agent config_json["default_command"]
    3. Default command based on task type
    """
    seq = 0

    def log(stream: str, message: str) -> int:
        nonlocal seq
        api.append_run_log(run_id, seq, stream, message)
        seq += 1
        return seq

    log("system", f"=== Task: {task['title']} ===")
    log("system", f"Type: {task['type']} | Priority: {task['priority']}")

    # Determine repo root
    repo_root = project.get("default_repo_path")
    if agent and agent.get("config_json", {}).get("repo_path"):
        repo_root = agent["config_json"]["repo_path"]

    if not repo_root:
        log("stderr", "ERROR: No repo path configured for project or agent")
        api.complete_run(run_id, "failed", 1, "No repo path configured")
        return

    # Validate repo path is allowed
    try:
        assert_allowed_path(repo_root, cfg.allowed_roots)
    except RuntimeError as e:
        log("stderr", f"ERROR: {e}")
        api.complete_run(run_id, "failed", 1, str(e))
        return

    if not os.path.isdir(repo_root):
        log("stderr", f"ERROR: Repo path does not exist: {repo_root}")
        api.complete_run(run_id, "failed", 1, f"Repo path does not exist: {repo_root}")
        return

    log("system", f"Repo: {repo_root}")

    # Extract command from task
    command = extract_command(task, agent)

    if not command:
        log("stderr", "ERROR: No command found in task description or agent config")
        api.complete_run(run_id, "failed", 1, "No command to execute")
        return

    # Safety check
    if not is_safe_command(command):
        log("stderr", f"ERROR: Command blocked by safety check: {command}")
        api.complete_run(run_id, "failed", 1, "Command blocked by safety check")
        return

    log("system", f"Command: {command}")
    log("system", "--- Output ---")

    # Execute command and stream output
    exit_code = 0
    try:
        gen = run_shell_streaming(repo_root, command)
        while True:
            try:
                stream, line = next(gen)
                log(stream, line)
            except StopIteration as e:
                exit_code = e.value if e.value is not None else 0
                break
    except Exception as e:
        log("stderr", f"Execution error: {e}")
        exit_code = 1

    log("system", f"--- Exit code: {exit_code} ---")

    # Complete the run
    status = "completed" if exit_code == 0 else "failed"
    summary = f"Task '{task['title']}' {status} with exit code {exit_code}"
    api.complete_run(run_id, status, exit_code, summary)
    print(f"Run {run_id} {status} (exit {exit_code})")


def extract_command(task: dict, agent: dict | None) -> str | None:
    """
    Extract command to execute from task description or agent config.

    Looks for:
    1. Code blocks in description: ```bash\n...\n``` or ```sh\n...\n```
    2. Lines starting with $ in description
    3. Agent default_command in config_json
    4. Default command based on task type
    """
    description = task.get("description", "")
    task_type = task.get("type", "code_change")

    # Try to extract bash/sh code block
    code_block_pattern = r'```(?:bash|sh)\n(.*?)```'
    matches = re.findall(code_block_pattern, description, re.DOTALL)
    if matches:
        # Join multiple code blocks with &&
        commands = [m.strip() for m in matches if m.strip()]
        if commands:
            return " && ".join(commands)

    # Try to extract $ prefixed commands
    dollar_pattern = r'^\$\s*(.+)$'
    dollar_matches = re.findall(dollar_pattern, description, re.MULTILINE)
    if dollar_matches:
        commands = [m.strip() for m in dollar_matches if m.strip()]
        if commands:
            return " && ".join(commands)

    # Try agent default command
    if agent:
        config = agent.get("config_json", {})
        if config.get("default_command"):
            return config["default_command"]

    # Default commands based on task type
    defaults = {
        "test": "npm test",
        "build": "npm run build",
        "lint": "npm run lint",
        "format": "npm run format",
        "install": "npm install",
        "code_change": None,  # No default for code changes - requires explicit command
        "review": None,
        "doc": None,
        "research": None,
    }

    return defaults.get(task_type)


if __name__ == "__main__":
    main()
