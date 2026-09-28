/**
 * AdsService - Handles game state rewards (disabled).
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
    return false;
  }

  showRewardedAd(
    _type: AdRewardType,
    _onSuccess: () => void,
    onFailure?: (error: string) => void,
  ): void {
    if (onFailure) {
      onFailure('DISABLED');
    }
  }
}
