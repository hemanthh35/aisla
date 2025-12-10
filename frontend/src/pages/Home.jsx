import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  FiCpu, FiImage, FiActivity, FiCheckCircle, 
  FiBook, FiMessageCircle, FiZap, FiUsers,
  FiArrowRight, FiPlay
} from 'react-icons/fi'
import './Home.css'

const Home = () => {
  const features = [
    {
      icon: <FiCpu />,
      title: 'OCR + AI Analysis',
      description: 'Advanced text extraction and intelligent experiment understanding using cutting-edge AI'
    },
    {
      icon: <FiImage />,
      title: 'Auto Diagram Generation',
      description: 'Automatically create circuits, reaction diagrams, and technical illustrations'
    },
    {
      icon: <FiActivity />,
      title: 'Live Simulations',
      description: 'Interactive simulations for physics, chemistry, electronics, and mechanical experiments'
    },
    {
      icon: <FiCheckCircle />,
      title: 'Lab Record Verification',
      description: 'Intelligent checking of formulas, calculations, and theoretical explanations'
    },
    {
      icon: <FiBook />,
      title: 'Smart Learning',
      description: 'Personalized learning paths and adaptive content for each student'
    },
    {
      icon: <FiMessageCircle />,
      title: 'Viva Assistant',
      description: 'AI-powered viva preparation with intelligent Q&A evaluation'
    }
  ]

  const stats = [
    { number: '10k+', label: 'Active Users' },
    { number: '500+', label: 'Experiments' },
    { number: '95%', label: 'Success Rate' },
    { number: '24/7', label: 'Available' }
  ]

  const disciplines = [
    { name: 'Physics', color: '#667eea' },
    { name: 'Chemistry', color: '#f093fb' },
    { name: 'Electronics', color: '#4facfe' },
    { name: 'Mechanical', color: '#43e97b' },
    { name: 'Computer Science', color: '#fa709a' }
  ]

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <motion.div 
            className="hero-content"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="hero-badge">
              <FiZap size={16} />
              <span>AI-Powered Lab Education Platform</span>
            </div>
            
            <h1 className="hero-title">
              Transform Your Lab Learning with
              <span className="gradient-text"> AI Intelligence</span>
            </h1>
            
            <p className="hero-subtitle">
              AISLA revolutionizes laboratory education through automated experiment understanding,
              real-time simulations, and personalized learning support for engineering and science students.
            </p>
            
            <div className="hero-buttons">
              <Link to="/demo" className="btn-hero-primary">
                <FiPlay size={20} />
                Try Live Demo
              </Link>
              <Link to="/features" className="btn-hero-secondary">
                Explore Features
                <FiArrowRight size={20} />
              </Link>
            </div>

            <div className="hero-stats">
              {stats.map((stat, index) => (
                <motion.div 
                  key={index}
                  className="stat-item"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 * index, duration: 0.5 }}
                >
                  <h3>{stat.number}</h3>
                  <p>{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div 
            className="hero-visual"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="visual-card">
              <div className="visual-icon">
                <FiCpu size={60} />
              </div>
              <div className="pulse-ring"></div>
              <div className="pulse-ring delay-1"></div>
              <div className="pulse-ring delay-2"></div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section section">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="section-title">Powerful Features for Modern Learning</h2>
            <p className="section-subtitle">
              Everything you need to master laboratory experiments and excel in your academic journey
            </p>
          </motion.div>

          <div className="features-grid">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="feature-card"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                viewport={{ once: true }}
                whileHover={{ y: -10 }}
              >
                <div className="feature-icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Disciplines Section */}
      <section className="disciplines-section section">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="section-title">Multi-Disciplinary Support</h2>
            <p className="section-subtitle">
              Comprehensive coverage across all major engineering and science disciplines
            </p>
          </motion.div>

          <div className="disciplines-grid">
            {disciplines.map((discipline, index) => (
              <motion.div
                key={index}
                className="discipline-card"
                style={{ '--accent-color': discipline.color }}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05 }}
              >
                <h3>{discipline.name}</h3>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works section">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="section-title">How AISLA Works</h2>
            <p className="section-subtitle">
              Simple, efficient, and intelligent - your complete lab learning companion
            </p>
          </motion.div>

          <div className="steps-grid">
            {[
              { step: '01', title: 'Upload Experiment', desc: 'Upload your lab manual or experiment image' },
              { step: '02', title: 'AI Analysis', desc: 'Our AI analyzes and understands the experiment' },
              { step: '03', title: 'Get Insights', desc: 'Receive diagrams, simulations, and explanations' },
              { step: '04', title: 'Verify & Learn', desc: 'Check your work and prepare for viva' }
            ].map((item, index) => (
              <motion.div
                key={index}
                className="step-card"
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.15, duration: 0.5 }}
                viewport={{ once: true }}
              >
                <div className="step-number">{item.step}</div>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <motion.div
            className="cta-content"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2>Ready to Transform Your Lab Experience?</h2>
            <p>Join thousands of students already learning smarter with AISLA</p>
            <div className="cta-buttons">
              <Link to="/demo" className="btn-cta-primary">
                Start Learning Now
                <FiArrowRight size={20} />
              </Link>
              <Link to="/contact" className="btn-cta-secondary">
                Contact Us
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default Home
