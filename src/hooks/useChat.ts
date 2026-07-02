import { useChatStore, welcomeMessage } from '../store/chatStore';

export { welcomeMessage };

export function useChat() {
  const store = useChatStore();

  const activeSession =
    store.sessions.find((s) => s.id === store.activeSessionId) || store.sessions[0];
  const messages = activeSession ? activeSession.messages : [welcomeMessage];

  return {
    ...store,
    messages,
  };
}
