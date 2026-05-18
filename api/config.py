import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-change-in-production")
    SESSION_COOKIE_DOMAIN = os.environ.get("SESSION_COOKIE_DOMAIN", ".yaasalu.com")
    SESSION_COOKIE_SAMESITE = "Lax"
    SESSION_COOKIE_SECURE = os.environ.get("FLASK_ENV") == "production"

    # PostgreSQL
    DATABASE_URL = os.environ.get("DATABASE_URL", "")

    # MongoDB
    MONGO_URI = os.environ.get("MONGO_URI", "")
    MONGO_DB_NAME = os.environ.get("MONGO_DB_NAME", "yaasalu")

    # Cloudinary
    CLOUDINARY_CLOUD_NAME = os.environ.get("CLOUDINARY_CLOUD_NAME", "")
    CLOUDINARY_API_KEY = os.environ.get("CLOUDINARY_API_KEY", "")
    CLOUDINARY_API_SECRET = os.environ.get("CLOUDINARY_API_SECRET", "")

    # CORS
    CORS_ORIGINS = os.environ.get(
        "CORS_ORIGINS",
        "https://racchabanda.vercel.app,https://racchabanda.yaasalu.com,https://yaasalu.com,http://localhost:3000",
    ).split(",")

    # Pagination
    PAGE_SIZE = 20


class DevelopmentConfig(Config):
    DEBUG = True
    SESSION_COOKIE_SECURE = False
    SESSION_COOKIE_DOMAIN = None


class ProductionConfig(Config):
    DEBUG = False


config = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
    "default": DevelopmentConfig,
}
