let banner
let interstitial
let rewarded
let inrewarded
let ad
interstitialDisplay = true;
console.log('loaded app.js new');
document.addEventListener('deviceready', () => {
  // admob.start()

 var ua = window.navigator.userAgent.toLowerCase();

//  if (/(android)/i.test(navigator.userAgent)) {  // Android
//   banner = new admob.BannerAd({
//     adUnitId: 'ca-app-pub-4198426445709899/6568798309',
//   })
//   } else if (navigator.userAgent.indexOf('iPhone') > 0 || ua.indexOf('iPod') > 0 || ua.indexOf('ipad') > -1 || ua.indexOf('macintosh') > -1 && 'ontouchend' in document) {  // ios
//   banner = new admob.BannerAd({
//     adUnitId: 'ca-app-pub-4198426445709899/4517350031',
//   })
//   }

  // banner.show()

//  if (/(android)/i.test(navigator.userAgent)) {  // Android
//   interstitial = new admob.InterstitialAd({
//     adUnitId: 'ca-app-pub-4198426445709899/6377226614',
//   })
//   } else if (navigator.userAgent.indexOf('iPhone') > 0 || ua.indexOf('iPod') > 0 || ua.indexOf('ipad') > -1 || ua.indexOf('macintosh') > -1 && 'ontouchend' in document) {  // ios
//   interstitial = new admob.InterstitialAd({
//     adUnitId: 'ca-app-pub-4198426445709899/9578105023',
//   })
//   }

//  if (/(android)/i.test(navigator.userAgent)) {  // Android
//   rewarded = new admob.RewardedAd({
//     adUnitId: 'ca-app-pub-4198426445709899/3256239258',
//   })
//   } else if (navigator.userAgent.indexOf('iPhone') > 0 || ua.indexOf('iPod') > 0 || ua.indexOf('ipad') > -1 || ua.indexOf('macintosh') > -1 && 'ontouchend' in document) {  // ios
//   rewarded = new admob.RewardedAd({
//     adUnitId: 'ca-app-pub-4198426445709899/9386533331',
//   })
//   }

//  if (/(android)/i.test(navigator.userAgent)) {  // Android
//   inrewarded = new admob.RewardedInterstitialAd({
//     adUnitId: 'ca-app-pub-4198426445709899/4121246287',
//   })
//   } else if (navigator.userAgent.indexOf('iPhone') > 0 || ua.indexOf('iPod') > 0 || ua.indexOf('ipad') > -1 || ua.indexOf('macintosh') > -1 && 'ontouchend' in document) {  // ios
//   inrewarded = new admob.RewardedInterstitialAd({
//     adUnitId: 'ca-app-pub-4198426445709899/5989943293',
//   })
//   }


//  if (/(android)/i.test(navigator.userAgent)) {  // Android
//    ad = new admob.AppOpenAd({
//     adUnitId: 'ca-app-pub-4198426445709899/1438051971',
//   })
//   } else if (navigator.userAgent.indexOf('iPhone') > 0 || ua.indexOf('iPod') > 0 || ua.indexOf('ipad') > -1 || ua.indexOf('macintosh') > -1 && 'ontouchend' in document) {  // ios
//    ad = new admob.AppOpenAd({
//     adUnitId: 'ca-app-pub-4198426445709899/1721973060',
//   })
//   }


   if (interstitialDisplay) {
      ad.on('load', (evt) => {
      // evt.ad
      })
   }

    document.addEventListener(
    'resume',
    async () => {
      // NOTE `resume` event is triggered when dismissing interstitial ads or by other reasons,
      // make sure to add logic to control when to display the ad.
      if (interstitialDisplay) {
      // if (!await ad.show()) {
      //   await ad.load()
      // }
      }
    },
    false,
  )

}, false)
