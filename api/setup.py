from setuptools import setup, find_packages

setup(
    name="racchabanda-forum",
    version="0.1.0",
    packages=find_packages(),
    install_requires=[
        "Flask>=3.0.3",
        "flask-cors>=4.0.1",
        "psycopg2-binary>=2.9.9",
        "pymongo>=4.7.2",
        "cloudinary>=1.40.0",
        "python-dotenv>=1.0.1",
    ],
)
