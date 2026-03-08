import { atom } from 'nanostores';

export const $isSettingsPanelOpen = atom(false);
export const $isSettingsPanelClosing = atom(false);

export function openSettingsPanel() {
  $isSettingsPanelClosing.set(false);
  $isSettingsPanelOpen.set(true);
}

export function closeSettingsPanel() {
  $isSettingsPanelOpen.set(false);
  $isSettingsPanelClosing.set(false);
}

export function requestCloseSettingsPanel() {
  $isSettingsPanelClosing.set(true);
}

export function toggleSettingsPanel() {
  if ($isSettingsPanelOpen.get()) {
    requestCloseSettingsPanel();
  } else {
    openSettingsPanel();
  }
}
