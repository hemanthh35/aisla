# AISLA Backend API

Flask backend for AISLA - AI Self-Learning Lab Assistant

## Setup

1. Create virtual environment:
```bash
python -m venv venv
```

2. Activate virtual environment:
```bash
# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create `.env` file from `.env.example` and configure your settings

5. Run the application:
```bash
python app.py
```

The API will be available at `http://localhost:5000`

## API Endpoints

- `GET /` - API information
- `GET /api/health` - Health check
- `GET /api/experiments` - Get all experiments
- `POST /api/ocr/analyze` - Analyze experiment with OCR
- `POST /api/diagrams/generate` - Generate diagrams
- `POST /api/simulation/run` - Run simulation
- `POST /api/viva/questions` - Generate viva questions
- `POST /api/lab-record/verify` - Verify lab record

## Technologies

- Flask - Web framework
- MongoDB - Database
- Tesseract - OCR engine
- OpenAI GPT - AI analysis
- Flask-CORS - Cross-origin requests
