from app import db
from datetime import datetime
import uuid

def gen_uuid():
    return str(uuid.uuid4())

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.String(36), primary_key=True, default=gen_uuid)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    role = db.Column(db.String(20), nullable=False)  # admin, officer, auditor
    full_name = db.Column(db.String(120), nullable=False)
    branch = db.Column(db.String(80), nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    totp_secret = db.Column(db.String(64), nullable=True)
    totp_enabled = db.Column(db.Boolean, default=False)
    last_login = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    password_changed_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'role': self.role,
            'full_name': self.full_name,
            'branch': self.branch,
            'is_active': self.is_active,
            'totp_enabled': self.totp_enabled,
            'last_login': self.last_login.isoformat() if self.last_login else None,
            'created_at': self.created_at.isoformat()
        }

class Customer(db.Model):
    __tablename__ = 'customers'
    id = db.Column(db.String(36), primary_key=True, default=gen_uuid)
    customer_id = db.Column(db.String(50), unique=True, nullable=False)
    full_name = db.Column(db.String(120), nullable=False)
    account_number = db.Column(db.String(50), unique=True, nullable=False)
    branch = db.Column(db.String(80), nullable=False)
    email = db.Column(db.String(120), nullable=True)
    phone = db.Column(db.String(20), nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    signatures = db.relationship('SignatureReference', backref='customer', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'customer_id': self.customer_id,
            'full_name': self.full_name,
            'account_number': self.account_number,
            'branch': self.branch,
            'email': self.email,
            'phone': self.phone,
            'is_active': self.is_active,
            'signature_count': len(self.signatures),
            'created_at': self.created_at.isoformat()
        }

class SignatureReference(db.Model):
    __tablename__ = 'signature_references'
    id = db.Column(db.String(36), primary_key=True, default=gen_uuid)
    customer_id = db.Column(db.String(36), db.ForeignKey('customers.id'), nullable=False)
    image_path = db.Column(db.String(256), nullable=False)
    image_hash = db.Column(db.String(128), nullable=True)
    features = db.Column(db.Text, nullable=True)  # JSON features
    is_active = db.Column(db.Boolean, default=True)
    added_by = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'customer_id': self.customer_id,
            'image_path': self.image_path,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat()
        }

class VerificationTransaction(db.Model):
    __tablename__ = 'verification_transactions'
    id = db.Column(db.String(36), primary_key=True, default=gen_uuid)
    transaction_id = db.Column(db.String(50), unique=True, nullable=False)
    customer_id = db.Column(db.String(36), db.ForeignKey('customers.id'), nullable=False)
    officer_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    branch = db.Column(db.String(80), nullable=False)
    submitted_image_path = db.Column(db.String(256), nullable=True)
    match_score = db.Column(db.Float, nullable=False, default=0.0)
    classification = db.Column(db.String(30), nullable=False)  # Genuine, Suspected Forgery, Highly Suspicious
    document_type = db.Column(db.String(50), nullable=True)
    notes = db.Column(db.Text, nullable=True)
    processing_time_ms = db.Column(db.Integer, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    customer = db.relationship('Customer', backref='verifications')
    officer = db.relationship('User', backref='verifications')

    def to_dict(self):
        return {
            'id': self.id,
            'transaction_id': self.transaction_id,
            'customer_id': self.customer_id,
            'customer_name': self.customer.full_name if self.customer else None,
            'customer_account': self.customer.account_number if self.customer else None,
            'officer_id': self.officer_id,
            'officer_name': self.officer.full_name if self.officer else None,
            'branch': self.branch,
            'match_score': self.match_score,
            'classification': self.classification,
            'document_type': self.document_type,
            'notes': self.notes,
            'processing_time_ms': self.processing_time_ms,
            'created_at': self.created_at.isoformat()
        }

class AuditLog(db.Model):
    __tablename__ = 'audit_logs'
    id = db.Column(db.String(36), primary_key=True, default=gen_uuid)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=True)
    action = db.Column(db.String(100), nullable=False)
    resource = db.Column(db.String(100), nullable=True)
    resource_id = db.Column(db.String(100), nullable=True)
    details = db.Column(db.Text, nullable=True)
    ip_address = db.Column(db.String(50), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User', backref='audit_logs')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'user_name': self.user.full_name if self.user else 'System',
            'action': self.action,
            'resource': self.resource,
            'resource_id': self.resource_id,
            'details': self.details,
            'ip_address': self.ip_address,
            'created_at': self.created_at.isoformat()
        }

class Alert(db.Model):
    __tablename__ = 'alerts'
    id = db.Column(db.String(36), primary_key=True, default=gen_uuid)
    transaction_id = db.Column(db.String(36), db.ForeignKey('verification_transactions.id'), nullable=True)
    severity = db.Column(db.String(20), nullable=False)  # critical, high, medium
    title = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'transaction_id': self.transaction_id,
            'severity': self.severity,
            'title': self.title,
            'message': self.message,
            'is_read': self.is_read,
            'created_at': self.created_at.isoformat()
        }
