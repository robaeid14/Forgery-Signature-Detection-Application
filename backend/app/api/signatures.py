from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.models import Customer, SignatureReference, User
from app.services.detection_engine import detection_engine
from app.services.audit_service import log_action
import os, uuid, base64

signatures_bp = Blueprint('signatures', __name__)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in current_app.config['ALLOWED_EXTENSIONS']

# ---- Customers ----

@signatures_bp.route('/customers', methods=['GET'])
@jwt_required()
def list_customers():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    query = Customer.query
    if user.role == 'officer' and user.branch:
        query = query.filter_by(branch=user.branch)
    search = request.args.get('search', '')
    if search:
        query = query.filter(
            (Customer.full_name.ilike(f'%{search}%')) |
            (Customer.customer_id.ilike(f'%{search}%')) |
            (Customer.account_number.ilike(f'%{search}%'))
        )
    customers = query.all()
    return jsonify([c.to_dict() for c in customers])

@signatures_bp.route('/customers', methods=['POST'])
@jwt_required()
def create_customer():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if user.role not in ['admin', 'officer']:
        return jsonify({'error': 'Access denied'}), 403
    
    data = request.get_json()
    if Customer.query.filter_by(account_number=data['account_number']).first():
        return jsonify({'error': 'Account number already exists'}), 400
    
    customer = Customer(
        customer_id=data.get('customer_id', f'CUST-{str(uuid.uuid4())[:8].upper()}'),
        full_name=data['full_name'],
        account_number=data['account_number'],
        branch=data.get('branch', user.branch or ''),
        email=data.get('email', ''),
        phone=data.get('phone', '')
    )
    db.session.add(customer)
    db.session.commit()
    log_action(user_id, 'CREATE_CUSTOMER', 'customer', customer.id)
    return jsonify(customer.to_dict()), 201

@signatures_bp.route('/customers/<cid>', methods=['GET'])
@jwt_required()
def get_customer(cid):
    customer = Customer.query.get(cid)
    if not customer:
        return jsonify({'error': 'Customer not found'}), 404
    result = customer.to_dict()
    result['signatures'] = [s.to_dict() for s in customer.signatures if s.is_active]
    return jsonify(result)


@signatures_bp.route('/customers/<cid>', methods=['PUT'])
@jwt_required()
def update_customer(cid):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if user.role not in ['admin', 'officer']:
        return jsonify({'error': 'Access denied'}), 403
    customer = Customer.query.get(cid)
    if not customer:
        return jsonify({'error': 'Customer not found'}), 404
    data = request.get_json()
    customer.full_name      = data.get('full_name', customer.full_name)
    customer.account_number = data.get('account_number', customer.account_number)
    customer.branch         = data.get('branch', customer.branch)
    customer.email          = data.get('email', customer.email)
    customer.phone          = data.get('phone', customer.phone)
    customer.is_active      = data.get('is_active', customer.is_active)
    db.session.commit()
    log_action(user_id, 'UPDATE_CUSTOMER', 'customer', cid)
    return jsonify(customer.to_dict())

@signatures_bp.route('/customers/<cid>', methods=['DELETE'])
@jwt_required()
def delete_customer(cid):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if user.role != 'admin':
        return jsonify({'error': 'Admin only'}), 403
    customer = Customer.query.get(cid)
    if not customer:
        return jsonify({'error': 'Customer not found'}), 404
    # Soft-delete: mark inactive
    customer.is_active = False
    db.session.commit()
    log_action(user_id, 'DELETE_CUSTOMER', 'customer', cid,
               f'Soft-deleted customer: {customer.full_name}')
    return jsonify({'message': f'Customer {customer.full_name} deactivated'})

# ---- Signature References ----

@signatures_bp.route('/customers/<cid>/references', methods=['POST'])
@jwt_required()
def add_reference(cid):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if user.role not in ['admin', 'officer']:
        return jsonify({'error': 'Access denied'}), 403
    
    customer = Customer.query.get(cid)
    if not customer:
        return jsonify({'error': 'Customer not found'}), 404
    
    image_data = None
    
    # Support file upload
    if 'file' in request.files:
        file = request.files['file']
        if file and allowed_file(file.filename):
            image_data = file.read()
    
    # Support base64 JSON upload (pen tablet / canvas)
    elif request.is_json:
        data = request.get_json()
        b64 = data.get('image_base64', '')
        if b64:
            if ',' in b64:
                b64 = b64.split(',')[1]
            image_data = base64.b64decode(b64)
    
    if not image_data:
        return jsonify({'error': 'No valid image provided'}), 400
    
    folder = os.path.join(current_app.config['UPLOAD_FOLDER'], 'references', cid)
    filename = f'ref_{uuid.uuid4().hex}.png'
    filepath = detection_engine.save_image(image_data, folder, filename)
    
    ref = SignatureReference(
        customer_id=cid,
        image_path=filepath,
        image_hash=detection_engine.compute_hash(image_data),
        added_by=user_id
    )
    db.session.add(ref)
    db.session.commit()
    
    log_action(user_id, 'ADD_SIGNATURE_REFERENCE', 'signature', ref.id, f'Customer: {customer.full_name}')
    return jsonify(ref.to_dict()), 201

@signatures_bp.route('/references/<rid>/image', methods=['GET'])
@jwt_required()
def get_reference_image(rid):
    ref = SignatureReference.query.get(rid)
    if not ref:
        return jsonify({'error': 'Not found'}), 404
    b64 = detection_engine.image_to_base64(ref.image_path)
    return jsonify({'image_base64': b64})

@signatures_bp.route('/references/<rid>', methods=['DELETE'])
@jwt_required()
def delete_reference(rid):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if user.role != 'admin':
        return jsonify({'error': 'Admin only'}), 403
    
    ref = SignatureReference.query.get(rid)
    if not ref:
        return jsonify({'error': 'Not found'}), 404
    
    ref.is_active = False
    db.session.commit()
    log_action(user_id, 'DELETE_SIGNATURE_REFERENCE', 'signature', rid)
    return jsonify({'message': 'Reference deactivated'})
