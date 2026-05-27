/**
 * Shared mock data for API calls used across all tests.
 */

export const mockQuestion = {
  id: 1,
  question_text: 'Which AWS service provides scalable object storage?',
  question: 'Which AWS service provides scalable object storage?',
  domain: 'Storage',
  difficulty: 'easy',
  explanation: 'Amazon S3 (Simple Storage Service) is AWS scalable object storage.',
  correct_answer_letter: 'A',
  answers: [
    { letter: 'A', text: 'Amazon S3', is_correct: true },
    { letter: 'B', text: 'Amazon EC2', is_correct: false },
    { letter: 'C', text: 'Amazon RDS', is_correct: false },
    { letter: 'D', text: 'AWS Lambda', is_correct: false },
  ],
  options: [
    { letter: 'A', text: 'Amazon S3' },
    { letter: 'B', text: 'Amazon EC2' },
    { letter: 'C', text: 'Amazon RDS' },
    { letter: 'D', text: 'AWS Lambda' },
  ],
};

export const mockQuestionHard = {
  id: 2,
  question_text: 'Which VPC component controls inbound/outbound traffic at the subnet level?',
  question: 'Which VPC component controls inbound/outbound traffic at the subnet level?',
  domain: 'Networking',
  difficulty: 'hard',
  explanation: 'Network ACLs (NACLs) operate at the subnet level and are stateless.',
  correct_answer_letter: 'B',
  answers: [
    { letter: 'A', text: 'Security Group', is_correct: false },
    { letter: 'B', text: 'Network ACL', is_correct: true },
    { letter: 'C', text: 'Route Table', is_correct: false },
    { letter: 'D', text: 'Internet Gateway', is_correct: false },
  ],
  options: [
    { letter: 'A', text: 'Security Group' },
    { letter: 'B', text: 'Network ACL' },
    { letter: 'C', text: 'Route Table' },
    { letter: 'D', text: 'Internet Gateway' },
  ],
};

export const mockQuestions = [mockQuestion, mockQuestionHard];

export const mockExam = {
  id: 1,
  name: 'AWS Cloud Practitioner',
  exam_type: 'cloud_practitioner',
  description: 'Foundational AWS certification',
  total_questions: 50,
  passing_score: 70,
  is_active: true,
};

export const mockReviews = [
  {
    id: 1,
    user_name: 'Jane Doe',
    user_photo_url: '',
    exam_name: 'AWS Cloud Practitioner',
    rating: 5,
    comment: 'Excellent practice!',
    passed: true,
    exam_score: 85,
    created_at: '2026-05-01T10:00:00Z',
  },
];
