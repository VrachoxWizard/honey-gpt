import { useChatStore, welcomeMessage } from '../store/chatStore';
import {
  selectSessions,
  selectActiveSessionId,
  selectMessages,
  selectIsSending,
  selectError,
  selectActiveModel,
  selectToneMode,
} from '../store/selectors';

export { welcomeMessage };

export function useChat() {
  const sessions = useChatStore(selectSessions);
  const activeSessionId = useChatStore(selectActiveSessionId);
  const messages = useChatStore(selectMessages);
  const isSending = useChatStore(selectIsSending);
  const error = useChatStore(selectError);
  const activeModel = useChatStore(selectActiveModel);
  const toneMode = useChatStore(selectToneMode);
  const summaryWarning = useChatStore((s) => s.summaryWarning);

  const setToneMode = useChatStore((s) => s.setToneMode);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const regenerateLastResponse = useChatStore((s) => s.regenerateLastResponse);
  const editAndResend = useChatStore((s) => s.editAndResend);
  const newChat = useChatStore((s) => s.newChat);
  const switchSession = useChatStore((s) => s.switchSession);
  const deleteSession = useChatStore((s) => s.deleteSession);
  const renameSession = useChatStore((s) => s.renameSession);
  const clearAllSessions = useChatStore((s) => s.clearAllSessions);
  const abortGeneration = useChatStore((s) => s.abortGeneration);
  const shareSession = useChatStore((s) => s.shareSession);
  const exportSession = useChatStore((s) => s.exportSession);
  const importSession = useChatStore((s) => s.importSession);
  const setActiveModel = useChatStore((s) => s.setActiveModel);

  return {
    sessions,
    activeSessionId,
    messages,
    toneMode,
    setToneMode,
    error,
    isSending,
    activeModel,
    summaryWarning,
    sendMessage,
    regenerateLastResponse,
    editAndResend,
    newChat,
    switchSession,
    deleteSession,
    renameSession,
    clearAllSessions,
    abortGeneration,
    shareSession,
    exportSession,
    importSession,
    setActiveModel,
  };
}
