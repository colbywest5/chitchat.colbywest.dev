import subprocess
import select
import sys
from typing import Generator
from .sandbox import sanitize_env


def run_shell(repo_root: str, command: str, env: dict[str, str] | None = None) -> tuple[int, str]:
    """
    Execute a shell command in a repository directory.

    Args:
        repo_root: Directory to run command in
        command: Shell command to execute
        env: Environment variables (will be sanitized)

    Returns:
        Tuple of (exit_code, output)
    """
    safe_env = sanitize_env(env)
    p = subprocess.Popen(
        command,
        cwd=repo_root,
        shell=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        env=safe_env,
    )
    out = []
    while True:
        line = p.stdout.readline() if p.stdout else ""
        if line:
            out.append(line.rstrip("\n"))
        if p.poll() is not None:
            # Drain remaining output
            if p.stdout:
                for remaining in p.stdout:
                    out.append(remaining.rstrip("\n"))
            break
    return p.returncode or 0, "\n".join(out)


def run_shell_streaming(
    repo_root: str,
    command: str,
    env: dict[str, str] | None = None
) -> Generator[tuple[str, str], None, int]:
    """
    Execute a shell command and yield output lines as they arrive.

    Args:
        repo_root: Directory to run command in
        command: Shell command to execute
        env: Environment variables (will be sanitized)

    Yields:
        Tuples of (stream, line) where stream is 'stdout' or 'stderr'

    Returns:
        Exit code (accessible via StopIteration.value)
    """
    safe_env = sanitize_env(env)
    p = subprocess.Popen(
        command,
        cwd=repo_root,
        shell=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        bufsize=1,  # Line buffered
        env=safe_env,
    )

    # Use select on Unix, fallback to polling on Windows
    if sys.platform != "win32":
        # Unix: use select for non-blocking reads
        while p.poll() is None:
            readable, _, _ = select.select([p.stdout, p.stderr], [], [], 0.1)
            for stream in readable:
                line = stream.readline()
                if line:
                    stream_name = "stdout" if stream == p.stdout else "stderr"
                    yield (stream_name, line.rstrip("\n"))
    else:
        # Windows: alternate reading (less efficient but works)
        while p.poll() is None:
            if p.stdout:
                line = p.stdout.readline()
                if line:
                    yield ("stdout", line.rstrip("\n"))
            if p.stderr:
                line = p.stderr.readline()
                if line:
                    yield ("stderr", line.rstrip("\n"))

    # Drain remaining output after process exits
    if p.stdout:
        for line in p.stdout:
            yield ("stdout", line.rstrip("\n"))
    if p.stderr:
        for line in p.stderr:
            yield ("stderr", line.rstrip("\n"))

    return p.returncode or 0
