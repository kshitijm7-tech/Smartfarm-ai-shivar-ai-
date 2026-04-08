from app import create_app
from extensions import db
from models import User, Product, FarmRecord

def init_db():
    app = create_app()
    with app.app_context():
        db.create_all()
        print("Database initialized successfully!")

if __name__ == "__main__":
    init_db()
