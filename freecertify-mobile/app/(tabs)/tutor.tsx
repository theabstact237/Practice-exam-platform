import { useState, useRef } from 'react';
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
import { Colors, Spacing, Radius, FontSize, FontWeight } from '../../constants/theme';
import { SUBJECTS } from '../../constants/subjects';
import { useUserStore } from '../../stores/useUserStore';
import { getSyllabusLectures } from '../../utils/api';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default function TutorTab() {
  const { user } = useUserStore();
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [subjectLoading, setSubjectLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const handleSelectSubject = async (subjectId: string) => {
    setSelectedSubject(subjectId);
    setSubjectLoading(true);
    setMessages([]);
    try {
      await getSyllabusLectures(subjectId);
      const subject = SUBJECTS.find(s => s.id === subjectId);
      setMessages([{
        role: 'assistant',
        content: `Hi! I'm your AI tutor for ${subject?.name}. Ask me anything about this subject — concepts, examples, practice problems, or study tips. 🎓`,
      }]);
    } catch {
      setMessages([{
        role: 'assistant',
        content: 'Hi! I\'m here to help you study. What questions do you have?',
      }]);
    } finally {
      setSubjectLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    // Add placeholder
    setMessages(prev => [...prev, { role: 'assistant', content: '...' }]);

    try {
      // In production: call the streaming endpoint from the backend
      // For now: show a helpful placeholder response
      await new Promise(r => setTimeout(r, 1000));
      const reply = `Great question about "${userMsg}"! In a full deployment, this connects to the AI backend for a real answer. Make sure your backend is running at the configured URL.`;
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: 'assistant', content: reply };
        return updated;
      });
    } catch {
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: 'assistant', content: 'Sorry, I could not connect to the AI right now. Try again later.' };
        return updated;
      });
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 200);
    }
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.guestPrompt}>
          <Text style={styles.guestEmoji}>🤖</Text>
          <Text style={styles.guestTitle}>AI Study Tutor</Text>
          <Text style={styles.guestSub}>Sign in to unlock your personal AI tutor that answers questions about any topic you're studying.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!selectedSubject) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.title}>AI Study Tutor</Text>
          <Text style={styles.subtitle}>Choose a subject to start</Text>
          {SUBJECTS.map(s => (
            <TouchableOpacity
              key={s.id}
              style={[styles.subjectCard, { borderColor: s.color + '60' }]}
              onPress={() => handleSelectSubject(s.id)}
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

  const subject = SUBJECTS.find(s => s.id === selectedSubject)!;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        {/* Header */}
        <View style={[styles.chatHeader, { borderBottomColor: subject.color + '40' }]}>
          <TouchableOpacity onPress={() => setSelectedSubject(null)}>
            <Text style={styles.backBtn}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.chatHeaderTitle}>{subject.emoji} {subject.name}</Text>
        </View>

        {/* Messages */}
        {subjectLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={subject.color} />
            <Text style={styles.loadingText}>Preparing your tutor...</Text>
          </View>
        ) : (
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={styles.chatScroll}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
          >
            {messages.map((msg, i) => (
              <View
                key={i}
                style={[
                  styles.bubble,
                  msg.role === 'user' ? styles.bubbleUser : styles.bubbleAI,
                ]}
              >
                <Text style={[
                  styles.bubbleText,
                  msg.role === 'user' ? styles.bubbleTextUser : styles.bubbleTextAI,
                ]}>
                  {msg.content}
                </Text>
              </View>
            ))}
            {loading && (
              <View style={styles.bubbleAI}>
                <ActivityIndicator size="small" color={subject.color} />
              </View>
            )}
          </ScrollView>
        )}

        {/* Input */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.textInput}
            value={input}
            onChangeText={setInput}
            placeholder={`Ask about ${subject.name}...`}
            placeholderTextColor={Colors.textMuted}
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity
            style={[styles.sendBtn, { backgroundColor: subject.color }, (!input.trim() || loading) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!input.trim() || loading}
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
  guestSub: { color: Colors.textSecondary, fontSize: FontSize.md, textAlign: 'center' },
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
  chatScroll: { padding: Spacing.md, gap: Spacing.sm },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  loadingText: { color: Colors.textSecondary, fontSize: FontSize.sm },
  bubble: {
    maxWidth: '80%',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  bubbleUser: { alignSelf: 'flex-end', backgroundColor: Colors.primary },
  bubbleAI: { alignSelf: 'flex-start', backgroundColor: Colors.bgDark, borderWidth: 1, borderColor: Colors.border },
  bubbleText: { fontSize: FontSize.md, lineHeight: 22 },
  bubbleTextUser: { color: Colors.bgDeep },
  bubbleTextAI: { color: Colors.textPrimary },
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
