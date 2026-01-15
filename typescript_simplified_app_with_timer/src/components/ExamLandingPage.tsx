import { Clock, CheckCircle, AlertTriangle, Award, BookOpen, Target, Shield, ArrowRight, Home, LogIn, User } from 'lucide-react';

interface ExamLandingPageProps {
  examType: string;
  onStartExam: () => void;
  onGoBack: () => void;
  user: any;
  onLoginClick: () => void;
}

// Exam data with descriptions, topics, and instructions
const examData: { [key: string]: {
  title: string;
  subtitle: string;
  description: string;
  duration: string;
  questions: number;
  passingScore: number;
  domains: { name: string; percentage: number; topics: string[] }[];
  tips: string[];
  color: string;
  gradient: string;
}} = {
  solutions_architect: {
    title: 'AWS Solutions Architect',
    subtitle: 'Associate Level Certification',
    description: 'The AWS Certified Solutions Architect – Associate exam validates your ability to design and deploy scalable, highly available, and fault-tolerant systems on AWS. This certification demonstrates your expertise in selecting appropriate AWS services to design and deploy applications based on given requirements.',
    duration: '75 minutes',
    questions: 50,
    passingScore: 70,
    domains: [
      { 
        name: 'Design Resilient Architectures', 
        percentage: 30,
        topics: ['Multi-tier architecture', 'High availability', 'Decoupling mechanisms', 'Disaster recovery']
      },
      { 
        name: 'Design High-Performing Architectures', 
        percentage: 28,
        topics: ['Elastic compute solutions', 'Storage solutions', 'Database solutions', 'Network architectures']
      },
      { 
        name: 'Design Secure Applications', 
        percentage: 24,
        topics: ['IAM policies', 'Encryption', 'VPC security', 'Compliance']
      },
      { 
        name: 'Design Cost-Optimized Architectures', 
        percentage: 18,
        topics: ['Cost-effective storage', 'Compute optimization', 'Reserved capacity', 'Cost allocation']
      }
    ],
    tips: [
      'Focus on understanding AWS Well-Architected Framework principles',
      'Know the differences between storage types (S3, EBS, EFS, FSx)',
      'Understand VPC networking, subnets, and security groups',
      'Be familiar with database options and when to use each'
    ],
    color: 'sky',
    gradient: 'from-sky-500 to-blue-600'
  },
  cloud_practitioner: {
    title: 'AWS Cloud Practitioner',
    subtitle: 'Foundational Level Certification',
    description: 'The AWS Certified Cloud Practitioner exam validates your overall understanding of the AWS Cloud. This certification is ideal for individuals who want to demonstrate their knowledge of AWS Cloud concepts, services, security, architecture, pricing, and support.',
    duration: '75 minutes',
    questions: 50,
    passingScore: 70,
    domains: [
      { 
        name: 'Cloud Concepts', 
        percentage: 26,
        topics: ['AWS Cloud value proposition', 'Cloud economics', 'Cloud architecture principles']
      },
      { 
        name: 'Security and Compliance', 
        percentage: 25,
        topics: ['Shared responsibility model', 'AWS security services', 'Compliance programs']
      },
      { 
        name: 'Technology', 
        percentage: 33,
        topics: ['Core AWS services', 'Global infrastructure', 'Deployment and management']
      },
      { 
        name: 'Billing and Pricing', 
        percentage: 16,
        topics: ['Pricing models', 'Account structures', 'Billing support resources']
      }
    ],
    tips: [
      'Understand the AWS Shared Responsibility Model thoroughly',
      'Know the basic services: EC2, S3, RDS, Lambda, VPC',
      'Be familiar with AWS pricing models and Free Tier',
      'Understand the difference between Regions, AZs, and Edge Locations'
    ],
    color: 'emerald',
    gradient: 'from-emerald-500 to-green-600'
  },
  developer: {
    title: 'AWS Developer Associate',
    subtitle: 'Associate Level Certification',
    description: 'The AWS Certified Developer – Associate exam validates your ability to develop, deploy, and debug cloud-based applications using AWS. This certification demonstrates your proficiency in core AWS services, basic architecture best practices, and the ability to develop, deploy, and debug applications.',
    duration: '75 minutes',
    questions: 50,
    passingScore: 70,
    domains: [
      { 
        name: 'Development with AWS Services', 
        percentage: 32,
        topics: ['AWS SDKs', 'API Gateway', 'Lambda', 'DynamoDB', 'S3']
      },
      { 
        name: 'Security', 
        percentage: 26,
        topics: ['IAM', 'Cognito', 'KMS', 'Secrets Manager', 'API authentication']
      },
      { 
        name: 'Deployment', 
        percentage: 24,
        topics: ['CI/CD pipelines', 'Elastic Beanstalk', 'CloudFormation', 'SAM']
      },
      { 
        name: 'Troubleshooting and Optimization', 
        percentage: 18,
        topics: ['CloudWatch', 'X-Ray', 'Performance optimization', 'Error handling']
      }
    ],
    tips: [
      'Master AWS Lambda and serverless architecture patterns',
      'Understand DynamoDB thoroughly (indexes, capacity, streams)',
      'Know API Gateway configuration and integration types',
      'Be familiar with CI/CD tools: CodePipeline, CodeBuild, CodeDeploy'
    ],
    color: 'orange',
    gradient: 'from-orange-500 to-amber-600'
  }
};

