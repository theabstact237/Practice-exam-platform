"""Generate PDF documenting AI Assistant and Exam question flows."""
from pathlib import Path

from fpdf import FPDF

OUT = Path(__file__).resolve().parents[1] / "docs" / "AI-Assistant-and-Exam-Flows.pdf"


class FlowPDF(FPDF):
    def header(self):
        if self.page_no() > 1:
            self.set_font("Helvetica", "I", 8)
            self.set_text_color(100, 100, 100)
            self.cell(0, 8, "Practice Exam Platform - Flow Documentation", align="R", new_x="LMARGIN", new_y="NEXT")
            self.ln(2)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(120, 120, 120)
        self.cell(0, 10, f"Page {self.page_no()}", align="C")

    def title_page(self):
        self.add_page()
        self.set_font("Helvetica", "B", 22)
        self.set_text_color(15, 23, 42)
        self.ln(40)
        self.multi_cell(0, 12, "Practice Exam Platform\nArchitecture Flows", align="C")
        self.ln(8)
        self.set_font("Helvetica", "", 14)
        self.set_text_color(51, 65, 85)
        self.multi_cell(
            0,
            8,
            "Flow 1: AI Study Assistant (modal to CachedChatResponse)\n"
            "Flow 2: Exam Questions (ExamViewSet to QuestionGenerator)",
            align="C",
        )
        self.ln(20)
        self.set_font("Helvetica", "I", 11)
        self.cell(0, 8, "aws-project-4f082 | Web + Django backend", align="C", new_x="LMARGIN", new_y="NEXT")

    def h1(self, text: str):
        self.set_font("Helvetica", "B", 16)
        self.set_text_color(15, 23, 42)
        self.ln(4)
        self.set_x(self.l_margin)
        self.multi_cell(self.epw, 9, text)
        self.ln(2)

    def h2(self, text: str):
        self.set_font("Helvetica", "B", 12)
        self.set_text_color(30, 58, 138)
        self.ln(2)
        self.set_x(self.l_margin)
        self.multi_cell(self.epw, 7, text)
        self.ln(1)

    def body(self, text: str):
        self.set_font("Helvetica", "", 10)
        self.set_text_color(30, 41, 59)
        self.set_x(self.l_margin)
        self.multi_cell(self.epw, 5.5, text)
        self.ln(1)

    def bullet(self, text: str):
        self.set_font("Helvetica", "", 10)
        self.set_text_color(30, 41, 59)
        self.set_x(self.l_margin)
        self.multi_cell(self.epw, 5.5, f"  - {text}")

    def code_block(self, text: str):
        self.set_font("Courier", "", 8.5)
        self.set_fill_color(241, 245, 249)
        self.set_text_color(15, 23, 42)
        for line in text.split("\n"):
            self.cell(0, 4.5, f"  {line}", new_x="LMARGIN", new_y="NEXT", fill=True)
        self.ln(2)

    def table_row(self, cols: list[str], bold: bool = False):
        w = [52, 68, 70]
        self.set_font("Helvetica", "B" if bold else "", 8.5 if bold else 8)
        if bold:
            self.set_fill_color(226, 232, 240)
            self.set_text_color(15, 23, 42)
        else:
            self.set_fill_color(255, 255, 255)
            self.set_text_color(30, 41, 59)
        h = 6
        for i, col in enumerate(cols):
            self.cell(w[i], h, col[:42], border=1, fill=bold)
        self.ln(h)


