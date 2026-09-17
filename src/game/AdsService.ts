/**
 * AdsService - Handles Rewarded Ad integration for PWA Builder / Android APK / Uptodown
 * Strictly disabled when running on Itch.io or in Itch builds.
 */

export type AdRewardType = 'recover_diamonds' | 'revive';

/**
 * AdMob Configuration for Android APK / Uptodown
 * Insert your 2 AdMob codes here:
 */
export const ADMOB_CONFIG = {
  // Code 1: Rewarded Ad Unit ID for RESCUE 🚀
  RESCUE_AD_UNIT_ID: 'ca-app-pub-6542029020781525/3727907220',

  // Code 2: Rewarded Ad Unit ID for RECOVER 💎
  RECOVER_AD_UNIT_ID: 'ca-app-pub-6542029020781525/9273456955',

  // Optional App ID (e.g. ca-app-pub-xxxxxxxxxxxxxxxx~yyyyyyyyyy)
  APP_ID: 'ca-app-pub-6542029020781525~1338739570',
};

declare global {
  interface Window {
    __ITCH_BUILD__?: boolean;
    // Native AdMob Bridge hooks for Android APK / Capacitor / Cordova / WebToApp
    AndroidAdsBridge?: {
      showRewardedAd: (rewardType: string, adUnitId?: string) => void;
      isAdReady?: (rewardType?: string) => boolean;
      hasInternet?: () => boolean;
    };
    admob?: {
      rewarded?: {
        show: (options?: { adId?: string }) => Promise<void>;
      };
    };
    AdMob?: {
      showRewardVideoAd?: (options?: { adId?: string }) => Promise<void>;
    };
    onAdMobRewardSuccess?: (rewardType: string) => void;
    onAdMobRewardFailed?: (reason: string) => void;
  }
}

export class AdsService {
  private static instance: AdsService;
  private adInProgress = false;

  private constructor() {
    // Setup global window callback for native Android AdMob wrapper
    if (typeof window !== 'undefined') {
      window.onAdMobRewardSuccess = (rewardType: string) => {
        this.adInProgress = false;
        console.log(`[AdsService] Native AdMob Reward Granted: ${rewardType}`);
      };
      window.onAdMobRewardFailed = (reason: string) => {
        this.adInProgress = false;
        console.warn(`[AdsService] Native AdMob Failed: ${reason}`);
      };
    }
  }

  static getInstance(): AdsService {
    if (!AdsService.instance) {
      AdsService.instance = new AdsService();
    }
    return AdsService.instance;
  }

  /**
   * Check if device is connected to the internet.
   * Ads and recovery rewards require active internet connection.
   */
  isOnline(): boolean {
    if (typeof navigator !== 'undefined' && 'onLine' in navigator) {
      if (!navigator.onLine) return false;
    }
    // Check native bridge if available
    if (typeof window !== 'undefined' && window.AndroidAdsBridge && typeof window.AndroidAdsBridge.hasInternet === 'function') {
      return window.AndroidAdsBridge.hasInternet();
    }
    return true;
  }

  /**
   * Check if running in Itch.io environment.
   * If on Itch.io or Itch build, all ads must remain strictly hidden and disabled.
   */
  isItchPlatform(): boolean {
    if (typeof window === 'undefined') return true;

    // Check custom Itch build flag
    if (window.__ITCH_BUILD__ === true) return true;

    // Check query parameters (e.g. ?platform=itch or ?itch=1)
    const search = (window.location.search || '').toLowerCase();
    if (
      search.includes('platform=itch') ||
      search.includes('itch=true') ||
      search.includes('itch=1') ||
      search.includes('target=itch')
    ) {
      return true;
    }

    // Check hostnames and domains used by Itch.io games
    const hostname = (window.location.hostname || '').toLowerCase();
    if (
      hostname.includes('itch.io') ||
      hostname.includes('itch.zone') ||
      hostname.includes('hwcdn.net') || // Itch.io CDN hosting HTML5 iframes
      hostname.includes('itch')
    ) {
      return true;
    }

    // Check document referrer (when embedded in an Itch iframe or game page)
    try {
      const ref = (document.referrer || '').toLowerCase();
      if (
        ref.includes('itch.io') ||
        ref.includes('itch.zone') ||
        ref.includes('hwcdn.net') ||
        ref.includes('itch')
      ) {
        return true;
      }
    } catch {
      // ignore security restrictions
    }

    // Check window ancestors if accessible
    try {
      if (window.location.ancestorOrigins && window.location.ancestorOrigins.length > 0) {
        for (let i = 0; i < window.location.ancestorOrigins.length; i++) {
          const origin = window.location.ancestorOrigins[i].toLowerCase();
          if (origin.includes('itch.io') || origin.includes('itch.zone') || origin.includes('hwcdn.net')) {
            return true;
          }
        }
      }
    } catch {
      // ignore
    }

    return false;
  }

