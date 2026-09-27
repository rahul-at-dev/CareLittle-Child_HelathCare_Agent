import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  apiClient,
  fetchChildById,
  ChildProfile,
  fetchChatSessions,
  createChatSession,
  fetchSessionMessages,
  sendChatMessage,
  deleteChatSession,
  ChatSession,
  ChatMessage
} from '../services/api';
import {
  MessageSquare,
  Plus,
  Trash2,
  Send,
  Shield,
  ArrowLeft,
  AlertTriangle,
  Bot,
  User,
  Loader2,
  PhoneCall
} from 'lucide-react';

export const ChatPage: React.FC = () => {
  const { childId, sessionId } = useParams<{ childId: string; sessionId?: string }>();
  const navigate = useNavigate();
  const { getToken } = useAuth();

  const [child, setChild] = useState<ChildProfile | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(sessionId || null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  const [inputText, setInputText] = useState('');
  const [loadingChild, setLoadingChild] = useState(true);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [emergencyAlert, setEmergencyAlert] = useState<{
    userMessage: string;
    emergencyContacts?: any;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, sending]);

  // Load Child Info & Chat Sessions
  useEffect(() => {
    const initPage = async () => {
      if (!childId) return;
      setLoadingChild(true);
      setLoadingSessions(true);
      setError('');

      try {
        const token = await getToken();
        if (token) {
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }

        const childData = await fetchChildById(childId);
        setChild(childData);

        const sessionList = await fetchChatSessions(childId);
        setSessions(sessionList);

        if (!sessionId && sessionList.length > 0) {
          setActiveSessionId(sessionList[0]._id);
          navigate(`/child/${childId}/chat/${sessionList[0]._id}`, { replace: true });
        } else if (sessionId) {
          setActiveSessionId(sessionId);
        }
      } catch (err: any) {
        console.error('Error initializing chat:', err);
        setError(err.response?.data?.error || 'Failed to load chat data.');
      } finally {
        setLoadingChild(false);
        setLoadingSessions(false);
      }
    };

    initPage();
  }, [childId, getToken]);

  // Load Messages when activeSessionId changes
  useEffect(() => {
    const loadMessages = async () => {
      if (!childId || !activeSessionId) {
        setMessages([]);
        return;
      }
      setLoadingMessages(true);
      setEmergencyAlert(null);
      try {
        const msgs = await fetchSessionMessages(childId, activeSessionId);
        setMessages(msgs);
      } catch (err: any) {
        console.error('Error loading session messages:', err);
        setError('Failed to load conversation messages.');
      } finally {
        setLoadingMessages(false);
      }
    };

    loadMessages();
  }, [childId, activeSessionId]);

  // Handle New Session Creation
  const handleNewSession = async () => {
    if (!childId) return;
    try {
      const newSession = await createChatSession(childId);
      setSessions((prev) => [newSession, ...prev]);
      setActiveSessionId(newSession._id);
      setMessages([]);
      setEmergencyAlert(null);
      navigate(`/child/${childId}/chat/${newSession._id}`);
    } catch (err: any) {
      console.error('Error creating chat session:', err);
      setError('Failed to start a new chat session.');
    }
  };

  // Handle Session Deletion
  const handleDeleteSession = async (sId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!childId || !window.confirm('Are you sure you want to delete this conversation?')) return;

    try {
      await deleteChatSession(childId, sId);
      const updated = sessions.filter((s) => s._id !== sId);
      setSessions(updated);
      if (activeSessionId === sId) {
        if (updated.length > 0) {
          setActiveSessionId(updated[0]._id);
          navigate(`/child/${childId}/chat/${updated[0]._id}`);
        } else {
          setActiveSessionId(null);
          setMessages([]);
          navigate(`/child/${childId}/chat`);
        }
      }
    } catch (err: any) {
      console.error('Error deleting session:', err);
      setError('Failed to delete chat session.');
    }
  };

  // Handle Send Message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !childId || sending) return;

    let targetSessionId = activeSessionId;
    setSending(true);
    setError('');
    setEmergencyAlert(null);

    try {
      if (!targetSessionId) {
        const newSession = await createChatSession(childId, inputText.trim().slice(0, 30));
        setSessions((prev) => [newSession, ...prev]);
        targetSessionId = newSession._id;
        setActiveSessionId(newSession._id);
        navigate(`/child/${childId}/chat/${newSession._id}`);
      }

      const currentInput = inputText.trim();
      setInputText('');

      const tempUserMsg: ChatMessage = {
        _id: 'temp-' + Date.now(),
        sessionId: targetSessionId,
        sender: 'user',
        text: currentInput,
        triageLevel: 'normal',
        createdAt: new Date().toISOString()
      };
      setMessages((prev) => [...prev, tempUserMsg]);

      const result = await sendChatMessage(childId, targetSessionId, currentInput);

      setMessages((prev) => [
        ...prev.filter((m) => !m._id.startsWith('temp-')),
        result.userMessage,
        result.aiMessage
      ]);

      if (result.triageLevel === 'emergency') {
        setEmergencyAlert({
          userMessage: result.aiMessage.text,
          emergencyContacts: result.emergencyContacts
        });
      }
    } catch (err: any) {
      console.error('Error sending message:', err);
      setError(err.response?.data?.error || 'Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  // Helper function to render formatted Markdown message content
  const renderMessageContent = (content: string, isUser: boolean) => {
    if (isUser) {
      return <p className="whitespace-pre-line text-xs leading-relaxed font-medium">{content}</p>;
    }

    // Clean up any raw leading ### or # symbols in headers while keeping text intact
    const processedContent = content.replace(/^#{1,6}\s+/gm, '### ');

    return (
      <div className="markdown-body text-xs text-forest-900 leading-relaxed">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ children }) => (
              <h1 className="text-sm font-black text-forest-950 mt-3 mb-1.5 border-b-2 border-forest-300 pb-1 flex items-center gap-1.5">
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-xs font-black text-forest-900 mt-3 mb-1 border-b border-forest-300 pb-1 flex items-center gap-1.5">
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-xs font-black text-forest-900 mt-2 mb-1 flex items-center gap-1">
                {children}
              </h3>
            ),
            strong: ({ children }) => (
              <strong className="font-extrabold text-forest-950 bg-forest-100/70 px-1 py-0.5 rounded border border-forest-300/60">
                {children}
              </strong>
            ),
            p: ({ children }) => (
              <p className="my-1.5 text-xs text-forest-900 leading-relaxed font-medium">
                {children}
              </p>
            ),
            ul: ({ children }) => (
              <ul className="my-2 space-y-1 text-xs text-forest-900 font-medium pl-1">
                {children}
              </ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal list-inside my-2 space-y-1 text-xs text-forest-900 font-medium pl-1">
                {children}
              </ol>
            ),
            li: ({ children }) => (
              <li className="leading-relaxed flex items-start gap-1.5 my-0.5">
                <span className="text-forest-700 font-bold shrink-0 mt-0.5">•</span>
                <span>{children}</span>
              </li>
            ),
            table: ({ children }) => (
              <div className="overflow-x-auto my-3 border-2 border-forest-900 rounded-md bg-white shadow-sm">
                <table className="w-full text-left border-collapse text-xs">
                  {children}
                </table>
              </div>
            ),
            thead: ({ children }) => (
              <thead className="bg-forest-800 text-white font-bold uppercase text-[11px] tracking-wider border-b-2 border-forest-900">
                {children}
              </thead>
            ),
            tbody: ({ children }) => (
              <tbody className="divide-y divide-forest-200">
                {children}
              </tbody>
            ),
            tr: ({ children }) => (
              <tr className="hover:bg-forest-50/80 transition-colors">
                {children}
              </tr>
            ),
            th: ({ children }) => (
              <th className="px-3 py-2 border-r border-forest-700 last:border-r-0 font-extrabold text-[11px]">
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td className="px-3 py-2 border-r border-forest-200 last:border-r-0 text-xs font-medium text-forest-900 leading-relaxed">
                {children}
              </td>
            ),
            hr: () => (
              <hr className="my-3 border-t-2 border-forest-300" />
            )
          }}
        >
          {processedContent}
        </ReactMarkdown>
      </div>
    );
  };

  if (loadingChild) {
    return (
      <div className="min-h-screen bg-forest-50 p-8 flex items-center justify-center font-sans">
        <p className="text-forest-900 font-bold flex items-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-forest-700" />
          Loading CareLittle AI Chat...
        </p>
      </div>
    );
  }

  if (error && !child) {
    return (
      <div className="min-h-screen bg-forest-50 p-8 font-sans">
        <div className="max-w-xl mx-auto classical-card p-6 text-center">
          <AlertTriangle className="w-10 h-10 text-rose-700 mx-auto mb-3" />
          <h2 className="text-xl font-black text-forest-900 mb-2">Error Loading Chat</h2>
          <p className="text-sm font-medium text-forest-800 mb-4">{error}</p>
          <Link to="/dashboard" className="classical-btn-primary px-4 py-2 text-xs">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-forest-50 text-forest-900 font-sans flex flex-col">
      {/* Top Header */}
      <header className="bg-white border-b-2 border-forest-900 py-3 px-6 shrink-0">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link to={`/child/${childId}`} className="p-1.5 bg-forest-100 border border-forest-700 rounded-md hover:bg-forest-200 transition">
              <ArrowLeft className="w-5 h-5 text-forest-800" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-forest-900">{child?.name}'s Symptom Assistant</h1>
                <span className="bg-forest-700 text-white text-[10px] font-bold px-2 py-0.5 rounded">Phase 4 AI</span>
              </div>
              <p className="text-[11px] font-semibold text-forest-700">
                Guarded by pre-LLM deterministic triage safety layer
              </p>
            </div>
          </div>

          <Link
            to={`/child/${childId}`}
            className="text-xs font-bold text-forest-800 hover:text-forest-900 underline"
          >
            Back to Health Hub
          </Link>
        </div>
      </header>

      {/* Safety Disclaimer Banner */}
      <div className="bg-amber-50 border-b border-amber-300 py-2 px-6 text-center text-xs font-semibold text-amber-900 flex items-center justify-center gap-2 shrink-0">
        <Shield className="w-4 h-4 text-amber-800 shrink-0" />
        <span>
          <strong>Medical Disclaimer:</strong> CareLittle AI provides informational guidance only and is NOT a substitute for professional pediatric diagnosis or prescription.
        </span>
      </div>

      {/* Main Chat Interface Grid */}
      <div className="max-w-7xl mx-auto w-full flex-1 p-4 md:p-6 flex flex-col md:flex-row gap-4 overflow-hidden" style={{ height: 'calc(100vh - 120px)' }}>
        
        {/* Left Sidebar: Session List */}
        <div className="w-full md:w-72 bg-white border-2 border-forest-900 rounded-lg p-4 flex flex-col shrink-0">
          <button
            onClick={handleNewSession}
            className="classical-btn-primary w-full py-2 px-3 text-xs font-bold flex items-center justify-center gap-2 mb-4"
          >
            <Plus className="w-4 h-4" /> Start New Conversation
          </button>

          <h2 className="text-xs font-black uppercase text-forest-800 tracking-wider mb-2">Past Conversations</h2>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {loadingSessions ? (
              <p className="text-xs text-forest-700 italic p-2">Loading sessions...</p>
            ) : sessions.length === 0 ? (
              <p className="text-xs text-forest-700 italic p-2">No past conversations.</p>
            ) : (
              sessions.map((sess) => (
                <div
                  key={sess._id}
                  onClick={() => {
                    setActiveSessionId(sess._id);
                    navigate(`/child/${childId}/chat/${sess._id}`);
                  }}
                  className={`p-3 rounded-md border text-left cursor-pointer transition flex items-center justify-between group ${
                    activeSessionId === sess._id
                      ? 'bg-forest-100 border-forest-900 font-bold text-forest-900'
                      : 'bg-white border-forest-200 text-forest-800 hover:border-forest-700'
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="text-xs truncate font-semibold">{sess.title}</p>
                    <p className="text-[10px] text-forest-700 mt-0.5">
                      {new Date(sess.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleDeleteSession(sess._id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-rose-700 hover:bg-rose-50 rounded transition"
                    title="Delete Conversation"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Panel: Chat Messages & Input */}
        <div className="flex-1 bg-white border-2 border-forest-900 rounded-lg flex flex-col overflow-hidden">
          
          {/* Emergency Alert Header (If triggered) */}
          {emergencyAlert && (
            <div className="bg-rose-600 text-white p-4 border-b-2 border-rose-900 flex items-start gap-3 animate-fade-in">
              <AlertTriangle className="w-6 h-6 shrink-0 mt-0.5" />
              <div className="flex-1 text-xs">
                <p className="font-black text-sm uppercase mb-1">Pediatric Emergency Warning</p>
                <p className="font-medium whitespace-pre-line mb-3">{emergencyAlert.userMessage}</p>
                {emergencyAlert.emergencyContacts && (
                  <div className="bg-rose-900/60 p-2.5 rounded border border-rose-400 flex flex-wrap gap-4 items-center">
                    <span className="font-bold flex items-center gap-1">
                      <PhoneCall className="w-3.5 h-3.5" /> Emergency Services: {emergencyAlert.emergencyContacts.emergencyNumber}
                    </span>
                    <span className="font-bold">
                      Ambulance: {emergencyAlert.emergencyContacts.ambulanceNumber}
                    </span>
                    <span className="font-bold">
                      Poison Control: {emergencyAlert.emergencyContacts.poisonControlNumber}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Messages Feed */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-forest-50/50">
            {loadingMessages ? (
              <div className="p-8 text-center text-xs font-bold text-forest-800 flex justify-center items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading chat history...
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-12 px-4 max-w-md mx-auto">
                <div className="w-12 h-12 bg-forest-100 border border-forest-700 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Bot className="w-6 h-6 text-forest-700" />
                </div>
                <h3 className="text-base font-black text-forest-900 mb-1">CareLittle AI Health Assistant</h3>
                <p className="text-xs text-forest-800 leading-relaxed mb-4">
                  Describe symptoms, fever, behavior changes, or care concerns for {child?.name}.
                </p>
                <div className="text-left bg-white border border-forest-300 p-3 rounded-md text-xs space-y-2">
                  <p className="font-bold text-forest-900 text-[11px] uppercase">Example Prompts:</p>
                  <button
                    onClick={() => setInputText(`My ${child?.name} has a mild cough and runny nose for 2 days. What should I observe?`)}
                    className="w-full text-left p-1.5 bg-forest-50 hover:bg-forest-100 rounded text-forest-900 border border-forest-200 transition"
                  >
                    "My child has a mild cough and runny nose for 2 days. What should I observe?"
                  </button>
                  <button
                    onClick={() => setInputText(`What are healthy solid food introduction steps for my baby?`)}
                    className="w-full text-left p-1.5 bg-forest-50 hover:bg-forest-100 rounded text-forest-900 border border-forest-200 transition"
                  >
                    "What are healthy solid food introduction steps for my baby?"
                  </button>
                </div>
              </div>
            ) : (
              messages.map((msg) => {
                const isUser = msg.sender === 'user';
                const isEmergency = msg.triageLevel === 'emergency';

                return (
                  <div
                    key={msg._id}
                    className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isUser && (
                      <div className={`p-1.5 rounded-full border shrink-0 ${isEmergency ? 'bg-rose-100 border-rose-800 text-rose-800' : 'bg-forest-700 border-forest-900 text-white'}`}>
                        <Bot className="w-4 h-4" />
                      </div>
                    )}

                    <div
                      className={`max-w-[85%] p-3.5 rounded-lg border text-xs leading-relaxed ${
                        isUser
                          ? 'bg-forest-800 text-white border-forest-900 rounded-br-none'
                          : isEmergency
                          ? 'bg-rose-50 border-2 border-rose-800 text-rose-950 font-medium rounded-bl-none shadow-sm'
                          : 'bg-white border-2 border-forest-800 text-forest-900 rounded-bl-none shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1 border-b pb-1 border-current/10">
                        <span className="font-bold uppercase text-[10px]">
                          {isUser ? 'You' : 'CareLittle AI Assistant'}
                        </span>
                        <span className="text-[10px] opacity-75">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {renderMessageContent(msg.text, isUser)}

                      {/* Phase 5 Grounding Citations */}
                      {!isUser && msg.citations && msg.citations.length > 0 && (
                        <div className="mt-3 pt-2 border-t border-forest-300/80 bg-forest-50/80 p-2.5 rounded-md border border-forest-200">
                          <p className="text-[11px] font-black text-forest-950 uppercase tracking-wider mb-1 flex items-center gap-1">
                            📚 Grounded Medical Sources ({msg.citations.length})
                          </p>
                          <ul className="space-y-1 text-[11px]">
                            {msg.citations.map((citeStr, idx) => {
                              const match = citeStr.match(/\[(.*?)\]\s*(.*?)\s*\((https?:\/\/.*?)\)/);
                              if (match) {
                                const [, pub, title, url] = match;
                                return (
                                  <li key={idx} className="flex items-center gap-1.5 font-semibold text-forest-900">
                                    <span className="text-forest-700 font-bold">[{idx + 1}]</span>
                                    <span className="bg-forest-200 text-forest-950 px-1 py-0.2 text-[9px] font-bold rounded">{pub}</span>
                                    <a
                                      href={url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="underline hover:text-forest-700 font-bold truncate max-w-[400px]"
                                    >
                                      {title}
                                    </a>
                                  </li>
                                );
                              }
                              return (
                                <li key={idx} className="text-forest-800 font-medium">
                                  [{idx + 1}] {citeStr}
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}

                      {!isUser && (
                        <div className="mt-2 pt-1 border-t border-forest-200 text-[10px] italic opacity-80 flex items-center justify-between">
                          <span>Informational guidance only</span>
                          {msg.triageLevel && (
                            <span className={`font-bold uppercase px-1.5 py-0.5 rounded text-[9px] ${
                              msg.triageLevel === 'emergency' ? 'bg-rose-200 text-rose-900' :
                              msg.triageLevel === 'advisory' ? 'bg-amber-200 text-amber-900' : 'bg-emerald-100 text-emerald-900'
                            }`}>
                              Triage: {msg.triageLevel}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {isUser && (
                      <div className="p-1.5 rounded-full bg-forest-100 border border-forest-700 text-forest-800 shrink-0">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {sending && (
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-full bg-forest-700 border border-forest-900 text-white shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white border-2 border-forest-800 p-3 rounded-lg text-xs font-semibold text-forest-800 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-forest-700" />
                  Analyzing symptoms & evaluating safety rules...
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Error Banner */}
          {error && (
            <div className="bg-rose-100 border-t border-rose-300 px-4 py-2 text-xs font-bold text-rose-900">
              ⚠️ {error}
            </div>
          )}

          {/* Message Input Form */}
          <form onSubmit={handleSendMessage} className="p-3 bg-white border-t-2 border-forest-900 flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Describe ${child?.name}'s symptoms or ask a child health question...`}
              disabled={sending}
              className="flex-1 border border-forest-400 rounded-md px-3 py-2 text-xs text-forest-900 focus:outline-none focus:border-forest-900 font-medium"
            />
            <button
              type="submit"
              disabled={sending || !inputText.trim()}
              className="classical-btn-primary px-4 py-2 text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
