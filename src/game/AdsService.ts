/**
 * AdsService - Handles Rewarded Ad integration (Start.io bridge & Web simulation).
 * Allows players to:
 * 1. Recover +25% lost diamonds (total 50%).
 * 2. Revive & resume game once per run.
 */

export type AdRewardType = 'recover_diamonds' | 'revive';

export class AdsService {
  private static instance: AdsService;

  private constructor() {}

  static getInstance(): AdsService {
    if (!AdsService.instance) {
      AdsService.instance = new AdsService();
    }
    return AdsService.instance;
  }

  isOnline(): boolean {
    if (typeof navigator !== 'undefined' && 'onLine' in navigator) {
      return navigator.onLine;
    }
    return true;
  }

  isAdsEnabled(): boolean {
    return true;
  }

  showRewardedAd(
    type: AdRewardType,
    onSuccess: () => void,
    onFailure?: (error: string) => void,
  ): void {
    if (!this.isOnline()) {
      if (onFailure) {
        onFailure('NO_INTERNET');
      }
      return;
    }

    // Check if running inside Android WebView with Start.io JavaScript bridge
    const androidAds = (window as unknown as { AndroidAds?: { showRewardedAd: (t: string) => void } }).AndroidAds;

    if (androidAds && typeof androidAds.showRewardedAd === 'function') {
      const win = window as unknown as {
        onAdRewarded?: (rewardType: string) => void;
        onAdFailed?: (reason: string) => void;
      };

      win.onAdRewarded = (rewardType: string) => {
        if (rewardType === type) {
          onSuccess();
        }
      };

      win.onAdFailed = (reason: string) => {
        if (onFailure) {
          onFailure(reason || 'AD_FAILED');
        }
      };

      try {
        androidAds.showRewardedAd(type);
      } catch {
        // Fallback if call fails
        onSuccess();
      }
    } else {
      // In web browser / emulator preview: provide seamless reward after brief delay
      window.setTimeout(() => {
        onSuccess();
      }, 400);
    }
  }
}
