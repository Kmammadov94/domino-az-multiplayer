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
  errorDetail?: string;
}

let initPromise: Promise<boolean> | null = null;
let rewardedPrepared = false;
let rewardedPreparePromise: Promise<boolean> | null = null;
let interstitialPrepared = false;
let interstitialLoading = false;
let isShowingAd = false;

const extractAdError = (err: unknown): string => {
  if (!err) return '';
  if (typeof err === 'string') return err;
  if (typeof err === 'object') {
    const anyErr = err as { code?: string | number; message?: string };
    const code = anyErr.code !== undefined ? `kod ${anyErr.code}` : '';
    const msg = anyErr.message || '';
    return [code, msg].filter(Boolean).join(': ').slice(0, 120);
  }
  return '';
};

export function getRewardedAdErrorNotice(
  result: RewardedAdResult,
  lang: 'az' | 'ru' | 'en'
): string | null {
  if (result.rewarded) return null;
  if (result.reason === 'dismissed') {
    return lang === 'az'
      ? 'Mükafat üçün reklamı sona qədər izləyin.'
      : lang === 'ru'
      ? 'Досмотрите рекламу до конца для награды.'
      : 'Watch the ad until the end to earn the reward.';
  }
  if (result.reason === 'busy') {
    return lang === 'az'
      ? 'Reklam artıq açılır, bir az gözləyin.'
      : lang === 'ru'
      ? 'Реклама уже загружается, подождите.'
      : 'Ad is already loading, please wait.';
  }
  if (result.reason === 'unavailable') {
    const detail = result.errorDetail ? ` (${result.errorDetail})` : '';
    return lang === 'az'
      ? `Reklam hazırda əlçatan deyil. Bir az sonra cəhd edin${detail}.`
      : lang === 'ru'
      ? `Реклама сейчас недоступна. Попробуйте позже${detail}.`
      : `Ad is currently unavailable. Please try again later${detail}.`;
  }
  return null;
}

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
      });
      await AdMob.addListener(RewardAdPluginEvents.FailedToLoad, () => {
        rewardedPrepared = false;
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
  if (rewardedPreparePromise) return rewardedPreparePromise;

  rewardedPreparePromise = (async () => {
    const ready = await initializeAdMob();
    if (!ready) return false;
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
      rewardedPreparePromise = null;
    }
  })();

  return rewardedPreparePromise;
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
 * Displays a rewarded video ad and resolves cleanly whether the user completes
 * the video, closes early, or the ad fails to load/show.
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
    return { rewarded: false, reason: 'unavailable', errorDetail: 'SDK init failed' };
  }

  isShowingAd = true;
  let earnedReward = false;
  const handles: Array<{ remove: () => Promise<void> }> = [];

  try {
    if (!rewardedPrepared) {
      if (rewardedPreparePromise) {
        await rewardedPreparePromise;
      }
      if (!rewardedPrepared) {
        await AdMob.prepareRewardVideoAd({
          adId: ADMOB_REWARDED_COINS_ID,
          isTesting: IS_DEV_TESTING,
        });
        rewardedPrepared = true;
      }
    }

    // Native @capacitor-community/admob only resolves showRewardVideoAd() when
    // reward is earned, and leaves the call pending if dismissed early or failed to show.
    // Racing against Dismissed / FailedToShow ensures the UI never locks up.
    const result = await new Promise<RewardedAdResult>(async (resolve) => {
      let settled = false;
      const finish = (res: RewardedAdResult) => {
        if (settled) return;
        settled = true;
        clearTimeout(safetyTimer);
        resolve(res);
      };

      const safetyTimer = setTimeout(() => {
        finish({
          rewarded: earnedReward,
          reason: earnedReward ? 'earned' : 'unavailable',
          errorDetail: earnedReward ? undefined : 'timeout',
        });
      }, 90_000);

      try {
        handles.push(
          await AdMob.addListener(RewardAdPluginEvents.Rewarded, (reward: AdMobRewardItem) => {
            if (reward && typeof reward.amount === 'number' && reward.amount > 0) {
              earnedReward = true;
            }
          })
        );

        handles.push(
          await AdMob.addListener(RewardAdPluginEvents.Dismissed, () => {
            finish({
              rewarded: earnedReward,
              reason: earnedReward ? 'earned' : 'dismissed',
            });
          })
        );

        handles.push(
          await AdMob.addListener(RewardAdPluginEvents.FailedToShow, (err) => {
            finish({
              rewarded: false,
              reason: 'unavailable',
              errorDetail: extractAdError(err),
            });
          })
        );

        const item = await AdMob.showRewardVideoAd();
        rewardedPrepared = false;
        if (item && typeof item.amount === 'number' && item.amount > 0) {
          earnedReward = true;
        }
        // Wait briefly for Dismissed if user hasn't tapped X yet, otherwise settle if reward earned
        if (earnedReward) {
          setTimeout(() => {
            finish({ rewarded: true, reason: 'earned' });
          }, 300);
        }
      } catch (showErr) {
        rewardedPrepared = false;
        finish({
          rewarded: false,
          reason: 'unavailable',
          errorDetail: extractAdError(showErr),
        });
      }
    });

    rewardedPrepared = false;
    return result;
  } catch (err) {
    console.warn('[AdMob] Rewarded show failed:', err);
    rewardedPrepared = false;
    return {
      rewarded: false,
      reason: 'unavailable',
      errorDetail: extractAdError(err),
    };
  } finally {
    isShowingAd = false;
    for (const h of handles) {
      await h.remove().catch(() => {});
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
