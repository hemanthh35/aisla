import React from 'react'
import { motion } from 'framer-motion'
import { FiTarget, FiUsers, FiTrendingUp, FiAward } from 'react-icons/fi'
import './About.css'

const About = () => {
  const team = [
    { role: 'AI Lead', name: 'Sheshank', specialty: 'Machine Learning & NLP' },
    { role: 'Full Stack Developer', name: 'Hemanth', specialty: 'MERN Stack' },
    { role: 'Simulation Specialist', name: 'Team Member', specialty: 'Physics & Electronics' },
    { role: 'Faculty Mentor', name: 'Dr. Advisor', specialty: 'Educational Technology' }
  ]

  const values = [
    {
      icon: <FiTarget />,
      title: 'Innovation',
      description: 'Pushing boundaries in educational technology'
    },
    {
      icon: <FiUsers />,
      title: 'Accessibility',
      description: 'Making quality education available to all'
    },
    {
      icon: <FiTrendingUp />,
      title: 'Excellence',
      description: 'Committed to highest learning outcomes'
    },
    {
      icon: <FiAward />,
      title: 'Impact',
      description: 'Transforming lives through education'
    }
  ]

  return (
    <div className="about-page">
      <section className="about-hero">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="about-hero-content"
          >
            <h1>About AISLA</h1>
            <p>
              Revolutionizing laboratory education through AI-driven intelligent assistance,
              making practical learning accessible, engaging, and effective for every student.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="about-content">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="about-text"
            >
              <h2 className="section-title">Our Mission</h2>
              <p>
                Laboratory sessions are the cornerstone of engineering and science education. However,
                students often face challenges including incomplete understanding of experiments,
                difficulty visualizing complex concepts, dependency on limited faculty time, and
                lack of personalized support.
              </p>
              <p>
                AISLA bridges this gap by combining OCR technology, artificial intelligence,
                simulation engines, and intelligent assessment tools to create a comprehensive,
                self-directed learning platform that empowers students to master practical concepts
                at their own pace.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="about-image"
            >
              <div className="image-placeholder">
                <FiAward size={80} />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="values-section section">
        <div className="container">
          <h2 className="section-title">Our Values</h2>
          <p className="section-subtitle">
            The principles that guide our mission to transform education
          </p>

          <div className="values-grid">
            {values.map((value, index) => (
              <motion.div
                key={index}
                className="value-card"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                viewport={{ once: true }}
              >
                <div className="value-icon">{value.icon}</div>
                <h3>{value.title}</h3>
                <p>{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="team-section section">
        <div className="container">
          <h2 className="section-title">Our Team</h2>
          <p className="section-subtitle">
            Meet the experts behind AISLA's innovation
          </p>

          <div className="team-grid">
            {team.map((member, index) => (
              <motion.div
                key={index}
                className="team-card"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                viewport={{ once: true }}
              >
                <div className="team-avatar">
                  <FiUsers size={40} />
                </div>
                <h3>{member.name}</h3>
                <p className="team-role">{member.role}</p>
                <p className="team-specialty">{member.specialty}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="impact-section section">
        <div className="container">
          <h2 className="section-title">Our Impact</h2>
          
          <div className="impact-stats">
            <motion.div
              className="impact-stat"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <h3>10,000+</h3>
              <p>Students Empowered</p>
            </motion.div>
            <motion.div
              className="impact-stat"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              viewport={{ once: true }}
            >
              <h3>500+</h3>
              <p>Experiments Covered</p>
            </motion.div>
            <motion.div
              className="impact-stat"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              viewport={{ once: true }}
            >
              <h3>95%</h3>
              <p>Success Rate</p>
            </motion.div>
            <motion.div
              className="impact-stat"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              viewport={{ once: true }}
            >
              <h3>50+</h3>
              <p>Partner Institutions</p>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default About
