from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.models import (
    VerificationTransaction, Customer, SignatureReference, 
    User, Alert
)
from app.services.detection_engine import detection_engine
from app.services.audit_service import log_action
import os, uuid, base64
from datetime import datetime, timedelta

verifications_bp = Blueprint('verifications', __name__)

def generate_transaction_id():
    now = datetime.utcnow()
    return f"TXN-{now.strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"

@verifications_bp.route('/verify', methods=['POST'])
@jwt_required()
def verify_signature():
    """
    Core verification endpoint per FR-007 through FR-014
    Supports file upload, base64 (pen tablet/canvas input)
    """
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if user.role not in ['admin', 'officer']:
        return jsonify({'error': 'Access denied'}), 403
    
    customer_id = None
    image_data = None
    document_type = 'Unknown'
    notes = ''
    
    # Handle multipart file upload
    if request.content_type and 'multipart' in request.content_type:
        customer_id = request.form.get('customer_id')
        document_type = request.form.get('document_type', 'Unknown')
        notes = request.form.get('notes', '')
        
        if 'file' in request.files:
            file = request.files['file']
            image_data = file.read()
    
    # Handle JSON with base64 (pen tablet canvas)
    elif request.is_json:
        data = request.get_json()
        customer_id = data.get('customer_id')
        document_type = data.get('document_type', 'Unknown')
        notes = data.get('notes', '')
        b64 = data.get('image_base64', '')
        if b64:
            if ',' in b64:
                b64 = b64.split(',')[1]
            image_data = base64.b64decode(b64)
    
    if not customer_id:
        return jsonify({'error': 'Customer ID required'}), 400
    if not image_data:
        return jsonify({'error': 'Signature image required'}), 400
    
    customer = Customer.query.get(customer_id)
    if not customer:
        return jsonify({'error': 'Customer not found'}), 404
    
    # Load reference signatures
    references = SignatureReference.query.filter_by(
        customer_id=customer_id, is_active=True
    ).all()
    
    ref_data = []
    for ref in references:
        try:
            img_bytes = detection_engine.load_image_from_path(ref.image_path)
            ref_data.append({'id': ref.id, 'data': img_bytes})
        except:
            pass
    
    # Run detection engine (FR-009, FR-011)
    result = detection_engine.verify(image_data, ref_data)
    
    # Save submitted image
    folder = os.path.join(current_app.config['UPLOAD_FOLDER'], 'submissions', customer_id)
    filename = f'submit_{uuid.uuid4().hex}.png'
    try:
        filepath = detection_engine.save_image(image_data, folder, filename)
    except:
        filepath = None
    
    # Create transaction record (FR-014)
    txn = VerificationTransaction(
        transaction_id=generate_transaction_id(),
        customer_id=customer_id,
        officer_id=user_id,
        branch=user.branch or customer.branch,
        submitted_image_path=filepath,
        match_score=result['match_score'],
        classification=result['classification'],
        document_type=document_type,
        notes=notes,
        processing_time_ms=result.get('processing_time_ms', 0)
    )
    db.session.add(txn)
    db.session.flush()
    
    # Create alert for suspicious verifications (FR-024)
    if result['classification'] == 'Highly Suspicious':
        alert = Alert(
            transaction_id=txn.id,
            severity='critical',
            title='Highly Suspicious Signature Detected',
            message=f'Transaction {txn.transaction_id}: Customer {customer.full_name} '
                    f'(Account: {customer.account_number}) — Score: {result["match_score"]:.1f}%'
        )
        db.session.add(alert)
    elif result['classification'] == 'Suspected Forgery':
        alert = Alert(
            transaction_id=txn.id,
            severity='high',
            title='Suspected Forgery Detected',
            message=f'Transaction {txn.transaction_id}: Customer {customer.full_name} '
                    f'— Score: {result["match_score"]:.1f}%'
        )
        db.session.add(alert)
    
    db.session.commit()
    log_action(user_id, 'VERIFY_SIGNATURE', 'verification', txn.id, 
               f'Customer: {customer.full_name}, Score: {result["match_score"]}%, '
               f'Result: {result["classification"]}')
    
    # Return full result
    response = txn.to_dict()
    response['individual_scores']  = result.get('individual_scores', [])
    response['component_scores']   = result.get('component_scores', {})
    response['references_checked'] = result.get('references_checked', 0)
    response['model_backend']      = result.get('model_backend', 'unknown')
    response['submitted_image']    = detection_engine.image_to_base64(filepath) if filepath else ''
    
    return jsonify(response), 201

@verifications_bp.route('/', methods=['GET'])
@jwt_required()
def list_verifications():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    query = VerificationTransaction.query.order_by(
        VerificationTransaction.created_at.desc()
    )
    
    if user.role == 'officer':
        query = query.filter_by(branch=user.branch)
    
    # Filters
    classification = request.args.get('classification')
    if classification:
        query = query.filter_by(classification=classification)
    
    customer_search = request.args.get('customer')
    if customer_search:
        query = query.join(Customer).filter(
            (Customer.full_name.ilike(f'%{customer_search}%')) |
            (Customer.account_number.ilike(f'%{customer_search}%'))
        )
    
    limit = int(request.args.get('limit', 50))
    txns = query.limit(limit).all()
    return jsonify([t.to_dict() for t in txns])

@verifications_bp.route('/<txn_id>', methods=['GET'])
@jwt_required()
def get_verification(txn_id):
    txn = VerificationTransaction.query.get(txn_id)
    if not txn:
        txn = VerificationTransaction.query.filter_by(transaction_id=txn_id).first()
    if not txn:
        return jsonify({'error': 'Not found'}), 404
    
    result = txn.to_dict()
    if txn.submitted_image_path:
        result['submitted_image'] = detection_engine.image_to_base64(txn.submitted_image_path)
    return jsonify(result)

@verifications_bp.route('/alerts', methods=['GET'])
@jwt_required()
def get_alerts():
    alerts = Alert.query.order_by(Alert.created_at.desc()).limit(50).all()
    return jsonify([a.to_dict() for a in alerts])

@verifications_bp.route('/alerts/<alert_id>/read', methods=['POST'])
@jwt_required()
def mark_alert_read(alert_id):
    alert = Alert.query.get(alert_id)
    if alert:
        alert.is_read = True
        db.session.commit()
    return jsonify({'message': 'Marked as read'})

@verifications_bp.route('/stats/summary', methods=['GET'])
@jwt_required()
def stats_summary():
    """Quick stats for dashboard widgets"""
    from sqlalchemy import func
    
    today = datetime.utcnow().date()
    
    total = VerificationTransaction.query.count()
    today_count = VerificationTransaction.query.filter(
        db.func.date(VerificationTransaction.created_at) == today
    ).count()
    
    genuine = VerificationTransaction.query.filter_by(classification='Genuine').count()
    suspected = VerificationTransaction.query.filter_by(classification='Suspected Forgery').count()
    highly_sus = VerificationTransaction.query.filter_by(classification='Highly Suspicious').count()
    
    unread_alerts = Alert.query.filter_by(is_read=False).count()
    
    avg_score = db.session.query(func.avg(VerificationTransaction.match_score)).scalar() or 0
    avg_time = db.session.query(func.avg(VerificationTransaction.processing_time_ms)).scalar() or 0
    
    return jsonify({
        'total_verifications': total,
        'today_verifications': today_count,
        'genuine_count': genuine,
        'suspected_forgery_count': suspected,
        'highly_suspicious_count': highly_sus,
        'unread_alerts': unread_alerts,
        'avg_match_score': round(float(avg_score), 2),
        'avg_processing_time_ms': round(float(avg_time), 1)
    })
