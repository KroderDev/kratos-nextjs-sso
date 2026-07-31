# Changelog

## [0.3.0](https://github.com/KroderDev/kratos-nextjs-sso/compare/v0.2.1...v0.3.0) (2026-07-31)


### Features

* **branding:** add dark mode favicon switching and fix auth logo rendering ([c4014b0](https://github.com/KroderDev/kratos-nextjs-sso/commit/c4014b0d0a55af668be00afded08e6080f9e7f74))
* **branding:** add dark mode favicon switching with buildtime env vars ([8cba2c4](https://github.com/KroderDev/kratos-nextjs-sso/commit/8cba2c41a31f40b205b5865ea1636264a5c4ecca))


### Bug Fixes

* **auth:** render theme-responsive brand logo in auth sidebar ([3b4f30b](https://github.com/KroderDev/kratos-nextjs-sso/commit/3b4f30bcd771fbef15976dd70d9c5b3f482dc097))
* **ci:** move secret guard to step level in release-please workflow ([6f28c44](https://github.com/KroderDev/kratos-nextjs-sso/commit/6f28c44b6a94b40fc2c61f8f4c106de77ca65e9b))
* **ci:** move secret guard to step level in release-please workflow ([61d1b7a](https://github.com/KroderDev/kratos-nextjs-sso/commit/61d1b7ad7972e2d32b162c70f346152e883f977c))
* **ci:** skip release-please job when secret is unset ([7e9bdf8](https://github.com/KroderDev/kratos-nextjs-sso/commit/7e9bdf816ae6f0354aa308c4b1d0735d7205039c))
* **ci:** skip release-please job when secret is unset ([6922e48](https://github.com/KroderDev/kratos-nextjs-sso/commit/6922e48853f4535ef76bd678fc79eb074bd12e1e))
* **ci:** use dynamic repository owner in release workflow image name ([1a08c23](https://github.com/KroderDev/kratos-nextjs-sso/commit/1a08c235bf3b1e86300e53901be8a9c2d8e4f9df))
* **ci:** use dynamic repository owner in release workflow image name ([e513785](https://github.com/KroderDev/kratos-nextjs-sso/commit/e5137855a901dd05537241841218d7738331138d))
* **ci:** use env context for step if condition in release-please workflow ([df9efb1](https://github.com/KroderDev/kratos-nextjs-sso/commit/df9efb1fa509dee024d854842e5b1a31c6285720))

## [0.2.1](https://github.com/KroderDev/kratos-nextjs-sso/compare/v0.2.0...v0.2.1) (2026-07-30)


### Bug Fixes

* **branding:** preserve logo images when brand mark is configured ([1c9294e](https://github.com/KroderDev/kratos-nextjs-sso/commit/1c9294e5a3118d709b5653af71010b1cb5456d39))
* **branding:** preserve logo images when brand mark is configured ([07f0a55](https://github.com/KroderDev/kratos-nextjs-sso/commit/07f0a55241c42325e5552720bb75a5241285a842))
* **ory:** add resilient logout flow with fallback handling ([fc04d85](https://github.com/KroderDev/kratos-nextjs-sso/commit/fc04d85ec093f9455a2a91c6a268e2ceb527e8f2))


### Documentation

* add live demo, badges, and demo section ([bb4385f](https://github.com/KroderDev/kratos-nextjs-sso/commit/bb4385fc9404cfd8deb75a2231b63ea949fe5bfc))

## [0.2.0](https://github.com/KroderDev/kratos-nextjs-sso/compare/v0.1.0...v0.2.0) (2026-07-30)


### Features

* add Ory Kratos SSO frontend with auth flows and dashboard ([fd77271](https://github.com/KroderDev/kratos-nextjs-sso/commit/fd7727140bed21a82fe68a22752b73036e33755e))
* **assets:** replace favicon with generic SVG icon and remove Next.js starter assets ([a83c852](https://github.com/KroderDev/kratos-nextjs-sso/commit/a83c8525dad9222c66cd7841fa6c0e4e613a0892))
* **auth:** filter avatar_url from registration form ([797b1f4](https://github.com/KroderDev/kratos-nextjs-sso/commit/797b1f4e630a6f8fb8bec053f0daa5b66f497e1f))
* **branding:** add centralized configurable branding with NEXT_PUBLIC_BRAND_NAME ([39b487c](https://github.com/KroderDev/kratos-nextjs-sso/commit/39b487cd8f69c18bf5824958f0ce44bf59ca52f9))
* **branding:** add theme-aware logos ([a3b53fb](https://github.com/KroderDev/kratos-nextjs-sso/commit/a3b53fb064ca3bf6aa39ee4e5c28f83fd5d50234))
* **branding:** add theme-aware logos with Next.js official brand assets ([e6d348d](https://github.com/KroderDev/kratos-nextjs-sso/commit/e6d348d7b34dd7d1c96e88c50d61ac1a56f39ddb))
* **branding:** use Next.js logo and favicon ([3f904c8](https://github.com/KroderDev/kratos-nextjs-sso/commit/3f904c89cb73e4c4b97ce45b488ddca709ea0131))
* **branding:** use Next.js logo and favicon ([76e8256](https://github.com/KroderDev/kratos-nextjs-sso/commit/76e82561bc292f7cd9df27acf393fd1181a71216))
* **config:** add canonical Ory URL and branding environment variables ([5128e62](https://github.com/KroderDev/kratos-nextjs-sso/commit/5128e629b9755e7f989496ede606556c78287b1a))
* **dashboard:** align account settings with workspace ([5eeccfd](https://github.com/KroderDev/kratos-nextjs-sso/commit/5eeccfda9741f82cebf4bbe2b67d2efee2f098ce))
* **dashboard:** align settings with overview ([a586951](https://github.com/KroderDev/kratos-nextjs-sso/commit/a5869512561936a22d88416ce02eb9240177b2a8))
* **i18n:** implement automated Spanish support ([49ba074](https://github.com/KroderDev/kratos-nextjs-sso/commit/49ba07498ed88b3cc0b9cb1e1d2336326ed54b1b))
* **i18n:** implement automated Spanish support and locale registry ([9557ef1](https://github.com/KroderDev/kratos-nextjs-sso/commit/9557ef1463bbe0afc1a8f096a7fcf2b14c463592))
* **i18n:** map Ory Kratos form node labels and messages to Spanish ([38305b3](https://github.com/KroderDev/kratos-nextjs-sso/commit/38305b33e7fd253a7849abf9ffb14c1712d660a5))
* improve auth navigation loading ([d37cdb2](https://github.com/KroderDev/kratos-nextjs-sso/commit/d37cdb2ce03faff2b468e97983f3c0dcf70ceab5))
* **navigation:** add route loading feedback ([b260aa8](https://github.com/KroderDev/kratos-nextjs-sso/commit/b260aa8466ab04243dcae3304d17a7891b8279a6))
* **proxy:** add Ory canonical URL rewriting for local SDK port-forward ([2b4d9ac](https://github.com/KroderDev/kratos-nextjs-sso/commit/2b4d9acc1c69a692cebc1b304197bb0d223bea5a))
* **sanitize:** filter Ory and Kratos provider references from flow messages ([74d8aa8](https://github.com/KroderDev/kratos-nextjs-sso/commit/74d8aa8491c49913114baccdeae452f9244fbe04))
* **ui:** add dark mode with next-themes and theme toggle ([66594ec](https://github.com/KroderDev/kratos-nextjs-sso/commit/66594eca6ae949ddda487b63d6f10bb87d2a5db4))
* **ui:** add navigation loading feedback ([8ce6997](https://github.com/KroderDev/kratos-nextjs-sso/commit/8ce6997e2f7e2ab313c416b308b0cbd958e129cd))
* **ui:** make shadcn theme and controls resilient ([d4d5a05](https://github.com/KroderDev/kratos-nextjs-sso/commit/d4d5a05bf22361edde8204e14457d1e37f26a8ea))
* **ui:** remove Ory and Kroder references from user-facing pages ([1324be9](https://github.com/KroderDev/kratos-nextjs-sso/commit/1324be90be6d226b9681739f242ecdf34579d783))
* **ui:** simplify identity access surfaces ([397b3de](https://github.com/KroderDev/kratos-nextjs-sso/commit/397b3de5e2793bb0f3f5c8a38aeecd4d9220f0a8))
* **ui:** support shadcn theme fonts ([62ebbf8](https://github.com/KroderDev/kratos-nextjs-sso/commit/62ebbf8b121dcc9fc20e2b03646c8c565b0a8869))


### Bug Fixes

* add .gitkeep to public dir so Docker COPY includes it ([d465cb5](https://github.com/KroderDev/kratos-nextjs-sso/commit/d465cb5e75136c9c2affe4212a1ce366cacd071f))
* **audit:** set pnpm audit threshold to critical-only ([8bce3d1](https://github.com/KroderDev/kratos-nextjs-sso/commit/8bce3d1227a3ea3b29fe54cac87066d754b1c24d))
* **auth:** re-throw redirect errors from Ory flow fetch ([b5cd515](https://github.com/KroderDev/kratos-nextjs-sso/commit/b5cd515ded44fed4a0c52e8b12633c5daa029e1d))
* **auth:** wrap Ory flow fetch in try/catch to prevent page crashes ([fe7194e](https://github.com/KroderDev/kratos-nextjs-sso/commit/fe7194e0363675818f0d0b07d0762eab2ba519f5))
* **codeql:** add actions: read permission for SARIF upload workflow-run lookup ([30625c8](https://github.com/KroderDev/kratos-nextjs-sso/commit/30625c8bf43334a03182b28c29f7d9236da5fe51))
* **dashboard:** match account trigger height ([fe24121](https://github.com/KroderDev/kratos-nextjs-sso/commit/fe24121f9e6b969ea346319dd65550f1c18b21d8))
* **dependabot:** correct commit prefix to deps type ([f417d04](https://github.com/KroderDev/kratos-nextjs-sso/commit/f417d04b6194c992b0b51f26b5c7005b52b977e7))
* **deps:** align react-dom 19.2.8 with react 19.2.8 ([5b9ef43](https://github.com/KroderDev/kratos-nextjs-sso/commit/5b9ef43478fa7bf015087bf86b5b04ee2a6b835e))
* **deps:** patch brace-expansion DoS vulnerability ([44538f6](https://github.com/KroderDev/kratos-nextjs-sso/commit/44538f60b0891d7c24e5c06ec222169f128ebfd8))
* **deps:** patch brace-expansion DoS vulnerability ([def62cd](https://github.com/KroderDev/kratos-nextjs-sso/commit/def62cda2a1b4161d2079de1bf1566707c518f6f))
* **i18n:** replace hardcoded loading aria-labels ([bf10aec](https://github.com/KroderDev/kratos-nextjs-sso/commit/bf10aec626211d254e38ae0c75ce1596ecf0a0ac))
* **ory:** keep authenticator QR codes square ([077f01d](https://github.com/KroderDev/kratos-nextjs-sso/commit/077f01d70544bec69c955a8836277d11ac5acd40))
* **security:** add contents: read permission to CodeQL and container-scan jobs ([4bf2d0e](https://github.com/KroderDev/kratos-nextjs-sso/commit/4bf2d0e4e299e7f4dd93a4d32731ee4c4809e011))
* **security:** harden SSO trust boundaries ([5bf6981](https://github.com/KroderDev/kratos-nextjs-sso/commit/5bf6981aabfac372ef6ca431c586797e5e084220))
* **security:** harden SSO trust boundaries ([9372468](https://github.com/KroderDev/kratos-nextjs-sso/commit/937246850e5eb93134fcdc1d8800c04b149c2740))
* **trivy:** drop dead SARIF upload and security-events permission from container-scan ([5dee23b](https://github.com/KroderDev/kratos-nextjs-sso/commit/5dee23bd3718ba9d4da0de3a42335cad9cf46173))
* **trivy:** upgrade trivy-action to v0.36.0 to resolve missing setup-trivy@v0.2.2 dependency ([2f5d6a4](https://github.com/KroderDev/kratos-nextjs-sso/commit/2f5d6a408aa3a1c376007feb4e78cc4551e6f460))
* **trivy:** use correct v0.30.0 commit SHA for aquasecurity/trivy-action ([81387e6](https://github.com/KroderDev/kratos-nextjs-sso/commit/81387e65e197d1fc0cbc85345409d5c137e16b99))
* **ui:** remove redundant card header, badge, and duplicate text from FlowForm ([02fd39c](https://github.com/KroderDev/kratos-nextjs-sso/commit/02fd39c9d56802717e5f4b15f10343f179ff5127))
* **ui:** standardize header action heights ([7c73862](https://github.com/KroderDev/kratos-nextjs-sso/commit/7c73862f1c94a105a38926b3b6baaa76861dd1df))


### Refactoring

* **auth:** persist authentication frame ([f17daa1](https://github.com/KroderDev/kratos-nextjs-sso/commit/f17daa1ab3868022891d5132e2accf81417225ea))
* **homepage:** use shadcn card conventions and matching loading skeleton ([b27eb87](https://github.com/KroderDev/kratos-nextjs-sso/commit/b27eb8726969a5fece2b0a4e5ef3947061e21569))
* **i18n:** centralize locale registry for easy language addition ([d3bfac9](https://github.com/KroderDev/kratos-nextjs-sso/commit/d3bfac9657120089db3afd25127f0c7848f8754d))
* **theme:** use standard shadcn tokens ([fed9e70](https://github.com/KroderDev/kratos-nextjs-sso/commit/fed9e706f3c59d9f3e04624fe170b8cdf3db0b73))


### Dependencies

* **deps-dev:** bump @types/node ([20e5a45](https://github.com/KroderDev/kratos-nextjs-sso/commit/20e5a458202a659318536b4faa2c46f5a4f51fdd))
* **deps-dev:** bump typescript from 5.9.3 to 6.0.3 ([2cfb4c9](https://github.com/KroderDev/kratos-nextjs-sso/commit/2cfb4c90632abc2c74430e4d79c8c9a54c980c63))
* **deps-dev:** bump typescript from 5.9.3 to 7.0.2 ([b5b27c7](https://github.com/KroderDev/kratos-nextjs-sso/commit/b5b27c7c1db7b918fcea6ba25f68617e4bee379b))
* **deps:** bump @ory/client-fetch from 1.22.22 to 1.22.65 ([5bfb8eb](https://github.com/KroderDev/kratos-nextjs-sso/commit/5bfb8eb6d4901162478682d250845d14c57140c5))
* **deps:** bump actions/cache from 4 to 6 ([13f07e7](https://github.com/KroderDev/kratos-nextjs-sso/commit/13f07e77e8f1fa8274b7456f53114b8df65b537d))
* **deps:** bump actions/checkout from 4.2.2 to 7.0.1 ([d81e0cc](https://github.com/KroderDev/kratos-nextjs-sso/commit/d81e0ccb8d55c41577555cbe5c55e092c5c3b0de))
* **deps:** bump pnpm/action-setup from 4.1.0 to 6.0.9 ([069e8f1](https://github.com/KroderDev/kratos-nextjs-sso/commit/069e8f14a3fbc7d0e17c015b852fc42e5a6baf80))
* **deps:** bump react from 19.2.4 to 19.2.8 ([6e5b2b6](https://github.com/KroderDev/kratos-nextjs-sso/commit/6e5b2b68b382fa22a8f5c8db3b80e5f9e9bed007))
* **deps:** bump the production-dependencies group across 1 directory with 2 updates ([878dc3c](https://github.com/KroderDev/kratos-nextjs-sso/commit/878dc3cbb36f020c712d35af9467d84ae22fc50b))


### Documentation

* add branding customization section and remove Mida development instructions ([744c232](https://github.com/KroderDev/kratos-nextjs-sso/commit/744c23292504306794a1c95539ca6bf7c7fc605f))
* add i18n guide in docs/i18n.md ([f5d7e80](https://github.com/KroderDev/kratos-nextjs-sso/commit/f5d7e8026787dd6d82e42df8425cc69be5fb77ed))
* replace generic Next.js warning with repo-specific guidance ([395e6b5](https://github.com/KroderDev/kratos-nextjs-sso/commit/395e6b56f3ab604fd030c1ebc782fda022f7d0e2))
* **security:** extract and expand security documentation ([f349747](https://github.com/KroderDev/kratos-nextjs-sso/commit/f349747b8732e46964a0de128e8513a25ecc1d3a))
* **security:** extract and expand security documentation ([706996a](https://github.com/KroderDev/kratos-nextjs-sso/commit/706996a09f7beabaf110be0fc9956d1637cd7685))
* **shadcn:** document preset workflow ([ef2f3db](https://github.com/KroderDev/kratos-nextjs-sso/commit/ef2f3db39b852f3ca53b2d869d348cabffd93fb1))
* update repository title and description in README ([bd2064f](https://github.com/KroderDev/kratos-nextjs-sso/commit/bd2064f866e87d91e6cbd956182c8058ce4d0da1))


### Tests

* add neutral UI assertions and provider reference sanitization test ([df499b2](https://github.com/KroderDev/kratos-nextjs-sso/commit/df499b225508604ebe579a63c3df76a9ff6ac17e))
* **auth:** cover navigation loading states ([acbbef8](https://github.com/KroderDev/kratos-nextjs-sso/commit/acbbef861b9eaf88690be9b710c46fbfcdc782af))


### Continuous Integration

* add branding build arguments to Dockerfile and Playwright config ([25b8782](https://github.com/KroderDev/kratos-nextjs-sso/commit/25b8782216cfa867cdf9759eff13cf30f6bdd710))
* add CI, security scanning, Playwright smoke tests, and release hardening ([3ca58e1](https://github.com/KroderDev/kratos-nextjs-sso/commit/3ca58e13013410bb16405e1f943b4cac10a65615))
* add Docker multi-stage image with health check and container scanning ([2049320](https://github.com/KroderDev/kratos-nextjs-sso/commit/2049320323c784e939672daa52a8dc17686c4890))
* **codeql:** remove CodeQL job since code scanning is not enabled on this repository ([913049d](https://github.com/KroderDev/kratos-nextjs-sso/commit/913049d1630f7d3e20c4caaaf1576512c1be1720))
* **dependabot:** add Docker ecosystem, labels, and commit scope formatting ([83a8544](https://github.com/KroderDev/kratos-nextjs-sso/commit/83a85443942ff220c81731b160d9f6105fb6d37f))
* **dependabot:** add weekly npm dependency update config ([aa6374d](https://github.com/KroderDev/kratos-nextjs-sso/commit/aa6374d3e6258af67340473f1e9421ff00a6c8f7))
* **release-please:** add automated release workflow ([8984a0f](https://github.com/KroderDev/kratos-nextjs-sso/commit/8984a0fff580b1eb6a65790ce3517c038b3dbbb7))
* **release:** add ghcr publishing workflow ([7b95d69](https://github.com/KroderDev/kratos-nextjs-sso/commit/7b95d694569da2db197689f4b1c5d25f2e36ffb1))
* **security:** set TZ environment to America/Santiago ([3ccbac4](https://github.com/KroderDev/kratos-nextjs-sso/commit/3ccbac4ee1a352295976ab76e9a1ad262d50afca))
* simplify action version pins and enhance dependabot config ([d964304](https://github.com/KroderDev/kratos-nextjs-sso/commit/d964304b2be39e85c3ebeb48eeb91f8c6107e2cf))