def build():
    pdf = FlowPDF()
    pdf.set_auto_page_break(auto=True, margin=18)
    pdf.title_page()

    # --- Flow 1 ---
    pdf.add_page()
    pdf.h1("Flow 1: AI Study Assistant")
    pdf.body(
        "Traces the path from the web UI modal through the Django backend to "
        "SyllabusAssistantService and CachedChatResponse. Both web and mobile "
        "share the same Firebase project (aws-project-4f082)."
    )

    pdf.h2("User journey (step by step)")
    steps1 = [
        "User opens AI Study Assistant modal and picks a syllabus "
        "(solutions_architect, cloud_practitioner, or developer).",
        "AIAssistantModal calls onSelectSyllabus, then App.tsx handleSyllabusSelection.",
        "App calls api.ts getSyllabusLectures(syllabus) -> POST /assistant/syllabus-lectures/.",
        "urls.py syllabus_assistant checks CachedLecturePlan (7-day TTL).",
        "On cache miss: SyllabusAssistantService.generate_lecture_plan() via Groq/DeepSeek.",
        "Lecture plan saved to CachedLecturePlan; UI shows roadmap + chat panel.",
        "User sends a message via sendChatMessage and streamChatWithSyllabusAssistant.",
        "POST /assistant/chat/stream/ (Server-Sent Events).",
        "Standalone questions only (history length <= 1): lookup CachedChatResponse by hash.",
        "Cache hit: instant SSE response, provider=cache. Miss: stream from AI, save to DB.",
        "App.tsx onDelta updates chat bubble with typing effect; onDone handles off-topic.",
    ]
    for s in steps1:
        pdf.bullet(s)
    pdf.ln(2)

    pdf.h2("Key files")
    pdf.code_block(
        "typescript_simplified_app_with_timer/src/components/AIAssistantModal.tsx\n"
        "typescript_simplified_app_with_timer/src/App.tsx (handleSyllabusSelection, sendChatMessage)\n"
        "typescript_simplified_app_with_timer/src/utils/api.ts (getSyllabusLectures, streamChatWithSyllabusAssistant)\n"
        "backend/exams/urls.py (syllabus_assistant, syllabus_assistant_chat_stream)\n"
        "backend/exams/assistant.py (SyllabusAssistantService)\n"
        "backend/exams/models.py (CachedLecturePlan, CachedChatResponse)"
    )

    pdf.h2("Assistant cache rules")
    pdf.bullet("CachedLecturePlan: one row per syllabus, 7-day staleness check.")
    pdf.bullet("CachedChatResponse: global cache keyed by (syllabus, MD5 of normalized question).")
    pdf.bullet("Only standalone questions cached (history <= 1); multi-turn bypasses cache.")
    pdf.bullet("Off-topic messages filtered by regex before AI call; UI shows amber warning.")

    pdf.h2("Sequence (text diagram)")
    pdf.code_block(
        "User -> AIAssistantModal -> App.tsx -> api.ts\n"
        "  -> POST /assistant/syllabus-lectures/ -> CachedLecturePlan | SyllabusAssistantService\n"
        "User -> chat input -> streamChatWithSyllabusAssistant\n"
        "  -> POST /assistant/chat/stream/ -> CachedChatResponse | stream_chat_about_syllabus\n"
        "  -> SSE deltas -> App onDelta -> modal chat bubble"
    )

    # --- Flow 2 ---
    pdf.add_page()
    pdf.h1("Flow 2: Exam Questions")
    pdf.body(
        "Traces how a user starts a practice exam: pre-generation fills the "
        "question pool via QuestionGenerator; random_questions serves a sample "
        "from PostgreSQL with a Django cache layer for question IDs."
    )

    pdf.h2("User journey (step by step)")
    steps2 = [
        "User clicks an exam tab (e.g. Solutions Architect).",
        "App.tsx handleExamTypeChange calls preGenerateExamQuestions(exam_type).",
        "POST /exams/pre-generate/ hits ExamViewSet.pre_generate_questions.",
        "DB-first: if questions exist, return immediately (source: database).",
        "If pool empty: QuestionGenerator (Manus then OpenAI fallback) creates questions.",
        "Questions + answers saved to PostgreSQL; invalidate_exam_cache(exam_id).",
        "Exam page loads getOrGenerateExamQuestions (reads DB only, no AI).",
        "getExamsByType then GET /exams/{id}/random-questions/?limit=50.",
        "ExamViewSet.random_questions: Django cache exam_{id}_question_ids (1 hour).",
        "Random sample up to 100 from pool, return 50 with prefetched answers.",
        "App transforms API format and starts timed exam UI.",
    ]
    for s in steps2:
        pdf.bullet(s)
    pdf.ln(2)

    pdf.h2("Key files")
    pdf.code_block(
        "typescript_simplified_app_with_timer/src/App.tsx (handleExamTypeChange, loadQuestions)\n"
        "typescript_simplified_app_with_timer/src/utils/api.ts (preGenerateExamQuestions, getOrGenerateExamQuestions)\n"
        "backend/exams/views.py (pre_generate_questions, random_questions, invalidate_exam_cache)\n"
        "backend/exams/services.py (QuestionGenerator)\n"
        "backend/exams/models.py (Exam, Question, Answer)"
    )

    pdf.h2("Exam cache rules")
    pdf.bullet("Primary store: Question and Answer rows in PostgreSQL (permanent).")
    pdf.bullet("Hot cache: Django cache key exam_{id}_question_ids, 1-hour TTL.")
    pdf.bullet("AI runs only when DB pool is empty (or force_generate=true).")
    pdf.bullet("invalidate_exam_cache() clears ID list after new questions are generated.")

    pdf.h2("Sequence (text diagram)")
    pdf.code_block(
        "User -> exam tab -> preGenerateExamQuestions -> POST /exams/pre-generate/\n"
        "  -> DB count | QuestionGenerator -> save Question/Answer -> invalidate cache\n"
        "User -> exam page -> getOrGenerateExamQuestions -> getRandomExamQuestions\n"
        "  -> GET /exams/{id}/random-questions/ -> cache IDs | DB sample -> 50 questions"
    )

    # --- Comparison ---
    pdf.add_page()
    pdf.h1("Side-by-side comparison")
    pdf.ln(2)
    pdf.table_row(["Aspect", "AI Assistant", "Exam Questions"], bold=True)
    rows = [
        ("Primary store", "CachedLecturePlan, CachedChatResponse", "Question, Answer tables"),
        ("Hot cache", "None (DB per request)", "Django cache (question IDs)"),
        ("AI provider", "Groq then DeepSeek", "Manus then OpenAI"),
        ("When AI runs", "Lecture/chat cache miss", "Only when DB pool empty"),
        ("Reuse scope", "Global (shared chat answers)", "Per-exam pool (all users)"),
        ("Invalidation", "7-day staleness", "invalidate_exam_cache + 1h TTL"),
        ("Frontend entry", "AIAssistantModal + stream chat", "Exam tab + random-questions"),
        ("Routing hub", "urls.py (assistant views)", "views.py (ExamViewSet)"),
    ]
    for row in rows:
        pdf.table_row(list(row))

    pdf.ln(6)
    pdf.h2("Shared pattern")
    pdf.body(
        "Both systems follow serve-from-store-first, call-AI-only-on-miss. "
        "The assistant caches AI text responses for instant replay. "
        "The exam system caches structured question entities and samples them randomly. "
        "Same philosophy, different granularity."
    )

    pdf.h2("Product connection")
    pdf.body(
        "Both flows use the same syllabus keys (solutions_architect, cloud_practitioner, "
        "developer) and the same api.ts client. A user can study with the AI tutor (Flow 1), "
        "then switch to the exam tab (Flow 2) for the same certification track."
    )

    pdf.h2("Why SyllabusAssistantService bridges communities (graph insight)")
    pdf.body(
        "SyllabusAssistantService does not call views.py directly. urls.py is the hub "
        "that wires assistant endpoints and ExamViewSet into one API surface. Both share "
        "models.py and the same certification domain. The knowledge graph flagged high "
        "betweenness because this service sits at the intersection of AI study and exam practice."
    )

    OUT.parent.mkdir(parents=True, exist_ok=True)
    pdf.output(str(OUT))
    print(OUT)


if __name__ == "__main__":
    build()
