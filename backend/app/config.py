from pydantic import BaseModel


class Settings(BaseModel):
    """Runtime settings kept intentionally small in the foundation phase."""

    app_name: str = "The Launcher API"
    api_prefix: str = "/api/v1"


settings = Settings()
