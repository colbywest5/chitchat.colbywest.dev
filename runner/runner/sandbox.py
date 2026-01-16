import os
import re


def assert_allowed_path(repo_root: str, allowed_roots: list[str]) -> None:
    """
    Verify that a repository root is within allowed directories.

    Args:
        repo_root: Path to validate
        allowed_roots: List of allowed parent directories

    Raises:
        RuntimeError: If the path is not within any allowed root
    """
    rr = os.path.realpath(os.path.expanduser(repo_root))

    for root in allowed_roots:
        real_root = os.path.realpath(os.path.expanduser(root))
        # Check if repo_root is the same as or under an allowed root
        if rr == real_root or rr.startswith(real_root + os.sep):
            return

    raise RuntimeError(f"Repo root not allowed: {rr}")


def is_safe_command(command: str) -> bool:
    """
    Check if a command appears safe to execute.

    This is a defense-in-depth check. The allowed_roots restriction
    is the primary security boundary.

    Args:
        command: Shell command to validate

    Returns:
        True if command appears safe, False otherwise
    """
    command_lower = command.lower()

    # Deny list: catastrophic system commands
    catastrophic_patterns = [
        r"rm\s+-rf\s+/($|\s)",      # rm -rf /
        r"rm\s+-rf\s+/\*",          # rm -rf /*
        r"rm\s+-rf\s+~",            # rm -rf ~
        r":\(\)\{.*:\|:.*\};:",     # Fork bomb
        r"dd\s+if=/dev/(zero|random|urandom)\s+of=/dev/sd",  # Disk wipe
        r"mkfs\.",                   # Format filesystem
        r">\s*/dev/sd",              # Write to disk device
        r"chmod\s+-R\s+777\s+/($|\s)",  # chmod 777 /
        r"chown\s+-R\s+.*\s+/($|\s)",   # chown /
    ]

    for pattern in catastrophic_patterns:
        if re.search(pattern, command_lower):
            return False

    # Deny: downloading and executing unknown scripts
    download_execute_patterns = [
        r"curl\s+.*\|\s*(ba)?sh",    # curl | sh
        r"wget\s+.*\|\s*(ba)?sh",    # wget | sh
        r"curl\s+.*>\s*[^|]+;\s*(ba)?sh",  # curl > file; sh file
    ]

    for pattern in download_execute_patterns:
        if re.search(pattern, command_lower):
            return False

    # Deny: modifying system files
    system_paths = [
        r"/etc/passwd",
        r"/etc/shadow",
        r"/etc/sudoers",
        r"/etc/ssh",
        r"/root/",
    ]

    for path in system_paths:
        if path in command_lower:
            return False

    # Deny: privilege escalation attempts
    priv_esc_patterns = [
        r"\bsudo\b",                 # sudo
        r"\bsu\s+-",                 # su -
        r"\bdoas\b",                 # doas
    ]

    for pattern in priv_esc_patterns:
        if re.search(pattern, command_lower):
            return False

    return True


def sanitize_env(env: dict[str, str] | None = None) -> dict[str, str]:
    """
    Create a sanitized environment for subprocess execution.

    Removes potentially dangerous environment variables and
    adds safe defaults.

    Args:
        env: Base environment (defaults to os.environ)

    Returns:
        Sanitized environment dictionary
    """
    base = dict(env) if env else dict(os.environ)

    # Remove potentially dangerous env vars
    dangerous_vars = [
        "LD_PRELOAD",
        "LD_LIBRARY_PATH",
        "DYLD_INSERT_LIBRARIES",
        "PYTHONPATH",
        "NODE_OPTIONS",
        "PERL5LIB",
        "RUBYLIB",
    ]

    for var in dangerous_vars:
        base.pop(var, None)

    # Ensure safe PATH (prepend standard paths)
    safe_paths = ["/usr/local/bin", "/usr/bin", "/bin"]
    current_path = base.get("PATH", "")
    base["PATH"] = ":".join(safe_paths) + ":" + current_path

    return base
