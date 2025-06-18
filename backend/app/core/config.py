from pydantic_settings import BaseSettings
from pydantic import Field
import os


class Settings(BaseSettings):
    database_url: str = Field(..., env="DATABASE_URL")
    secret_key: str = Field(..., env="SECRET_KEY")
    algorithm: str = Field(default="HS256", env="ALGORITHM")
    access_token_expire_minutes: int = Field(default=30, env="ACCESS_TOKEN_EXPIRE_MINUTES")
    timezone: str = Field(default="America/Santo_Domingo", env="TIMEZONE")
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()