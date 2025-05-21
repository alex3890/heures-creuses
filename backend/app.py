from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
app.config['SECRET_KEY'] = 'your_secret_key'  # Replace with a real secret key
db = SQLAlchemy(app)
login_manager = LoginManager()
login_manager.init_app(app)

class User(UserMixin, db.Model):
    __tablename__ = 'users'  # Explicitly naming the table
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(120), nullable=False)
    heures_creuses = db.relationship('HeuresCreuses', backref='user', lazy=True)
    appliances = db.relationship('Appliance', backref='user', lazy=True) # New relationship

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class HeuresCreuses(db.Model):
    __tablename__ = 'heures_creuses' # Explicitly naming the table
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    nom = db.Column(db.String(100), nullable=False)
    debut = db.Column(db.String(5), nullable=False)  # HH:MM
    fin = db.Column(db.String(5), nullable=False)    # HH:MM

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'nom': self.nom,
            'debut': self.debut,
            'fin': self.fin
        }

class Appliance(db.Model):
    __tablename__ = 'appliances'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    nom = db.Column(db.String(100), nullable=False)
    duree = db.Column(db.Integer, nullable=False)  # in minutes
    type = db.Column(db.String(10), nullable=False) # "debut" or "fin"
    pas = db.Column(db.Integer, nullable=False) # in minutes

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'nom': self.nom,
            'duree': self.duree,
            'type': self.type,
            'pas': self.pas
        }

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

@app.before_first_request
def create_tables():
    db.create_all()

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'message': 'Username and password are required'}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({'message': 'Username already exists'}), 400

    user = User(username=username)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()
    return jsonify({'message': 'User registered successfully'}), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    user = User.query.filter_by(username=username).first()

    if user is None or not user.check_password(password):
        return jsonify({'message': 'Invalid username or password'}), 401

    login_user(user)
    return jsonify({'message': 'Logged in successfully', 'user': {'username': user.username, 'id': user.id}}), 200

