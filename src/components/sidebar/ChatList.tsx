import { AnimatePresence } from 'framer-motion';
import { ChatListItem } from './ChatListItem';
import type { ChatSession } from '@shared/types';

interface ChatListProps {
  sessions: ChatSession[];
  filteredSessions: ChatSession[];
  activeSessionId?: string;
  editingId: string | null;
  editTitle: string;
  onSelect: (id: string) => void;
  onEditStart: (id: string, title: string) => void;
  onEditChange: (title: string) => void;
  onEditSave: (id: string) => void;
  onEditCancel: () => void;
  onDeleteRequest: (id: string) => void;
}

export function ChatList({
  sessions,
  filteredSessions,
  activeSessionId,
  editingId,
  editTitle,
  onSelect,
  onEditStart,
  onEditChange,
  onEditSave,
  onEditCancel,
  onDeleteRequest,
}: ChatListProps) {
  return (
    <div className="flex-1 min-h-0 overflow-y-auto px-1 pb-2 scrollbar-thin">
      {filteredSessions.length === 0 ? (
        <p className="px-3 py-6 text-center text-[13px] text-ink-faint italic leading-relaxed">
          {sessions.length === 0
            ? 'Umoči pero i zapiši prvu molbu.'
            : 'Ništa ne odgovara pretrazi.'}
        </p>
      ) : (
        <AnimatePresence initial={false}>
          {filteredSessions.map((session) => (
            <ChatListItem
              key={session.id}
              session={session}
              isActive={session.id === activeSessionId}
              isEditing={editingId === session.id}
              editTitle={editTitle}
              onSelect={onSelect}
              onEditStart={onEditStart}
              onEditChange={onEditChange}
              onEditSave={onEditSave}
              onEditCancel={onEditCancel}
              onDeleteRequest={onDeleteRequest}
            />
          ))}
        </AnimatePresence>
      )}
    </div>
  );
}
