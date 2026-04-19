from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token, create_refresh_token,
    jwt_required, get_jwt_identity
)
from app import db, bcrypt
from app.models.models import User
from app.services.audit_service import log_action
import pyotp
import qrcode
import io
import base64
from datetime import datetime

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username', '').strip()
    password = data.get('password', '')
    totp_code = data.get('totp_code', '')
    
    user = User.query.filter_by(username=username, is_active=True).first()
    
    if not user or not bcrypt.check_password_hash(user.password_hash, password):
        return jsonify({'error': 'Invalid credentials'}), 401
    
    # 2FA check if enabled
    if user.totp_enabled and user.totp_secret:
        if not totp_code:
            return jsonify({'requires_2fa': True, 'message': '2FA code required'}), 200
        totp = pyotp.TOTP(user.totp_secret)
        if not totp.verify(totp_code, valid_window=1):
            return jsonify({'error': 'Invalid 2FA code'}), 401
    
    user.last_login = datetime.utcnow()
    db.session.commit()
    
    access_token = create_access_token(identity=user.id)
    refresh_token = create_refresh_token(identity=user.id)
    
    log_action(user.id, 'LOGIN', 'auth', user.id)
    
    return jsonify({
        'access_token': access_token,
        'refresh_token': refresh_token,
        'user': user.to_dict()
    })

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    user_id = get_jwt_identity()
    access_token = create_access_token(identity=user_id)
    return jsonify({'access_token': access_token})

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def me():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify(user.to_dict())

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    user_id = get_jwt_identity()
    log_action(user_id, 'LOGOUT', 'auth', user_id)
    return jsonify({'message': 'Logged out successfully'})

@auth_bp.route('/setup-2fa', methods=['POST'])
@jwt_required()
def setup_2fa():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user.totp_secret:
        user.totp_secret = pyotp.random_base32()
        db.session.commit()
    
    totp = pyotp.TOTP(user.totp_secret)
    uri = totp.provisioning_uri(name=user.email, issuer_name='FSDS-WeCare')
    
    # Generate QR code
    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data(uri)
    qr.make(fit=True)
    img = qr.make_image(fill_color='black', back_color='white')
    
    buf = io.BytesIO()
    img.save(buf, format='PNG')
    buf.seek(0)
    qr_b64 = base64.b64encode(buf.read()).decode('utf-8')
    
    return jsonify({
        'secret': user.totp_secret,
        'qr_code': qr_b64,
        'uri': uri
    })

@auth_bp.route('/enable-2fa', methods=['POST'])
@jwt_required()
def enable_2fa():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    data = request.get_json()
    code = data.get('code', '')
    
    if not user.totp_secret:
        return jsonify({'error': 'Setup 2FA first'}), 400
    
    totp = pyotp.TOTP(user.totp_secret)
    if not totp.verify(code, valid_window=1):
        return jsonify({'error': 'Invalid code'}), 400
    
    user.totp_enabled = True
    db.session.commit()
    log_action(user_id, 'ENABLE_2FA', 'user', user_id)
    
    return jsonify({'message': '2FA enabled successfully'})

@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    data = request.get_json()
    
    if not bcrypt.check_password_hash(user.password_hash, data.get('current_password', '')):
        return jsonify({'error': 'Current password incorrect'}), 400
    
    new_password = data.get('new_password', '')
    if len(new_password) < 12:
        return jsonify({'error': 'Password must be at least 12 characters'}), 400
    
    user.password_hash = bcrypt.generate_password_hash(new_password).decode('utf-8')
    user.password_changed_at = datetime.utcnow()
    db.session.commit()
    
    log_action(user_id, 'CHANGE_PASSWORD', 'user', user_id)
    return jsonify({'message': 'Password changed successfully'})
