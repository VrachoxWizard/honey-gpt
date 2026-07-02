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
  onDelete: (id: string) => void;
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
  onDelete,
}: ChatListItemProps) {
  const onKey = (e: KeyboardEvent, id: string) => {
    if (e.key === 'Enter') onEditSave(id);
    else if (e.key === 'Escape') onEditCancel();
  };

  const handleDelete = (e: MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Spaliti ovaj zapis?')) {
      onDelete(session.id);
    }
  };

  return (
    <div
      onClick={() => !isEditing && onSelect(session.id)}
      className={cn(
        'group relative flex items-center justify-between p-2 mb-1 rounded-xl transition-all cursor-pointer border',
        isActive
          ? 'bg-gold/15 border-gold/30 shadow-[inset_0_1px_4px_rgba(255,215,0,0.1)]'
          : 'bg-transparent border-transparent hover:bg-vellum/50'
      )}
    >
      <div className="flex-1 min-w-0 pr-6">
        {isEditing ? (
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <input
              autoFocus
              value={editTitle}
              onChange={(e) => onEditChange(e.target.value)}
              onKeyDown={(e) => onKey(e, session.id)}
              className="w-full bg-parchment-2 border border-gold/40 rounded px-1.5 py-0.5 text-xs text-ink focus:outline-none focus:border-gold"
            />
            <button
              onClick={() => onEditSave(session.id)}
              className="p-1 text-gold hover:text-gold-light"
              aria-label="Spremi naslov"
            >
              <Check size={13} />
            </button>
            <button
              onClick={onEditCancel}
              className="p-1 text-ink-faint hover:text-oxblood"
              aria-label="Odustani"
            >
              <X size={13} />
            </button>
          </div>
        ) : (
          <div className="text-[13px] text-ink font-medium truncate tracking-tight">
            {session.title}
          </div>
        )}
      </div>

      {!isEditing && (
        <div
          className={cn(
            'absolute right-2 flex items-center gap-1 transition-opacity',
            isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          )}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEditStart(session.id, session.title);
            }}
            className="p-1.5 text-ink-faint hover:text-ink transition-colors rounded-md hover:bg-vellum"
            title="Preimenuj"
            aria-label="Preimenuj"
          >
            <Pencil size={12} />
          </button>
          <button
            onClick={handleDelete}
            className="p-1.5 text-ink-faint hover:text-oxblood transition-colors rounded-md hover:bg-vellum"
            title="Spali zapis"
            aria-label="Spali zapis"
          >
            <Trash2 size={12} />
          </button>
        </div>
      )}
    </div>
  );
});
