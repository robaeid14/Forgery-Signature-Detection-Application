from app import create_app
import os

app = create_app('development')

if __name__ == '__main__':
    # Ensure required directories exist
    for folder in ['uploads/signatures/references', 'uploads/signatures/submissions', 'reports']:
        os.makedirs(os.path.join(os.path.dirname(__file__), folder), exist_ok=True)
    
    print("=" * 60)
    print("  FSDS - Forgery Signature Detection System")
    print("  WeCare Software Solutions LTD.")
    print("  Backend API Server v1.0")
    print("=" * 60)
    print(f"  Server: http://127.0.0.1:5000")
    print(f"  Default Admin: admin / Admin@123456")
    print(f"  Default Officer: officer1 / Officer@123456")
    print(f"  Default Auditor: auditor1 / Auditor@123456")
    print("=" * 60)
    
    app.run(host='127.0.0.1', port=5000, debug=True)
