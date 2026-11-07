/**
 * AdsService - Handles Rewarded Ad status.
 * StickUp 2D v3.0.0 is completely AD-FREE.
 * All advertising bridges and fake simulation timers are disabled.
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

  /**
   * Ad-Free release: Advertisements are disabled.
   */
  isAdsEnabled(): boolean {
    return false;
  }

  /**
   * Safe handler: In this ad-free release, advertisements are unavailable.
   * Never grants fake rewards without real completed ads, never simulates timers,
   * never integrates third-party ad SDKs, and safely notifies failure handlers.
   */
  showRewardedAd(
    _type: AdRewardType,
    _onSuccess: () => void,
    onFailure?: (error: string) => void,
  ): void {
    if (onFailure) {
      onFailure('ADS_DISABLED');
    }
  }
}
