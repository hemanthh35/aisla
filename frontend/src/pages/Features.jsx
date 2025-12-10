import React from 'react'
import { motion } from 'framer-motion'
import { 
  FiCpu, FiImage, FiActivity, FiCheckCircle, 
  FiBook, FiMessageCircle, FiEye, FiZap,
  FiLayers, FiSettings, FiShield, FiGlobe
} from 'react-icons/fi'
import './Features.css'

const Features = () => {
  const mainFeatures = [
    {
      icon: <FiCpu />,
      title: 'OCR + AI Experiment Analyzer',
      description: 'Advanced optical character recognition combined with GPT-powered analysis to understand experiment manuals instantly',
      benefits: ['Text extraction from images', 'Intelligent content parsing', 'Structured output generation', 'Multi-language support']
    },
    {
      icon: <FiImage />,
      title: 'Auto Diagram Generator',
      description: 'Automatically create accurate circuit diagrams, chemical reactions, mechanical sketches, and graphs',
      benefits: ['Circuit diagram generation', 'Chemical structure drawing', 'Physics vector diagrams', 'Interactive graphs']
    },
    {
      icon: <FiActivity />,
      title: 'Multi-Discipline Simulation Engine',
      description: 'Real-time simulations for physics, chemistry, electronics, and mechanical engineering experiments',
      benefits: ['Interactive simulations', 'Real-time parameter changes', 'Visual learning', 'Safe experimentation']
    },
    {
      icon: <FiCheckCircle />,
      title: 'Intelligent Lab Record Checker',
      description: 'AI-powered verification of formulas, calculations, diagrams, and theoretical explanations',
      benefits: ['Formula validation', 'Calculation verification', 'Diagram accuracy check', 'Theory assessment']
    },
    {
      icon: <FiMessageCircle />,
      title: 'Smart Viva Assistant',
      description: 'AI-generated viva questions with intelligent answer evaluation and personalized feedback',
      benefits: ['Question generation', 'Answer evaluation', 'Personalized feedback', 'Difficulty adaptation']
    },
    {
      icon: <FiBook />,
      title: 'Self-Directed Learning Platform',
      description: 'Comprehensive learning resources with adaptive content and progress tracking',
      benefits: ['Personalized paths', 'Progress tracking', 'Resource library', '24/7 availability']
    }
  ]

  const additionalFeatures = [
    { icon: <FiEye />, title: 'Accessibility Features', description: 'Screen reader support and inclusive design' },
    { icon: <FiZap />, title: 'Real-time Collaboration', description: 'Work together with peers in real-time' },
    { icon: <FiLayers />, title: 'Multi-Platform Support', description: 'Access from web, mobile, and desktop' },
    { icon: <FiSettings />, title: 'Customizable Interface', description: 'Personalize your learning environment' },
    { icon: <FiShield />, title: 'Secure & Private', description: 'Your data is encrypted and protected' },
    { icon: <FiGlobe />, title: 'Cloud-Based', description: 'Access your work from anywhere' }
  ]

  return (
    <div className="features-page">
      <section className="features-hero">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="features-hero-content"
          >
            <h1>Powerful Features</h1>
            <p>
              Everything you need to master laboratory experiments and excel in your academic journey.
              Comprehensive tools powered by cutting-edge AI technology.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="main-features">
            {mainFeatures.map((feature, index) => (
              <motion.div
                key={index}
                className="main-feature-card"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                viewport={{ once: true }}
              >
                <div className="feature-header">
                  <div className="feature-icon-large">{feature.icon}</div>
                  <div>
                    <h3>{feature.title}</h3>
                    <p className="feature-description">{feature.description}</p>
                  </div>
                </div>
                <div className="feature-benefits">
                  <h4>Key Benefits:</h4>
                  <ul>
                    {feature.benefits.map((benefit, idx) => (
                      <li key={idx}>
                        <FiCheckCircle size={16} />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="additional-features-section section">
        <div className="container">
          <h2 className="section-title">Additional Features</h2>
          <p className="section-subtitle">
            More tools to enhance your learning experience
          </p>

          <div className="additional-features-grid">
            {additionalFeatures.map((feature, index) => (
              <motion.div
                key={index}
                className="additional-feature-card"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
              >
                <div className="additional-feature-icon">{feature.icon}</div>
                <h4>{feature.title}</h4>
                <p>{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="tech-stack-section section">
        <div className="container">
          <h2 className="section-title">Powered by Modern Technology</h2>
          <p className="section-subtitle">
            Built with industry-leading tools and frameworks
          </p>

          <div className="tech-stack">
            <motion.div
              className="tech-category"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h3>Frontend</h3>
              <div className="tech-items">
                <span>React</span>
                <span>React Router</span>
                <span>Framer Motion</span>
              </div>
            </motion.div>

            <motion.div
              className="tech-category"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h3>Backend</h3>
              <div className="tech-items">
                <span>Flask / FastAPI</span>
                <span>Node.js</span>
                <span>Express</span>
              </div>
            </motion.div>

            <motion.div
              className="tech-category"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <h3>AI & ML</h3>
              <div className="tech-items">
                <span>Tesseract OCR</span>
                <span>GPT-4</span>
                <span>Llama 3</span>
              </div>
            </motion.div>

            <motion.div
              className="tech-category"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <h3>Database</h3>
              <div className="tech-items">
                <span>MongoDB</span>
                <span>Firebase</span>
                <span>Redis</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Features
