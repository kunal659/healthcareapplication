
import React from 'react';
import { ChatMessage } from '../types';
import QueryResultTable from './QueryResultTable';

interface ChatMessageProps {
  message: ChatMessage;
}

const ChatMessageComponent: React.FC<ChatMessageProps> = ({ message }) => {
  const { sender, content } = message;
  const isUser = sender === 'user';

  const avatar = isUser ? '👤' : '🤖';
  const bubbleClasses = isUser
    ? 'bg-primary-500 text-white'
    : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
    
  const containerClasses = isUser ? 'justify-end' : 'justify-start';

  // Basic markdown-like text formatting for bold
  const formatText = (text: string) => {
    return text.split('**').map((part, index) => 
      index % 2 === 1 ? <strong key={index}>{part}</strong> : part
    );
  };

  return (
    <div className={`flex items-start gap-3 ${containerClasses}`}>
      {!isUser && <span className="text-2xl mt-1">{avatar}</span>}
      <div className="flex flex-col max-w-2xl">
        {content.text && (
            <div className={`px-4 py-2 rounded-xl ${bubbleClasses} mb-2`}>
                <p>{formatText(content.text)}</p>
            </div>
        )}
        
        {content.sql && (
             <div className="p-4 rounded-lg bg-gray-900 text-white font-mono text-sm overflow-x-auto mb-2">
                <pre><code>{content.sql}</code></pre>
            </div>
        )}
        
        {content.results && (
            <div className="w-full overflow-hidden rounded-lg border dark:border-gray-700 mb-2">
                <QueryResultTable headers={content.results.headers} rows={content.results.rows} />
            </div>
        )}

        {content.error && (
            <div className="p-3 rounded-lg bg-red-100 border border-red-400 text-red-800 text-sm">
                <strong>Error:</strong> {content.error}
            </div>
        )}
      </div>
      {isUser && <span className="text-2xl mt-1">{avatar}</span>}
    </div>
  );
};

export default ChatMessageComponent;