@app.route('/api/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    return jsonify({'message': 'Logged out successfully'}), 200

@app.route('/api/current_user')
@login_required
def get_current_user():
    return jsonify({'username': current_user.username, 'id': current_user.id}), 200

# --- Heures Creuses CRUD Endpoints ---

def is_valid_time_format(time_str):
    import re
    return bool(re.match(r'^\d{2}:\d{2}$', time_str))

@app.route('/api/heures_creuses', methods=['POST'])
@login_required
def create_heures_creuses():
    data = request.get_json()
    nom = data.get('nom')
    debut = data.get('debut')
    fin = data.get('fin')

    if not all([nom, debut, fin]):
        return jsonify({'message': 'Missing required fields (nom, debut, fin)'}), 400

    if not is_valid_time_format(debut) or not is_valid_time_format(fin):
        return jsonify({'message': 'Invalid time format. Please use HH:MM'}), 400

    hc = HeuresCreuses(
        user_id=current_user.id,
        nom=nom,
        debut=debut,
        fin=fin
    )
    db.session.add(hc)
    db.session.commit()
    return jsonify({'message': 'HeuresCreuses entry created successfully', 'entry': hc.to_dict()}), 201

@app.route('/api/heures_creuses', methods=['GET'])
@login_required
def get_heures_creuses():
    user_hcs = HeuresCreuses.query.filter_by(user_id=current_user.id).all()
    return jsonify([hc.to_dict() for hc in user_hcs]), 200

@app.route('/api/heures_creuses/<int:hc_id>', methods=['PUT'])
@login_required
def update_heures_creuses(hc_id):
    hc = HeuresCreuses.query.get(hc_id)
    if not hc:
        return jsonify({'message': 'Entry not found'}), 404
    if hc.user_id != current_user.id:
        return jsonify({'message': 'Unauthorized'}), 403

    data = request.get_json()
    nom = data.get('nom')
    debut = data.get('debut')
    fin = data.get('fin')

    if not all([nom, debut, fin]):
        return jsonify({'message': 'Missing required fields (nom, debut, fin)'}), 400

    if not is_valid_time_format(debut) or not is_valid_time_format(fin):
        return jsonify({'message': 'Invalid time format. Please use HH:MM'}), 400

    hc.nom = nom
    hc.debut = debut
    hc.fin = fin
    db.session.commit()
    return jsonify({'message': 'HeuresCreuses entry updated successfully', 'entry': hc.to_dict()}), 200

@app.route('/api/heures_creuses/<int:hc_id>', methods=['DELETE'])
@login_required
def delete_heures_creuses(hc_id):
    hc = HeuresCreuses.query.get(hc_id)
    if not hc:
        return jsonify({'message': 'Entry not found'}), 404
    if hc.user_id != current_user.id:
        return jsonify({'message': 'Unauthorized'}), 403

    db.session.delete(hc)
    db.session.commit()
    return jsonify({'message': 'HeuresCreuses entry deleted successfully', 'deleted_id': hc_id}), 200

# --- Appliance CRUD Endpoints ---

@app.route('/api/appliances', methods=['POST'])
@login_required
def create_appliance():
    data = request.get_json()
    nom = data.get('nom')
    duree = data.get('duree')
    type = data.get('type')
    pas = data.get('pas')

    if not all([nom, isinstance(duree, int), type, isinstance(pas, int)]):
        return jsonify({'message': 'Missing or invalid type for required fields (nom, duree(int), type, pas(int))'}), 400
    
    if duree <= 0 or pas <= 0:
        return jsonify({'message': 'duree and pas must be positive integers'}), 400
    
    if type not in ["debut", "fin"]:
        return jsonify({'message': 'type must be "debut" or "fin"'}), 400

    appliance = Appliance(
        user_id=current_user.id,
        nom=nom,
        duree=duree,
        type=type,
        pas=pas
    )
    db.session.add(appliance)
    db.session.commit()
    return jsonify({'message': 'Appliance created successfully', 'appliance': appliance.to_dict()}), 201

@app.route('/api/appliances', methods=['GET'])
@login_required
def get_appliances():
    user_appliances = Appliance.query.filter_by(user_id=current_user.id).all()
    return jsonify([appliance.to_dict() for appliance in user_appliances]), 200

@app.route('/api/appliances/<int:appliance_id>', methods=['PUT'])
@login_required
def update_appliance(appliance_id):
    appliance = Appliance.query.get(appliance_id)
    if not appliance:
        return jsonify({'message': 'Appliance not found'}), 404
    if appliance.user_id != current_user.id:
        return jsonify({'message': 'Unauthorized'}), 403

    data = request.get_json()
    nom = data.get('nom')
    duree = data.get('duree')
    type = data.get('type')
    pas = data.get('pas')

    if not all([nom, isinstance(duree, int), type, isinstance(pas, int)]):
        return jsonify({'message': 'Missing or invalid type for required fields (nom, duree(int), type, pas(int))'}), 400

    if duree <= 0 or pas <= 0:
        return jsonify({'message': 'duree and pas must be positive integers'}), 400
    
    if type not in ["debut", "fin"]:
        return jsonify({'message': 'type must be "debut" or "fin"'}), 400

    appliance.nom = nom
    appliance.duree = duree
    appliance.type = type
    appliance.pas = pas
    db.session.commit()
    return jsonify({'message': 'Appliance updated successfully', 'appliance': appliance.to_dict()}), 200

@app.route('/api/appliances/<int:appliance_id>', methods=['DELETE'])
@login_required
def delete_appliance(appliance_id):
    appliance = Appliance.query.get(appliance_id)
    if not appliance:
        return jsonify({'message': 'Appliance not found'}), 404
    if appliance.user_id != current_user.id:
        return jsonify({'message': 'Unauthorized'}), 403

    db.session.delete(appliance)
    db.session.commit()
    return jsonify({'message': 'Appliance deleted successfully', 'deleted_id': appliance_id}), 200

@app.route('/api/health')
def health_check():
    return jsonify({'status': 'ok'})

if __name__ == '__main__':
    app.run(debug=True)
