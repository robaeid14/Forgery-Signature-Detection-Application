from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db, bcrypt
from app.models.models import User
from app.services.audit_service import log_action
from functools import wraps

users_bp = Blueprint('users', __name__)

def admin_required(f):
    @wraps(f)
    @jwt_required()
    def decorated(*args, **kwargs):
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        if not user or user.role != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        return f(*args, **kwargs)
    return decorated

@users_bp.route('/', methods=['GET'])
@admin_required
def list_users():
    users = User.query.all()
    return jsonify([u.to_dict() for u in users])

@users_bp.route('/', methods=['POST'])
@admin_required
def create_user():
    admin_id = get_jwt_identity()
    data = request.get_json()
    
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Username already exists'}), 400
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already exists'}), 400
    
    user = User(
        username=data['username'],
        email=data['email'],
        password_hash=bcrypt.generate_password_hash(data['password']).decode('utf-8'),
        role=data['role'],
        full_name=data['full_name'],
        branch=data.get('branch', ''),
        is_active=True
    )
    db.session.add(user)
    db.session.commit()
    
    log_action(admin_id, 'CREATE_USER', 'user', user.id, f'Created user: {user.username}')
    return jsonify(user.to_dict()), 201

@users_bp.route('/<user_id>', methods=['GET'])
@jwt_required()
def get_user(user_id):
    curr_id = get_jwt_identity()
    curr = User.query.get(curr_id)
    if curr.role != 'admin' and curr_id != user_id:
        return jsonify({'error': 'Access denied'}), 403
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify(user.to_dict())

@users_bp.route('/<user_id>', methods=['PUT'])
@admin_required
def update_user(user_id):
    admin_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    user.full_name = data.get('full_name', user.full_name)
    user.email = data.get('email', user.email)
    user.role = data.get('role', user.role)
    user.branch = data.get('branch', user.branch)
    user.is_active = data.get('is_active', user.is_active)
    
    db.session.commit()
    log_action(admin_id, 'UPDATE_USER', 'user', user_id)
    return jsonify(user.to_dict())

@users_bp.route('/<user_id>', methods=['DELETE'])
@admin_required
def delete_user(user_id):
    admin_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    log_action(admin_id, 'DELETE_USER', 'user', user_id, f'Deleted user: {user.username}')
    db.session.delete(user)
    db.session.commit()
    return jsonify({'message': 'User deleted'})

@users_bp.route('/<user_id>/deactivate', methods=['POST'])
@admin_required
def deactivate_user(user_id):
    admin_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    user.is_active = False
    db.session.commit()
    log_action(admin_id, 'DEACTIVATE_USER', 'user', user_id)
    return jsonify({'message': 'User deactivated'})

@users_bp.route('/branches', methods=['GET'])
@jwt_required()
def get_branches():
    branches = db.session.query(User.branch).distinct().filter(User.branch != None).all()
    return jsonify([b[0] for b in branches if b[0]])
