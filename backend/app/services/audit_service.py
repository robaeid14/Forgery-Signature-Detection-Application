from app import db
from app.models.models import AuditLog
from flask import request
from datetime import datetime

def log_action(user_id, action, resource=None, resource_id=None, details=None):
    """Log user action to audit trail per FR-014, NFR-006"""
    try:
        ip = request.remote_addr if request else 'system'
        entry = AuditLog(
            user_id=user_id,
            action=action,
            resource=resource,
            resource_id=resource_id,
            details=details,
            ip_address=ip
        )
        db.session.add(entry)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print(f"[AUDIT] Failed to log: {e}")
