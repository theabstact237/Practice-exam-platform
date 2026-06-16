import json
import re
from typing import Dict, List

import requests
from django.conf import settings


AWS_SYLLABUS_LABELS: Dict[str, str] = {
    "solutions_architect": "AWS Certified Solutions Architect - Associate",
    "cloud_practitioner": "AWS Certified Cloud Practitioner",
    "developer": "AWS Certified Developer - Associate",
}

# FreeCertify mobile app subjects (separate from web AWS tracks).
MOBILE_SYLLABUS_LABELS: Dict[str, str] = {
    "python": "Python Programming",
    "javascript": "JavaScript Programming",
    "java": "Java Programming",
    "prompt_engineering": "Prompt Engineering",
    "ai_fundamentals": "AI Fundamentals",
}

# Per-subject coaching context for the mobile tutor (tutorial + steps to succeed).
MOBILE_SYLLABUS_COACHING: Dict[str, Dict[str, str]] = {
    "python": {
        "focus": "Python syntax, variables, control flow, functions, OOP, modules, and small projects",
        "success_path": "basics → control flow → functions → data structures → OOP → libraries → capstone project",
        "extra": "Use short runnable code snippets. Suggest practice exercises after each explanation.",
    },
    "javascript": {
        "focus": "JavaScript fundamentals, DOM, async/await, ES6+, and building interactive web apps",
        "success_path": "syntax → functions → arrays/objects → DOM → async → mini web projects",
        "extra": "Show browser-friendly examples. Explain common pitfalls (scope, async, types).",
    },
    "java": {
        "focus": "Java syntax, OOP, collections, exceptions, and application structure",
        "success_path": "syntax → OOP → collections → exceptions → classes/packages → practice apps",
        "extra": "Use clear class/method examples. Tie concepts to real software development tasks.",
    },
    "prompt_engineering": {
        "focus": "clear instructions, roles, constraints, few-shot examples, chain-of-thought, and evaluation",
        "success_path": "prompt basics → structure → iteration → advanced patterns → real AI workflows",
        "extra": (
            "Always teach with before/after prompt examples. Explain why each instruction works. "
            "Give the learner a reusable template and steps to refine their prompt."
        ),
    },
    "ai_fundamentals": {
        "focus": "ML basics, neural networks, LLMs, training vs inference, and responsible AI",
        "success_path": "AI concepts → ML overview → neural nets → LLMs → ethics → applied understanding",
        "extra": "Use simple analogies for hard concepts. Connect theory to everyday AI tools.",
    },
}

SYLLABUS_LABELS: Dict[str, str] = {**AWS_SYLLABUS_LABELS, **MOBILE_SYLLABUS_LABELS}

# Hard-block: messages that explicitly reference completely unrelated topics.
# Keep this list narrow and obvious — false positives are worse than letting
# borderline messages through (the AI system prompt handles those).
_OFFTOPIC_PATTERNS = re.compile(
    r"\b("
    r"recipe|cooking|restaurant|movie|film|soccer|basketball|football|"
    r"weather|forecast|bitcoin|crypto|forex|dating|relationship|"
    r"politics|election|religion|prayer|"
    r"instagram|tiktok|netflix|"
    r"medical advice|doctor|legal advice|lawyer"
    r")\b",
    re.IGNORECASE,
)

AWS_OFF_TOPIC_REPLY = (
    "I can only help with topics related to your AWS certification study plan. "
    "Please ask me about AWS services, exam concepts, lecture content, or study strategies."
)

# Backwards-compatible alias used by tests and imports.
OFF_TOPIC_REPLY = AWS_OFF_TOPIC_REPLY


def _is_aws_syllabus(syllabus: str) -> bool:
    return syllabus in AWS_SYLLABUS_LABELS


def _off_topic_reply(syllabus: str, syllabus_label: str) -> str:
    if _is_aws_syllabus(syllabus):
        return AWS_OFF_TOPIC_REPLY
    return (
        f"I can only help with topics related to {syllabus_label}. "
        "Please ask me about concepts, examples, practice problems, or study strategies for this subject."
    )