const ExamLandingPage: React.FC<ExamLandingPageProps> = ({ 
  examType, 
  onStartExam, 
  onGoBack, 
  user,
  onLoginClick 
}) => {
  const exam = examData[examType] || examData.solutions_architect;
  
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button
              onClick={onGoBack}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
              <Home className="w-5 h-5" />
              <span className="hidden sm:inline">Back to Home</span>
            </button>
            
            {user ? (
              <div className="flex items-center gap-2">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Profile" className="w-8 h-8 rounded-full border border-sky-500/50" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                    <User size={16} className="text-sky-400" />
                  </div>
                )}
                <span className="text-sm font-medium text-slate-300 hidden sm:inline">
                  {user.displayName || user.email?.split('@')[0]}
                </span>
              </div>
            ) : (
              <button
                onClick={onLoginClick}
                className="flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-lg text-sm font-bold transition-all"
              >
                <LogIn className="w-4 h-4" />
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className={`inline-flex items-center gap-2 px-4 py-2 bg-${exam.color}-500/10 border border-${exam.color}-500/20 rounded-full mb-6`}>
            <Award className={`w-4 h-4 text-${exam.color}-400`} />
            <span className={`text-${exam.color}-400 text-sm font-semibold uppercase tracking-wider`}>
              {exam.subtitle}
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 font-['Space_Grotesk'] tracking-tight">
            {exam.title}
          </h1>
          <p className="text-lg sm:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
            {exam.description}
          </p>
        </div>

        {/* Exam Stats */}
        <div className="grid grid-cols-3 gap-4 sm:gap-6 mb-12">
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 sm:p-6 text-center">
            <Clock className="w-8 h-8 text-sky-400 mx-auto mb-3" />
            <div className="text-2xl sm:text-3xl font-bold text-white mb-1">{exam.duration}</div>
            <div className="text-sm text-slate-500 uppercase tracking-wider">Duration</div>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 sm:p-6 text-center">
            <BookOpen className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
            <div className="text-2xl sm:text-3xl font-bold text-white mb-1">{exam.questions}</div>
            <div className="text-sm text-slate-500 uppercase tracking-wider">Questions</div>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 sm:p-6 text-center">
            <Target className="w-8 h-8 text-amber-400 mx-auto mb-3" />
            <div className="text-2xl sm:text-3xl font-bold text-white mb-1">{exam.passingScore}%</div>
            <div className="text-sm text-slate-500 uppercase tracking-wider">Passing Score</div>
          </div>
        </div>

        {/* Exam Domains */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 sm:p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Shield className="w-6 h-6 text-sky-400" />
            Exam Domains
          </h2>
          <div className="space-y-6">
            {exam.domains.map((domain, index) => (
              <div key={index}>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-white">{domain.name}</span>
                  <span className={`text-${exam.color}-400 font-bold`}>{domain.percentage}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 mb-3">
                  <div 
                    className={`bg-gradient-to-r ${exam.gradient} h-2 rounded-full transition-all duration-500`}
                    style={{ width: `${domain.percentage}%` }}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {domain.topics.map((topic, i) => (
                    <span 
                      key={i}
                      className="px-3 py-1 bg-slate-800 text-slate-400 text-xs rounded-full border border-slate-700"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tips Section */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 sm:p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-emerald-400" />
            Preparation Tips
          </h2>
          <ul className="space-y-4">
            {exam.tips.map((tip, index) => (
              <li key={index} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                </div>
                <span className="text-slate-300">{tip}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Important Notice */}
        <div className={`bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 sm:p-8 mb-8`}>
          <div className="flex items-start gap-4">
            <AlertTriangle className="w-8 h-8 text-amber-400 flex-shrink-0" />
            <div>
              <h3 className="text-xl font-bold text-amber-400 mb-3">Important Instructions</h3>
              <ul className="space-y-2 text-slate-300">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  Each question has a <strong>90-second time limit</strong>. Unanswered questions will be marked as incorrect.
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  You need <strong>{exam.passingScore}% or higher</strong> to pass and receive your certificate.
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  You can review all questions and explanations after completing the exam.
                </li>
                {!user && (
                  <li className="flex items-center gap-2 text-amber-300 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-300"></span>
                    <strong>Sign in to save your progress and receive your certificate!</strong>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* Login Prompt for Non-Authenticated Users */}
        {!user && (
          <div className="bg-sky-500/10 border border-sky-500/30 rounded-2xl p-6 sm:p-8 mb-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-sky-500/20 flex items-center justify-center">
                  <Award className="w-6 h-6 text-sky-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Want to earn your certificate?</h3>
                  <p className="text-slate-400">Sign in now to save your progress and receive your official certificate upon passing.</p>
                </div>
              </div>
              <button
                onClick={onLoginClick}
                className="px-6 py-3 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-xl font-bold transition-all flex items-center gap-2 whitespace-nowrap"
              >
                <LogIn className="w-5 h-5" />
                Sign In
              </button>
            </div>
          </div>
        )}

        {/* Start Exam Button */}
        <div className="text-center">
          <button
            onClick={onStartExam}
            className={`group px-10 py-5 bg-gradient-to-r ${exam.gradient} hover:opacity-90 text-white rounded-2xl text-xl font-bold transition-all shadow-lg shadow-${exam.color}-500/30 flex items-center justify-center gap-3 mx-auto hover:scale-105`}
          >
            Start Exam
            <ArrowRight className="w-6 h-6 transition-transform group-hover:translate-x-1" />
          </button>
          <p className="text-slate-500 text-sm mt-4">
            {user ? 'Good luck! Your progress will be saved.' : 'You can sign in anytime during the exam.'}
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/50 py-8 mt-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-slate-500 text-sm">
            &copy; 2025 FreeCertify. AWS is a trademark of Amazon.com, Inc.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default ExamLandingPage;
