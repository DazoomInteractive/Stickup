/**
 * AdsService - Handles Rewarded Ad integration for PWA Builder / Android APK
 * Strictly disabled - fake ads and overlays removed.
 */

export type AdRewardType = 'recover_diamonds' | 'revive';

declare global {
  interface Window {
    __ITCH_BUILD__?: boolean;
    AndroidAdsBridge?: {
      showRewardedAd: (rewardType: string) => void;
      isAdReady?: (rewardType?: string) => boolean;
      hasInternet?: () => boolean;
    };
    onStartIoRewardSuccess?: (rewardType: string) => void;
    onStartIoRewardFailed?: (reason: string) => void;
  }
}

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
    return false;
  }

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
