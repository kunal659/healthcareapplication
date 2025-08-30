import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import * as dbService from '../services/databaseService';
import * as aiService from '../services/aiService';
import { DatabaseConnection, ChatMessage } from '../types';
import Card from '../components/Card';
import Button from '../components/Button';
import ChatMessageComponent from '../components/ChatMessage';
import DatabaseSelector from '../components/DatabaseSelector';
import Spinner from '../components/Spinner';

const SqlChatPage: React.FC = () => {
    const { user } = useAuth();
    const [selectedDb, setSelectedDb] = useState<DatabaseConnection | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    const connections = user?.databaseConnections || [];

    useEffect(() => {
        // Automatically select the first connected database
        const firstConnected = connections.find(c => c.status === 'connected');
        if (firstConnected && !selectedDb) {
            setSelectedDb(firstConnected);
        }
    }, [connections, selectedDb]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);
    
     useEffect(() => {
        if (selectedDb) {
            setMessages([{
                id: `msg_${Date.now()}`,
                sender: 'ai',
                content: { text: `Connected to **${selectedDb.name}** (${selectedDb.database}). What would you like to know about your data?` },
                timestamp: new Date().toISOString()
            }]);
        } else {
             setMessages([]);
        }
    }, [selectedDb]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || !selectedDb || isLoading) return;

        const userMessage: ChatMessage = {
            id: `msg_${Date.now()}`,
            sender: 'user',
            content: { text: input },
            timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            if (!selectedDb.schema) {
                throw new Error("Selected database has no schema information.");
            }
            
            // 1. Generate SQL and chart suggestion from AI
            // FIX: The AI service returns a 'text' property, not 'textResponse', as per the ChatMessageContent type.
            const { text, sql, chartSuggestion } = await aiService.generateSqlFromNaturalLanguage(
                input, 
                selectedDb.schema,
                messages,
                selectedDb.type
            );
            
            // 2. Execute SQL query if one was generated
            let results = undefined;
            if (sql && !sql.startsWith('--')) {
                results = await dbService.executeQuery(sql, selectedDb);
            }
            
            // 3. Create a single, consolidated AI response message
            const aiResponseMessage: ChatMessage = {
                id: `msg_${Date.now() + 1}`,
                sender: 'ai',
                content: {
                    text: text,
                    sql: sql,
                    results: results,
                    // Only include chart suggestion if there are results to display
                    chartSuggestion: (results && results.rows.length > 0) ? chartSuggestion : undefined
                },
                timestamp: new Date().toISOString()
            };
            setMessages(prev => [...prev, aiResponseMessage]);

        } catch (error: any) {
            const errorMessage: ChatMessage = {
                id: `msg_${Date.now() + 1}`,
                sender: 'ai',
                content: { error: error.message || "An unexpected error occurred." },
                timestamp: new Date().toISOString()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-120px)]">
            <div className="flex-shrink-0 mb-4 flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">SQL Chat</h1>
                {connections.length > 0 && (
                    <DatabaseSelector
                        connections={connections}
                        selectedId={selectedDb?.id || ''}
                        onSelect={id => setSelectedDb(connections.find(c => c.id === id) || null)}
                    />
                )}
            </div>
            
            <Card className="flex-grow flex flex-col p-0">
                {!selectedDb ? (
                    <div className="flex-grow flex items-center justify-center">
                        <div className="text-center text-gray-500">
                            <p className="text-lg">Please select a connected database to begin.</p>
                            <p className="text-sm">You can add or manage connections on the Databases page.</p>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="flex-grow p-6 overflow-y-auto space-y-6">
                           {messages.map(msg => <ChatMessageComponent key={msg.id} message={msg} />)}
                           {isLoading && (
                               <div className="flex items-center space-x-2">
                                    <Spinner size="sm" />
                                    <p className="text-gray-500 dark:text-gray-400 italic">AI is thinking...</p>
                               </div>
                           )}
                           <div ref={chatEndRef} />
                        </div>
                        <div className="p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                           <form onSubmit={handleSendMessage} className="flex items-center space-x-4">
                               <input
                                   type="text"
                                   value={input}
                                   onChange={e => setInput(e.target.value)}
                                   placeholder="Ask a question about your data..."
                                   className="w-full px-4 py-2 border rounded-full shadow-sm focus:outline-none focus:ring-2 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 focus:ring-primary-500"
                                   disabled={isLoading}
                               />
                               <Button type="submit" isLoading={isLoading} disabled={!input.trim()}>Send</Button>
                           </form>
                        </div>
                    </>
                )}
            </Card>
        </div>
    );
};

export default SqlChatPage;