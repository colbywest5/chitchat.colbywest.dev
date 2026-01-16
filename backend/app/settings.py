from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    ENV: str = "dev"
    APP_NAME: str = "OvermindOps"

    DATABASE_URL: str
    REDIS_URL: str

    SECRET_KEY_CHANGE_ME: str
    SESSION_TOKEN_BYTES: int = 32
    SESSION_TTL_SECONDS: int = 86400
    PASSWORD_BCRYPT_ROUNDS: int = 12

    DATA_DIR: str = "/data"
    RECORDINGS_DIR: str = "/data/recordings"
    ARTIFACTS_DIR: str = "/data/artifacts"

    WHISPER_MODEL_SIZE: str = "small"
    WHISPER_DEVICE: str = "cpu"
    WHISPER_COMPUTE_TYPE: str = "int8"

    class Config:
        env_file = ".env"


settings = Settings()