  /**
   * Ads are active in PWA / APK / Uptodown / Standalone mobile environments.
   * Ads are strictly HIDDEN and DISABLED on Itch.io.
   */
  isAdsEnabled(): boolean {
    if (this.isItchPlatform()) {
      return false;
    }
    return true;
  }

  /**
   * Play a Rewarded Ad with fallback simulated interactive modal if native AdMob bridge is pending.
   * Requires active internet connection.
   */
  showRewardedAd(
    type: AdRewardType,
    onSuccess: () => void,
    onFailure?: (error: string) => void,
  ): void {
    if (!this.isAdsEnabled()) {
      if (onFailure) onFailure('ADS_DISABLED');
      return;
    }

    // Must have internet connection to load and watch ads
    if (!this.isOnline()) {
      if (onFailure) onFailure('NO_INTERNET');
      return;
    }

    if (this.adInProgress) return;
    this.adInProgress = true;

    const adUnitId =
      type === 'recover_diamonds'
        ? ADMOB_CONFIG.RECOVER_AD_UNIT_ID
        : ADMOB_CONFIG.RESCUE_AD_UNIT_ID;

    // 1. Check if Native Android AdMob bridge is injected (e.g. Capacitor / TWA / Cordova APK for Uptodown)
    if (
      typeof window !== 'undefined' &&
      window.AndroidAdsBridge &&
      typeof window.AndroidAdsBridge.showRewardedAd === 'function'
    ) {
      try {
        const prevSuccess = window.onAdMobRewardSuccess;
        const prevFailed = window.onAdMobRewardFailed;

        window.onAdMobRewardSuccess = (rewardType: string) => {
          this.adInProgress = false;
          if (prevSuccess) prevSuccess(rewardType);
          onSuccess();
        };

        window.onAdMobRewardFailed = (reason: string) => {
          this.adInProgress = false;
          if (prevFailed) prevFailed(reason);
          if (onFailure) onFailure(reason);
        };

        window.AndroidAdsBridge.showRewardedAd(type, adUnitId);
        return;
      } catch (err) {
        console.warn('[AdsService] Native AdMob bridge error, falling back to overlay:', err);
      }
    }

    // 2. Check Capacitor / Cordova community AdMob plugin
    if (typeof window !== 'undefined' && window.admob?.rewarded?.show) {
      window.admob.rewarded
        .show({ adId: adUnitId || undefined })
        .then(() => {
          this.adInProgress = false;
          onSuccess();
        })
        .catch((err) => {
          this.adInProgress = false;
          console.warn('[AdsService] Cordova AdMob error:', err);
          if (onFailure) onFailure('ADMOB_FAILED');
        });
      return;
    }

    // 3. High-performance PWA / Web Ad playback overlay
    this.showPwaAdOverlay(type, onSuccess, onFailure);
  }

  /**
   * Sleek in-game rewarded video overlay for PWA Builder / Mobile Web / Uptodown APK
   */
  private showPwaAdOverlay(
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

    let countdown = 3; // 3-second quick rewarded prompt for snappy user experience
    let timerId: number | null = null;

    modal.innerHTML = `
      <div style="background: linear-gradient(135deg, #1e293b, #0f172a); border: 2px solid #38bdf8; border-radius: 20px; padding: 24px; max-width: 360px; width: 100%; text-align: center; box-shadow: 0 12px 36px rgba(0,0,0,0.6);">
        <div style="font-size: 38px; margin-bottom: 8px;">📺</div>
        <div style="font-size: 19px; font-weight: 800; color: #38bdf8; margin-bottom: 8px;">${titleText}</div>
        <div style="font-size: 13px; color: #cbd5e1; line-height: 1.4; margin-bottom: 18px;">${descText}</div>
        
        <!-- Ad Simulation Banner -->
        <div style="background: rgba(30, 41, 59, 0.9); border: 1px dashed #64748b; border-radius: 12px; padding: 14px; margin-bottom: 18px;">
          <div style="font-size: 11px; text-transform: uppercase; color: #94a3b8; letter-spacing: 1px; margin-bottom: 4px;">AdMob / PWA Sponsor Ad</div>
          <div style="font-size: 15px; font-weight: 700; color: #facc15;">⭐ Sky Jumper Pro Upgrades ⭐</div>
          <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">Uptodown & Mobile APK Edition</div>
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
          timerLabel.textContent = `✅ Reward Granted!`;
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