class SyllabusAssistantService:
    """Generate syllabus-specific lecture recommendations with provider fallback."""

    def __init__(self) -> None:
        self.deepseek_api_key = getattr(settings, "DEEPSEEK_API_KEY", "")
        self.groq_api_key = getattr(settings, "GROQ_API_KEY", "")
        self.deepseek_base_url = getattr(settings, "DEEPSEEK_BASE_URL", "https://api.deepseek.com")
        self.groq_base_url = getattr(settings, "GROQ_BASE_URL", "https://api.groq.com/openai")
        self.deepseek_model = getattr(settings, "DEEPSEEK_MODEL", "deepseek-chat")
        self.groq_model = getattr(settings, "GROQ_MODEL", "llama-3.1-8b-instant")

    def generate_lecture_plan(self, syllabus: str) -> Dict:
        if syllabus not in SYLLABUS_LABELS:
            raise ValueError("Invalid syllabus selected.")

        syllabus_label = SYLLABUS_LABELS[syllabus]
        prompt = self._build_prompt(syllabus, syllabus_label)
        errors: List[str] = []

        system_content = self._lecture_system_prompt(syllabus)

        if self.groq_api_key:
            try:
                content = self._single_turn_completion(
                    base_url=self.groq_base_url,
                    api_key=self.groq_api_key,
                    model=self.groq_model,
                    system_content=system_content,
                    prompt=prompt,
                )
                return self._parse_response(content, syllabus, syllabus_label, "groq")
            except Exception as exc:
                errors.append(f"Groq failed: {exc}")

        if self.deepseek_api_key:
            try:
                content = self._single_turn_completion(
                    base_url=self.deepseek_base_url,
                    api_key=self.deepseek_api_key,
                    model=self.deepseek_model,
                    system_content=system_content,
                    prompt=prompt,
                )
                return self._parse_response(content, syllabus, syllabus_label, "deepseek")
            except Exception as exc:
                errors.append(f"DeepSeek failed: {exc}")

        if errors:
            raise RuntimeError("All AI providers failed. " + " | ".join(errors))
        raise RuntimeError("No AI provider configured. Set DEEPSEEK_API_KEY or GROQ_API_KEY.")

    def _is_off_topic(self, message: str) -> bool:
        """Return True only if the message contains an explicit off-topic keyword.
        Borderline/ambiguous messages are intentionally passed to the AI — the
        system prompt instructs it to refuse anything unrelated to the syllabus.
        """
        text = message.strip()
        if not text:
            return False
        return bool(_OFFTOPIC_PATTERNS.search(text))

    def chat_about_syllabus(
        self,
        syllabus: str,
        user_message: str,
        lectures: List[Dict] | None = None,
        history: List[Dict] | None = None,
    ) -> Dict:
        if syllabus not in SYLLABUS_LABELS:
            raise ValueError("Invalid syllabus selected.")
        if not user_message or not user_message.strip():
            raise ValueError("Message is required.")

        # Layer 1: zero-token pre-filter — block obvious off-topic messages immediately
        syllabus_label = SYLLABUS_LABELS[syllabus]
        off_topic_reply = _off_topic_reply(syllabus, syllabus_label)

        if self._is_off_topic(user_message):
            return {
                "syllabus": syllabus,
                "provider": "filter",
                "reply": off_topic_reply,
                "off_topic": True,
            }
        lectures_json = json.dumps(lectures or [], ensure_ascii=True)

        system_content = self._build_chat_system(syllabus, syllabus_label, lectures_json)
        messages = self._build_chat_messages(system_content, history or [], user_message)
        errors: List[str] = []

        if self.groq_api_key:
            try:
                content = self._multi_turn_completion(
                    base_url=self.groq_base_url,
                    api_key=self.groq_api_key,
                    model=self.groq_model,
                    messages=messages,
                )
                return self._build_chat_reply(syllabus, "groq", content)
            except Exception as exc:
                errors.append(f"Groq failed: {exc}")

        if self.deepseek_api_key:
            try:
                content = self._multi_turn_completion(
                    base_url=self.deepseek_base_url,
                    api_key=self.deepseek_api_key,
                    model=self.deepseek_model,
                    messages=messages,
                )
                return self._build_chat_reply(syllabus, "deepseek", content)
            except Exception as exc:
                errors.append(f"DeepSeek failed: {exc}")

        if errors:
            raise RuntimeError("All AI providers failed. " + " | ".join(errors))
        raise RuntimeError("No AI provider configured. Set DEEPSEEK_API_KEY or GROQ_API_KEY.")

    def stream_chat_about_syllabus(
        self,
        syllabus: str,
        user_message: str,
        lectures: List[Dict] | None = None,
        history: List[Dict] | None = None,
    ):
        """Yield SSE chunks for a chat message. Raises on unrecoverable error."""
        if syllabus not in SYLLABUS_LABELS:
            raise ValueError("Invalid syllabus selected.")
        if not user_message or not user_message.strip():
            raise ValueError("Message is required.")

        # Layer 1: zero-token pre-filter
        syllabus_label = SYLLABUS_LABELS[syllabus]
        off_topic_reply = _off_topic_reply(syllabus, syllabus_label)

        if self._is_off_topic(user_message):
            yield f"data: {json.dumps({'off_topic': True, 'reply': off_topic_reply})}\n\n"
            return
        lectures_json = json.dumps(lectures or [], ensure_ascii=True)
        system_content = self._build_chat_system(syllabus, syllabus_label, lectures_json)
        on_topic_history = [m for m in (history or []) if not m.get("off_topic")]
        messages = self._build_chat_messages(system_content, on_topic_history, user_message)

        last_error: str = ""
        for base_url, api_key, model, provider in self._provider_chain():
            try:
                yield from self._stream_completion(base_url, api_key, model, messages, provider)
                return
            except Exception as exc:
                last_error = str(exc)

        raise RuntimeError(f"All AI providers failed. {last_error}")

    def _provider_chain(self):
        """Yield (base_url, api_key, model, provider_name) in priority order.
        Groq first (fastest, free), DeepSeek as fallback.
        """
        if self.groq_api_key:
            yield self.groq_base_url, self.groq_api_key, self.groq_model, "groq"
        if self.deepseek_api_key:
            yield self.deepseek_base_url, self.deepseek_api_key, self.deepseek_model, "deepseek"

    def _stream_completion(self, base_url: str, api_key: str, model: str, messages: List[Dict], provider: str):
        """Stream SSE delta chunks from an OpenAI-compatible endpoint."""
        endpoint = f"{base_url.rstrip('/')}/chat/completions"
        payload = {
            "model": model,
            "temperature": 0.4,
            "messages": messages,
            "stream": True,
            "max_tokens": 1000,
        }
        with requests.post(
            endpoint,
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json=payload,
            stream=True,
            timeout=90,
        ) as resp:
            resp.raise_for_status()
            for raw_line in resp.iter_lines():
                if not raw_line:
                    continue
                line = raw_line.decode("utf-8") if isinstance(raw_line, bytes) else raw_line
                if not line.startswith("data: "):
                    continue
                chunk_data = line[6:]
                if chunk_data.strip() == "[DONE]":
                    yield f"data: {json.dumps({'done': True, 'provider': provider})}\n\n"
                    return
                try:
                    chunk = json.loads(chunk_data)
                    delta = chunk["choices"][0]["delta"].get("content", "")
                    if delta:
                        yield f"data: {json.dumps({'delta': delta})}\n\n"
                except (KeyError, json.JSONDecodeError):
                    continue

    def _multi_turn_completion(
        self,
        base_url: str,
        api_key: str,
        model: str,
        messages: List[Dict],
    ) -> str:
        """Send a full messages array (system + history + latest user turn)."""
        endpoint = f"{base_url.rstrip('/')}/chat/completions"
        payload = {
            "model": model,
            "temperature": 0.4,
            "messages": messages,
            "max_tokens": 1000,
        }
        response = requests.post(
            endpoint,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=90,
        )
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"]

    def _single_turn_completion(
        self,
        base_url: str,
        api_key: str,
        model: str,
        system_content: str,
        prompt: str,
    ) -> str:
        """Convenience wrapper for one-shot prompts (lecture generation)."""
        endpoint = f"{base_url.rstrip('/')}/chat/completions"
        payload = {
            "model": model,
            "temperature": 0.3,
            "max_tokens": 1200,
            "messages": [
                {"role": "system", "content": system_content},
                {"role": "user", "content": prompt},
            ],
        }
        response = requests.post(
            endpoint,
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json=payload,
            timeout=90,
        )
        response.raise_for_status()
        return response.json()["choices"][0]["message"]["content"]

    def _lecture_system_prompt(self, syllabus: str) -> str:
        if _is_aws_syllabus(syllabus):
            return "You are an AWS certification coach that returns strict JSON only."
        return (
            "You are a curriculum designer for programming and technology education. "
            "Return strict JSON only."
        )

    def _build_prompt(self, syllabus: str, syllabus_label: str) -> str:
        json_shape = (
            '{"overview":"2 sentences","lectures":[{"title":"string","focus":"1 sentence",'
            '"duration_minutes":45,"resources":["res1","res2"],"hands_on_lab":"1 sentence"}]}'
        )
        if _is_aws_syllabus(syllabus):
            rules = "exactly 6 lectures, AWS exam-focused, fundamentals to exam strategy progression."
        else:
            coaching = MOBILE_SYLLABUS_COACHING.get(syllabus, {})
            rules = (
                f"exactly 6 lectures for {syllabus_label}, beginner-friendly progression from "
                f"fundamentals to applied practice. Focus: {coaching.get('focus', syllabus_label)}. "
                f"Learning path: {coaching.get('success_path', 'basics to advanced')}. "
                "Each lecture must include a concrete hands-on lab and actionable resources."
            )
        return f"""Return ONLY valid JSON. No explanation. No markdown.

Create a 6-lecture roadmap for: {syllabus_label}

JSON shape:
{json_shape}

Rules: {rules}"""

    def _mobile_coaching_block(self, syllabus: str, syllabus_label: str) -> str:
        coaching = MOBILE_SYLLABUS_COACHING.get(syllabus, {})
        focus = coaching.get("focus", syllabus_label)
        success_path = coaching.get("success_path", "fundamentals to practice")
        extra = coaching.get("extra", "")
        return f"""Subject focus: {focus}
Recommended learning path: {success_path}
{f"Teaching notes: {extra}" if extra else ""}

Your job is to help the learner succeed in {syllabus_label} by providing:
- Step-by-step tutorials and clear explanations
- Numbered action plans and study steps they can follow today
- Practical examples, mini exercises, and hands-on lab ideas
- Which lecture from the roadmap to study next (reference lecture titles)
- Study strategies, common mistakes to avoid, and encouragement

When the user asks how to learn something, structure your answer as:
1) Brief concept overview
2) Step-by-step instructions (numbered)
3) A small practice task or lab suggestion
4) Suggested next lecture or topic from the roadmap (when relevant)"""

    def _build_chat_system(self, syllabus: str, syllabus_label: str, lectures_json: str) -> str:
        off_topic_line = _off_topic_reply(syllabus, syllabus_label)
        if _is_aws_syllabus(syllabus):
            scope_rule = (
                "- Stay focused on this certification only\n"
                "- CRITICAL: If the user's question is not related to AWS, cloud computing, or this "
                f"certification exam, respond with EXACTLY this single line and nothing else: "
                f'"{off_topic_line}"\n'
                "- Never answer questions about cooking, movies, sports, news, relationships, "
                "or any non-AWS topic"
            )
            role = f"AWS certification study coach for {syllabus_label} ({syllabus})"
            coaching_block = (
                "Help the learner pass this certification with study plans, exam tips, "
                "service explanations, and lecture-guided practice."
            )
        else:
            scope_rule = (
                f"- Stay focused on {syllabus_label} only\n"
                "- CRITICAL: If the user's question is not related to this subject, respond with "
                f'EXACTLY this single line and nothing else: "{off_topic_line}"\n'
                "- Never answer questions about unrelated subjects, entertainment, or personal advice"
            )
            role = f"friendly study tutor and coach for {syllabus_label} ({syllabus})"
            coaching_block = self._mobile_coaching_block(syllabus, syllabus_label)

        return f"""You are a {role}.

{coaching_block}

Current lecture roadmap:
{lectures_json}

Rules:
- Be concise and direct — keep answers under 300 words unless a longer tutorial truly needs more
- Use bullet points or numbered lists for structure
- Reference specific lecture titles when relevant
- Prefer actionable steps the learner can follow immediately
{scope_rule}"""

    def _build_chat_reply(self, syllabus: str, provider: str, content: str) -> Dict:
        """Wrap AI reply, flagging it as off_topic if the AI itself refused the question."""
        reply = content.strip()
        off_topic = reply.startswith("I can only help with topics related to")
        return {
            "syllabus": syllabus,
            "provider": provider,
            "reply": reply,
            "off_topic": off_topic,
        }

    def _build_chat_messages(
        self,
        system_content: str,
        history: List[Dict],
        latest_user_message: str,
    ) -> List[Dict]:
        """Build the full messages array with system prompt, prior turns, and latest question."""
        messages: List[Dict] = [{"role": "system", "content": system_content}]

        max_history = 20
        trimmed = history[-max_history:] if len(history) > max_history else history
        for turn in trimmed:
            role = turn.get("role", "user")
            content = turn.get("content", "")
            if role in ("user", "assistant") and content:
                messages.append({"role": role, "content": content})

        messages.append({"role": "user", "content": latest_user_message})
        return messages

    def _parse_response(self, content: str, syllabus: str, syllabus_label: str, provider: str) -> Dict:
        cleaned = content.strip()
        if "```json" in cleaned:
            start = cleaned.find("```json") + 7
            end = cleaned.find("```", start)
            cleaned = cleaned[start:end].strip()
        elif cleaned.startswith("```"):
            cleaned = cleaned.strip("`").strip()

        parsed = json.loads(cleaned)
        lectures = parsed.get("lectures", [])
        if not isinstance(lectures, list) or len(lectures) == 0:
            raise ValueError("Invalid lecture structure returned by AI provider.")

        return {
            "syllabus": syllabus,
            "syllabus_label": syllabus_label,
            "provider": provider,
            "overview": parsed.get("overview", ""),
            "lectures": lectures,
        }
