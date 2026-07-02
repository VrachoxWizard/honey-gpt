import { KeyboardEvent, MouseEvent } from 'react';
import { Pencil, Trash2, Check, X } from 'lucide-react';
import { cn } from '@utils/cn';
import type { ChatSession } from '@shared/types';
import { memo } from 'react';

interface ChatListItemProps {
  session: ChatSession;
  isActive: boolean;
  isEditing: boolean;
  editTitle: string;
  onSelect: (id: string) => void;
  onEditStart: (id: string, title: string) => void;
  onEditChange: (title: string) => void;
  onEditSave: (id: string) => void;
  onEditCancel: () => void;
  onDeleteRequest: (id: string) => void;
}

export const ChatListItem = memo(function ChatListItem({
  session,
  isActive,
  isEditing,
  editTitle,
  onSelect,
  onEditStart,
  onEditChange,
  onEditSave,
  onEditCancel,
  onDeleteRequest,
}: ChatListItemProps) {
  const onKey = (e: KeyboardEvent, id: string) => {
    if (e.key === 'Enter') onEditSave(id);
    else if (e.key === 'Escape') onEditCancel();
  };

  const handleDelete = (e: MouseEvent) => {
    e.stopPropagation();
    onDeleteRequest(session.id);
  };

  if (isEditing) {
    return (
      <div
        className={cn(
          'group relative flex items-center justify-between p-2 mb-1 rounded-xl border',
          isActive ? 'bg-gold/15 border-gold/30' : 'bg-transparent border-transparent'
        )}
      >
        <div className="flex flex-1 items-center gap-1.5 min-w-0">
          <input
            autoFocus
            value={editTitle}
            onChange={(e) => onEditChange(e.target.value)}
            onKeyDown={(e) => onKey(e, session.id)}
            className="w-full bg-parchment-2 border border-gold/40 rounded px-1.5 py-0.5 text-xs text-ink focus:outline-none focus:border-gold"
            aria-label="Uredi naslov razgovora"
          />
          <button
            type="button"
            onClick={() => onEditSave(session.id)}
            className="p-1 text-gold hover:text-gold-light"
            aria-label="Spremi naslov"
          >
            <Check size={13} />
          </button>
          <button
            type="button"
            onClick={onEditCancel}
            className="p-1 text-ink-faint hover:text-oxblood"
            aria-label="Odustani"
          >
            <X size={13} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'group relative flex items-center justify-between p-2 mb-1 rounded-xl border',
        isActive
          ? 'bg-gold/15 border-gold/30 shadow-[inset_0_1px_4px_rgba(255,215,0,0.1)]'
          : 'bg-transparent border-transparent hover:bg-vellum/50'
      )}
    >
      <button
        type="button"
        onClick={() => onSelect(session.id)}
        aria-current={isActive ? 'true' : undefined}
        className="flex-1 min-w-0 pr-14 text-left text-[13px] text-ink font-medium truncate tracking-tight cursor-pointer"
      >
        {session.title}
      </button>

      <div className="absolute right-2 flex items-center gap-1">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEditStart(session.id, session.title);
          }}
          className={cn(
            'p-1.5 text-ink-faint hover:text-ink transition-colors rounded-md hover:bg-vellum',
            isActive
              ? 'opacity-100'
              : 'opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100'
          )}
          title="Preimenuj"
          aria-label="Preimenuj"
        >
          <Pencil size={12} />
        </button>
        <button
          type="button"
          onClick={handleDelete}
          className={cn(
            'p-1.5 text-ink-faint hover:text-oxblood transition-colors rounded-md hover:bg-vellum',
            isActive
              ? 'opacity-100'
              : 'opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100'
          )}
          title="Spali zapis"
          aria-label="Spali zapis"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
});
