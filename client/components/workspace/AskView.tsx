'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';
import { Send, Bot, User, BookOpen, Quote, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface Props {
  projectId: string;
}

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  sources?: Array<{
    paper_id?: string;
    title?: string;
    passage?: string;
    page_number?: number;
  }>;
}

export function AskView({ projectId }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      content:
        'Ask questions about the papers indexed in this project. All answers are grounded strictly in the retrieved text passages with verified citations.'
    }
  ]);
  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const query = input.trim();
    if (!query || loading) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: 'user',
      content: query
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post<{
        answer: string;
        sources: Array<{
          paper_id?: string;
          title?: string;
          passage?: string;
          page_number?: number;
        }>;
      }>(`/api/projects/${projectId}/ask`, { prompt: query, question: query });

      const botMsg: Message = {
        id: `a-${Date.now()}`,
        sender: 'assistant',
        content: res.answer,
        sources: res.sources || []
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        content:
          err instanceof Error
            ? `Query failed: ${err.message}`
            : 'Failed to retrieve answers from the research index.'
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-[650px] rounded-lg border border-border bg-bg-surface overflow-hidden">
      {/* Header */}
      <div className="p-3.5 border-b border-border bg-bg-subtle/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-accent" />
          <span className="text-xs font-semibold text-text-primary">Grounded Literature Assistant</span>
        </div>
        <span className="text-[11px] text-text-muted">Strict Context Retrieval</span>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m) => {
          const isUser = m.sender === 'user';
          return (
            <div
              key={m.id}
              className={cn('flex items-start gap-3 text-xs md:text-sm', isUser ? 'justify-end' : 'justify-start')}
            >
              {!isUser && (
                <div className="h-7 w-7 rounded-full bg-accent/15 text-accent flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="h-4 w-4" />
                </div>
              )}

              <div
                className={cn(
                  'max-w-[80%] rounded-lg p-3 space-y-2',
                  isUser
                    ? 'bg-accent text-text-primary'
                    : 'bg-bg-subtle text-text-primary border border-border/70'
                )}
              >
                <p className="leading-relaxed whitespace-pre-line">{m.content}</p>

                {/* Evidence Sources */}
                {m.sources && m.sources.length > 0 && (
                  <div className="pt-2 border-t border-border/50 space-y-1.5">
                    <span className="text-[11px] uppercase tracking-wider font-semibold text-text-muted block">
                      Evidence Sources
                    </span>
                    <div className="space-y-1.5">
                      {m.sources.map((s, idx) => (
                        <div
                          key={idx}
                          className="p-2 rounded bg-bg-surface border border-border/40 text-xs text-text-muted space-y-0.5"
                        >
                          <div className="flex items-center gap-1.5 font-medium text-text-primary">
                            <BookOpen className="h-3 w-3 text-accent shrink-0" />
                            <span className="truncate">{s.title || 'Indexed Paper'}</span>
                            {s.page_number && <span className="text-[10px] text-text-muted font-mono">(p. {s.page_number})</span>}
                          </div>
                          {s.passage && (
                            <p className="text-[11px] italic font-sans pl-4 border-l border-border/70 text-text-muted">
                              &ldquo;{s.passage}&rdquo;
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {isUser && (
                <div className="h-7 w-7 rounded-full bg-bg-subtle text-text-primary flex items-center justify-center shrink-0 mt-0.5 border border-border">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex items-start gap-3 text-sm">
            <div className="h-7 w-7 rounded-full bg-accent/15 text-accent flex items-center justify-center shrink-0">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
            <div className="rounded-lg p-3 bg-bg-subtle border border-border/70 text-text-muted text-xs">
              Retrieving context from Qdrant vector index and formulating grounded response...
            </div>
          </div>
        )}
      </div>

      {/* Input box */}
      <form onSubmit={handleSend} className="p-3 border-t border-border bg-bg-subtle/30 flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about the methodology, dataset, or findings..."
          className="bg-bg-surface text-xs md:text-sm"
          disabled={loading}
        />
        <Button type="submit" disabled={loading || !input.trim()} size="sm" className="px-3 shrink-0">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
