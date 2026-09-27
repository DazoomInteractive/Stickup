// ============================================================
// Sky Jumper - Ads Service
// Configured for Start.io (StartApp) integration & Aptoide distribution
// ============================================================

export type AdRewardType = 'recover_diamonds' | 'rescue_flight';

export interface StartIoConfig {
  APP_ID: string;
}

export const STARTIO_CONFIG: StartIoConfig = {
  // Replace with your 9-digit Start.io App ID once registered at portal.start.io
  APP_ID: '200000000',
};

declare global {
  interface Window {
    AndroidAdsBridge?: {
      hasInternet?: () => boolean;
      showRewardedAd?: (rewardType: string) => void;
      showStartIoRewarded?: (rewardType: string) => void;
    };
    onStartIoRewardSuccess?: (rewardType: string) => void;
    onStartIoRewardFailed?: (reason: string) => void;
    __ITCH_BUILD__?: boolean;
  }
}

export class AdsService {
  private static instance: AdsService;
  private adInProgress = false;

  private constructor() {
    if (typeof window !== 'undefined') {
      window.onStartIoRewardSuccess = (rewardType: string) => {
        this.adInProgress = false;
        console.log(`[AdsService] Start.io Reward Granted: ${rewardType}`);
      };
      window.onStartIoRewardFailed = (reason: string) => {
        this.adInProgress = false;
        console.warn(`[AdsService] Start.io Reward Failed: ${reason}`);
      };
    }
  }

  static getInstance(): AdsService {
    if (!AdsService.instance) {
      AdsService.instance = new AdsService();
    }
    return AdsService.instance;
  }

  isOnline(): boolean {
    if (typeof navigator !== 'undefined' && 'onLine' in navigator && !navigator.onLine) {
      return false;
    }
    if (
      typeof window !== 'undefined' &&
      window.AndroidAdsBridge &&
      typeof window.AndroidAdsBridge.hasInternet === 'function'
    ) {
      return window.AndroidAdsBridge.hasInternet();
    }
    return true;
  }

  showRewardedAd(
    type: AdRewardType,
    onSuccess: () => void,
    onFailure?: (error: string) => void,
  ): void {
    if (!this.isOnline()) {
      if (onFailure) onFailure('NO_INTERNET');
      return;
    }

    if (this.adInProgress) return;
    this.adInProgress = true;

    // 1. Android Native Start.io Bridge
    if (typeof window !== 'undefined' && window.AndroidAdsBridge) {
      const prevSuccess = window.onStartIoRewardSuccess;
      const prevFailed = window.onStartIoRewardFailed;

      window.onStartIoRewardSuccess = (rewardType: string) => {
        this.adInProgress = false;
        if (prevSuccess) prevSuccess(rewardType);
        onSuccess();
      };

      window.onStartIoRewardFailed = (reason: string) => {
        this.adInProgress = false;
        if (prevFailed) prevFailed(reason);
        if (onFailure) onFailure(reason);
      };

      if (typeof window.AndroidAdsBridge.showStartIoRewarded === 'function') {
        window.AndroidAdsBridge.showStartIoRewarded(type);
        return;
      } else if (typeof window.AndroidAdsBridge.showRewardedAd === 'function') {
        window.AndroidAdsBridge.showRewardedAd(type);
        return;
      }
    }

    // 2. Fallback in-game overlay
    this.showWebAdOverlay(type, onSuccess, onFailure);
  }

  private showWebAdOverlay(
    type: AdRewardType,
    onSuccess: () => void,
    onFailure?: (error: string) => void,
  ): void {
    const existing = document.getElementById('rewarded-ad-modal');
    if (existing) existing.remove();

    const titleText =
      type === 'recover_diamonds'
        ? '💎 Recover 100% Diamonds'
        : '🚀 Revive & Rescue Flight';

    const descText =
      type === 'recover_diamonds'
        ? 'Watch a short video to recover all lost diamonds safely into your bank!'
        : 'Watch a short video to resume your run right here with a protective shield!';

    const modal = document.createElement('div');
    modal.id = 'rewarded-ad-modal';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100vw';
    modal.style.height = '100vh';
    modal.style.backgroundColor = 'rgba(15, 23, 42, 0.94)';
    modal.style.zIndex = '99999';
    modal.style.display = 'flex';
    modal.style.flexDirection = 'column';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.fontFamily = 'system-ui, -apple-system, Roboto, sans-serif';
    modal.style.color = '#ffffff';
    modal.style.userSelect = 'none';
    modal.style.padding = '20px';
    modal.style.boxSizing = 'border-box';

    let countdown = 3;
    let timerId: number | null = null;

    modal.innerHTML = `
      <div style="background: linear-gradient(135deg, #1e293b, #0f172a); border: 2px solid #38bdf8; border-radius: 20px; padding: 24px; max-width: 360px; width: 100%; text-align: center; box-shadow: 0 12px 36px rgba(0,0,0,0.6);">
        <div style="font-size: 38px; margin-bottom: 8px;">📺</div>
        <div style="font-size: 19px; font-weight: 800; color: #38bdf8; margin-bottom: 8px;">${titleText}</div>
        <div style="font-size: 13px; color: #cbd5e1; line-height: 1.4; margin-bottom: 18px;">${descText}</div>
        
        <div style="background: rgba(30, 41, 59, 0.9); border: 1px dashed #64748b; border-radius: 12px; padding: 14px; margin-bottom: 18px;">
          <div style="font-size: 11px; text-transform: uppercase; color: #94a3b8; letter-spacing: 1px; margin-bottom: 4px;">Sponsored Ad</div>
          <div style="font-size: 15px; font-weight: 700; color: #facc15;">⭐ StickUp Pro Upgrades ⭐</div>
        </div>

        <div id="ad-timer-label" style="font-size: 15px; font-weight: 700; color: #4ade80; margin-bottom: 14px;">
          Reward in: ${countdown}s...
        </div>

        <button id="ad-close-btn" style="background: #334155; color: #94a3b8; border: none; border-radius: 10px; padding: 8px 18px; font-size: 12px; font-weight: 600; cursor: pointer;">
          Cancel
        </button>
      </div>
    `;

    document.body.appendChild(modal);

    const timerLabel = document.getElementById('ad-timer-label');
    const closeBtn = document.getElementById('ad-close-btn');

    if (closeBtn) {
      closeBtn.onclick = () => {
        if (timerId) clearInterval(timerId);
        modal.remove();
        this.adInProgress = false;
        if (onFailure) onFailure('Ad cancelled');
      };
    }

    timerId = window.setInterval(() => {
      countdown--;
      if (timerLabel) {
        if (countdown > 0) {
          timerLabel.textContent = `Reward in: ${countdown}s...`;
        } else {
          timerLabel.textContent = '✅ Reward Granted!';
          timerLabel.style.color = '#22c55e';
        }
      }

      if (countdown <= 0) {
        if (timerId) clearInterval(timerId);
        setTimeout(() => {
          modal.remove();
          this.adInProgress = false;
          onSuccess();
        }, 500);
      }
    }, 1000);
  }
}
