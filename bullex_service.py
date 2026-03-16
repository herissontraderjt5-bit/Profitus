from flask import Flask, request, jsonify
from flask_cors import CORS
import sys
import os

# Ensure the bullexapi package can be imported from the current directory
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from bullexapi.stable_api import Bullex

app = Flask(__name__)
CORS(app)

# Store instances in memory for simplicity. In production, consider Redis or database.
# Key: email
sessions = {}

@app.route('/api/bullex/connect', methods=['POST'])
def connect():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({'success': False, 'message': 'Email and password are required'}), 400
        
    try:
        api = Bullex(email, password)
        status, message = api.connect()
        
        if status:
            sessions[email] = api
            return jsonify({'success': True, 'message': 'Connected successfully'})
        else:
            return jsonify({'success': False, 'message': str(message)}), 401
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/bullex/balance', methods=['GET'])
def get_balance():
    email = request.args.get('email')
    account_type = request.args.get('type') # 'REAL' or 'PRACTICE'
    
    if not email or email not in sessions:
        return jsonify({'success': False, 'message': 'Not connected'}), 401
        
    api = sessions[email]
    
    try:
        if account_type:
            api.change_balance(account_type.upper())
            
        balance = api.get_balance()
        current_mode = api.get_balance_mode()
        
        return jsonify({
            'success': True, 
            'balance': balance,
            'mode': current_mode
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/bullex/assets', methods=['GET'])
def get_assets():
    email = request.args.get('email')
    if not email or email not in sessions:
        return jsonify({'success': False, 'message': 'Not connected'}), 401
        
    api = sessions[email]
    try:
        api.update_ACTIVES_OPCODE()
        assets = api.get_all_ACTIVES_OPCODE()
        # Filter mostly interesting assets or return all
        return jsonify({'success': True, 'assets': list(assets.keys())[:50]}) # Limit to 50 for performance
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/bullex/trade', methods=['POST'])
def trade():
    data = request.json
    email = data.get('email')
    asset = data.get('asset')
    action = data.get('action') # 'call' or 'put'
    amount = data.get('amount')
    duration = data.get('duration', 1)
    
    if not email or email not in sessions:
        return jsonify({'success': False, 'message': 'Not connected'}), 401
        
    api = sessions[email]
    
    try:
        status, order_id = api.buy(int(amount), asset, action, int(duration))
        if status:
            # Optionally, we could wait for the result here, but since trades take minutes, it's better to verify asynchronously in a real app.
            # For simplicity, we just return the order_id.
            return jsonify({'success': True, 'order_id': order_id, 'message': 'Trade executed'})
        else:
            return jsonify({'success': False, 'message': 'Failed to execute trade'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


if __name__ == '__main__':
    print("Starting Bullex Service...")
    app.run(host='127.0.0.1', port=5000)
