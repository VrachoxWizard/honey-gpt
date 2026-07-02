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

const DATE_GROUP_ORDER = ['Danas', 'Jučer', 'Starije'] as const;
type DateGroupLabel = (typeof DATE_GROUP_ORDER)[number];

function startOfDay(timestamp: number): number {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function dateGroupLabel(createdAt: number): DateGroupLabel {
  const diffDays = Math.round((startOfDay(Date.now()) - startOfDay(createdAt)) / 86_400_000);
  if (diffDays <= 0) return 'Danas';
  if (diffDays === 1) return 'Jučer';
  return 'Starije';
}

function groupSessionsByDate(
  sessions: ChatSession[]
): Array<{ label: DateGroupLabel; sessions: ChatSession[] }> {
  const buckets: Record<DateGroupLabel, ChatSession[]> = {
    Danas: [],
    Jučer: [],
    Starije: [],
  };

  for (const session of sessions) {
    buckets[dateGroupLabel(session.createdAt)].push(session);
  }

  return DATE_GROUP_ORDER.map((label) => ({ label, sessions: buckets[label] })).filter(
    (group) => group.sessions.length > 0
  );
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
  const groups = groupSessionsByDate(filteredSessions);
  const showGroupHeaders = groups.length > 1;

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
          {groups.map((group) => (
            <div key={group.label}>
              {showGroupHeaders && (
                <p className="rubric text-[9px] px-2 pt-3 pb-1 first:pt-1">{group.label}</p>
              )}
              {group.sessions.map((session) => (
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
            </div>
          ))}
        </AnimatePresence>
      )}
    </div>
  );
}
