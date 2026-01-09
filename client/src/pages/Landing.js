// AISLA - High-Graphics Landing Page with Rich Animations
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Landing.css';

const Landing = () => {
    const navigate = useNavigate();
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const features = [
        {
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 18h8" />
                    <path d="M3 22h18" />
                    <path d="M14 22a7 7 0 1 0 0-14h-1" />
                    <path d="M9 14h2" />
                    <path d="M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2Z" />
                    <path d="M12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3" />
                </svg>
            ),
            title: 'Smart Experiment Analysis',
            description: 'AI-powered OCR extracts and deeply understands experiments from your lab manual in seconds.'
        },
        {
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="13.5" cy="6.5" r=".5" />
                    <circle cx="17.5" cy="10.5" r=".5" />
                    <circle cx="8.5" cy="7.5" r=".5" />
                    <circle cx="6.5" cy="12.5" r=".5" />
                    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.555C21.965 6.012 17.461 2 12 2z" />
                </svg>
            ),
            title: 'Auto Diagram Generation',
            description: 'Creates stunning circuits, diagrams, and technical visuals automatically from text descriptions.'
        },
        {
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
            ),
            title: 'Live Simulations',
            description: 'Interactive simulations for physics, chemistry, and electronics with real-time visual feedback.'
        },
        {
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
            ),
            title: 'Lab Verification',
            description: 'Instant AI-powered validation of calculations, formulas, and experimental results with precision.'
        },
        {
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                    <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
                </svg>
            ),
            title: 'Viva Preparation',
            description: 'AI-generated viva questions with intelligent answer evaluation and personalized feedback.'
        },
        {
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
            ),
            title: 'Remote Access',
            description: 'Learn anytime, anywhere with 24/7 cloud-based AI-powered lab support and guidance.'
        }
    ];

    const steps = [
        { number: '01', title: 'Upload', description: 'Snap a photo of your lab manual or experiment page' },
        { number: '02', title: 'Analyze', description: 'AI reads, extracts, and understands the experiment' },
        { number: '03', title: 'Visualize', description: 'Get auto-generated diagrams and live simulations' },
        { number: '04', title: 'Learn', description: 'Interactive learning with instant verification' }
    ];

    const benefits = [
        {
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
                    <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
                    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
                    <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
                </svg>
            ),
            title: '10x Faster Learning',
            description: 'Understand complex experiments in minutes, not hours'
        },
        {
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                    <line x1="12" y1="18" x2="12.01" y2="18" />
                </svg>
            ),
            title: 'Learn Anytime',
            description: '24/7 access to AI-powered lab support on any device'
        },
        {
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="6" />
                    <circle cx="12" cy="12" r="2" />
                </svg>
            ),
            title: 'Better Grades',
            description: '98% improvement in lab performance scores'
        },
        {
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="4" r="1" />
                    <path d="m5 8 4 2v4l-2 5" />
                    <path d="m19 8-4 2v4l2 5" />
                    <path d="M8 10h8" />
                </svg>
            ),
            title: 'Inclusive Design',
            description: 'Accessible learning experience for everyone globally'
        },
        {
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
            ),
            title: 'Expert Support',
            description: 'AI mentors guide you through each step with precision'
        },
        {
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
            ),
            title: 'Real-world Labs',
            description: '500+ real experiments to practice and master'
        }
    ];

    return (
        <div className="landing">
            {/* Navigation */}
            <nav className={`nav ${isScrolled ? 'scrolled' : ''}`}>
                <div className="nav-inner">
                    <a href="/" className="nav-logo">
                        <div className="nav-logo-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                                <path d="M2 17l10 5 10-5" />
                                <path d="M2 12l10 5 10-5" />
                            </svg>
                        </div>
                        <span>AISLA</span>
                    </a>

                    <div className="nav-links">
                        <a href="#features" className="nav-link">Features</a>
                        <a href="#comparison" className="nav-link">Comparison</a>
                        <a href="#how-it-works" className="nav-link">How it Works</a>
                        <a href="#benefits" className="nav-link">Benefits</a>
                    </div>

                    <div className="nav-actions">
                        <button className="nav-btn nav-btn-outline" onClick={() => navigate('/login')}>
                            Log In
                        </button>
                        <button className="nav-btn nav-btn-primary" onClick={() => navigate('/register')}>
                            Get Started
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="hero">
                <div className="hero-bg">
                    <div className="hero-orb hero-orb-1"></div>
                    <div className="hero-orb hero-orb-2"></div>
                    <div className="hero-orb hero-orb-3"></div>
                    <div className="hero-grid"></div>
                    <div className="hero-particles">
                        <div className="particle"></div>
                        <div className="particle"></div>
                        <div className="particle"></div>
                        <div className="particle"></div>
                        <div className="particle"></div>
                        <div className="particle"></div>
                        <div className="particle"></div>
                        <div className="particle"></div>
                    </div>
                </div>

                <div className="hero-content">
                    <div className="hero-badge">
                        <span className="hero-badge-dot"></span>
                        Now Available for Students & Faculty
                    </div>

                    <h1 className="hero-title">
                        <span className="hero-title-line">AI-Powered Learning</span>
                        <span className="hero-title-line">
                            <span className="hero-title-gradient">For Modern Labs</span>
                        </span>
                    </h1>

                    <p className="hero-description">
                        Transform your lab experience with intelligent experiment understanding,
                        live simulations, and AI-driven viva preparation. Learn smarter, not harder.
                    </p>

                    <div className="hero-actions">
                        <button className="hero-btn-primary" onClick={() => navigate('/register')}>
                            Start Learning Free
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                        </button>
                        <button className="hero-btn-secondary">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <polygon points="5 3 19 12 5 21 5 3" />
                            </svg>
                            Watch Demo
                        </button>
                    </div>

                    <div className="hero-stats">
                        <div className="hero-stat">
                            <div className="hero-stat-value">10K+</div>
                            <div className="hero-stat-label">Active Students</div>
                        </div>
                        <div className="hero-stat">
                            <div className="hero-stat-value">500+</div>
                            <div className="hero-stat-label">Experiments</div>
                        </div>
                        <div className="hero-stat">
                            <div className="hero-stat-value">98%</div>
                            <div className="hero-stat-label">Success Rate</div>
                        </div>
                        <div className="hero-stat">
                            <div className="hero-stat-value">5+</div>
                            <div className="hero-stat-label">Disciplines</div>
                        </div>
                    </div>
                </div>

                <div className="hero-scroll" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
                    <div className="hero-scroll-icon"></div>
                    <span>Scroll</span>
                </div>
            </section>

            {/* Trusted By / Partners Section */}
            <section className="partners">
                <div className="partners-content">
                    <p className="partners-label">Trusted By Leading Institutions</p>
                    <div className="partners-logos">
                        <div className="partner-logo">
                            <img src="/gitam-logo.png" alt="GITAM - Deemed to be University" />
                        </div>
                        <div className="partner-logo">
                            <img src="/auisc-logo.png" alt="AUISC - Innovate Today, Impact Tomorrow" />
                        </div>
                        <div className="partner-logo">
                            <img src="/anurag-logo.png" alt="Anurag University" />
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="features" id="features">
                <div className="features-bg"></div>
                <div className="features-header">
                    <span className="features-badge">Features</span>
                    <h2 className="features-title">Everything You Need for Lab Excellence</h2>
                    <p className="features-subtitle">
                        Powerful AI tools designed to make lab learning easier, faster, and more effective than ever
                    </p>
                </div>

                <div className="features-grid">
                    {features.map((feature, index) => (
                        <div key={index} className="feature-card">
                            <div className="feature-card-inner">
                                <div className="feature-icon">
                                    {feature.icon}
                                </div>
                                <h3 className="feature-title">{feature.title}</h3>
                                <p className="feature-description">{feature.description}</p>
                                <span className="feature-arrow">
                                    Learn more
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M5 12h14M12 5l7 7-7 7" />
                                    </svg>
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Comparison Section */}
            <section className="comparison" id="comparison">
                <div className="comparison-bg"></div>
                <div className="comparison-header">
                    <span className="comparison-badge">System Comparison</span>
                    <h2 className="comparison-title">Traditional Labs vs AISLA</h2>
                    <p className="comparison-subtitle">
                        See how AISLA revolutionizes lab education with sustainable, accessible, and intelligent learning
                    </p>
                </div>

                <div className="comparison-container">
                    {/* Traditional System Column */}
                    <div className="comparison-column traditional">
                        <div className="comparison-column-header">
                            <div className="comparison-column-icon traditional-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                    <polyline points="9 22 9 12 15 12 15 22" />
                                </svg>
                            </div>
                            <h3>Traditional Labs</h3>
                        </div>
                        <div className="comparison-features">
                            <div className="comparison-feature negative">
                                <span className="feature-icon">✗</span>
                                <div className="feature-content">
                                    <h4>Limited Access</h4>
                                    <p>Fixed lab hours, physical presence required</p>
                                </div>
                            </div>
                            <div className="comparison-feature negative">
                                <span className="feature-icon">✗</span>
                                <div className="feature-content">
                                    <h4>High Resource Waste</h4>
                                    <p>Chemical waste, energy consumption, paper usage</p>
                                </div>
                            </div>
                            <div className="comparison-feature negative">
                                <span className="feature-icon">✗</span>
                                <div className="feature-content">
                                    <h4>Safety Concerns</h4>
                                    <p>Risk of accidents, hazardous materials handling</p>
                                </div>
                            </div>
                            <div className="comparison-feature negative">
                                <span className="feature-icon">✗</span>
                                <div className="feature-content">
                                    <h4>Costly Infrastructure</h4>
                                    <p>Expensive equipment, maintenance, and space</p>
                                </div>
                            </div>
                            <div className="comparison-feature negative">
                                <span className="feature-icon">✗</span>
                                <div className="feature-content">
                                    <h4>Manual Record Keeping</h4>
                                    <p>Paper-based lab manuals and notebooks</p>
                                </div>
                            </div>
                            <div className="comparison-feature negative">
                                <span className="feature-icon">✗</span>
                                <div className="feature-content">
                                    <h4>No Instant Feedback</h4>
                                    <p>Wait days for lab report grades</p>
                                </div>
                            </div>
                            <div className="comparison-feature negative">
                                <span className="feature-icon">✗</span>
                                <div className="feature-content">
                                    <h4>Limited Experiments</h4>
                                    <p>Restricted by equipment availability</p>
                                </div>
                            </div>
                            <div className="comparison-feature negative">
                                <span className="feature-icon">✗</span>
                                <div className="feature-content">
                                    <h4>No Personalization</h4>
                                    <p>One-size-fits-all learning approach</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* VS Divider */}
                    <div className="comparison-divider">
                        <div className="divider-circle">
                            <span>VS</span>
                        </div>
                    </div>

                    {/* AISLA System Column */}
                    <div className="comparison-column aisla">
                        <div className="comparison-column-header">
                            <div className="comparison-column-icon aisla-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                                    <path d="M2 17l10 5 10-5" />
                                    <path d="M2 12l10 5 10-5" />
                                </svg>
                            </div>
                            <h3>AISLA Platform</h3>
                        </div>
                        <div className="comparison-features">
                            <div className="comparison-feature positive">
                                <span className="feature-icon">✓</span>
                                <div className="feature-content">
                                    <h4>24/7 Global Access</h4>
                                    <p>Learn anytime, anywhere with cloud-based labs</p>
                                </div>
                            </div>
                            <div className="comparison-feature positive">
                                <span className="feature-icon">✓</span>
                                <div className="feature-content">
                                    <h4>100% Sustainable</h4>
                                    <p>Zero chemical waste, carbon-neutral digital platform</p>
                                </div>
                            </div>
                            <div className="comparison-feature positive">
                                <span className="feature-icon">✓</span>
                                <div className="feature-content">
                                    <h4>Completely Safe</h4>
                                    <p>Virtual simulations eliminate all physical risks</p>
                                </div>
                            </div>
                            <div className="comparison-feature positive">
                                <span className="feature-icon">✓</span>
                                <div className="feature-content">
                                    <h4>Cost-Effective</h4>
                                    <p>No equipment costs, minimal infrastructure needed</p>
                                </div>
                            </div>
                            <div className="comparison-feature positive">
                                <span className="feature-icon">✓</span>
                                <div className="feature-content">
                                    <h4>AI-Powered Automation</h4>
                                    <p>Digital records, OCR extraction, smart tracking</p>
                                </div>
                            </div>
                            <div className="comparison-feature positive">
                                <span className="feature-icon">✓</span>
                                <div className="feature-content">
                                    <h4>Instant AI Feedback</h4>
                                    <p>Real-time evaluation and personalized guidance</p>
                                </div>
                            </div>
                            <div className="comparison-feature positive">
                                <span className="feature-icon">✓</span>
                                <div className="feature-content">
                                    <h4>Unlimited Experiments</h4>
                                    <p>500+ experiments across multiple disciplines</p>
                                </div>
                            </div>
                            <div className="comparison-feature positive">
                                <span className="feature-icon">✓</span>
                                <div className="feature-content">
                                    <h4>Adaptive Learning</h4>
                                    <p>AI tailors experience to individual pace & style</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Key Advantages */}
                <div className="comparison-advantages">
                    <h3 className="advantages-title">AISLA's Sustainable Advantage</h3>
                    <div className="advantages-grid">
                        <div className="advantage-card">
                            <div className="advantage-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 2a10 10 0 0 1 10 10 4 4 0 0 1-5 5 4 4 0 0 1-5-5 4 4 0 0 1-5 5 4 4 0 0 1-5-5 10 10 0 0 1 10-10Z" />
                                    <path d="M8.5 8.5v.01" />
                                    <path d="M15.5 8.5v.01" />
                                    <path d="M12 15a3 3 0 0 0 3-3" />
                                </svg>
                            </div>
                            <h4>Environmental Impact</h4>
                            <p>Reduces carbon footprint by <strong>85%</strong> compared to traditional labs</p>
                        </div>
                        <div className="advantage-card">
                            <div className="advantage-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="12" y1="1" x2="12" y2="23" />
                                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                                </svg>
                            </div>
                            <h4>Cost Savings</h4>
                            <p>Institutions save <strong>70% annually</strong> on lab operational costs</p>
                        </div>
                        <div className="advantage-card">
                            <div className="advantage-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                    <circle cx="9" cy="7" r="4" />
                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                </svg>
                            </div>
                            <h4>Accessibility</h4>
                            <p>Reaches <strong>10x more students</strong> with equal quality education</p>
                        </div>
                        <div className="advantage-card">
                            <div className="advantage-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                                </svg>
                            </div>
                            <h4>Learning Efficiency</h4>
                            <p>Students learn <strong>3x faster</strong> with AI-powered guidance</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="how-it-works" id="how-it-works">
                <div className="how-it-works-bg"></div>
                <div className="how-it-works-header">
                    <h2 className="how-it-works-title">How AISLA Works</h2>
                    <p className="how-it-works-subtitle">
                        Get started in just four simple steps
                    </p>
                </div>

                <div className="steps-container">
                    {steps.map((step, index) => (
                        <div key={index} className="step-item">
                            <div className="step-number">{step.number}</div>
                            <h3 className="step-title">{step.title}</h3>
                            <p className="step-description">{step.description}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Benefits Section */}
            <section className="benefits" id="benefits">
                <div className="benefits-header">
                    <h2 className="benefits-title">Why Choose AISLA?</h2>
                    <p className="benefits-subtitle">
                        Join thousands of students already learning smarter
                    </p>
                </div>

                <div className="benefits-grid">
                    {benefits.map((benefit, index) => (
                        <div key={index} className="benefit-card">
                            <div className="benefit-icon">
                                {benefit.icon}
                            </div>
                            <h3 className="benefit-title">{benefit.title}</h3>
                            <p className="benefit-description">{benefit.description}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta">
                <div className="cta-bg"></div>
                <div className="cta-orb"></div>
                <div className="cta-content">
                    <h2 className="cta-title">Ready to Transform Your Lab Experience?</h2>
                    <p className="cta-description">
                        Join thousands of students already learning smarter with AISLA
                    </p>
                    <button className="cta-btn" onClick={() => navigate('/register')}>
                        Get Started Now
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>
            </section>

            {/* Footer */}
            <footer className="footer">
                <div className="footer-content">
                    <div className="footer-brand">
                        <div className="footer-logo">
                            <div className="footer-logo-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                                    <path d="M2 17l10 5 10-5" />
                                    <path d="M2 12l10 5 10-5" />
                                </svg>
                            </div>
                            <span>AISLA</span>
                        </div>
                        <p className="footer-brand-text">
                            AI Self-Learning Lab Assistant - Making lab learning accessible, engaging, and effective for everyone.
                        </p>
                    </div>

                    <div className="footer-column">
                        <h4 className="footer-column-title">Product</h4>
                        <ul className="footer-links">
                            <li className="footer-link">Features</li>
                            <li className="footer-link">Pricing</li>
                            <li className="footer-link">Security</li>
                            <li className="footer-link">Updates</li>
                        </ul>
                    </div>

                    <div className="footer-column">
                        <h4 className="footer-column-title">Company</h4>
                        <ul className="footer-links">
                            <li className="footer-link">About</li>
                            <li className="footer-link">Team</li>
                            <li className="footer-link">Careers</li>
                            <li className="footer-link">Contact</li>
                        </ul>
                    </div>

                    <div className="footer-column">
                        <h4 className="footer-column-title">Legal</h4>
                        <ul className="footer-links">
                            <li className="footer-link">Privacy</li>
                            <li className="footer-link">Terms</li>
                            <li className="footer-link">Support</li>
                            <li className="footer-link">FAQ</li>
                        </ul>
                    </div>
                </div>

                <div className="footer-bottom">
                    <p className="footer-copyright">© 2025 AISLA. All rights reserved.</p>
                    <div className="footer-socials">
                        <a href="#" className="footer-social">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                            </svg>
                        </a>
                        <a href="#" className="footer-social">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                            </svg>
                        </a>
                        <a href="#" className="footer-social">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                <polyline points="22,6 12,13 2,6" />
                            </svg>
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Landing;
