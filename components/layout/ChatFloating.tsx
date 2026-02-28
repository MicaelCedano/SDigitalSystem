"use client";

import { useState, useEffect, useRef } from "react";
import {
    MessageCircle, X, Search, Send, User,
    MoreVertical, ChevronLeft, Sparkles,
    Smile, Paperclip, CheckCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    getConversations,
    getMessages,
    sendMessage,
    searchUsers,
    startOrGetConversation,
    getUnreadMessageCount,
    markMessagesAsRead
} from "@/app/actions/chat";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";

export function ChatFloating({ currentUser }: { currentUser: any }) {
    const [isOpen, setIsOpen] = useState(false);
    const [currentView, setCurrentView] = useState<"list" | "chat" | "search">("list");
    const [conversations, setConversations] = useState<any[]>([]);
    const [selectedConv, setSelectedConv] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen && currentView === "list") {
            loadConversations();
        }
    }, [isOpen, currentView]);

    // Polling de mensajes no leídos cada 5 segundos
    useEffect(() => {
        const fetchUnread = async () => {
            const count = await getUnreadMessageCount();
            setUnreadCount(count);
        };
        fetchUnread();
        const interval = setInterval(fetchUnread, 5000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        let interval: any;
        if (isOpen && currentView === "chat" && selectedConv) {
            loadMessages(selectedConv.id);
            interval = setInterval(() => loadMessages(selectedConv.id), 3000); // Polling cada 3 segundos
        }
        return () => clearInterval(interval);
    }, [isOpen, currentView, selectedConv]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const loadConversations = async () => {
        const data = await getConversations();
        setConversations(data);
    };

    const loadMessages = async (id: number) => {
        const data = await getMessages(id);
        setMessages(data);
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedConv) return;

        const content = newMessage;
        setNewMessage("");

        // Optimistic UI
        const tempMsg = {
            id: Date.now(),
            content,
            senderId: Number(currentUser.id),
            createdAt: new Date(),
            sender: currentUser
        };
        setMessages(prev => [...prev, tempMsg]);

        const res = await sendMessage(selectedConv.id, content);
        if (!res.success) {
            // Error handling
            console.error(res.error);
        } else {
            loadMessages(selectedConv.id);
        }
    };

    const handleSearch = async (query: string) => {
        setSearchQuery(query);
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }
        const users = await searchUsers(query);
        setSearchResults(users);
    };

    const handleStartChat = async (otherUser: any) => {
        setIsLoading(true);
        const convId = await startOrGetConversation(otherUser.id);
        if (convId) {
            setSelectedConv({ id: convId, isGlobal: false, participants: [otherUser] });
            setCurrentView("chat");
            setSearchQuery("");
            setSearchResults([]);
            await loadMessages(convId);
            await markMessagesAsRead(convId);
            setUnreadCount(prev => Math.max(0, prev - 1));
        } else {
            console.error("No se pudo crear o encontrar la conversación");
        }
        setIsLoading(false);
    };

    return (
        <div className="fixed bottom-6 right-6 z-[100] font-outfit">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="mb-4 w-[380px] h-[550px] bg-slate-900/95 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden shadow-indigo-500/20"
                    >
                        {/* Header */}
                        <div className="p-6 bg-indigo-600 flex items-center justify-between text-white shrink-0">
                            <div className="flex items-center gap-3">
                                {currentView !== "list" && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-white hover:bg-white/10 rounded-full"
                                        onClick={() => setCurrentView("list")}
                                    >
                                        <ChevronLeft size={20} />
                                    </Button>
                                )}
                                <div>
                                    <h3 className="text-lg font-black tracking-tight leading-none">
                                        {currentView === "list" ? "Mensajes" :
                                            currentView === "search" ? "Nuevo Chat" :
                                                selectedConv?.isGlobal ? "🚀 Chat Global" :
                                                    selectedConv?.participants[0]?.name || selectedConv?.participants[0]?.username}
                                    </h3>
                                    <p className="text-[10px] text-indigo-200 font-bold uppercase tracking-widest mt-1">
                                        {currentView === "list" ? "Bandeja de Entrada" :
                                            currentView === "search" ? "Buscar Usuarios" :
                                                selectedConv?.isGlobal ? "Canal de Seguridad Digital" :
                                                    selectedConv?.participants[0]?.role?.replace('_', ' ')}
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-white hover:bg-white/10 rounded-full"
                                onClick={() => setIsOpen(false)}
                            >
                                <X size={20} />
                            </Button>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 overflow-hidden relative flex flex-col">

                            {/* Conversations List */}
                            {currentView === "list" && (
                                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                                    <div className="px-4 py-2">
                                        <div className="relative group">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                            <input
                                                type="text"
                                                placeholder="Buscar chat..."
                                                className="w-full bg-white/5 border border-white/5 rounded-2xl py-2 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                                                onClick={() => setCurrentView("search")}
                                            />
                                        </div>
                                    </div>

                                    {conversations.length > 0 ? conversations.sort((a, b) => (b.isGlobal ? 1 : 0) - (a.isGlobal ? 1 : 0)).map((conv) => {
                                        const isGlobal = conv.isGlobal;
                                        const otherUser = !isGlobal ? conv.participants[0] : null;
                                        const lastMsg = conv.messages[0];
                                        const convUnread = conv._count?.messages ?? 0;

                                        return (
                                            <button
                                                key={conv.id}
                                                onClick={() => {
                                                    setSelectedConv(conv);
                                                    setCurrentView("chat");
                                                    markMessagesAsRead(conv.id);
                                                    setUnreadCount(prev => Math.max(0, prev - convUnread));
                                                    // limpiar badge local
                                                    setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, _count: { messages: 0 } } : c));
                                                }}
                                                className={cn(
                                                    "w-full flex items-center gap-4 p-4 rounded-3xl transition-all text-left group",
                                                    isGlobal ? "bg-indigo-600/10 border border-indigo-500/20 mb-2" : "hover:bg-white/5",
                                                    convUnread > 0 && !isGlobal && "bg-white/5"
                                                )}
                                            >
                                                <div className="relative">
                                                    <div className={cn(
                                                        "w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black overflow-hidden border-2 shrink-0",
                                                        isGlobal ? "bg-gradient-to-br from-indigo-500 to-purple-600 border-indigo-400" : "bg-indigo-600 border-slate-800"
                                                    )}>
                                                        {isGlobal ? (
                                                            <Sparkles className="w-6 h-6 text-white" />
                                                        ) : otherUser?.profileImage ? (
                                                            <img src={`/profile_images/${otherUser.profileImage}`} className="w-full h-full object-cover" />
                                                        ) : (otherUser?.username?.substring(0, 2).toUpperCase() || "??")}
                                                    </div>
                                                    {!isGlobal && <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-900 rounded-full" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-0.5">
                                                        <span className={cn(
                                                            "text-sm font-bold truncate",
                                                            convUnread > 0 ? "text-white" : "text-slate-300"
                                                        )}>
                                                            {isGlobal ? "🚀 Chat Global" : (otherUser?.name || otherUser?.username)}
                                                        </span>
                                                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                                            {convUnread > 0 && (
                                                                <span className="flex h-5 min-w-5 px-1 items-center justify-center bg-indigo-500 rounded-full text-[10px] font-black text-white">
                                                                    {convUnread > 9 ? '9+' : convUnread}
                                                                </span>
                                                            )}
                                                            <span className="text-[10px] text-slate-500 font-bold uppercase">
                                                                {lastMsg ? formatDistanceToNow(new Date(lastMsg.createdAt), { locale: es }) : ""}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <p className={cn(
                                                        "text-xs truncate font-medium",
                                                        convUnread > 0 ? "text-slate-200" : isGlobal ? "text-indigo-300" : "text-slate-400"
                                                    )}>
                                                        {lastMsg ? (
                                                            <span className="flex items-center gap-1">
                                                                {isGlobal && <span className="text-[10px] font-black opacity-50">{lastMsg.sender?.username}:</span>}
                                                                {lastMsg.content}
                                                            </span>
                                                        ) : isGlobal ? "¡Saluda a todo el equipo!" : "Inicia una conversación..."}
                                                    </p>
                                                </div>
                                            </button>
                                        );
                                    }) : (
                                        <div className="flex flex-col items-center justify-center py-20 px-10 text-center space-y-4">
                                            <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center text-slate-500">
                                                <MessageCircle className="w-8 h-8 opacity-20" />
                                            </div>
                                            <p className="text-slate-400 text-sm font-medium leading-relaxed">No tienes chats activos. <br /> Busca a un compañero para empezar.</p>
                                            <Button
                                                onClick={() => setCurrentView("search")}
                                                variant="outline"
                                                className="bg-indigo-600/10 border-indigo-500/20 text-indigo-400 hover:bg-indigo-600 hover:text-white rounded-xl text-xs font-black uppercase tracking-widest"
                                            >
                                                Nuevo Mensaje
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* User Search View */}
                            {currentView === "search" && (
                                <div className="flex-1 flex flex-col overflow-hidden">
                                    <div className="p-4 bg-white/5 border-b border-white/5">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400" />
                                            <Input
                                                autoFocus
                                                value={searchQuery}
                                                onChange={(e) => handleSearch(e.target.value)}
                                                placeholder="Nombre o usuario..."
                                                className="bg-slate-950/50 border-white/10 rounded-2xl pl-10 h-11 text-white"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-2">
                                        {searchQuery.length < 2 ? (
                                            <div className="p-10 text-center">
                                                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Escribe para buscar...</p>
                                            </div>
                                        ) : searchResults.length > 0 ? (
                                            searchResults.map((user) => (
                                                <button
                                                    key={user.id}
                                                    onClick={() => handleStartChat(user)}
                                                    className="w-full flex items-center gap-4 p-4 rounded-3xl hover:bg-white/5 transition-all text-left"
                                                >
                                                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-white font-bold overflow-hidden shrink-0">
                                                        {user.profileImage ? (
                                                            <img src={`/profile_images/${user.profileImage}`} className="w-full h-full object-cover" />
                                                        ) : user.username.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-white">{user.name || user.username}</p>
                                                        <p className="text-[10px] text-indigo-400 font-black uppercase tracking-wider">{user.role?.replace('_', ' ')}</p>
                                                    </div>
                                                </button>
                                            ))
                                        ) : (
                                            <div className="p-10 text-center">
                                                <p className="text-sm text-slate-500 font-medium">No se encontraron usuarios.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Chat Interface */}
                            {currentView === "chat" && (
                                <div className="flex-1 flex flex-col overflow-hidden">
                                    {/* Messages Area */}
                                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                                        {messages.map((msg, idx) => {
                                            const isMe = Number(msg.senderId) === Number(currentUser.id);
                                            const isGlobal = selectedConv?.isGlobal;
                                            // Agrupar mensajes: mostrar avatar/nombre solo si cambia el remitente
                                            const prevMsg = messages[idx - 1];
                                            const showSender = isGlobal && !isMe && (prevMsg?.senderId !== msg.senderId);

                                            return (
                                                <div key={msg.id} className={cn("flex flex-col", isMe ? "items-end" : "items-start")}>
                                                    {/* Mostrar nombre + avatar del que escribe en el chat global */}
                                                    {showSender && (
                                                        <div className="flex items-center gap-2 mb-1 ml-1">
                                                            <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-[9px] font-black overflow-hidden shrink-0">
                                                                {msg.sender?.profileImage ? (
                                                                    <img src={`/profile_images/${msg.sender.profileImage}`} className="w-full h-full object-cover" />
                                                                ) : msg.sender?.username?.substring(0, 2).toUpperCase()}
                                                            </div>
                                                            <span className="text-[10px] font-black text-indigo-300 uppercase tracking-wider">
                                                                {msg.sender?.name || msg.sender?.username}
                                                            </span>
                                                        </div>
                                                    )}
                                                    <div className={cn(
                                                        "max-w-[80%] px-4 py-3 rounded-[1.5rem] relative group",
                                                        isMe ? "bg-indigo-600 text-white rounded-br-none" : "bg-white/10 text-slate-100 rounded-bl-none"
                                                    )}>
                                                        <p className="text-sm leading-relaxed font-medium">{msg.content}</p>
                                                        <div className={cn(
                                                            "flex items-center gap-1 mt-1",
                                                            isMe ? "justify-end" : "justify-start"
                                                        )}>
                                                            <span className="text-[9px] opacity-40 font-bold uppercase">
                                                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                            {isMe && <CheckCheck size={10} className="opacity-40" />}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        <div ref={messagesEndRef} />
                                    </div>

                                    {/* Input Area */}
                                    <form onSubmit={handleSendMessage} className="p-4 bg-white/5 border-t border-white/5 flex items-center gap-2 shrink-0">
                                        <Button type="button" variant="ghost" size="icon" className="h-10 w-10 text-slate-400 hover:text-white rounded-full">
                                            <Paperclip size={18} />
                                        </Button>
                                        <div className="flex-1 relative">
                                            <input
                                                value={newMessage}
                                                onChange={(e) => setNewMessage(e.target.value)}
                                                placeholder="Mensaje..."
                                                className="w-full bg-slate-950/50 border border-white/10 rounded-2xl py-2 pl-4 pr-10 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                            />
                                            <Smile size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 cursor-pointer hover:text-indigo-400" />
                                        </div>
                                        <Button
                                            disabled={!newMessage.trim()}
                                            className="h-10 w-10 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl shadow-lg shadow-indigo-600/20 flex items-center justify-center p-0 transition-transform active:scale-95"
                                        >
                                            <Send size={18} />
                                        </Button>
                                    </form>
                                </div>
                            )}

                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <Button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "h-16 w-16 rounded-[2rem] shadow-2xl flex items-center justify-center transition-all duration-500 relative group overflow-hidden",
                    isOpen ? "bg-slate-800 rotate-90 scale-110" : "bg-indigo-600 hover:scale-110 active:scale-95 shadow-indigo-500/30"
                )}
            >
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600 to-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                <AnimatePresence mode="wait">
                    {isOpen ? (
                        <motion.div key="x" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                            <X size={28} className="relative z-10 text-white" />
                        </motion.div>
                    ) : (
                        <motion.div key="msg" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="relative">
                            <MessageCircle size={28} className="relative z-10 text-white" />
                            {unreadCount > 0 && (
                                <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center bg-rose-500 rounded-full border-2 border-slate-900 text-[10px] font-black text-white">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </Button>
        </div>
    );
}
