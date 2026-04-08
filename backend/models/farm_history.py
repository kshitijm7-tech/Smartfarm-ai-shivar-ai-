from datetime import datetime
from ..extensions import db

class FarmRecord(db.Model):
    __tablename__ = 'farm_history'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    crop_type = db.Column(db.String(50), nullable=True)
    input_data = db.Column(db.JSON, nullable=True) # Stores parameters like Nitrogen, Ph, etc.
    prediction_result = db.Column(db.String(100), nullable=False)
    prediction_type = db.Column(db.String(50), nullable=False) # crop_recommendation, disease_detection
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'crop_type': self.crop_type,
            'input_data': self.input_data,
            'prediction_result': self.prediction_result,
            'prediction_type': self.prediction_type,
            'created_at': self.created_at.isoformat()
        }
