import os
from dotenv import load_dotenv


base_dir = os.path.dirname(os.path.dirname(__file__))
dotenv_path = os.path.join(base_dir, '.env')
load_dotenv(dotenv_path)

DATABASE_URL = os.getenv("DATABASE_URL")