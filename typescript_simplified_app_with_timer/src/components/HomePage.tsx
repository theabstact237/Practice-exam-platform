import { useState, useEffect, useMemo } from 'react';
import { BookOpen, Users, Target, LogIn, Menu, X, User, LogOut, Cloud, Server, Database, Shield, Zap, Globe, Cpu, Github, Linkedin } from 'lucide-react';
import SimpleLoginModal from './SimpleLoginModal';
import LanguageSelector from './LanguageSelector';
import { getAllExams, Exam } from '../utils/api';
import { signOutUser } from '../utils/auth';

interface HomePageProps {
  onSelectExam: (examType: string) => void;
  user: any;
}

// Background Animation Component
const TechBackground = () => {
  const particles = useMemo(() => {
    return Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: Math.random() * 4 + 1,
      duration: Math.random() * 20 + 10,
      delay: Math.random() * 5,
    }));
  }, []);

  const clouds = useMemo(() => {
    return Array.from({ length: 6 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 80}%`,
      scale: Math.random() * 0.5 + 0.5,
      duration: Math.random() * 30 + 20,
      delay: Math.random() * -20,
    }));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-grid-slate-700 opacity-20"></div>
      
      {/* Radial Gradient Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(56,189,248,0.15),transparent_50%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(56,189,248,0.1),transparent_50%)]"></div>

      {/* Floating Particles */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full bg-sky-500/30 animate-pulse-slow"
          style={{
            left: p.left,
            top: p.top,
            width: `${p.size}px`,
            height: `${p.size}px`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}

      {/* Cloud Infrastructure Icons */}
      {clouds.map((c) => (
        <div
          key={c.id}
          className="absolute text-sky-500/10 animate-float"
          style={{
            left: c.left,
            top: c.top,
            transform: `scale(${c.scale})`,
            animationDuration: `${c.duration}s`,
            animationDelay: `${c.delay}s`,
          }}
        >
          {c.id % 3 === 0 ? <Cloud size={120} /> : c.id % 3 === 1 ? <Server size={100} /> : <Database size={100} />}
        </div>
      ))}

      {/* Animated Circuit Lines (SVG) */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
        <path d="M0 100 Q 250 50 500 100 T 1000 100" fill="none" stroke="currentColor" strokeWidth="2" className="text-sky-400" />
        <path d="M0 300 Q 250 350 500 300 T 1000 300" fill="none" stroke="currentColor" strokeWidth="2" className="text-sky-400" />
        <path d="M0 500 Q 250 450 500 500 T 1000 500" fill="none" stroke="currentColor" strokeWidth="2" className="text-sky-400" />
      </svg>
    </div>
  );
};

const HomePage: React.FC<HomePageProps> = ({ onSelectExam, user }) => {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loadingExams, setLoadingExams] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const allExams = await getAllExams();
        const activeExams = allExams.filter((exam: Exam) => exam.is_active);
        setExams(activeExams);
      } catch (error) {
        console.error('Error fetching exams:', error);
      } finally {
        setLoadingExams(false);
      }
    };

    fetchExams();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOutUser();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleExamClick = (examType: string) => {
    onSelectExam(examType);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white relative font-['Inter']">
      <TechBackground />

      {/* Navigation Bar */}
      <nav className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="bg-sky-500/20 p-2 rounded-lg mr-3 border border-sky-500/30">
                <Cloud className="w-6 h-6 text-sky-400" />
              </div>
              <span className="text-2xl font-bold tracking-tight font-['Space_Grotesk']">
                Free<span className="text-sky-400">Certify</span>
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              {exams.length > 0 && (
                <div className="flex items-center space-x-2 mr-4">
                  {exams.map((exam) => (
                    <button
                      key={exam.id}
                      onClick={() => handleExamClick(exam.exam_type)}
                      className="px-3 py-1.5 text-sm font-medium text-slate-400 hover:text-sky-400 hover:bg-sky-500/10 rounded-md transition-all border border-transparent hover:border-sky-500/20"
                    >
                      {exam.name}
                    </button>
                  ))}
                </div>
              )}
              
              {/* Language Selector */}
              <LanguageSelector />

              {!user ? (
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="px-5 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-lg text-sm font-bold transition-all shadow-[0_0_15px_rgba(56,189,248,0.3)] flex items-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  Sign In
                </button>
              ) : (
                <div className="flex items-center space-x-4 pl-4 border-l border-slate-800">
                  <div className="flex items-center gap-2">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="Profile" className="w-8 h-8 rounded-full border border-sky-500/50" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                        <User size={16} className="text-sky-400" />
                      </div>
                    )}
                    <span className="text-sm font-medium text-slate-300">{user.displayName || user.email?.split('@')[0]}</span>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                    title="Sign Out"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-slate-400 hover:text-white">
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-900 border-t border-slate-800 px-4 py-6 space-y-4">
            {exams.map((exam) => (
              <button
                key={exam.id}
                onClick={() => {
                  handleExamClick(exam.exam_type);
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left px-4 py-3 text-base font-medium text-slate-300 hover:text-sky-400 hover:bg-sky-500/10 rounded-xl transition-colors"
              >
                {exam.name}
              </button>
            ))}
            
            {/* Language Selector - Mobile */}
            <div className="px-4 py-2 border-t border-slate-800 mt-4">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Language</p>
              <LanguageSelector />
            </div>

            {!user ? (
              <button
                onClick={() => {
                  setShowLoginModal(true);
                  setMobileMenuOpen(false);
                }}
                className="w-full px-4 py-3 bg-sky-500 text-slate-950 rounded-xl text-base font-bold flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20"
              >
                <LogIn className="w-5 h-5" />
                Sign In
              </button>
            ) : (
              <button
                onClick={handleSignOut}
                className="w-full px-4 py-3 bg-slate-800 text-slate-300 rounded-xl text-base font-medium flex items-center justify-center gap-2"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            )}
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
        <div className="text-center max-w-4xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-bold uppercase tracking-widest mb-6 animate-pulse-slow">
            <Zap className="w-3 h-3" />
            AI-Powered Learning Platform
          </div>
          <h1 className="text-6xl md:text-8xl font-extrabold mb-8 tracking-tighter font-['Space_Grotesk'] leading-[0.9]">
            Master <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-cyan-300 to-sky-500 text-glow">AWS</span> <br /> 
            Certifications
          </h1>
          <p className="text-xl md:text-2xl text-slate-400 mb-12 leading-relaxed font-light">
            Elevate your career with enterprise-grade practice exams. 
            Powered by advanced AI to mirror the actual certification experience.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            {!user ? (
              <button
                onClick={() => setShowLoginModal(true)}
                className="group px-8 py-4 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-2xl text-xl font-bold transition-all shadow-[0_0_30px_rgba(56,189,248,0.4)] flex items-center justify-center gap-3 hover:scale-105"
              >
                <LogIn className="w-6 h-6 transition-transform group-hover:translate-x-1" />
                Get Started Free
              </button>
            ) : (
              <div className="flex flex-wrap justify-center gap-4">
                <button
                  onClick={() => onSelectExam('solutions_architect')}
                  className="px-8 py-4 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-2xl text-lg font-bold transition-all shadow-lg shadow-sky-500/20 hover:scale-105"
                >
                  Solutions Architect
                </button>
                <button
                  onClick={() => onSelectExam('cloud_practitioner')}
                  className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl text-lg font-bold border border-slate-700 transition-all hover:scale-105"
                >
                  Cloud Practitioner
                </button>
                <button
                  onClick={() => onSelectExam('developer')}
                  className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl text-lg font-bold border border-slate-700 transition-all hover:scale-105"
                >
                  Developer Associate
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-24">
          {[
            { 
              icon: <Zap className="text-sky-400" />, 
              title: "AI Question Engine", 
              desc: "Dynamically generated questions that evolve with the latest AWS service updates." 
            },
            { 
              icon: <Target className="text-cyan-400" />, 
              title: "Precise Analytics", 
              desc: "Deep-dive performance metrics to identify your knowledge gaps with surgical precision." 
            },
            { 
              icon: <Shield className="text-blue-400" />, 
              title: "Realistic Simulations", 
              desc: "Timed environments and question formats that mirror the actual exam difficulty." 
            }
          ].map((feat, i) => (
            <div key={i} className="glass-card p-8 rounded-3xl group hover:border-sky-500/50 transition-all duration-500">
              <div className="bg-slate-950/50 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform border border-slate-800">
                {feat.icon}
              </div>
              <h3 className="text-2xl font-bold mb-4 font-['Space_Grotesk']">{feat.title}</h3>
              <p className="text-slate-400 leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>

        {/* Platform Stats Section */}
        <div className="glass-card rounded-2xl sm:rounded-[3rem] p-6 sm:p-8 md:p-12 mb-16 sm:mb-24 border-sky-500/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 sm:p-12 text-sky-500/5 rotate-12 hidden sm:block">
            <Cpu size={160} className="sm:w-60 sm:h-60" />
          </div>
          <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-center">
            <div>
              <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-8 tracking-tight font-['Space_Grotesk'] leading-tight">
                Enterprise Preparedness <br />
                <span className="text-sky-400">For Everyone.</span>
              </h2>
              <div className="space-y-4 sm:space-y-6 text-slate-400 text-base sm:text-lg leading-relaxed">
                <p>
                  FreeCertify was built on the principle that high-quality career advancement tools 
                  should be accessible to all. We leverage cloud-native technologies to deliver a 
                  premium preparation experience at zero cost.
                </p>
                <div className="flex flex-wrap gap-4 sm:gap-8 py-2 sm:py-4">
                  <div>
                    <div className="text-xl sm:text-3xl font-bold text-white font-['Space_Grotesk'] tracking-tight">100%</div>
                    <div className="text-xs text-slate-500 uppercase font-bold tracking-widest mt-1">Cloud Native</div>
                  </div>
                  <div className="w-px h-10 sm:h-12 bg-slate-800 hidden sm:block"></div>
                  <div>
                    <div className="text-xl sm:text-3xl font-bold text-white font-['Space_Grotesk'] tracking-tight">AI</div>
                    <div className="text-xs text-slate-500 uppercase font-bold tracking-widest mt-1">Powered</div>
                  </div>
                  <div className="w-px h-10 sm:h-12 bg-slate-800 hidden sm:block"></div>
                  <div>
                    <div className="text-xl sm:text-3xl font-bold text-white font-['Space_Grotesk'] tracking-tight">Free</div>
                    <div className="text-xs text-slate-500 uppercase font-bold tracking-widest mt-1">Forever</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="glass-card p-4 sm:p-6 rounded-2xl border-emerald-500/20">
                <Globe className="text-emerald-400 mb-2 sm:mb-3 w-5 h-5 sm:w-6 sm:h-6" />
                <div className="font-bold text-white text-sm sm:text-base">Global Reach</div>
              </div>
              <div className="glass-card p-4 sm:p-6 rounded-2xl border-orange-500/20">
                <Cpu className="text-orange-400 mb-2 sm:mb-3 w-5 h-5 sm:w-6 sm:h-6" />
                <div className="font-bold text-white text-sm sm:text-base">Neural Processing</div>
              </div>
              <div className="glass-card p-4 sm:p-6 rounded-2xl border-purple-500/20">
                <Database className="text-purple-400 mb-2 sm:mb-3 w-5 h-5 sm:w-6 sm:h-6" />
                <div className="font-bold text-white text-sm sm:text-base">Scalable Infrastructure</div>
              </div>
              <div className="glass-card p-4 sm:p-6 rounded-2xl border-sky-500/20">
                <Shield className="text-sky-400 mb-2 sm:mb-3 w-5 h-5 sm:w-6 sm:h-6" />
                <div className="font-bold text-white text-sm sm:text-base">Secure Learning</div>
              </div>
            </div>
          </div>
        </div>

        {/* Founder Section */}
        <div className="text-center">
          <div className="relative inline-block mb-10 group">
            <div className="absolute inset-0 bg-sky-500 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
            <div className="relative w-40 h-40 bg-gradient-to-br from-slate-800 to-slate-950 rounded-full border-2 border-sky-500/30 p-1 group-hover:border-sky-500 transition-colors overflow-hidden">
              <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center overflow-hidden">
                <img 
                  src="/profile-image.jpg" 
                  alt="Karl Siaka" 
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).parentElement!.innerHTML = '<span class="text-5xl font-bold text-sky-400 font-[\'Space_Grotesk\']">KS</span>';
                  }}
                />
              </div>
            </div>
          </div>
          <h3 className="text-3xl font-bold mb-4 font-['Space_Grotesk']">Karl Siaka</h3>
          <p className="text-sky-400 font-bold tracking-widest uppercase text-sm mb-6">Cloud Architect & Founder</p>
          <p className="text-slate-400 text-lg mb-10 max-w-2xl mx-auto leading-relaxed italic">
            "We're democratizing cloud certification. Preparation shouldn't be a financial barrier to entry into the tech industry."
          </p>
          <div className="flex justify-center gap-6">
            <a 
              href="https://github.com/theabstact237" 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-3 bg-slate-900 hover:bg-sky-500/10 border border-slate-800 rounded-xl transition-all hover:scale-110 hover:border-sky-500/50 group"
              title="GitHub"
            >
              <Github className="w-6 h-6 text-slate-400 group-hover:text-sky-400" />
            </a>
            <a 
              href="https://linkedin.com/in/siaka-karl" 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-3 bg-slate-900 hover:bg-sky-500/10 border border-slate-800 rounded-xl transition-all hover:scale-110 hover:border-sky-500/50 group"
              title="LinkedIn"
            >
              <Linkedin className="w-6 h-6 text-slate-400 group-hover:text-sky-400" />
            </a>
          </div>
        </div>
      </div>

      {/* Simple Login Modal */}
      <SimpleLoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
      
      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-900 bg-slate-950/50 py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-slate-500 text-sm font-medium tracking-wide font-['Space_Grotesk'] uppercase">
            &copy; 2025 FreeCertify. All Rights Reserved. AWS is a trademark of Amazon.com, Inc.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;

