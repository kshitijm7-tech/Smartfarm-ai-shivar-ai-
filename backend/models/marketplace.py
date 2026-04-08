from datetime import datetime
from ..extensions import db

class Product(db.Model):
    __tablename__ = 'marketplace'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    price = db.Column(db.Float, nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    unit = db.Column(db.String(20), nullable=False, default='kg') # kg, piece, bunch
    image_url = db.Column(db.String(255), nullable=True)
    farmer_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'price': self.price,
            'quantity': self.quantity,
            'unit': self.unit,
            'image_url': self.image_url,
            'farmer_id': self.farmer_id,
            'created_at': self.created_at.isoformat()
        }
