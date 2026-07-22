import sys
import os

# Add the backend directory to sys.path so we can import app
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.db import Base, engine
# Import models so Base metadata is populated
from app.models import *

def main():
    print("Applying schema updates to database...")
    Base.metadata.create_all(bind=engine)
    print("Schema applied successfully.")

if __name__ == "__main__":
    main()
