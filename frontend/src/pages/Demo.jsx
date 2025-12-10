import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { FiUpload, FiImage, FiCheckCircle, FiAlertCircle } from 'react-icons/fi'
import './Demo.css'

const Demo = () => {
  const [selectedFile, setSelectedFile] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState(null)

  const handleFileUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
      setSelectedFile(file)
      setResult(null)
    }
  }

  const handleProcess = () => {
    setProcessing(true)
    
    // Simulate AI processing
    setTimeout(() => {
      setResult({
        experimentName: 'RC Circuit Time Constant Experiment',
        objective: 'To study the charging and discharging characteristics of a capacitor in an RC circuit',
        apparatus: ['Resistor (1kΩ)', 'Capacitor (100μF)', 'DC Power Supply', 'Multimeter', 'Breadboard'],
        theory: 'When a capacitor charges through a resistor, the voltage across the capacitor increases exponentially...',
        diagram: 'Generated circuit diagram available',
        simulation: 'Interactive simulation ready',
        vivaQuestions: [
          'What is the time constant of an RC circuit?',
          'How does the capacitor voltage vary with time during charging?',
          'What is the significance of the time constant?'
        ]
      })
      setProcessing(false)
    }, 3000)
  }

  return (
    <div className="demo-page">
      <section className="demo-hero">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="demo-hero-content"
          >
            <h1>Try AISLA Demo</h1>
            <p>
              Upload your experiment manual or image to see AISLA's AI-powered analysis,
              diagram generation, and intelligent insights in action.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="demo-container">
            <motion.div
              className="upload-section"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h2>Upload Experiment</h2>
              <div className="upload-area">
                <input
                  type="file"
                  id="file-upload"
                  accept="image/*,.pdf"
                  onChange={handleFileUpload}
                  hidden
                />
                <label htmlFor="file-upload" className="upload-label">
                  {selectedFile ? (
                    <>
                      <FiCheckCircle size={48} className="upload-icon success" />
                      <p className="file-name">{selectedFile.name}</p>
                      <p className="upload-hint">Click to change file</p>
                    </>
                  ) : (
                    <>
                      <FiUpload size={48} className="upload-icon" />
                      <p>Click to upload or drag and drop</p>
                      <p className="upload-hint">PDF, JPG, PNG up to 10MB</p>
                    </>
                  )}
                </label>
              </div>

              {selectedFile && !processing && !result && (
                <button className="btn-process" onClick={handleProcess}>
                  <FiImage size={20} />
                  Process with AI
                </button>
              )}

              {processing && (
                <div className="processing-indicator">
                  <div className="spinner"></div>
                  <p>AI is analyzing your experiment...</p>
                  <div className="processing-steps">
                    <div className="step active">Extracting text with OCR</div>
                    <div className="step active">Analyzing experiment structure</div>
                    <div className="step">Generating diagrams</div>
                    <div className="step">Creating simulation</div>
                  </div>
                </div>
              )}
            </motion.div>

            {result && (
              <motion.div
                className="result-section"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
              >
                <h2>AI Analysis Results</h2>
                
                <div className="result-card">
                  <h3><FiCheckCircle className="result-icon" /> Experiment Identified</h3>
                  <p className="result-title">{result.experimentName}</p>
                </div>

                <div className="result-card">
                  <h3>Objective</h3>
                  <p>{result.objective}</p>
                </div>

                <div className="result-card">
                  <h3>Apparatus Required</h3>
                  <ul className="apparatus-list">
                    {result.apparatus.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="result-card">
                  <h3>Theory</h3>
                  <p>{result.theory}</p>
                </div>

                <div className="result-card highlight">
                  <h3>Generated Resources</h3>
                  <div className="resources">
                    <div className="resource-item">
                      <FiImage size={24} />
                      <span>Circuit Diagram</span>
                      <button className="btn-view">View</button>
                    </div>
                    <div className="resource-item">
                      <FiImage size={24} />
                      <span>Interactive Simulation</span>
                      <button className="btn-view">Launch</button>
                    </div>
                  </div>
                </div>

                <div className="result-card">
                  <h3>Viva Questions</h3>
                  <ul className="viva-list">
                    {result.vivaQuestions.map((question, index) => (
                      <li key={index}>{question}</li>
                    ))}
                  </ul>
                </div>

                <button className="btn-reset" onClick={() => { setResult(null); setSelectedFile(null); }}>
                  Try Another Experiment
                </button>
              </motion.div>
            )}
          </div>

          {!selectedFile && !result && (
            <div className="demo-features">
              <h2>What AISLA Can Do</h2>
              <div className="demo-features-grid">
                <div className="demo-feature">
                  <FiCheckCircle size={32} />
                  <h3>Instant Analysis</h3>
                  <p>AI-powered OCR and experiment understanding in seconds</p>
                </div>
                <div className="demo-feature">
                  <FiCheckCircle size={32} />
                  <h3>Auto Diagrams</h3>
                  <p>Generate accurate circuit and technical diagrams</p>
                </div>
                <div className="demo-feature">
                  <FiCheckCircle size={32} />
                  <h3>Live Simulation</h3>
                  <p>Interactive simulations for hands-on learning</p>
                </div>
                <div className="demo-feature">
                  <FiCheckCircle size={32} />
                  <h3>Viva Preparation</h3>
                  <p>AI-generated questions and intelligent evaluation</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="demo-note">
        <div className="container">
          <div className="note-content">
            <FiAlertCircle size={24} />
            <p>
              This is a demo version. The full AISLA platform offers more comprehensive features,
              including detailed simulations, complete viva modules, and lab record verification.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Demo
