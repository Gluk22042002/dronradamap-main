declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initData: string;
        initDataUnsafe: {
          query_id?: string;
          user?: { id: number; first_name: string; last_name?: string; username?: string; language_code?: string };
          auth_date?: string;
          hash?: string;
        };
        colorScheme: 'light' | 'dark';
        themeParams: {
          bg_color?: string;
          secondary_bg_color?: string;
          text_color?: string;
          hint_color?: string;
          link_color?: string;
          button_color?: string;
          button_text_color?: string;
          header_bg_color?: string;
          accent_text_color?: string;
          section_bg_color?: string;
          section_header_text_color?: string;
          subtitle_text_color?: string;
          destructive_text_color?: string;
        };
        isExpanded: boolean;
        viewportHeight: number;
        viewportStableHeight: number;
        platform: string;
        headerColor: string;
        backgroundColor: string;
        BackButton: {
          isVisible: boolean;
          show: () => void;
          hide: () => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
        };
        MainButton: {
          isVisible: boolean;
          isActive: boolean;
          isProgressVisible: boolean;
          text: string;
          color: string;
          textColor: string;
          show: () => void;
          hide: () => void;
          setText: (text: string) => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
          showProgress: () => void;
          hideProgress: () => void;
          enable: () => void;
          disable: () => void;
        };
        HapticFeedback: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
          selectionChanged: () => void;
        };
        expand: () => void;
        close: () => void;
        setHeaderColor: (color: string) => void;
        setBackgroundColor: (color: string) => void;
        ready: () => void;
      };
    };
  }
}

const tg = window.Telegram?.WebApp;

export function initTelegram() {
  if (!tg) return;
  tg.expand();
  tg.ready();
}

export interface AppTheme {
  isDark: boolean;
  bg: string;
  text: string;
  hint: string;
  button: string;
  buttonText: string;
  secondaryBg: string;
  link: string;
  headerBg: string;
  accent: string;
  sectionBg: string;
  cardBg: string;
  cardBorder: string;
  glowColor: string;
}

export function getTheme(): AppTheme {
  if (!tg) return {
    isDark: true,
    bg: '#07070d',
    text: '#eeeff6',
    hint: '#4f4f65',
    button: '#3b82f6',
    buttonText: '#ffffff',
    secondaryBg: '#0b0b12',
    link: '#60a5fa',
    headerBg: 'rgba(7,7,13,0.85)',
    accent: '#60a5fa',
    sectionBg: '#0f0f1a',
    cardBg: 'rgba(255,255,255,0.015)',
    cardBorder: 'rgba(255,255,255,0.04)',
    glowColor: 'rgba(59,130,246,0.15)',
  };
  const p = tg.themeParams;
  return {
    isDark: tg.colorScheme === 'dark',
    bg: p.bg_color || '#07070d',
    text: p.text_color || '#eeeff6',
    hint: p.hint_color || '#4f4f65',
    button: p.button_color || '#3b82f6',
    buttonText: p.button_text_color || '#ffffff',
    secondaryBg: p.secondary_bg_color || '#0b0b12',
    link: p.link_color || '#60a5fa',
    headerBg: p.header_bg_color || 'rgba(7,7,13,0.85)',
    accent: p.accent_text_color || '#60a5fa',
    sectionBg: p.section_bg_color || '#0f0f1a',
    cardBg: 'rgba(255,255,255,0.015)',
    cardBorder: 'rgba(255,255,255,0.04)',
    glowColor: 'rgba(59,130,246,0.15)',
  };
}

export function showBackButton(callback: () => void) {
  if (!tg?.BackButton) return;
  tg.BackButton.show();
  tg.BackButton.onClick(callback);
}

export function hideBackButton() {
  if (!tg?.BackButton) return;
  tg.BackButton.hide();
}

export function showMainButton(text: string, callback: () => void) {
  if (!tg?.MainButton) return;
  tg.MainButton.setText(text);
  tg.MainButton.show();
  tg.MainButton.onClick(callback);
}

export function hideMainButton() {
  if (!tg?.MainButton) return;
  tg.MainButton.hide();
}

export function hapticImpact(style: 'light' | 'medium' | 'heavy' = 'medium') {
  tg?.HapticFeedback?.impactOccurred(style);
}

export function hapticSuccess() {
  tg?.HapticFeedback?.notificationOccurred('success');
}

export { tg };
