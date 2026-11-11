import {
  AdMob,
  BannerAdPluginEvents,
  BannerAdPosition,
  BannerAdSize,
  InterstitialAdPluginEvents,
  RewardAdPluginEvents,
  type AdMobBannerSize,
  type AdMobRewardItem,
} from '@capacitor-community/admob';
import { isNativeMobileApp } from '../utils/storage';

// Live Google AdMob IDs for Domino PRO (Android)
export const ADMOB_REWARDED_COINS_ID = 'ca-app-pub-7168141178694506/1731069314';
export const ADMOB_INTERSTITIAL_MATCH_END_ID = 'ca-app-pub-7168141178694506/7521792908';
export const ADMOB_BANNER_LOBBY_ID = 'ca-app-pub-7168141178694506/2468455972';

export const REWARDED_AD_COINS_AMOUNT = 20;

const INTERSTITIAL_MATCH_INTERVAL = 2;
const INTERSTITIAL_COOLDOWN_MS = 90_000;

const IS_DEV_TESTING = Boolean(
  (import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV
);

export interface RewardedAdResult {
  rewarded: boolean;
  reason: 'earned' | 'dismissed' | 'unavailable' | 'not_native' | 'busy';
}

let initPromise: Promise<boolean> | null = null;
let rewardedPrepared = false;
let rewardedLoading = false;
let interstitialPrepared = false;
let interstitialLoading = false;
let isShowingAd = false;

let finishedMatchesSinceInterstitial = 0;
let lastInterstitialShownAt = 0;

let bannerCreated = false;
let bannerVisible = false;
let lastKnownBannerHeight = 0;
let currentBannerHeight = 0;
let bannerQueue: Promise<void> = Promise.resolve();
const bannerHeightListeners = new Set<(height: number) => void>();

const setBannerHeight = (height: number) => {
  const safeHeight = Math.max(0, Math.round(height));
  if (safeHeight === currentBannerHeight) return;
  currentBannerHeight = safeHeight;
  bannerHeightListeners.forEach((cb) => cb(safeHeight));
};

/**
 * Initializes the Google Mobile Ads SDK once on native Android/iOS builds.
 * Safe no-op on web browsers.
 */
export async function initializeAdMob(): Promise<boolean> {
  if (!isNativeMobileApp()) return false;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      await AdMob.initialize({
        initializeForTesting: IS_DEV_TESTING,
      });

      // Keep preload state synced via SDK lifecycle listeners
      await AdMob.addListener(RewardAdPluginEvents.Loaded, () => {
        rewardedPrepared = true;
        rewardedLoading = false;
      });
      await AdMob.addListener(RewardAdPluginEvents.FailedToLoad, () => {
        rewardedPrepared = false;
        rewardedLoading = false;
      });
      await AdMob.addListener(RewardAdPluginEvents.Dismissed, () => {
        rewardedPrepared = false;
        void prepareRewardedCoinsAd();
      });

      await AdMob.addListener(InterstitialAdPluginEvents.Loaded, () => {
        interstitialPrepared = true;
        interstitialLoading = false;
      });
      await AdMob.addListener(InterstitialAdPluginEvents.FailedToLoad, () => {
        interstitialPrepared = false;
        interstitialLoading = false;
      });
      await AdMob.addListener(InterstitialAdPluginEvents.Dismissed, () => {
        interstitialPrepared = false;
        void prepareMatchEndInterstitial();
      });

      await AdMob.addListener(BannerAdPluginEvents.SizeChanged, (size: AdMobBannerSize) => {
        const h = size?.height ?? 0;
        if (h > 0) {
          lastKnownBannerHeight = h;
        }
        setBannerHeight(bannerVisible ? h : 0);
      });
      await AdMob.addListener(BannerAdPluginEvents.FailedToLoad, () => {
        bannerCreated = false;
        setBannerHeight(0);
      });

      void prepareRewardedCoinsAd();
      void prepareMatchEndInterstitial();
      return true;
    } catch (err) {
      console.warn('[AdMob] Initialization failed:', err);
      initPromise = null;
      return false;
    }
  })();

  return initPromise;
}

/**
 * Preloads the rewarded video ad for earning bonus gold coins.
 */
export async function prepareRewardedCoinsAd(): Promise<boolean> {
  if (!isNativeMobileApp()) return false;
  if (rewardedPrepared) return true;
  if (rewardedLoading) return false;

  const ready = await initializeAdMob();
  if (!ready) return false;

  rewardedLoading = true;
  try {
    await AdMob.prepareRewardVideoAd({
      adId: ADMOB_REWARDED_COINS_ID,
      isTesting: IS_DEV_TESTING,
    });
    rewardedPrepared = true;
    return true;
  } catch (err) {
    console.warn('[AdMob] Rewarded prepare failed:', err);
    rewardedPrepared = false;
    return false;
  } finally {
    rewardedLoading = false;
  }
}

/**
 * Preloads the end-of-match interstitial ad.
 */
export async function prepareMatchEndInterstitial(): Promise<boolean> {
  if (!isNativeMobileApp()) return false;
  if (interstitialPrepared) return true;
  if (interstitialLoading) return false;

  const ready = await initializeAdMob();
  if (!ready) return false;

  interstitialLoading = true;
  try {
    await AdMob.prepareInterstitial({
      adId: ADMOB_INTERSTITIAL_MATCH_END_ID,
      isTesting: IS_DEV_TESTING,
    });
    interstitialPrepared = true;
    return true;
  } catch (err) {
    console.warn('[AdMob] Interstitial prepare failed:', err);
    interstitialPrepared = false;
    return false;
  } finally {
    interstitialLoading = false;
  }
}

