from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.models import VerificationTransaction, Customer, User, Alert
from datetime import datetime, timedelta
from sqlalchemy import func

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/overview', methods=['GET'])
@jwt_required()
def overview():
    """FR-022: Real-time branch-wise verification statistics"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    today = datetime.utcnow().date()
    week_ago = datetime.utcnow() - timedelta(days=7)
    
    base_query = VerificationTransaction.query
    if user.role == 'officer' and user.branch:
        base_query = base_query.filter_by(branch=user.branch)
    
    # Today stats
    today_txns = base_query.filter(
        func.date(VerificationTransaction.created_at) == today
    ).all()
    
    # Last 7 days
    week_txns = base_query.filter(
        VerificationTransaction.created_at >= week_ago
    ).all()
    
    # All time
    all_txns = base_query.all()
    
    # Last 7 days trend
    trend = {}
    for i in range(7):
        d = (datetime.utcnow() - timedelta(days=i)).strftime('%Y-%m-%d')
        trend[d] = {'total': 0, 'genuine': 0, 'suspected': 0, 'highly_suspicious': 0}
    
    for t in week_txns:
        d = t.created_at.strftime('%Y-%m-%d')
        if d in trend:
            trend[d]['total'] += 1
            if t.classification == 'Genuine':
                trend[d]['genuine'] += 1
            elif t.classification == 'Suspected Forgery':
                trend[d]['suspected'] += 1
            else:
                trend[d]['highly_suspicious'] += 1
    
    # Branch stats (FR-022)
    branch_stats = {}
    for t in all_txns:
        b = t.branch or 'Unknown'
        if b not in branch_stats:
            branch_stats[b] = {'total': 0, 'genuine': 0, 'suspected': 0, 'highly_suspicious': 0}
        branch_stats[b]['total'] += 1
        if t.classification == 'Genuine':
            branch_stats[b]['genuine'] += 1
        elif t.classification == 'Suspected Forgery':
            branch_stats[b]['suspected'] += 1
        else:
            branch_stats[b]['highly_suspicious'] += 1
    
    # Unread alerts
    unread_alerts = Alert.query.filter_by(is_read=False).order_by(
        Alert.created_at.desc()
    ).limit(5).all()
    
    total = len(all_txns)
    genuine = sum(1 for t in all_txns if t.classification == 'Genuine')
    suspected = sum(1 for t in all_txns if t.classification == 'Suspected Forgery')
    highly_sus = sum(1 for t in all_txns if t.classification == 'Highly Suspicious')
    
    avg_score = sum(t.match_score for t in all_txns) / total if total else 0
    avg_time = sum(t.processing_time_ms or 0 for t in all_txns) / total if total else 0
    
    # Recent transactions
    recent = base_query.order_by(
        VerificationTransaction.created_at.desc()
    ).limit(10).all()
    
    return jsonify({
        'summary': {
            'total_verifications': total,
            'today_verifications': len(today_txns),
            'genuine_count': genuine,
            'suspected_forgery_count': suspected,
            'highly_suspicious_count': highly_sus,
            'avg_match_score': round(float(avg_score), 2),
            'avg_processing_time_ms': round(float(avg_time), 1),
            'total_customers': Customer.query.count(),
            'total_users': User.query.count(),
            'unread_alerts': Alert.query.filter_by(is_read=False).count()
        },
        'trend_7days': [
            {'date': k, **v} for k, v in sorted(trend.items())
        ],
        'branch_stats': [
            {'branch': k, **v} for k, v in branch_stats.items()
        ],
        'recent_transactions': [t.to_dict() for t in recent],
        'unread_alerts': [a.to_dict() for a in unread_alerts]
    })
