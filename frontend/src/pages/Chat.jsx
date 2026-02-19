import { useState, useEffect, useRef, useContext } from'react';
import api from'../services/api';
import { AuthContext } from'../contexts/AuthContext';
import { useToast } from'../contexts/ToastContext';

export default function Chat() {
  const { user } = useContext(AuthContext);
  const { showToast } = useToast();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showNewConv, setShowNewConv] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [newConvSubject, setNewConvSubject] = useState('');
  const [newConvMessage, setNewConvMessage] = useState('');
  const messagesEndRef = useRef(null);
  const pollingRef = useRef(null);

  useEffect(() => {
    fetchConversations();
    fetchAvailableUsers();

    // Poll for new messages every 10 seconds
    pollingRef.current = setInterval(() => {
      fetchConversations();
      if (activeConversation) {
        fetchMessages(activeConversation.id, true);
      }
    }, 10000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior:'smooth' });
  };

  const fetchConversations = async () => {
    try {
      const response = await api.get('/chat/conversations');
      setConversations(response.data.data);
    } catch (err) {
      console.error('Error fetching conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableUsers = async () => {
    try {
      const response = await api.get('/chat/users');
      setAvailableUsers(response.data.data);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const fetchMessages = async (convId, silent = false) => {
    try {
      const response = await api.get(`/chat/conversations/${convId}`);
      const data = response.data.data;
      setMessages(data.messages || []);
      if (!silent) {
        setActiveConversation(data);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  const selectConversation = async (conv) => {
    setActiveConversation(conv);
    await fetchMessages(conv.id);
    // Mark as read
    await api.post(`/chat/conversations/${conv.id}/read`);
    fetchConversations(); // Refresh unread counts
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation) return;

    setSending(true);
    try {
      const response = await api.post(`/chat/conversations/${activeConversation.id}/messages`, {
        content: newMessage,
      });
      setMessages([...messages, response.data.data]);
      setNewMessage('');
      fetchConversations();
    } catch (err) {
      showToast('Erreur lors de l\'envoi du message','error');
 } finally {
 setSending(false);
 }
 };

 const handleCreateConversation = async (e) => {
 e.preventDefault();
 if (selectedUsers.length === 0) {
 showToast('Selectionnez au moins un destinataire','error');
 return;
 }

 try {
 const response = await api.post('/chat/conversations', {
 subject: newConvSubject || null,
 participantIds: selectedUsers,
 initialMessage: newConvMessage || null,
 });

 setShowNewConv(false);
 setSelectedUsers([]);
 setNewConvSubject('');
 setNewConvMessage('');

 await fetchConversations();
 await selectConversation(response.data.data);
 showToast('Conversation creee','success');
 } catch (err) {
 showToast('Erreur lors de la creation','error');
 }
 };

 const formatTime = (dateStr) => {
 const date = new Date(dateStr);
 const today = new Date();
 const isToday = date.toDateString() === today.toDateString();

 if (isToday) {
 return date.toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' });
 }
 return date.toLocaleDateString('fr-FR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' });
 };

 const getConversationName = (conv) => {
 if (conv.subject) return conv.subject;
 if (conv.participants && conv.participants.length > 0) {
 return conv.participants.map(p =>
 p.user ? `${p.user.firstName} ${p.user.lastName}` :'Utilisateur'
 ).join(',');
 }
 return'Conversation';
 };

 const getInitials = (firstName, lastName) => {
 return `${firstName?.[0] ||''}${lastName?.[0] ||''}`.toUpperCase();
 };

 if (loading) {
 return (
 <>
 <div className="flex items-center justify-center h-64">
 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
 </div>
 </>
 );
 }

 return (
 <>
 <div className="flex h-[calc(100vh-10rem)] bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
 {/* Conversations list */}
 <div className="w-80 border-r border-gray-200 flex flex-col">
 <div className="p-4 border-b border-gray-200">
 <div className="flex items-center justify-between mb-4">
 <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
 <button
 onClick={() => setShowNewConv(true)}
 className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
 title="Nouvelle conversation"
 >
 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
 </svg>
 </button>
 </div>
 </div>

 <div className="flex-1 overflow-y-auto">
 {conversations.length === 0 ? (
 <div className="p-4 text-center text-gray-500">
 Aucune conversation
 </div>
 ) : (
 conversations.map((conv) => (
 <button
 key={conv.id}
 onClick={() => selectConversation(conv)}
 className={`w-full p-4 text-left border-b border-gray-100 hover:bg-gray-50 transition-colors ${
 activeConversation?.id === conv.id ?'bg-blue-50' :''
 }`}
 >
 <div className="flex items-start gap-3">
 <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
 <span className="text-sm font-medium text-blue-600">
 {conv.participants?.[0]?.user
 ? getInitials(conv.participants[0].user.firstName, conv.participants[0].user.lastName)
 :'?'}
 </span>
 </div>
 <div className="flex-1 min-w-0">
 <div className="flex items-center justify-between">
 <span className="font-medium text-gray-900 truncate">
 {getConversationName(conv)}
 </span>
 {conv.unreadCount > 0 && (
 <span className="ml-2 px-2 py-0.5 text-xs font-medium text-white bg-blue-600 rounded-full">
 {conv.unreadCount}
 </span>
 )}
 </div>
 {conv.lastMessage && (
 <p className="text-sm text-gray-500 truncate mt-1">
 {conv.lastMessage.content}
 </p>
 )}
 {conv.lastMessageAt && (
 <p className="text-xs text-gray-400 mt-1">
 {formatTime(conv.lastMessageAt)}
 </p>
 )}
 </div>
 </div>
 </button>
 ))
 )}
 </div>
 </div>

 {/* Messages area */}
 <div className="flex-1 flex flex-col">
 {activeConversation ? (
 <>
 {/* Conversation header */}
 <div className="p-4 border-b border-gray-200 bg-gray-50">
 <h3 className="font-semibold text-gray-900">
 {getConversationName(activeConversation)}
 </h3>
 {activeConversation.participants && (
 <p className="text-sm text-gray-500">
 {activeConversation.participants.map(p =>
 p.user ? `${p.user.firstName} ${p.user.lastName}` :''
 ).filter(Boolean).join(',')}
 </p>
 )}
 </div>

 {/* Messages */}
 <div className="flex-1 overflow-y-auto p-4 space-y-4">
 {messages.map((msg) => {
 const isOwn = msg.senderId === user?.id;
 return (
 <div
 key={msg.id}
 className={`flex ${isOwn ?'justify-end' :'justify-start'}`}
 >
 <div className={`max-w-[70%] ${isOwn ?'order-2' :''}`}>
 {!isOwn && msg.sender && (
 <p className="text-xs text-gray-500 mb-1">
 {msg.sender.firstName} {msg.sender.lastName}
 </p>
 )}
 <div
 className={`px-4 py-2 rounded-2xl ${
 isOwn
 ?'bg-blue-600 text-white rounded-br-md'
 :'bg-gray-100 text-gray-900 rounded-bl-md'
 }`}
 >
 <p className="whitespace-pre-wrap break-words">{msg.content}</p>
 </div>
 <p className={`text-xs text-gray-400 mt-1 ${isOwn ?'text-right' :''}`}>
                          {formatTime(msg.createdAt)}
                          {msg.isEdited && <span className="ml-1">(modifie)</span>}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Message input */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Ecrivez votre message..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-full bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={sending}
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || sending}
                    className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p>Selectionnez une conversation</p>
                <p className="text-sm mt-1">ou creez-en une nouvelle</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New conversation modal */}
      {showNewConv && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Nouvelle conversation
                </h3>
                <button
                  onClick={() => setShowNewConv(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleCreateConversation} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sujet (optionnel)
                  </label>
                  <input
                    type="text"
                    value={newConvSubject}
                    onChange={(e) => setNewConvSubject(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                    placeholder="Ex: Discussion dossier Martin"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Destinataires *
                  </label>
                  <div className="border border-gray-300 rounded-lg max-h-40 overflow-y-auto">
                    {availableUsers.map((u) => (
                      <label
                        key={u.id}
                        className="flex items-center p-2 hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(u.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUsers([...selectedUsers, u.id]);
                            } else {
                              setSelectedUsers(selectedUsers.filter(id => id !== u.id));
                            }
                          }}
                          className="mr-3"
                        />
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                          <span className="text-xs font-medium text-blue-600">
                            {getInitials(u.firstName, u.lastName)}
                          </span>
                        </div>
                        <span className="text-sm text-gray-900">
                          {u.firstName} {u.lastName}
                        </span>
                        <span className="text-xs text-gray-500 ml-2">
                          ({u.role})
                        </span>
                      </label>
                    ))}
                    {availableUsers.length === 0 && (
                      <p className="p-4 text-sm text-gray-500 text-center">
                        Aucun autre utilisateur disponible
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Premier message (optionnel)
                  </label>
                  <textarea
                    value={newConvMessage}
                    onChange={(e) => setNewConvMessage(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 resize-none"
                    placeholder="Ecrivez votre message..."
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowNewConv(false)}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={selectedUsers.length === 0}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    Creer
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
