import React, { useRef, useState } from 'react';
import { X, Download, FileText, Award, CheckCircle, Loader2 } from 'lucide-react';
// jsPDF and html2canvas are now dynamically imported for better performance

interface CertificateProps {
  isVisible: boolean;
  onClose: () => void;
  userName: string;
  examType: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  completionDate: Date;
}

const Certificate: React.FC<CertificateProps> = ({
  isVisible,
  onClose,
  userName,
  examType,
  score,
  totalQuestions,
  percentage,
  completionDate
}) => {
  const certificateRef = useRef<HTMLDivElement>(null);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const [isDownloadingWord, setIsDownloadingWord] = useState(false);

  if (!isVisible) return null;

  const getExamFullName = (type: string): string => {
    switch (type) {
      case 'solutions_architect':
        return 'AWS Solutions Architect Associate';
      case 'cloud_practitioner':
        return 'AWS Cloud Practitioner';
      case 'developer':
        return 'AWS Developer Associate';
      default:
        return 'AWS Certification';
    }
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const generateCertificateId = (): string => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `FC-${timestamp}-${random}`;
  };

  const certificateId = generateCertificateId();

  const downloadAsPDF = async () => {
    if (!certificateRef.current) return;

    setIsDownloadingPDF(true);
    
    try {
      // Dynamically import heavy PDF libraries only when needed
      // This saves ~300KB from the initial bundle
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import('jspdf'),
        import('html2canvas')
      ]);
      
      // Create a clone of the certificate for PDF generation
      const element = certificateRef.current;
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#0f172a'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`FreeCertify_${examType}_Certificate_${userName.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  const downloadAsWord = async () => {
    setIsDownloadingWord(true);
    
    // Small delay to show loading state
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const content = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: 'Georgia', serif;
      text-align: center;
      padding: 60px;
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      color: #e2e8f0;
    }
    .certificate {
      border: 4px double #0ea5e9;
      padding: 60px;
      background: #1e293b;
      max-width: 800px;
      margin: 0 auto;
    }
    .logo {
      font-size: 32px;
      font-weight: bold;
      color: #0ea5e9;
      margin-bottom: 20px;
    }
    .title {
      font-size: 42px;
      font-weight: bold;
      color: #f8fafc;
      margin: 30px 0;
      text-transform: uppercase;
      letter-spacing: 4px;
    }
    .subtitle {
      font-size: 18px;
      color: #94a3b8;
      margin-bottom: 30px;
    }
    .name {
      font-size: 36px;
      font-weight: bold;
      color: #0ea5e9;
      margin: 30px 0;
      border-bottom: 2px solid #0ea5e9;
      padding-bottom: 10px;
      display: inline-block;
    }
    .exam {
      font-size: 24px;
      color: #f8fafc;
      margin: 20px 0;
    }
    .score {
      font-size: 48px;
      font-weight: bold;
      color: #10b981;
      margin: 20px 0;
    }
    .details {
      font-size: 14px;
      color: #64748b;
      margin-top: 40px;
    }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="logo">🎓 FreeCertify</div>
    <div class="title">Certificate of Achievement</div>
    <div class="subtitle">This is to certify that <span class="name">${userName}</span> has successfully completed the</div>
    <div class="exam">${getExamFullName(examType)}</div>
    <div class="subtitle">Practice Examination</div>
    <div class="score">${percentage}%</div>
    <div class="subtitle">Score: ${score} out of ${totalQuestions} questions</div>
    <div class="details">
      <p>Date: ${formatDate(completionDate)}</p>
      <p>Certificate ID: ${certificateId}</p>
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([content], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `FreeCertify_${examType}_Certificate_${userName.replace(/\s+/g, '_')}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setIsDownloadingWord(false);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-auto">
      <div className="relative w-full max-w-5xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute -top-2 -right-2 z-10 p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors shadow-lg"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Certificate Container */}
        <div className="bg-slate-900 rounded-2xl shadow-2xl overflow-hidden">
          {/* Success Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-sky-600 p-6 text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Award className="w-10 h-10 text-yellow-300" />
              <h2 className="text-3xl font-bold text-white font-['Space_Grotesk']">
                🎉 Congratulations!
              </h2>
              <Award className="w-10 h-10 text-yellow-300" />
            </div>
            <p className="text-emerald-100 text-lg">
              You have successfully passed the exam!
            </p>
          </div>

          {/* Certificate Preview */}
          <div className="p-8 flex justify-center">
            <div
              ref={certificateRef}
              className="w-full max-w-4xl aspect-[1.414/1] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl border-4 border-double border-sky-500/50 p-8 md:p-12 relative overflow-hidden"
            >
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0" style={{
                  backgroundImage: `radial-gradient(circle at 25% 25%, #0ea5e9 1px, transparent 1px),
                                    radial-gradient(circle at 75% 75%, #0ea5e9 1px, transparent 1px)`,
                  backgroundSize: '50px 50px'
                }}></div>
              </div>

              {/* Corner Decorations */}
              <div className="absolute top-4 left-4 w-16 h-16 border-l-4 border-t-4 border-sky-500/40 rounded-tl-lg"></div>
              <div className="absolute top-4 right-4 w-16 h-16 border-r-4 border-t-4 border-sky-500/40 rounded-tr-lg"></div>
              <div className="absolute bottom-4 left-4 w-16 h-16 border-l-4 border-b-4 border-sky-500/40 rounded-bl-lg"></div>
              <div className="absolute bottom-4 right-4 w-16 h-16 border-r-4 border-b-4 border-sky-500/40 rounded-br-lg"></div>

              {/* Certificate Content */}
              <div className="relative z-10 flex flex-col items-center justify-between h-full text-center">
                {/* Logo */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-sky-400 to-sky-600 rounded-xl flex items-center justify-center shadow-lg shadow-sky-500/30">
                    <span className="text-2xl">🎓</span>
                  </div>
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-sky-400 font-['Space_Grotesk'] tracking-wider">
                      FreeCertify
                    </h1>
                    <p className="text-xs text-slate-500 tracking-widest uppercase">Cloud Certification Platform</p>
                  </div>
                </div>

                {/* Title */}
                <div className="my-4">
                  <h2 className="text-3xl md:text-4xl font-bold text-white font-['Space_Grotesk'] tracking-[0.2em] uppercase mb-2">
                    Certificate
                  </h2>
                  <p className="text-slate-400 text-lg tracking-widest uppercase">of Achievement</p>
                </div>

                {/* Certification Statement */}
                <div className="text-center">
                  <p className="text-slate-400 text-lg mb-4 tracking-wide">
                    This is to certify that{' '}
                    <span className="text-sky-400 font-bold text-2xl md:text-3xl font-['Space_Grotesk'] border-b-2 border-sky-500/30 pb-1">
                      {userName}
                    </span>{' '}
                    has successfully completed the
                  </p>
                  <h4 className="text-xl md:text-2xl font-semibold text-white mb-2">
                    {getExamFullName(examType)}
                  </h4>
                  <p className="text-slate-400 text-sm">Practice Examination</p>
                </div>

                {/* Score */}
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <CheckCircle className="w-8 h-8 text-emerald-400" />
                      <span className="text-4xl md:text-5xl font-bold text-emerald-400 font-['Space_Grotesk']">
                        {percentage}%
                      </span>
                    </div>
                    <p className="text-slate-400 text-sm mt-1">
                      {score} / {totalQuestions} Questions Correct
                    </p>
                  </div>
                </div>

                {/* Footer */}
                <div className="w-full flex justify-between items-end text-xs text-slate-500">
                  <div className="text-left">
                    <p className="font-semibold text-slate-400">Date of Completion</p>
                    <p>{formatDate(completionDate)}</p>
                  </div>
                  <div className="text-center">
                    <div className="w-32 border-t border-slate-600 pt-2">
                      <p className="text-slate-400 font-semibold">Karl Siaka</p>
                      <p className="text-slate-500">Founder, FreeCertify</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-400">Certificate ID</p>
                    <p className="font-mono">{certificateId}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Download Options */}
          <div className="bg-slate-800/50 p-6 border-t border-slate-700">
            <p className="text-center text-slate-400 mb-4">Download your certificate</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={downloadAsPDF}
                disabled={isDownloadingPDF}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 disabled:from-sky-800 disabled:to-sky-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-sky-500/25 hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
              >
                {isDownloadingPDF ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Download className="w-5 h-5" />
                )}
                {isDownloadingPDF ? 'Generating...' : 'Download PDF'}
              </button>
              <button
                onClick={downloadAsWord}
                disabled={isDownloadingWord}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 disabled:from-purple-800 disabled:to-purple-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-purple-500/25 hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
              >
                {isDownloadingWord ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <FileText className="w-5 h-5" />
                )}
                {isDownloadingWord ? 'Generating...' : 'Download Word'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Certificate;