/**
 * Displays a rewarded video ad and resolves with `rewarded: true` only when the
 * user earns the reward from AdMob.
 */
export async function showRewardedCoinsAd(): Promise<RewardedAdResult> {
  if (!isNativeMobileApp()) {
    return { rewarded: false, reason: 'not_native' };
  }
  if (isShowingAd) {
    return { rewarded: false, reason: 'busy' };
  }

  const ready = await initializeAdMob();
  if (!ready) {
    return { rewarded: false, reason: 'unavailable' };
  }

  isShowingAd = true;
  let earnedReward = false;
  let rewardListener: { remove: () => Promise<void> } | null = null;

  try {
    if (!rewardedPrepared) {
      await AdMob.prepareRewardVideoAd({
        adId: ADMOB_REWARDED_COINS_ID,
        isTesting: IS_DEV_TESTING,
      });
      rewardedPrepared = true;
    }

    rewardListener = await AdMob.addListener(
      RewardAdPluginEvents.Rewarded,
      (reward: AdMobRewardItem) => {
        if (reward && typeof reward.amount === 'number' && reward.amount > 0) {
          earnedReward = true;
        }
      }
    );

    const item = await AdMob.showRewardVideoAd();
    rewardedPrepared = false;

    if (item && typeof item.amount === 'number' && item.amount > 0) {
      earnedReward = true;
    }

    return {
      rewarded: earnedReward,
      reason: earnedReward ? 'earned' : 'dismissed',
    };
  } catch (err) {
    console.warn('[AdMob] Rewarded show failed:', err);
    rewardedPrepared = false;
    return { rewarded: false, reason: 'unavailable' };
  } finally {
    isShowingAd = false;
    if (rewardListener) {
      await rewardListener.remove().catch(() => {});
    }
    void prepareRewardedCoinsAd();
  }
}

/**
 * Frequency-capped end-of-match interstitial helper.
 * Call when leaving or restarting a finished match (`isMatchOver === true`).
 * Never delays gameplay if an ad is not already cached.
 */
export async function maybeShowMatchEndInterstitial(): Promise<boolean> {
  if (!isNativeMobileApp() || isShowingAd) return false;

  finishedMatchesSinceInterstitial += 1;

  const now = Date.now();
  const intervalReached = finishedMatchesSinceInterstitial >= INTERSTITIAL_MATCH_INTERVAL;
  const cooldownElapsed =
    lastInterstitialShownAt === 0 || now - lastInterstitialShownAt >= INTERSTITIAL_COOLDOWN_MS;

  if (!intervalReached || !cooldownElapsed) {
    if (!interstitialPrepared) {
      void prepareMatchEndInterstitial();
    }
    return false;
  }

  if (!interstitialPrepared) {
    void prepareMatchEndInterstitial();
    return false;
  }

  isShowingAd = true;
  try {
    await AdMob.showInterstitial();
    interstitialPrepared = false;
    finishedMatchesSinceInterstitial = 0;
    lastInterstitialShownAt = Date.now();
    return true;
  } catch (err) {
    console.warn('[AdMob] Interstitial show failed:', err);
    interstitialPrepared = false;
    return false;
  } finally {
    isShowingAd = false;
    void prepareMatchEndInterstitial();
  }
}

/**
 * Subscribes to visible adaptive banner height changes (in CSS px/dp)
 * so the lobby layout can reserve clean bottom spacing.
 */
export function subscribeBannerHeight(listener: (height: number) => void): () => void {
  bannerHeightListeners.add(listener);
  listener(currentBannerHeight);
  return () => {
    bannerHeightListeners.delete(listener);
  };
}

/**
 * Shows the bottom adaptive banner on the Lobby screen and hides it during
 * active matches or open modals so gameplay and buttons stay unobstructed.
 */
export function setLobbyBannerVisible(visible: boolean): Promise<void> {
  if (!isNativeMobileApp()) return Promise.resolve();

  bannerQueue = bannerQueue.then(async () => {
    if (visible) {
      const ready = await initializeAdMob();
      if (!ready) return;
      bannerVisible = true;
      try {
        if (!bannerCreated) {
          await AdMob.showBanner({
            adId: ADMOB_BANNER_LOBBY_ID,
            adSize: BannerAdSize.ADAPTIVE_BANNER,
            position: BannerAdPosition.BOTTOM_CENTER,
            isTesting: IS_DEV_TESTING,
          });
          bannerCreated = true;
        } else {
          await AdMob.resumeBanner();
          if (lastKnownBannerHeight > 0) {
            setBannerHeight(lastKnownBannerHeight);
          }
        }
      } catch (err) {
        console.warn('[AdMob] Banner show failed:', err);
        bannerVisible = false;
        bannerCreated = false;
        setBannerHeight(0);
      }
    } else {
      bannerVisible = false;
      setBannerHeight(0);
      if (bannerCreated) {
        await AdMob.hideBanner().catch(() => {});
      }
    }
  });

  return bannerQueue;
}
