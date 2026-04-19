from app import db, bcrypt
from app.models.models import User, Customer, SignatureReference
from datetime import datetime
import os
import json

def seed_data():
    """Create initial admin user and demo data if not exists"""
    
    # Create admin if not exists
    admin = User.query.filter_by(username='admin').first()
    if not admin:
        admin = User(
            username='admin',
            email='admin@wecare-fsds.com',
            password_hash=bcrypt.generate_password_hash('Admin@123456').decode('utf-8'),
            role='admin',
            full_name='System Administrator',
            branch='Head Office',
            is_active=True,
            totp_enabled=False
        )
        db.session.add(admin)

    # Create demo officer
    officer = User.query.filter_by(username='officer1').first()
    if not officer:
        officer = User(
            username='officer1',
            email='officer1@wecare-fsds.com',
            password_hash=bcrypt.generate_password_hash('Officer@123456').decode('utf-8'),
            role='officer',
            full_name='John Smith',
            branch='Branch A',
            is_active=True,
            totp_enabled=False
        )
        db.session.add(officer)

    # Create demo auditor
    auditor = User.query.filter_by(username='auditor1').first()
    if not auditor:
        auditor = User(
            username='auditor1',
            email='auditor1@wecare-fsds.com',
            password_hash=bcrypt.generate_password_hash('Auditor@123456').decode('utf-8'),
            role='auditor',
            full_name='Jane Doe',
            branch='Head Office',
            is_active=True,
            totp_enabled=False
        )
        db.session.add(auditor)

    # Create sample customers
    if Customer.query.count() == 0:
        branches = ['Branch A', 'Branch B', 'Branch C', 'Head Office']
        names = [
            ('Alice Johnson', 'CUST-001', 'ACC-10001'),
            ('Bob Williams', 'CUST-002', 'ACC-10002'),
            ('Carol Martinez', 'CUST-003', 'ACC-10003'),
            ('David Lee', 'CUST-004', 'ACC-10004'),
            ('Emma Brown', 'CUST-005', 'ACC-10005'),
        ]
        for i, (name, cid, acc) in enumerate(names):
            customer = Customer(
                customer_id=cid,
                full_name=name,
                account_number=acc,
                branch=branches[i % len(branches)],
                email=f'{name.lower().replace(" ", ".")}@example.com',
                phone=f'+880-1700-{10000+i}'
            )
            db.session.add(customer)

    db.session.commit()
    print("[FSDS] Database seeded successfully")
