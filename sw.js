/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-c5f6b949'], (function (workbox) { 'use strict';

  self.skipWaiting();
  workbox.clientsClaim();

  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "assets/Auth-DzDFn8mY.js",
    "revision": null
  }, {
    "url": "assets/Dashboard-CvQjZp2T.js",
    "revision": null
  }, {
    "url": "assets/ForgotPassword-CXHkypEp.js",
    "revision": null
  }, {
    "url": "assets/Help-DJea_o2y.js",
    "revision": null
  }, {
    "url": "assets/index-CZCse1Q0.css",
    "revision": null
  }, {
    "url": "assets/index-DZp60Vkn.js",
    "revision": null
  }, {
    "url": "assets/Login-DWhv7QwR.js",
    "revision": null
  }, {
    "url": "assets/Messages-CxWmo1ZW.js",
    "revision": null
  }, {
    "url": "assets/mui-vendor-DOedHO9w.js",
    "revision": null
  }, {
    "url": "assets/NotFound-BF-2T1wZ.js",
    "revision": null
  }, {
    "url": "assets/pdf-vendor--DKs459r.js",
    "revision": null
  }, {
    "url": "assets/ProjectView-CdmghoDd.js",
    "revision": null
  }, {
    "url": "assets/react-vendor-B4YHSBsh.js",
    "revision": null
  }, {
    "url": "assets/Register-BGRQ9AXB.js",
    "revision": null
  }, {
    "url": "assets/ResetPassword-Bag2-aD2.js",
    "revision": null
  }, {
    "url": "assets/Settings-CLG7HV_e.js",
    "revision": null
  }, {
    "url": "comprehensive-file-test.html",
    "revision": "83de323aa2b15ed5593fbd2d5eb59bb6"
  }, {
    "url": "favicon.ico",
    "revision": "d41d8cd98f00b204e9800998ecf8427e"
  }, {
    "url": "immediate-fix.css",
    "revision": "11580466475d6926e5ebb1a7b6d44fe2"
  }, {
    "url": "index.html",
    "revision": "5692fe1dbc0127cd8cd3bef58d64f4ae"
  }, {
    "url": "pdf/pdf.worker.min.js",
    "revision": "f7ae3fe3cc9c326175ba6815547a71fa"
  }, {
    "url": "registerSW.js",
    "revision": "1872c500de691dce40960bb85481de07"
  }, {
    "url": "reset-app.js",
    "revision": "c361a344caaba06445d9a65cc96eece5"
  }, {
    "url": "service-worker.js",
    "revision": "08a47519f3a16a7020ba135398c31364"
  }, {
    "url": "static-verify.html",
    "revision": "41011a9dfb8153f265bc45e16ceb8403"
  }, {
    "url": "style-fixes.css",
    "revision": "127fe28fd3da0e1484cf2544bcd06dd9"
  }, {
    "url": "test-files/test-document.html",
    "revision": "cd8e1d1dda0d872504c8d834e1b066d1"
  }, {
    "url": "test-files/test-image.svg",
    "revision": "5088299af5eea741f11c9c0d37cb796b"
  }, {
    "url": "tinymce/icons/default/icons.js",
    "revision": "9c9c08d098e965088e89ed6c250956d7"
  }, {
    "url": "tinymce/icons/default/icons.min.js",
    "revision": "d67b5ccf431f8b049a8bb6c1d29e52a5"
  }, {
    "url": "tinymce/icons/default/index.js",
    "revision": "9c5b7a740ca30e13e64b6a4de5b17c77"
  }, {
    "url": "tinymce/models/dom/index.js",
    "revision": "0400e22acd7d9117cc36b06d26eacbe6"
  }, {
    "url": "tinymce/models/dom/model.js",
    "revision": "97eef68c5949d37d03fb810977cc6f0f"
  }, {
    "url": "tinymce/models/dom/model.min.js",
    "revision": "41f73dee742ee41d751d43d0f196dc56"
  }, {
    "url": "tinymce/plugins/accordion/index.js",
    "revision": "3987030cfebaf6bf4f1864005d1ed61a"
  }, {
    "url": "tinymce/plugins/accordion/plugin.js",
    "revision": "097f9e60c5a2b657c2776c30a3916e90"
  }, {
    "url": "tinymce/plugins/accordion/plugin.min.js",
    "revision": "546015f063ad65a01f14abb683eb7adb"
  }, {
    "url": "tinymce/plugins/advlist/index.js",
    "revision": "344ca56d8dedfae33380a44b89dfdd1d"
  }, {
    "url": "tinymce/plugins/advlist/plugin.js",
    "revision": "2f1fde9d367253d50dd7fb4ff378dda6"
  }, {
    "url": "tinymce/plugins/advlist/plugin.min.js",
    "revision": "69cf7bf8c2e8803f11d7408e01dd1bfb"
  }, {
    "url": "tinymce/plugins/anchor/index.js",
    "revision": "dd697e3891ed83de226860a7aa436b10"
  }, {
    "url": "tinymce/plugins/anchor/plugin.js",
    "revision": "e5826f834771ba19ef4900b6db823042"
  }, {
    "url": "tinymce/plugins/anchor/plugin.min.js",
    "revision": "b6246749687fa866a2538c17642e8f37"
  }, {
    "url": "tinymce/plugins/autolink/index.js",
    "revision": "fa84bd3bd42aeb01da94b784344d4d84"
  }, {
    "url": "tinymce/plugins/autolink/plugin.js",
    "revision": "4ef835fb961e7bc77b30398f24232f23"
  }, {
    "url": "tinymce/plugins/autolink/plugin.min.js",
    "revision": "ed167aa9d05dc0043416f2dbf95648d9"
  }, {
    "url": "tinymce/plugins/autoresize/index.js",
    "revision": "00116480a9865b9b84937b8c6ec471ed"
  }, {
    "url": "tinymce/plugins/autoresize/plugin.js",
    "revision": "faa5c1c7aa313439e03d0846698c223e"
  }, {
    "url": "tinymce/plugins/autoresize/plugin.min.js",
    "revision": "12f2bab0f4e10f1cd2e82ae29bf1f809"
  }, {
    "url": "tinymce/plugins/autosave/index.js",
    "revision": "8d9bb78be9ddbce43bfd7964b71678ae"
  }, {
    "url": "tinymce/plugins/autosave/plugin.js",
    "revision": "a9848dd874a4f32e41da1ad69734a218"
  }, {
    "url": "tinymce/plugins/autosave/plugin.min.js",
    "revision": "1eadff728b45a6146c59f24872592036"
  }, {
    "url": "tinymce/plugins/charmap/index.js",
    "revision": "18775f459a8bd073ba47b3ad3e2f6bdf"
  }, {
    "url": "tinymce/plugins/charmap/plugin.js",
    "revision": "6628d840b79fd5f24e63bddbb5cf9ced"
  }, {
    "url": "tinymce/plugins/charmap/plugin.min.js",
    "revision": "e8d9ebbca961ff9508ff0e0176343a79"
  }, {
    "url": "tinymce/plugins/code/index.js",
    "revision": "d2db687200588ab654afd39728df329f"
  }, {
    "url": "tinymce/plugins/code/plugin.js",
    "revision": "15e6373618667d11dd5062fca6fda420"
  }, {
    "url": "tinymce/plugins/code/plugin.min.js",
    "revision": "49ce90c847c474fdf334fa3697340f2a"
  }, {
    "url": "tinymce/plugins/codesample/index.js",
    "revision": "23fdb57b1d401abe9ff929ab26ec394e"
  }, {
    "url": "tinymce/plugins/codesample/plugin.js",
    "revision": "c0cd9de318d1aad8b14aead9b62076e1"
  }, {
    "url": "tinymce/plugins/codesample/plugin.min.js",
    "revision": "39aa0e6e1dc2f8c980112b403b418d1b"
  }, {
    "url": "tinymce/plugins/directionality/index.js",
    "revision": "cd2c90f18e8c7d1215bc4ede4a2ed3ff"
  }, {
    "url": "tinymce/plugins/directionality/plugin.js",
    "revision": "7f2f1e7cd0b82ef2c8ffd01597ee89fa"
  }, {
    "url": "tinymce/plugins/directionality/plugin.min.js",
    "revision": "95b791551ff395803fd712a68c20109e"
  }, {
    "url": "tinymce/plugins/emoticons/index.js",
    "revision": "57e489f4ab69ca17dc7c95aef7052d88"
  }, {
    "url": "tinymce/plugins/emoticons/js/emojiimages.js",
    "revision": "1ab2fd097df3919a141b411bb0b053b8"
  }, {
    "url": "tinymce/plugins/emoticons/js/emojiimages.min.js",
    "revision": "d3b2eef2f78cde4a29db5afc18223611"
  }, {
    "url": "tinymce/plugins/emoticons/js/emojis.js",
    "revision": "7fa1cc8fdcb750daad96da33821c5263"
  }, {
    "url": "tinymce/plugins/emoticons/js/emojis.min.js",
    "revision": "74f5f8072608c3281eede313c2234f6a"
  }, {
    "url": "tinymce/plugins/emoticons/plugin.js",
    "revision": "686f486cb33e1c44e16f66ed0e4ea539"
  }, {
    "url": "tinymce/plugins/emoticons/plugin.min.js",
    "revision": "767c49a003f4158f6d9a94940b8e2fe5"
  }, {
    "url": "tinymce/plugins/fullscreen/index.js",
    "revision": "2a071ce05b6865fc1a874f298b920e9e"
  }, {
    "url": "tinymce/plugins/fullscreen/plugin.js",
    "revision": "27e7699f592531656c5678a9fa835e8d"
  }, {
    "url": "tinymce/plugins/fullscreen/plugin.min.js",
    "revision": "f4ace39bc221a0cd8c4fd443e943802e"
  }, {
    "url": "tinymce/plugins/help/index.js",
    "revision": "b7c64e9d5f9003aacb929b6944987c2e"
  }, {
    "url": "tinymce/plugins/help/js/i18n/keynav/ar.js",
    "revision": "f7e29866b870be64454712a0bfdceaef"
  }, {
    "url": "tinymce/plugins/help/js/i18n/keynav/bg_BG.js",
    "revision": "d5a41cf5453dbd6cc1ea8fbaf268f91b"
  }, {
    "url": "tinymce/plugins/help/js/i18n/keynav/ca.js",
    "revision": "33ae0c3e4ea58f276290c071547ef7cd"
  }, {
    "url": "tinymce/plugins/help/js/i18n/keynav/cs.js",
    "revision": "e678796969274cafe7fa1877fcea40b5"
  }, {
    "url": "tinymce/plugins/help/js/i18n/keynav/da.js",
    "revision": "4d15a37a4ad69c26e17d5147f3e04aea"
  }, {
    "url": "tinymce/plugins/help/js/i18n/keynav/de.js",
    "revision": "83b3fee2666dc3b2caadcd8df5a117b1"
  }, {
    "url": "tinymce/plugins/help/js/i18n/keynav/el.js",
    "revision": "55845312d98877a651d9193538d5122b"
  }, {
    "url": "tinymce/plugins/help/js/i18n/keynav/en.js",
    "revision": "25ec53a8e7728a382679b18920afe7c4"
  }, {
    "url": "tinymce/plugins/help/js/i18n/keynav/es.js",
    "revision": "1e02d4c563993bc0dd2837c0adbf038c"
  }, {
    "url": "tinymce/plugins/help/js/i18n/keynav/eu.js",
    "revision": "bdad367473f9afeb4601b3754fc163dc"
  }, {
    "url": "tinymce/plugins/help/js/i18n/keynav/fa.js",
    "revision": "b18b4db563fe6a3e36c7944ca6b93044"
  }, {
    "url": "tinymce/plugins/help/js/i18n/keynav/fi.js",
    "revision": "53db866385b0b6779fe2ff0a0482070d"
  }, {
    "url": "tinymce/plugins/help/js/i18n/keynav/fr_FR.js",
    "revision": "6d03416c1d7f9f953f9d4629144ed77c"
  }, {
    "url": "tinymce/plugins/help/js/i18n/keynav/he_IL.js",
    "revision": "e5a85e20c1d6af2008e99144c3a5be28"
  }, {
    "url": "tinymce/plugins/help/js/i18n/keynav/hi.js",
    "revision": "cfc6b2b198475abbcd91545d624bb103"
  }, {
    "url": "tinymce/plugins/help/js/i18n/keynav/hr.js",
    "revision": "892358646252137ff5796b0840dff871"
  }, {
    "url": "tinymce/plugins/help/js/i18n/keynav/hu_HU.js",
    "revision": "f24ff1424a16811d035f32c668e05f4f"
  }, {
    "url": "tinymce/plugins/help/js/i18n/keynav/id.js",
    "revision": "4ef64cb3b406da4ab33571a184f6a8e8"
  }, {
    "url": "tinymce/plugins/help/js/i18n/keynav/it.js",
    "revision": "debbcf6b6f80ff78043ea4f762a1d86e"
  }, {
    "url": "tinymce/plugins/help/js/i18n/keynav/ja.js",
    "revision": "c0ad4baefb952fe4c637db8264ef6f7e"
  }, {
    "url": "tinymce/plugins/help/js/i18n/keynav/kk.js",
    "revision": "8fc30ca83443a6fba267915108110f5c"
  }, {
    "url": "tinymce/plugins/help/js/i18n/keynav/ko_KR.js",
    "revision": "25a16f0f57a9c3943e2d0640e893b4ea"
  }, {
    "url": "tinymce/plugins/help/js/i18n/keynav/ms.js",
    "revision": "16da45ae14907721c36718fb3b30c451"
  }, {
    "url": "tinymce/plugins/help/js/i18n/keynav/nb_NO.js",
    "revision": "7e1e997155632ce31c76b2576d2672f9"
  }, {
    "url": "tinymce/plugins/help/js/i18n/keynav/nl.js",
    "revision": "20f677beac1ff5a29932ed7f265b3dee"
  }, {
    "url": "tinymce/plugins/help/js/i18n/keynav/pl.js",
    "revision": "b0e51d9a267abb8d57ab112811f8cad2"
  }, {
    "url": "tinymce/plugins/help/js/i18n/keynav/pt_BR.js",
    "revision": "d31074c9a256a9cbc2a1160e14545d53"
  }, {
    "url": "tinymce/plugins/help/js/i18n/keynav/pt_PT.js",
    "revision": "213bd09ce1ddce6aa2c1eab391020393"
  }, {
    "url": "tinymce/plugins/help/js/i18n/keynav/ro.js",
    "revision": "59e9b92c87368b48cd2023d530672c28"
  }, {
    "url": "tinymce/plugins/help/js/i18n/keynav/ru.js",
    "revision": "56bd96bcd4b31e5d8d16ed1c948827c5"
  }, {
    "url": "tinymce/plugins/help/js/i18n/keynav/sk.js",
    "revision": "08eff7d8782df5326227924b9f582d1c"
  }, {
    "url": "tinymce/plugins/help/js/i18n/keynav/sl_SI.js",
    "revision": "0d62175a1ba88969b6dfb1b94cda85c0"
  }, {
    "url": "tinymce/plugins/help/js/i18n/keynav/sv_SE.js",
    "revision": "8021b2bf6035872c5140248689ce3e99"
  }, {
    "url": "tinymce/plugins/help/js/i18n/keynav/th_TH.js",
    "revision": "04413f1796c6b47d2ed732fe9bc81fb1"
  }, {
    "url": "tinymce/plugins/help/js/i18n/keynav/tr.js",
    "revision": "c555f22b01767c44883cc00dbaeec7ff"
  }, {
    "url": "tinymce/plugins/help/js/i18n/keynav/uk.js",
    "revision": "849237baf50625f4b8c17039bec688e5"
  }, {
    "url": "tinymce/plugins/help/js/i18n/keynav/vi.js",
    "revision": "354387db83ea8af6ee7bad101cf77dab"
  }, {
    "url": "tinymce/plugins/help/js/i18n/keynav/zh_CN.js",
    "revision": "778615758c4af74bfe1624fdbc8093f1"
  }, {
    "url": "tinymce/plugins/help/js/i18n/keynav/zh_TW.js",
    "revision": "1ce4b68afa621fcf36eec23254afebc9"
  }, {
    "url": "tinymce/plugins/help/plugin.js",
    "revision": "715f662c3260d5aee5f06fc29d20ea00"
  }, {
    "url": "tinymce/plugins/help/plugin.min.js",
    "revision": "24b41f602caf6001276b9d112d396db8"
  }, {
    "url": "tinymce/plugins/image/index.js",
    "revision": "27415d3d43098d4bdb48c6c45c15e08c"
  }, {
    "url": "tinymce/plugins/image/plugin.js",
    "revision": "47b991ce581f3960a0f0f5fa8bced224"
  }, {
    "url": "tinymce/plugins/image/plugin.min.js",
    "revision": "f86621dc02b1a7b41db106bd4c2f843e"
  }, {
    "url": "tinymce/plugins/importcss/index.js",
    "revision": "2409fda93c2625fad2c9dfffe31b1473"
  }, {
    "url": "tinymce/plugins/importcss/plugin.js",
    "revision": "9357bf5faa9c64e19ad1f8b74e82bdec"
  }, {
    "url": "tinymce/plugins/importcss/plugin.min.js",
    "revision": "6ec7fda88ac6209c48f3e0b8462c8749"
  }, {
    "url": "tinymce/plugins/insertdatetime/index.js",
    "revision": "4ece334f6233df3aa3e5becbfe1f9a8e"
  }, {
    "url": "tinymce/plugins/insertdatetime/plugin.js",
    "revision": "f90eb3dc7f555481306781d86449b41b"
  }, {
    "url": "tinymce/plugins/insertdatetime/plugin.min.js",
    "revision": "fb7778107c7bbc9841d4e660fdad663b"
  }, {
    "url": "tinymce/plugins/link/index.js",
    "revision": "5837f9d0ed7b2cc610dbffa6a7d7dafe"
  }, {
    "url": "tinymce/plugins/link/plugin.js",
    "revision": "c8113a5f8f8f56b943059cbea6722878"
  }, {
    "url": "tinymce/plugins/link/plugin.min.js",
    "revision": "5c561ab15cf5ccb6a317c7ac1c6d6cfa"
  }, {
    "url": "tinymce/plugins/lists/index.js",
    "revision": "959bf9c345e983ce032814178b94cb09"
  }, {
    "url": "tinymce/plugins/lists/plugin.js",
    "revision": "6ad834638656f8adc7e69707cac10694"
  }, {
    "url": "tinymce/plugins/lists/plugin.min.js",
    "revision": "bedbab28a4e12372ec2110167add0f44"
  }, {
    "url": "tinymce/plugins/media/index.js",
    "revision": "22710d182e71e1bef50ee3838ac15b07"
  }, {
    "url": "tinymce/plugins/media/plugin.js",
    "revision": "6bfef804954d01a507d325e58d989ad6"
  }, {
    "url": "tinymce/plugins/media/plugin.min.js",
    "revision": "6743323daebe30e860bc6cfc68ed3239"
  }, {
    "url": "tinymce/plugins/nonbreaking/index.js",
    "revision": "851e4039437062e49d5729f1fe30cb40"
  }, {
    "url": "tinymce/plugins/nonbreaking/plugin.js",
    "revision": "52c59ab1a3e15a60e1933a0ed8aa03f2"
  }, {
    "url": "tinymce/plugins/nonbreaking/plugin.min.js",
    "revision": "2f25b3170e8b8783714b7ab491f3c190"
  }, {
    "url": "tinymce/plugins/pagebreak/index.js",
    "revision": "b2ec3630c22897879bc089749ca3466e"
  }, {
    "url": "tinymce/plugins/pagebreak/plugin.js",
    "revision": "5b67146ba23b7896ebcd1074a6020216"
  }, {
    "url": "tinymce/plugins/pagebreak/plugin.min.js",
    "revision": "7e0ba5b67ef007bb9cadd6f399ac703b"
  }, {
    "url": "tinymce/plugins/preview/index.js",
    "revision": "ac924715206330e49ae83f0ce0a41a7c"
  }, {
    "url": "tinymce/plugins/preview/plugin.js",
    "revision": "d0830518ef7738bdd2fb09e631f14201"
  }, {
    "url": "tinymce/plugins/preview/plugin.min.js",
    "revision": "9843d73f5b28f4c78591cbdcdf463154"
  }, {
    "url": "tinymce/plugins/quickbars/index.js",
    "revision": "24942b053967586fefe96a215c44ae07"
  }, {
    "url": "tinymce/plugins/quickbars/plugin.js",
    "revision": "e49eb8a5ae7d9cfa0bd2503a5f6660e4"
  }, {
    "url": "tinymce/plugins/quickbars/plugin.min.js",
    "revision": "345ca22381f31013eb29ab112bdfbe32"
  }, {
    "url": "tinymce/plugins/save/index.js",
    "revision": "d2a87bcc64b326fc6dfa962fcbc662e8"
  }, {
    "url": "tinymce/plugins/save/plugin.js",
    "revision": "1ac37292be82058084b559216ff81d6c"
  }, {
    "url": "tinymce/plugins/save/plugin.min.js",
    "revision": "f7028557bb064d8cf067fe124b712890"
  }, {
    "url": "tinymce/plugins/searchreplace/index.js",
    "revision": "027916795b63233ba94d3938bc15cc28"
  }, {
    "url": "tinymce/plugins/searchreplace/plugin.js",
    "revision": "8ee118bd292b8cab751b09f01a357e18"
  }, {
    "url": "tinymce/plugins/searchreplace/plugin.min.js",
    "revision": "6bd9410253997648b1b5c4163b382ca5"
  }, {
    "url": "tinymce/plugins/table/index.js",
    "revision": "dc0a57cf52e5c96e8886974820620f30"
  }, {
    "url": "tinymce/plugins/table/plugin.js",
    "revision": "24a61b87b9caa2894d6e575affabec82"
  }, {
    "url": "tinymce/plugins/table/plugin.min.js",
    "revision": "616b09c359bf9836fe98abbac1594fe4"
  }, {
    "url": "tinymce/plugins/visualblocks/index.js",
    "revision": "1f348278fc3fa3ae9d560a2c6074537d"
  }, {
    "url": "tinymce/plugins/visualblocks/plugin.js",
    "revision": "eba577e43b6b1a7163c1ec2cf93710f9"
  }, {
    "url": "tinymce/plugins/visualblocks/plugin.min.js",
    "revision": "4d7bbcf7979d7adc946e89856a1f2cb1"
  }, {
    "url": "tinymce/plugins/visualchars/index.js",
    "revision": "01e4394764848c643482a4e060c3c16c"
  }, {
    "url": "tinymce/plugins/visualchars/plugin.js",
    "revision": "3c42abb5339f31523b00c8e22966b870"
  }, {
    "url": "tinymce/plugins/visualchars/plugin.min.js",
    "revision": "f31875c4bdf4f5634b9129ebd18159d5"
  }, {
    "url": "tinymce/plugins/wordcount/index.js",
    "revision": "8702637f4301b2c60b0d036a74a57952"
  }, {
    "url": "tinymce/plugins/wordcount/plugin.js",
    "revision": "db6514c99e9b8956eadfc76eb8b83985"
  }, {
    "url": "tinymce/plugins/wordcount/plugin.min.js",
    "revision": "18af9e499fae79de7ef9cf47d669fa9b"
  }, {
    "url": "tinymce/skins/content/dark/content.css",
    "revision": "c18a991f9ef0b423adb8b1b132afea6c"
  }, {
    "url": "tinymce/skins/content/dark/content.js",
    "revision": "38b9cd18bbec1e79964f94f79df8d322"
  }, {
    "url": "tinymce/skins/content/dark/content.min.css",
    "revision": "8be098c8a09616b6f37f8ed7c963ebca"
  }, {
    "url": "tinymce/skins/content/default/content.css",
    "revision": "fdd392b36001c3e0f925e00869fab674"
  }, {
    "url": "tinymce/skins/content/default/content.js",
    "revision": "f014cdd3dc76c820424ea0c13706b527"
  }, {
    "url": "tinymce/skins/content/default/content.min.css",
    "revision": "e7448307845064b6e567dabdf0edd81a"
  }, {
    "url": "tinymce/skins/content/document/content.css",
    "revision": "d6e36fda2726c056c0782b7f0e0d3a33"
  }, {
    "url": "tinymce/skins/content/document/content.js",
    "revision": "e133bc2114fa6bd3fb9e6404d5858e40"
  }, {
    "url": "tinymce/skins/content/document/content.min.css",
    "revision": "6cb27dc9ba941235eb2b074c9cbf7126"
  }, {
    "url": "tinymce/skins/content/tinymce-5-dark/content.css",
    "revision": "4d9f0e703d7e35ede12e5cc6916ff75b"
  }, {
    "url": "tinymce/skins/content/tinymce-5-dark/content.js",
    "revision": "445fd0a046091300c16b598738f48267"
  }, {
    "url": "tinymce/skins/content/tinymce-5-dark/content.min.css",
    "revision": "4e7d595a3352a317ac5457e1544dd018"
  }, {
    "url": "tinymce/skins/content/tinymce-5/content.css",
    "revision": "fdd392b36001c3e0f925e00869fab674"
  }, {
    "url": "tinymce/skins/content/tinymce-5/content.js",
    "revision": "97d1c5e4a709a49fd6f89552fc2e5f87"
  }, {
    "url": "tinymce/skins/content/tinymce-5/content.min.css",
    "revision": "e7448307845064b6e567dabdf0edd81a"
  }, {
    "url": "tinymce/skins/content/writer/content.css",
    "revision": "54891f08e9425ba6cfc8285c320f4394"
  }, {
    "url": "tinymce/skins/content/writer/content.js",
    "revision": "f11cb3b267cb6d8ede6190a1b736e02a"
  }, {
    "url": "tinymce/skins/content/writer/content.min.css",
    "revision": "5647767d1db4e7cbfe47ab7510c8aeea"
  }, {
    "url": "tinymce/skins/ui/oxide-dark/content.css",
    "revision": "89e955439d816abf01d5be4f5c2306b6"
  }, {
    "url": "tinymce/skins/ui/oxide-dark/content.inline.css",
    "revision": "df1379ec74243abc6dc857b66a2693ea"
  }, {
    "url": "tinymce/skins/ui/oxide-dark/content.inline.js",
    "revision": "e13510efae0904ac38e3c4cb297c7184"
  }, {
    "url": "tinymce/skins/ui/oxide-dark/content.inline.min.css",
    "revision": "94540af7ebbeae43ea448fc88916ebfd"
  }, {
    "url": "tinymce/skins/ui/oxide-dark/content.js",
    "revision": "58c96fb3225b9070a98695af123bf967"
  }, {
    "url": "tinymce/skins/ui/oxide-dark/content.min.css",
    "revision": "36cb4fc9ff5b2928afeefed50ea0bdc3"
  }, {
    "url": "tinymce/skins/ui/oxide-dark/skin.css",
    "revision": "d11422d307d901cd2a7b1883f9eb5dde"
  }, {
    "url": "tinymce/skins/ui/oxide-dark/skin.js",
    "revision": "db175e0e30c7d0a83a9da2d90d70b970"
  }, {
    "url": "tinymce/skins/ui/oxide-dark/skin.min.css",
    "revision": "4eea65c2930d8cea6f47f17e49a66663"
  }, {
    "url": "tinymce/skins/ui/oxide-dark/skin.shadowdom.css",
    "revision": "31792aa3530bea8433b3b50c8c38529f"
  }, {
    "url": "tinymce/skins/ui/oxide-dark/skin.shadowdom.js",
    "revision": "e96d3c218f2b79f82e2c87b6f3f818bb"
  }, {
    "url": "tinymce/skins/ui/oxide-dark/skin.shadowdom.min.css",
    "revision": "1448b0502cbc52a71d7b2a5eaa9f3847"
  }, {
    "url": "tinymce/skins/ui/oxide/content.css",
    "revision": "fba96f3698e33a459a54439e70ab7cd4"
  }, {
    "url": "tinymce/skins/ui/oxide/content.inline.css",
    "revision": "df1379ec74243abc6dc857b66a2693ea"
  }, {
    "url": "tinymce/skins/ui/oxide/content.inline.js",
    "revision": "7500db94fefd33633e81dfd228aa9d5f"
  }, {
    "url": "tinymce/skins/ui/oxide/content.inline.min.css",
    "revision": "94540af7ebbeae43ea448fc88916ebfd"
  }, {
    "url": "tinymce/skins/ui/oxide/content.js",
    "revision": "e6db01a152dc98207a62a9a1ad8e0ba1"
  }, {
    "url": "tinymce/skins/ui/oxide/content.min.css",
    "revision": "8938a7a1d13729b2083720b447e2bc99"
  }, {
    "url": "tinymce/skins/ui/oxide/skin.css",
    "revision": "a6cf520641a017bc218b7444231a6fec"
  }, {
    "url": "tinymce/skins/ui/oxide/skin.js",
    "revision": "730ef9234d7667d8608bc88d6dfb8fcb"
  }, {
    "url": "tinymce/skins/ui/oxide/skin.min.css",
    "revision": "ca17ba180439c4e527f554d19c20e1ca"
  }, {
    "url": "tinymce/skins/ui/oxide/skin.shadowdom.css",
    "revision": "31792aa3530bea8433b3b50c8c38529f"
  }, {
    "url": "tinymce/skins/ui/oxide/skin.shadowdom.js",
    "revision": "fb3cc71941cdc2e83de399ee39abe36d"
  }, {
    "url": "tinymce/skins/ui/oxide/skin.shadowdom.min.css",
    "revision": "1448b0502cbc52a71d7b2a5eaa9f3847"
  }, {
    "url": "tinymce/skins/ui/tinymce-5-dark/content.css",
    "revision": "3aa5b810b18528a64f7ea791b7117df8"
  }, {
    "url": "tinymce/skins/ui/tinymce-5-dark/content.inline.css",
    "revision": "df1379ec74243abc6dc857b66a2693ea"
  }, {
    "url": "tinymce/skins/ui/tinymce-5-dark/content.inline.js",
    "revision": "0c083e569943a12f6e15f97976103113"
  }, {
    "url": "tinymce/skins/ui/tinymce-5-dark/content.inline.min.css",
    "revision": "94540af7ebbeae43ea448fc88916ebfd"
  }, {
    "url": "tinymce/skins/ui/tinymce-5-dark/content.js",
    "revision": "a7ed416616fdf315b71b0dfc6ebb53f7"
  }, {
    "url": "tinymce/skins/ui/tinymce-5-dark/content.min.css",
    "revision": "e6e8625086a812fb56dff6fc24b52a1c"
  }, {
    "url": "tinymce/skins/ui/tinymce-5-dark/skin.css",
    "revision": "a6c72f18aeb12498d4b6842adf223315"
  }, {
    "url": "tinymce/skins/ui/tinymce-5-dark/skin.js",
    "revision": "8cf2f87cbdf2223caf1321a3da393a6b"
  }, {
    "url": "tinymce/skins/ui/tinymce-5-dark/skin.min.css",
    "revision": "e66b862e6e7563af2f8788588ba465bf"
  }, {
    "url": "tinymce/skins/ui/tinymce-5-dark/skin.shadowdom.css",
    "revision": "31792aa3530bea8433b3b50c8c38529f"
  }, {
    "url": "tinymce/skins/ui/tinymce-5-dark/skin.shadowdom.js",
    "revision": "eb127cec1c96aebc630b4f9f5efcbf7e"
  }, {
    "url": "tinymce/skins/ui/tinymce-5-dark/skin.shadowdom.min.css",
    "revision": "1448b0502cbc52a71d7b2a5eaa9f3847"
  }, {
    "url": "tinymce/skins/ui/tinymce-5/content.css",
    "revision": "fba96f3698e33a459a54439e70ab7cd4"
  }, {
    "url": "tinymce/skins/ui/tinymce-5/content.inline.css",
    "revision": "df1379ec74243abc6dc857b66a2693ea"
  }, {
    "url": "tinymce/skins/ui/tinymce-5/content.inline.js",
    "revision": "49c1f9db748353d539ed23fa0f5bfe27"
  }, {
    "url": "tinymce/skins/ui/tinymce-5/content.inline.min.css",
    "revision": "94540af7ebbeae43ea448fc88916ebfd"
  }, {
    "url": "tinymce/skins/ui/tinymce-5/content.js",
    "revision": "7f19a974066223c0039dff35a35d32b4"
  }, {
    "url": "tinymce/skins/ui/tinymce-5/content.min.css",
    "revision": "8938a7a1d13729b2083720b447e2bc99"
  }, {
    "url": "tinymce/skins/ui/tinymce-5/skin.css",
    "revision": "6232e54dc10aae91c439cc3efa113b5e"
  }, {
    "url": "tinymce/skins/ui/tinymce-5/skin.js",
    "revision": "a89156645ff55c24a948a0373eebda90"
  }, {
    "url": "tinymce/skins/ui/tinymce-5/skin.min.css",
    "revision": "a0bf9d641c70cb85322e1b7a4b0676ab"
  }, {
    "url": "tinymce/skins/ui/tinymce-5/skin.shadowdom.css",
    "revision": "31792aa3530bea8433b3b50c8c38529f"
  }, {
    "url": "tinymce/skins/ui/tinymce-5/skin.shadowdom.js",
    "revision": "7d0e89599f3017f7e3941b47f71afee3"
  }, {
    "url": "tinymce/skins/ui/tinymce-5/skin.shadowdom.min.css",
    "revision": "1448b0502cbc52a71d7b2a5eaa9f3847"
  }, {
    "url": "tinymce/themes/silver/index.js",
    "revision": "7281b0268319c90508a1a300a7c06d97"
  }, {
    "url": "tinymce/themes/silver/theme.js",
    "revision": "d88855e9dc74af5b27860b699e408765"
  }, {
    "url": "tinymce/themes/silver/theme.min.js",
    "revision": "115e9f96afe6f8c79c97bc00be5028a8"
  }, {
    "url": "tinymce/tinymce-custom.css",
    "revision": "834ba1a34e437db97413519fcdd77a6e"
  }, {
    "url": "tinymce/tinymce.js",
    "revision": "c6dd902952ce418c651795c5b0b6d290"
  }, {
    "url": "tinymce/tinymce.min.js",
    "revision": "a55076ec36c2328c93ff31714d0a7d15"
  }, {
    "url": "ui-fixes.js",
    "revision": "b492eafde3a5fc493ceb47c27a5bf338"
  }, {
    "url": "vite.svg",
    "revision": "8e3a10e157f75ada21ab742c022d5430"
  }, {
    "url": "favicon.ico",
    "revision": "d41d8cd98f00b204e9800998ecf8427e"
  }, {
    "url": "manifest.webmanifest",
    "revision": "271dea40033630590f1851e877eec61d"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html")));
  workbox.registerRoute(/\.(?:ico|png|svg|jpg|jpeg|gif)$/i, new workbox.CacheFirst({
    "cacheName": "images",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 50,
      maxAgeSeconds: 2592000
    })]
  }), 'GET');
  workbox.registerRoute(/^https:\/\/fonts\.googleapis\.com/, new workbox.StaleWhileRevalidate({
    "cacheName": "google-fonts-stylesheets",
    plugins: []
  }), 'GET');
  workbox.registerRoute(/^https:\/\/fonts\.gstatic\.com/, new workbox.CacheFirst({
    "cacheName": "google-fonts-webfonts",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 30,
      maxAgeSeconds: 31536000
    })]
  }), 'GET');

}));
//# sourceMappingURL=sw.js.map
