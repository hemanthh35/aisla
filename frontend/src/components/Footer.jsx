import React from 'react'
import { Link } from 'react-router-dom'
import { FiGithub, FiLinkedin, FiMail, FiTwitter } from 'react-icons/fi'
import './Footer.css'

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h3 className="footer-logo">AISLA</h3>
            <p className="footer-desc">
              AI Self-Learning Lab Assistant - Revolutionizing laboratory education through intelligent automation and personalized learning.
            </p>
            <div className="social-links">
              <a href="https://github.com/hemanthh35/lab" target="_blank" rel="noopener noreferrer" className="social-link">
                <FiGithub size={20} />
              </a>
              <a href="#" className="social-link">
                <FiLinkedin size={20} />
              </a>
              <a href="#" className="social-link">
                <FiTwitter size={20} />
              </a>
              <a href="mailto:info@aisla.com" className="social-link">
                <FiMail size={20} />
              </a>
            </div>
          </div>

          <div className="footer-section">
            <h4 className="footer-title">Quick Links</h4>
            <ul className="footer-links">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/about">About</Link></li>
              <li><Link to="/features">Features</Link></li>
              <li><Link to="/demo">Demo</Link></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4 className="footer-title">Features</h4>
            <ul className="footer-links">
              <li><Link to="/features">OCR + AI Analysis</Link></li>
              <li><Link to="/features">Auto Diagrams</Link></li>
              <li><Link to="/features">Simulations</Link></li>
              <li><Link to="/features">Viva Assistant</Link></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4 className="footer-title">Contact</h4>
            <ul className="footer-links">
              <li><Link to="/contact">Get in Touch</Link></li>
              <li><a href="mailto:info@aisla.com">info@aisla.com</a></li>
              <li><a href="tel:+1234567890">+1 (234) 567-890</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; 2025 AISLA. All rights reserved.</p>
          <div className="footer-bottom-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
