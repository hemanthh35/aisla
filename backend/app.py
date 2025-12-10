# AISLA Backend - Flask API

from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_pymongo import PyMongo
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

# MongoDB Configuration
app.config["MONGO_URI"] = os.getenv("MONGO_URI", "mongodb://localhost:27017/aisla")
mongo = PyMongo(app)

@app.route('/')
def home():
    return jsonify({
        "message": "Welcome to AISLA API",
        "version": "1.0.0",
        "endpoints": {
            "/api/experiments": "Get all experiments",
            "/api/ocr/analyze": "Analyze experiment image with OCR",
            "/api/diagrams/generate": "Generate circuit diagrams",
            "/api/simulation/run": "Run experiment simulation",
            "/api/viva/questions": "Get viva questions",
            "/api/lab-record/verify": "Verify lab record"
        }
    })

@app.route('/api/health')
def health_check():
    return jsonify({"status": "healthy", "service": "AISLA Backend"})

@app.route('/api/experiments', methods=['GET'])
def get_experiments():
    """Get all experiments from database"""
    try:
        experiments = list(mongo.db.experiments.find({}, {'_id': 0}))
        return jsonify({"experiments": experiments, "count": len(experiments)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/ocr/analyze', methods=['POST'])
def analyze_ocr():
    """Analyze uploaded experiment image with OCR + AI"""
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file uploaded"}), 400
        
        file = request.files['file']
        
        # TODO: Implement Tesseract OCR processing
        # TODO: Implement GPT/Llama AI analysis
        
        # Mock response for now
        result = {
            "experiment_name": "RC Circuit Time Constant",
            "objective": "To study the charging and discharging characteristics",
            "apparatus": ["Resistor", "Capacitor", "Power Supply"],
            "theory": "When a capacitor charges through a resistor...",
            "success": True
        }
        
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/diagrams/generate', methods=['POST'])
def generate_diagram():
    """Generate circuit/reaction diagrams"""
    try:
        data = request.json
        experiment_type = data.get('type', 'electronics')
        
        # TODO: Implement diagram generation logic
        
        return jsonify({
            "diagram_url": "/static/diagrams/sample.png",
            "success": True
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/simulation/run', methods=['POST'])
def run_simulation():
    """Run experiment simulation"""
    try:
        data = request.json
        experiment_id = data.get('experiment_id')
        
        # TODO: Implement simulation engine
        
        return jsonify({
            "simulation_url": "/simulations/rc-circuit",
            "success": True
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/viva/questions', methods=['POST'])
def generate_viva_questions():
    """Generate viva questions for experiment"""
    try:
        data = request.json
        experiment = data.get('experiment')
        difficulty = data.get('difficulty', 'medium')
        
        # TODO: Implement AI question generation
        
        questions = [
            "What is the time constant of an RC circuit?",
            "How does capacitor voltage vary during charging?",
            "What is the significance of the time constant?",
            "Derive the charging equation for RC circuit",
            "What happens to current at t=0 and t=infinity?"
        ]
        
        return jsonify({
            "questions": questions[:3] if difficulty == 'easy' else questions,
            "success": True
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/lab-record/verify', methods=['POST'])
def verify_lab_record():
    """Verify lab record for errors"""
    try:
        data = request.json
        
        # TODO: Implement intelligent verification
        
        return jsonify({
            "errors": [],
            "suggestions": ["Great work! All calculations are correct."],
            "score": 95,
            "success": True
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
