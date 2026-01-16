from pydantic import BaseModel


class RunnerConfig(BaseModel):
    api_base_url: str
    token: str
    poll_interval_seconds: float = 2.0
    allowed_roots: list[str]
