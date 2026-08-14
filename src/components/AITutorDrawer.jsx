import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Bot,
  Send,
  Sparkles,
  Lightbulb,
  BookOpen,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RotateCcw,
  Loader2,
  AlertTriangle,
  Zap
} from 'lucide-react';
import { AIService } from '../services/aiService';

export const AITutorDrawer = ({
  isOpen,
  onClose,
  assignment,
  course,
  currentProfile,
  onAddXP
}) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);

  // Quiz State
  const [quizMode, setQuizMode] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const messagesEndRef = useRef(null);

  const isChallenge = assignment?.isChallengeArea || (assignment?.confidence && assignment.confidence <= 2);

  useEffect(() => {
    if (assignment) {
      const welcomeText = isChallenge
        ? `👋 Hey ${currentProfile?.name?.split(' ')[0] || 'there'}! I see you marked **[${course?.code || 'Course'}] ${assignment.title}** as a **Growth & Challenge Area** (${assignment.skills?.join(', ') || 'focus skills'}).\n\nDon't worry — we will break down every equation and concept step-by-step together until you feel 100% confident!\n\n*Where would you like to begin?*`
        : `👋 Hey ${currentProfile?.name?.split(' ')[0] || 'there'}! I'm your Socratic AI Homework Companion for **[${course?.code || 'Course'}] ${assignment.title}**.\n\nI'm here to guide you step-by-step, clarify tricky concepts, and test your understanding without spoiling the answers.\n\n*How would you like to start?*`;

      setMessages([
        {
          id: 'welcome-1',
          sender: 'ai',
          text: welcomeText
        }
      ]);
      setQuizMode(false);
      setQuizQuestions([]);
      setCurrentQuizIndex(0);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
    }
  }, [assignment, course, isOpen, currentProfile]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (!isOpen || !assignment) return null;

  const handleSendMessage = async (textToSend = null) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || isLoading) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: text.trim()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const aiReply = await AIService.askTutor(assignment, course, text.trim(), messages, currentProfile);
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: aiReply
        }
      ]);
    } catch (err) {
      console.error('Tutor error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: 'ai',
          text: `⚠️ I had trouble connecting. Here is a quick tip: Focus on decomposing the problem into your active milestone: *${assignment.milestones?.[0]?.title || 'initial review'}*.`
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartQuiz = async () => {
    setIsLoading(true);
    try {
      const questions = await AIService.generateQuiz(assignment, course);
      setQuizQuestions(questions);
      setQuizMode(true);
      setCurrentQuizIndex(0);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
      setScore(0);
    } catch (err) {
      console.error('Quiz error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOptionSelect = (index) => {
    if (isAnswerSubmitted) return;
    setSelectedOption(index);
  };

  const handleSubmitQuizAnswer = () => {
    if (selectedOption === null) return;
    setIsAnswerSubmitted(true);
    const q = quizQuestions[currentQuizIndex];
    if (selectedOption === q.correctIndex) {
      setScore((prev) => prev + 1);
      if (onAddXP) onAddXP(15);
    }
  };

  const handleNextQuizQuestion = () => {
    if (currentQuizIndex < quizQuestions.length - 1) {
      setCurrentQuizIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
    } else {
      setQuizMode(false);
      const totalScore = score + (selectedOption === quizQuestions[currentQuizIndex].correctIndex ? 1 : 0);
      setMessages((prev) => [
        ...prev,
        {
          id: `quiz-summary-${Date.now()}`,
          sender: 'ai',
          text: `🎉 **Quiz Completed!** You scored **${totalScore}/${quizQuestions.length}** on *${assignment.title}*.\n\nGreat active recall work! You earned **+${totalScore * 15} XP**.`
        }
      ]);
    }
  };

  const copyToClipboard = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const renderMessageText = (text) => {
    return text.split('\n').map((line, i) => {
      let processed = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      processed = processed.replace(/\*(.*?)\*/g, '<em>$1</em>');
      return (
        <span
          key={i}
          style={{ display: 'block', minHeight: line.trim() ? 'auto' : '0.5rem' }}
          dangerouslySetInnerHTML={{ __html: processed }}
        />
      );
    });
  };

  return (
    <div className="tutor-drawer-backdrop" onClick={onClose}>
      <div className="tutor-drawer" onClick={(e) => e.stopPropagation()}>
        {/* Header with Mascot branding */}
        <div className="tutor-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <img
              src="/mascot.png"
              alt="Mascot Tutor"
              style={{
                width: '34px',
                height: '34px',
                borderRadius: 'var(--radius-md)',
                objectFit: 'cover',
                border: '1px solid var(--border-subtle)'
              }}
            />
            <div>
              <h3 style={{ fontSize: '1.05rem', margin: 0 }}>Socratic AI Tutor</h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Adaptive guidance for {currentProfile?.name}
              </span>
            </div>
          </div>

          <button onClick={onClose} className="btn btn-icon" style={{ width: '32px', height: '32px' }}>
            <X size={16} />
          </button>
        </div>

        {/* Current Assignment Context Card */}
        <div className="tutor-context-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span
              style={{
                fontSize: '0.725rem',
                fontWeight: 700,
                color: course?.color || 'var(--accent-primary)',
                textTransform: 'uppercase'
              }}
            >
              {course?.code || 'Course'}
            </span>

            {isChallenge ? (
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: 'var(--color-warning-text)',
                  background: 'var(--color-warning-subtle)',
                  padding: '0.1rem 0.45rem',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--color-warning-border)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.2rem'
                }}
              >
                <AlertTriangle size={10} />
                <span>Growth Area Support</span>
              </span>
            ) : (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Est: {assignment.estimatedMinutes}m • Diff {assignment.difficulty}/5
              </span>
            )}
          </div>
          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {assignment.title}
          </span>
        </div>

        {/* Content: Interactive Quiz Mode OR Chat History */}
        {quizMode && quizQuestions.length > 0 ? (
          <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-primary)' }}>
                Question {currentQuizIndex + 1} of {quizQuestions.length}
              </span>
              <button
                onClick={() => setQuizMode(false)}
                className="btn btn-subtle"
                style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
              >
                Exit Quiz
              </button>
            </div>

            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h4 style={{ fontSize: '1rem', lineHeight: 1.4 }}>
                {quizQuestions[currentQuizIndex].question}
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {quizQuestions[currentQuizIndex].options.map((opt, optIdx) => {
                  let optStyle = {
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-subtle)',
                    fontSize: '0.85rem',
                    textAlign: 'left',
                    cursor: isAnswerSubmitted ? 'default' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  };

                  if (selectedOption === optIdx) {
                    optStyle.borderColor = 'var(--accent-primary)';
                    optStyle.background = 'var(--accent-primary-subtle)';
                  }

                  if (isAnswerSubmitted) {
                    if (optIdx === quizQuestions[currentQuizIndex].correctIndex) {
                      optStyle.borderColor = 'var(--color-success)';
                      optStyle.background = 'var(--color-success-subtle)';
                      optStyle.color = 'var(--color-success-text)';
                    } else if (selectedOption === optIdx) {
                      optStyle.borderColor = 'var(--color-danger)';
                      optStyle.background = 'var(--color-danger-subtle)';
                      optStyle.color = 'var(--color-danger-text)';
                    }
                  }

                  return (
                    <div
                      key={optIdx}
                      style={optStyle}
                      onClick={() => handleOptionSelect(optIdx)}
                    >
                      <span>{opt}</span>
                      {isAnswerSubmitted && optIdx === quizQuestions[currentQuizIndex].correctIndex && (
                        <CheckCircle2 size={16} style={{ color: 'var(--color-success)' }} />
                      )}
                    </div>
                  );
                })}
              </div>

              {isAnswerSubmitted && (
                <div
                  style={{
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border-subtle)',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.825rem'
                  }}
                >
                  <strong>Explanation:</strong> {quizQuestions[currentQuizIndex].explanation}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              {!isAnswerSubmitted ? (
                <button
                  onClick={handleSubmitQuizAnswer}
                  disabled={selectedOption === null}
                  className="btn btn-primary"
                >
                  Check Answer
                </button>
              ) : (
                <button onClick={handleNextQuizQuestion} className="btn btn-primary">
                  {currentQuizIndex < quizQuestions.length - 1 ? 'Next Question →' : 'Finish Quiz (+XP)'}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="tutor-chat-history">
            {messages.map((msg, idx) => (
              <div key={msg.id || idx} className={`tutor-bubble ${msg.sender}`}>
                <div style={{ position: 'relative' }}>
                  {renderMessageText(msg.text)}
                  {msg.sender === 'ai' && (
                    <button
                      onClick={() => copyToClipboard(msg.text, idx)}
                      style={{
                        position: 'absolute',
                        right: '-8px',
                        bottom: '-12px',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '4px',
                        padding: '2px 4px',
                        cursor: 'pointer',
                        color: 'var(--text-muted)',
                        fontSize: '0.7rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2px'
                      }}
                      title="Copy explanation"
                    >
                      {copiedIndex === idx ? <Check size={10} /> : <Copy size={10} />}
                    </button>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="tutor-bubble ai" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Loader2 size={14} className="animate-spin" />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Linang is thinking...
                </span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Quick Suggestion Chips */}
        {!quizMode && (
          <div className="tutor-quick-prompts">
            <button
              onClick={() => handleSendMessage('💡 Where should I start on this problem?')}
              className="quick-prompt-chip"
            >
              💡 Where to start?
            </button>
            <button
              onClick={() => handleSendMessage('📚 Can you explain the underlying core concept simply?')}
              className="quick-prompt-chip"
            >
              📚 Explain concept
            </button>
            <button
              onClick={() => handleSendMessage('📐 What formulas and steps should I apply?')}
              className="quick-prompt-chip"
            >
              📐 Formulas & steps
            </button>
            <button
              onClick={handleStartQuiz}
              className="quick-prompt-chip"
              style={{ background: 'var(--accent-primary-subtle)', color: 'var(--accent-primary)', borderColor: 'var(--accent-primary-border)' }}
            >
              🎯 Practice Quiz (3 questions)
            </button>
          </div>
        )}

        {/* Input Bar */}
        {!quizMode && (
          <div className="tutor-input-bar">
            <input
              type="text"
              className="form-input"
              style={{ flex: 1 }}
              placeholder="Ask a question or describe where you're stuck..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputMessage.trim() || isLoading}
              className="btn btn-primary"
              style={{ padding: '0.55rem 0.85rem' }}
            >
              <Send size={15} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
