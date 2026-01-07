# AWS Practice Exam Platform

A full-stack web application designed to help users prepare for AWS certification exams. Features a React/TypeScript frontend with a Django REST API backend, Firebase authentication, and Google Analytics integration.

## 🏗️ Architecture

| Component | Technology | Deployment |
|-----------|------------|------------|
| **Frontend** | React + TypeScript + Vite + Tailwind CSS | Render Static Site (Free) |
| **Backend** | Django + Django REST Framework | Render Web Service |
| **Database** | PostgreSQL | Render Database |
| **Authentication** | Firebase Auth (Google & GitHub) | Firebase |
| **Analytics** | Google Analytics 4 | Google |

## ✨ Features

- 📝 **Practice Exams** - Simulated exam environment for AWS certifications (Cloud Practitioner, Solutions Architect, Developer)
- ⏱️ **Timed Mode** - Realistic exam timer with progress tracking
- 🔐 **User Authentication** - Secure sign-up/login with Google and GitHub via Firebase
- 📊 **Progress Tracking** - Track scores and performance over time
- 📈 **Analytics Dashboard** - View exam statistics and performance metrics
- 🌐 **Multi-language Support** - English and French language options
- 📜 **Certificate Generation** - Generate PDF certificates for completed exams
- 🎯 **Random Question Selection** - Dynamic question selection from question pools

## 📁 Project Structure

```
aws_exam_complete_with_auth_analytics/
├── backend/                          # Django REST API
│   ├── aws_exam_backend/             # Django project settings
│   ├── exams/                        # Exam app (models, views, serializers)
│   │   ├── management/commands/      # Custom management commands
│   │   └── migrations/               # Database migrations
│   ├── requirements.txt              # Python dependencies
│   └── build.sh                      # Render build script
├── typescript_simplified_app_with_timer/  # React Frontend
│   ├── src/
│   │   ├── components/               # React components
│   │   ├── config/                   # Firebase configuration
│   │   ├── hooks/                    # Custom React hooks
│   │   └── utils/                    # Utility functions
│   ├── public/                       # Static assets
│   └── package.json                  # Node.js dependencies
├── render.yaml                       # Render Blueprint (IaC)
└── *.md                              # Documentation files
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Python 3.12+
- Firebase account (for authentication)
- Google Analytics account (optional)

### Local Development

#### Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

pip install -r requirements.txt
python manage.py migrate
python manage.py create_exams  # Load sample questions
python manage.py runserver
```

Backend runs at: `http://localhost:8000`

#### Frontend Setup

```bash
cd typescript_simplified_app_with_timer
npm install
npm run dev
```

Frontend runs at: `http://localhost:5173`

### Environment Variables

#### Backend (.env)
```env
DJANGO_SECRET_KEY=your-secret-key
DEBUG=True
DATABASE_URL=sqlite:///db.sqlite3
OPENAI_API_KEY=your-openai-key  # Optional, for question generation
```

#### Frontend
Create `src/config/firebase.ts` with your Firebase configuration.

## ☁️ Deployment on Render

This project includes a `render.yaml` Blueprint for easy deployment on Render.

### One-Click Deploy

1. Push code to GitHub
2. Go to [Render Dashboard](https://dashboard.render.com)
3. Click **New** → **Blueprint**
4. Connect your repository
5. Render auto-deploys all services

### Monthly Cost: ~$14

| Service | Plan | Cost |
|---------|------|------|
| Frontend | Static Site (Free) | $0 |
| Backend | Starter | $7 |
| PostgreSQL | Starter | $7 |

See [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md) for detailed deployment instructions.

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md) | Render platform deployment guide |
| [NETLIFY_DEPLOYMENT.md](./NETLIFY_DEPLOYMENT.md) | Netlify deployment alternative |
| [LOCAL_DEVELOPMENT.md](./LOCAL_DEVELOPMENT.md) | Local setup instructions |
| [FIREBASE_SETUP.md](./typescript_simplified_app_with_timer/FIREBASE_SETUP.md) | Firebase authentication setup |
| [ANALYTICS_SETUP.md](./typescript_simplified_app_with_timer/ANALYTICS_SETUP.md) | Google Analytics configuration |
| [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) | Common issues and solutions |

## 🔧 Tech Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type-safe JavaScript
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Firebase** - Authentication
- **React GA4** - Analytics integration
- **Recharts** - Data visualization
- **Lucide React** - Icon library

### Backend
- **Django 5** - Python web framework
- **Django REST Framework** - API toolkit
- **PostgreSQL** - Production database
- **Gunicorn** - WSGI HTTP server
- **Whitenoise** - Static file serving

## 🧪 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/exams/` | GET | List all exams |
| `/api/exams/{id}/` | GET | Get exam details |
| `/api/exams/{id}/questions/` | GET | Get random questions for exam |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is private and proprietary.

## 🆘 Support

For issues, questions, or contributions, please open an issue in the GitHub repository.

