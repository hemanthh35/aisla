# AISLA - AI Self-Learning Lab Assistant

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![Flask](https://img.shields.io/badge/Flask-3.0+-green.svg)](https://flask.palletsprojects.com/)

**Transform Your Lab Learning with AI Intelligence**

AISLA is an intelligent platform that revolutionizes laboratory education through automated experiment understanding, real-time simulations, and personalized learning support for engineering and science students.

## 🚀 Features

- **OCR + AI Analysis**: Advanced text extraction and intelligent experiment understanding
- **Auto Diagram Generation**: Automatically create circuits, reaction diagrams, and technical illustrations
- **Live Simulations**: Interactive simulations for physics, chemistry, electronics, and mechanical experiments
- **Lab Record Verification**: Intelligent checking of formulas, calculations, and theoretical explanations
- **Smart Viva Assistant**: AI-powered viva preparation with intelligent Q&A evaluation
- **Multi-Disciplinary Support**: Comprehensive coverage across all major disciplines

## 🎯 Problem Statement

Laboratory sessions are essential for engineering and science education, but challenges such as:
- Incomplete understanding of experiments
- Difficulty visualizing complex concepts
- Dependency on limited faculty time
- Incorrect lab records
- Lack of personalized support

...affect learning outcomes. AISLA aims to bridge this gap.

## 🛠️ Tech Stack

### Frontend
- React 18+
- React Router
- Framer Motion (Animations)
- React Icons
- Vite (Build tool)

### Backend
- Flask / FastAPI
- MongoDB / Firebase
- Tesseract OCR
- OpenAI GPT-4 / Llama 3
- Python 3.9+

## 📦 Installation

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:3000`

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

The backend API will be available at `http://localhost:5000`

## 🌐 Project Structure

```
aisla/
├── frontend/                # React frontend application
│   ├── src/
│   │   ├── components/     # Reusable components (Navbar, Footer)
│   │   ├── pages/          # Page components (Home, About, Features, etc.)
│   │   ├── App.jsx         # Main app component
│   │   └── main.jsx        # Entry point
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── backend/                 # Flask backend API
│   ├── app.py              # Main Flask application
│   ├── requirements.txt    # Python dependencies
│   ├── .env.example        # Environment variables template
│   └── README.md
│
└── README.md               # This file
```

## 🎨 Key Pages

1. **Home** - Landing page with hero section, features, and statistics
2. **About** - Mission, values, team, and impact
3. **Features** - Detailed feature showcase with tech stack
4. **Demo** - Interactive demo with file upload and AI analysis
5. **Contact** - Contact form and FAQ section

## 🚀 Features in Detail

### Experiment Understanding Module
- Extracts text from images using OCR
- Identifies experiment type and objectives
- Generates structured output with AI

### Diagram Generator Module
- Auto-creates circuit diagrams
- Chemical reaction visualizations
- Physics vector diagrams
- Interactive graphs

### Simulation Module
- Electronics circuit simulations
- Physics experiments
- Chemistry reactions
- Mechanical concepts

### Lab Record Evaluation
- Formula validation
- Calculation verification
- Diagram accuracy check
- Theory assessment

### Viva Assistant
- Generates relevant questions
- Evaluates student answers
- Provides personalized feedback
- Adapts difficulty level

## 👥 Team

- **AI Lead** - Sheshank (Machine Learning & NLP)
- **Full Stack Developer** - Hemanth (MERN Stack)
- **Simulation Specialist** - Team Member
- **Faculty Mentor** - Dr. Advisor

## 🎯 Expected Outcomes

- Students can learn independently
- Simulate experiments safely
- Prepare effectively for viva
- Avoid calculation errors
- Study remotely with full support
- Improved learning outcomes for colleges

## 🔮 Future Scope

- VR/AR laboratory experiences
- Comprehensive experiment library
- Multi-language support
- LMS integration
- Automatic grading system
- Industry training modules

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Contact

- Email: info@aisla.com
- GitHub: [hemanthh35/lab](https://github.com/hemanthh35/lab)
- Website: Coming soon

## 🌟 Acknowledgments

- GITAM University
- All contributors and supporters
- Open source community

---

**Made with ❤️ by Team AISLA**
