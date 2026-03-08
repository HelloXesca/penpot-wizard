import { atom } from 'nanostores';

export const $isConversationHistoryPanelOpen = atom(false);
export const $isConversationHistoryPanelClosing = atom(false);

export function openConversationHistoryPanel() {
  $isConversationHistoryPanelClosing.set(false);
  $isConversationHistoryPanelOpen.set(true);
}

export function closeConversationHistoryPanel() {
  $isConversationHistoryPanelOpen.set(false);
  $isConversationHistoryPanelClosing.set(false);
}

export function requestCloseConversationHistoryPanel() {
  $isConversationHistoryPanelClosing.set(true);
}

export function toggleConversationHistoryPanel() {
  if ($isConversationHistoryPanelOpen.get()) {
    requestCloseConversationHistoryPanel();
  } else {
    openConversationHistoryPanel();
  }
}
