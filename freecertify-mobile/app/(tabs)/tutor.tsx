import { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '../../constants/theme';
import { TUTOR_SYLLABI } from '../../constants/tutorSyllabi';
import { buildWelcomeMessage, getQuickPrompts } from '../../constants/tutorPrompts';
import { useUserStore } from '../../stores/useUserStore';
import {
  API_BASE_URL,
  checkBackendReachable,
  getSyllabusLectures,
  streamChatWithSyllabusAssistant,
  type AssistantChatMessage,
  type SyllabusLecturePlan,
} from '../../utils/api';

const POWERED_BY_LABEL = 'Powered by AI';

export default function TutorTab() {
  const { user } = useUserStore();
  const [selectedSyllabus, setSelectedSyllabus] = useState<string | null>(null);
  const [lecturePlan, setLecturePlan] = useState<SyllabusLecturePlan | null>(null);
  const [messages, setMessages] = useState<AssistantChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [syllabusLoading, setSyllabusLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const handleSelectSyllabus = async (syllabusId: string) => {
    setSelectedSyllabus(syllabusId);
    setSyllabusLoading(true);
    setLecturePlan(null);
    setMessages([]);
    setError(null);
    setStatusMsg(null);

    try {
      setStatusMsg('Connecting to study server...');
      await checkBackendReachable();
      const plan = await getSyllabusLectures(syllabusId, () => {
        setStatusMsg('Server is waking up, please wait...');
      });
      setLecturePlan(plan);
      setMessages([
        {
          role: 'assistant',
          content: buildWelcomeMessage(plan.syllabus_label, plan.overview),
        },
      ]);
    } catch (e: any) {
      const msg = e?.message || 'Could not load your study plan.';
      const isNetwork =
        msg.includes('Network') ||
        msg.includes('fetch') ||
        msg.includes('abort') ||
        msg.includes('Failed to connect');
      setError(
        isNetwork
          ? `Cannot reach the backend at ${API_BASE_URL}. Restart Metro with "npx expo start --clear" after .env changes.`
          : msg,
      );
      setMessages([
        {
          role: 'assistant',
          content: isNetwork
            ? `I could not connect to ${API_BASE_URL}. Ensure Django is running on your PC and Metro was restarted after updating EXPO_PUBLIC_API_BASE_URL.`
            : `Something went wrong: ${msg}`,
        },
      ]);
    } finally {
      setSyllabusLoading(false);
      setStatusMsg(null);
    }
  };

  const sendMessage = useCallback(
    async (userMessage: string) => {
      if (!userMessage.trim() || loading || !selectedSyllabus || !lecturePlan) return;

      setInput('');
      setError(null);

      const onTopicHistory = messages.filter(m => !m.off_topic);
      const withUser: AssistantChatMessage[] = [
        ...messages,
        { role: 'user', content: userMessage },
      ];
      const withPlaceholder: AssistantChatMessage[] = [
        ...withUser,
        { role: 'assistant', content: '', off_topic: false },
      ];
      setMessages(withPlaceholder);
      setLoading(true);

      const acc = { text: '' };

      try {
        await streamChatWithSyllabusAssistant(
          selectedSyllabus,
          userMessage,
          lecturePlan.lectures,
          onTopicHistory,
          (delta) => {
            acc.text += delta;
            const snapshot = acc.text;
            setMessages(prev => {
              const updated = [...prev];
              updated[updated.length - 1] = {
                role: 'assistant',
                content: snapshot,
                off_topic: false,
              };
              return updated;
            });
          },
          (offTopic) => {
            if (offTopic) {
              setMessages(prev => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                updated[updated.length - 1] = {
                  role: 'assistant',
                  content: last.content || 'I can only help with topics related to this subject.',
                  off_topic: true,
                };
                return updated;
              });
            }
            setLoading(false);
            setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 200);
          },
          (errMsg) => {
            setError(errMsg);
            setMessages(prev => {
              const updated = [...prev];
              updated[updated.length - 1] = {
                role: 'assistant',
                content: `I could not answer right now: ${errMsg}`,
              };
              return updated;
            });
            setLoading(false);
          },
        );
      } catch (e: any) {
        const msg = e?.message || 'Assistant failed to respond.';
        setError(msg);
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: 'assistant',
            content: `I could not answer right now: ${msg}`,
          };
          return updated;
        });
        setLoading(false);
      }
    },
    [loading, selectedSyllabus, lecturePlan, messages],
  );

  const handleSend = () => sendMessage(input.trim());

  if (!user) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.guestPrompt}>
          <Text style={styles.guestEmoji}>🤖</Text>
          <Text style={styles.guestTitle}>AI Study Tutor</Text>
          <Text style={styles.poweredBy}>{POWERED_BY_LABEL}</Text>
          <Text style={styles.guestSub}>
            Sign in to unlock step-by-step tutorials, study plans, and hands-on guidance for
            Python, JavaScript, Java, Prompt Engineering, and AI Fundamentals.
          </Text>
          <TouchableOpacity
            style={styles.signInBtn}
            onPress={() => router.push('/login')}
            activeOpacity={0.85}
          >
            <Text style={styles.signInBtnText}>Sign In to Unlock</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!selectedSyllabus) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.title}>AI Study Tutor</Text>
          <Text style={styles.poweredBy}>{POWERED_BY_LABEL}</Text>
          <Text style={styles.subtitle}>Choose a subject — get a roadmap, tutorials, and study steps</Text>
          {TUTOR_SYLLABI.map(s => (
            <TouchableOpacity
              key={s.id}
              style={[styles.subjectCard, { borderColor: s.color + '60' }]}
              onPress={() => handleSelectSyllabus(s.id)}
              activeOpacity={0.8}
            >
              <Text style={styles.subjectEmoji}>{s.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.subjectName, { color: s.color }]}>{s.name}</Text>
                <Text style={styles.subjectTagline}>{s.tagline}</Text>
              </View>
              <Text style={{ color: Colors.textMuted }}>→</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  const syllabus = TUTOR_SYLLABI.find(s => s.id === selectedSyllabus)!;
  const quickPrompts = getQuickPrompts(selectedSyllabus);

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <View style={[styles.chatHeader, { borderBottomColor: syllabus.color + '40' }]}>
          <TouchableOpacity
            onPress={() => {
              setSelectedSyllabus(null);
              setLecturePlan(null);
              setMessages([]);
              setError(null);
            }}
          >
            <Text style={styles.backBtn}>← Back</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.chatHeaderTitle}>{syllabus.emoji} {syllabus.name}</Text>
            <Text style={styles.chatHeaderPowered}>{POWERED_BY_LABEL}</Text>
          </View>
        </View>

        {syllabusLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={syllabus.color} />
            <Text style={styles.loadingText}>
              {statusMsg || 'Generating your lecture roadmap...'}
            </Text>
          </View>
        ) : (
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={styles.chatScroll}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
          >
            {lecturePlan && (
              <View style={styles.roadmapSection}>
                <Text style={styles.roadmapTitle}>Your study roadmap</Text>
                <Text style={styles.roadmapOverview}>{lecturePlan.overview}</Text>
                {lecturePlan.lectures.map((lecture, idx) => (
                  <View
                    key={`${lecture.title}-${idx}`}
                    style={[styles.lectureCard, { borderColor: syllabus.color + '40' }]}
                  >
                    <View style={styles.lectureHeader}>
                      <Text style={styles.lectureTitle}>
                        {idx + 1}. {lecture.title}
                      </Text>
                      <Text style={styles.lectureDuration}>{lecture.duration_minutes} min</Text>
                    </View>
                    <Text style={styles.lectureFocus}>{lecture.focus}</Text>
                    <Text style={[styles.lectureLab, { color: syllabus.color }]}>
                      Lab: {lecture.hands_on_lab}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            <Text style={styles.chatSectionTitle}>Chat with your tutor</Text>
            {error && <Text style={styles.errorBanner}>{error}</Text>}
            {messages.map((msg, i) => (
              <View
                key={i}
                style={[
                  styles.bubble,
                  msg.role === 'user' ? styles.bubbleUser : styles.bubbleAI,
                  msg.off_topic && styles.bubbleOffTopic,
                ]}
              >
                <Text
                  style={[
                    styles.bubbleText,
                    msg.role === 'user' ? styles.bubbleTextUser : styles.bubbleTextAI,
                  ]}
                >
                  {msg.content || (loading && i === messages.length - 1 ? ' ' : '')}
                </Text>
              </View>
            ))}
            {loading && messages[messages.length - 1]?.content === '' && (
              <View style={styles.bubbleAI}>
                <ActivityIndicator size="small" color={syllabus.color} />
              </View>
            )}
          </ScrollView>
        )}

        {!syllabusLoading && lecturePlan && (
          <View style={styles.quickPromptSection}>
            <Text style={styles.quickPromptTitle}>Suggested questions</Text>
            <View style={styles.quickPromptWrap}>
              {quickPrompts.map(item => (
                <TouchableOpacity
                  key={item.label}
                  style={[styles.quickPromptChip, { borderColor: syllabus.color + '80' }]}
                  onPress={() => sendMessage(item.message)}
                  disabled={loading}
                  activeOpacity={0.75}
                >
                  <Text style={styles.quickPromptText}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={styles.inputRow}>
          <TextInput
            style={styles.textInput}
            value={input}
            onChangeText={setInput}
            placeholder={`Ask for tutorials, steps, or help with ${syllabus.name}...`}
            placeholderTextColor={Colors.textMuted}
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={handleSend}
            editable={!loading && !syllabusLoading && !!lecturePlan}
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              { backgroundColor: syllabus.color },
              (!input.trim() || loading || syllabusLoading || !lecturePlan) && styles.sendBtnDisabled,
            ]}
            onPress={handleSend}
            disabled={!input.trim() || loading || syllabusLoading || !lecturePlan}
          >
            <Text style={styles.sendBtnText}>→</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bgDeep },
  scroll: { padding: Spacing.lg },
  title: { color: Colors.textPrimary, fontSize: FontSize.xxl, fontWeight: FontWeight.black, marginBottom: 4 },
  subtitle: { color: Colors.textMuted, fontSize: FontSize.md, marginBottom: Spacing.lg },
  subjectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgDark,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  subjectEmoji: { fontSize: 32 },
  subjectName: { fontSize: FontSize.md, fontWeight: FontWeight.bold },
  subjectTagline: { color: Colors.textMuted, fontSize: FontSize.sm, marginTop: 2 },
  guestPrompt: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  guestEmoji: { fontSize: 80, marginBottom: Spacing.lg },
  guestTitle: { color: Colors.textPrimary, fontSize: FontSize.xxl, fontWeight: FontWeight.black, marginBottom: Spacing.sm },
  poweredBy: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  guestSub: { color: Colors.textSecondary, fontSize: FontSize.md, textAlign: 'center', marginBottom: Spacing.lg },
  signInBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  signInBtnText: { color: Colors.bgDeep, fontWeight: FontWeight.black, fontSize: FontSize.md },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
    borderBottomWidth: 1,
    backgroundColor: Colors.bgDark,
  },
  backBtn: { color: Colors.primary, fontSize: FontSize.md },
  chatHeaderTitle: { color: Colors.textPrimary, fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  chatHeaderPowered: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 },
  chatScroll: { padding: Spacing.md, gap: Spacing.sm },
  roadmapSection: { marginBottom: Spacing.md },
  roadmapTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.sm,
  },
  roadmapOverview: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  lectureCard: {
    backgroundColor: Colors.bgDark,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  lectureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginBottom: 4,
  },
  lectureTitle: { flex: 1, color: Colors.textPrimary, fontWeight: FontWeight.bold, fontSize: FontSize.sm },
  lectureDuration: { color: Colors.textMuted, fontSize: FontSize.xs },
  lectureFocus: { color: Colors.textSecondary, fontSize: FontSize.sm, marginBottom: 4 },
  lectureLab: { fontSize: FontSize.xs },
  chatSectionTitle: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  loadingText: { color: Colors.textSecondary, fontSize: FontSize.sm, textAlign: 'center', paddingHorizontal: Spacing.lg },
  errorBanner: {
    color: Colors.error,
    fontSize: FontSize.sm,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  bubble: {
    maxWidth: '85%',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  bubbleUser: { alignSelf: 'flex-end', backgroundColor: Colors.primary },
  bubbleAI: { alignSelf: 'flex-start', backgroundColor: Colors.bgDark, borderWidth: 1, borderColor: Colors.border },
  bubbleOffTopic: { borderColor: Colors.warning, backgroundColor: Colors.bgDark },
  bubbleText: { fontSize: FontSize.md, lineHeight: 22 },
  bubbleTextUser: { color: Colors.bgDeep },
  bubbleTextAI: { color: Colors.textPrimary },
  quickPromptSection: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.bgDark,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  quickPromptTitle: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
  },
  quickPromptWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  quickPromptChip: {
    backgroundColor: Colors.bgMid,
    borderRadius: Radius.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
  },
  quickPromptText: {
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    lineHeight: 18,
  },
  inputRow: {
    flexDirection: 'row',
    padding: Spacing.md,
    gap: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.bgDark,
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    backgroundColor: Colors.bgMid,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    maxHeight: 120,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnText: { color: '#fff', fontSize: FontSize.lg, fontWeight: FontWeight.bold },
});
