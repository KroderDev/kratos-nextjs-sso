# Changelog

## [0.6.1](https://github.com/KroderDev/kratos-nextjs-sso/compare/v0.6.0...v0.6.1) (2026-08-30)


### Dependencies

* **deps-dev:** bump the dev-dependencies group with 3 updates ([2697cc2](https://github.com/KroderDev/kratos-nextjs-sso/commit/2697cc20950c472934a8e2c99412685f7956ebdb))
* **deps:** bump @iconify-icons/logos from 1.2.36 to 2.0.0 ([b062408](https://github.com/KroderDev/kratos-nextjs-sso/commit/b062408d622c7ab506190d0439da67cc899c1314))
* **deps:** bump @iconify-icons/simple-icons from 1.2.74 to 2.0.0 ([130b69a](https://github.com/KroderDev/kratos-nextjs-sso/commit/130b69ae4f547f2284bf2e2db10dd989b40cd604))
* **deps:** bump the production-dependencies group with 5 updates ([a55a47d](https://github.com/KroderDev/kratos-nextjs-sso/commit/a55a47d8a9615d1f869e3deff0b6f47f0dcbd78f))

## [0.6.0](https://github.com/KroderDev/kratos-nextjs-sso/compare/v0.5.0...v0.6.0) (2026-08-21)


### Features

* **auth:** use canonical browser flow routes ([3dffef8](https://github.com/KroderDev/kratos-nextjs-sso/commit/3dffef895eadee16762bd6d6ec22a2f0994a5794))
* **auth:** use canonical browser flow routes ([594cebc](https://github.com/KroderDev/kratos-nextjs-sso/commit/594cebc25c6181bd97547be5e76fcf8def62aae0))
* **ory:** harden browser flows and settings UI ([0938392](https://github.com/KroderDev/kratos-nextjs-sso/commit/093839211fe88d3d70073b6279d2c5878bc09f7d))
* **ory:** harden browser flows and settings UI ([fcd1672](https://github.com/KroderDev/kratos-nextjs-sso/commit/fcd16726c663956e8a1a5ecac60fc3b1ca116b5d))


### Bug Fixes

* **auth:** preserve internal handoff origins ([84cdd0a](https://github.com/KroderDev/kratos-nextjs-sso/commit/84cdd0a6f77c1a0f7c49613787b660d6cbdf9378))
* **auth:** preserve internal handoff origins ([a40cea0](https://github.com/KroderDev/kratos-nextjs-sso/commit/a40cea08f8023b68eedccc394a4cc23a692d471d))
* **auth:** preserve SSO origin for flow retries ([80b45ee](https://github.com/KroderDev/kratos-nextjs-sso/commit/80b45eeb3d6eb23ae8897e56ca092698f5e959aa))
* **auth:** preserve SSO origin for flow retries ([5b839df](https://github.com/KroderDev/kratos-nextjs-sso/commit/5b839dfdab8b544b421f4dc56beb53f2bef556f3))
* **auth:** remember consent and honor skip flag ([e2ac2f3](https://github.com/KroderDev/kratos-nextjs-sso/commit/e2ac2f32ead44e3b5cb3a9b7491fd553930c767b))
* **auth:** remember consent and honor skip flag ([0b603fb](https://github.com/KroderDev/kratos-nextjs-sso/commit/0b603fbded3412dcb12f8d5ea867029981aceb0a))
* **build:** conditionally disable standalone output on Vercel deployments ([cba8f14](https://github.com/KroderDev/kratos-nextjs-sso/commit/cba8f147eec76d878bd93baa8312380734b70c07))
* **build:** conditionally disable standalone output on Vercel deployments ([7c9a308](https://github.com/KroderDev/kratos-nextjs-sso/commit/7c9a308b24989da7ce8901cd2c40002e0e6ad94b))
* **deps:** patch vulnerable nanoid release ([54061da](https://github.com/KroderDev/kratos-nextjs-sso/commit/54061dad404fbce0d6d6ab68b3832ee459aba890))
* **ory:** address CodeRabbit review findings ([eb49bf8](https://github.com/KroderDev/kratos-nextjs-sso/commit/eb49bf852fcc6a213eee7d20609fa493b4c497d4))
* **security:** allow configured form redirect origins ([131bb38](https://github.com/KroderDev/kratos-nextjs-sso/commit/131bb38836e7e89352bcd1758930393fe33eea5d))
* **security:** allow configured form redirect origins ([7477d28](https://github.com/KroderDev/kratos-nextjs-sso/commit/7477d2837d94049176092d3adebd83551b870d82))
* **security:** validate provider callback handoffs ([4cfea19](https://github.com/KroderDev/kratos-nextjs-sso/commit/4cfea198c31089b41a455d6714d65d24ae42fb58))
* **security:** validate provider callback handoffs ([0ac6468](https://github.com/KroderDev/kratos-nextjs-sso/commit/0ac64684e3acb10037d59b1be6fa5124ea6a613d))
* **ui:** honor registration setting and restore link padding ([c5d67ba](https://github.com/KroderDev/kratos-nextjs-sso/commit/c5d67ba6486163081675b8fdf865f5f4617bcbec))
* **ui:** honor registration setting and restore link padding ([3ff88e0](https://github.com/KroderDev/kratos-nextjs-sso/commit/3ff88e017cdb3c1d5ced2d5e68385b33a73f7f65))


### Refactoring

* **auth:** use shared consent checkbox ([514c33f](https://github.com/KroderDev/kratos-nextjs-sso/commit/514c33f0f7cdedc6f04833fc7e607e4cae333964))


### Dependencies

* **deps-dev:** bump the dev-dependencies group with 2 updates ([023c5e1](https://github.com/KroderDev/kratos-nextjs-sso/commit/023c5e11bad8ad0cf8eb109b1891f3d52ea240a1))


### Tests

* **auth:** align end-to-end routes ([06d1ec0](https://github.com/KroderDev/kratos-nextjs-sso/commit/06d1ec0d17fca18a4ca6ca0ce452a56a2db4172e))
* **auth:** cover application origin fallbacks ([0428c3c](https://github.com/KroderDev/kratos-nextjs-sso/commit/0428c3c20a423965dd35570b977a1b7c504de212))
* **auth:** cover consent form fallback ([a18cbfa](https://github.com/KroderDev/kratos-nextjs-sso/commit/a18cbfaa917bc2a8fb91357d395eb9117e5d28eb))
* **auth:** cover logout handoff rejection ([bdf517b](https://github.com/KroderDev/kratos-nextjs-sso/commit/bdf517b06df02c3c68f0a27e128fe8f7eb396926))
* **auth:** update Kratos fixture routes ([be1682b](https://github.com/KroderDev/kratos-nextjs-sso/commit/be1682b8ded7d56246f7b3e32dd95e13a6b7b352))
* **auth:** use generic consent fixture data ([a5d2a6a](https://github.com/KroderDev/kratos-nextjs-sso/commit/a5d2a6a5e5e6869a237add30c8528af491dfc679))
* **coverage:** cover remaining application branches ([759f18e](https://github.com/KroderDev/kratos-nextjs-sso/commit/759f18ef17c9f775f2461ddb84957b61738e5d50))
* **coverage:** exercise destructive confirm and browser-locale branches ([c103408](https://github.com/KroderDev/kratos-nextjs-sso/commit/c103408cc43547c0cc6a239b2e90d1d462a457b6))
* **security:** cover AAL1 step-up continue path ([14fe339](https://github.com/KroderDev/kratos-nextjs-sso/commit/14fe339fc32e709f266b28f033013a31f8910903))

## [0.5.0](https://github.com/KroderDev/kratos-nextjs-sso/compare/v0.4.0...v0.5.0) (2026-08-13)


### Features

* **ory:** add TOTP MFA support ([1f2d96a](https://github.com/KroderDev/kratos-nextjs-sso/commit/1f2d96a585939e9e775728a146487d0dae7a8d5c))
* **settings:** add account security workspace ([1f3518d](https://github.com/KroderDev/kratos-nextjs-sso/commit/1f3518d25021eb5ef5e270f22153d06876bff901))
* **settings:** add recovery code management ([6a085e9](https://github.com/KroderDev/kratos-nextjs-sso/commit/6a085e9c6170e63caac29ddac595074d2e65c4cf))
* **settings:** complete dashboard identity settings ([52c9563](https://github.com/KroderDev/kratos-nextjs-sso/commit/52c95636b8080dab383bf951fc78e08c79e17a02))
* **settings:** show flow messages as toasts ([43649b8](https://github.com/KroderDev/kratos-nextjs-sso/commit/43649b8a1b67006a49112acca61f9df18c5e6fe7))
* **ui:** add base toast notifications ([a2c590b](https://github.com/KroderDev/kratos-nextjs-sso/commit/a2c590bdd88994334e4c81f957041c81e3919c70))


### Bug Fixes

* **auth:** accept nested provider callbacks ([6d7ec79](https://github.com/KroderDev/kratos-nextjs-sso/commit/6d7ec79d3f0e5934c150d4f7a00e3a8472b3c2b6))
* **auth:** accept nested provider callbacks ([25ab9fa](https://github.com/KroderDev/kratos-nextjs-sso/commit/25ab9fa905c2859c78cefd7e5a8aa186e796c996))
* **auth:** address PR feedback — session check, deny form, docs, coverage ([3e9b821](https://github.com/KroderDev/kratos-nextjs-sso/commit/3e9b8216c4b27ad08f65d87dbba2ca047e43bce3))
* **auth:** handle Hydra provider handoffs ([82d79c0](https://github.com/KroderDev/kratos-nextjs-sso/commit/82d79c05102c0944348b4915b050f8a3500ed281))
* **auth:** handle Hydra provider handoffs ([893d8ae](https://github.com/KroderDev/kratos-nextjs-sso/commit/893d8ae7e21a4ce9a02ce9ec6e72b5907b5449dd))
* **auth:** preserve nested return_to query parameters ([7c9ad00](https://github.com/KroderDev/kratos-nextjs-sso/commit/7c9ad0062a33385f07fd0f2ccc65b7fdb5db93a2))
* **auth:** preserve nested return_to query parameters ([f61ce71](https://github.com/KroderDev/kratos-nextjs-sso/commit/f61ce71a932314541200be6bbc6b98ae8d839272)), closes [#53](https://github.com/KroderDev/kratos-nextjs-sso/issues/53)
* **auth:** preserve provider callback redirects ([6fd1527](https://github.com/KroderDev/kratos-nextjs-sso/commit/6fd1527bf42b9f4e3f6e49cf95076f70f92a1568))
* **auth:** preserve provider callback redirects ([31c727b](https://github.com/KroderDev/kratos-nextjs-sso/commit/31c727b4e2cf9a016248fab39c80d7dddc87bf11))
* **auth:** request AAL2 for provider login flows ([ee5e857](https://github.com/KroderDev/kratos-nextjs-sso/commit/ee5e857f5535c4febdc4f33a11453dc7fdef3f58))
* **auth:** request AAL2 for provider login flows ([4e8d1a9](https://github.com/KroderDev/kratos-nextjs-sso/commit/4e8d1a9e415d9048a3cc6cbc0b456fe70da3254a))
* **auth:** route provider login through SSO AAL continue page ([4a3786b](https://github.com/KroderDev/kratos-nextjs-sso/commit/4a3786bc0e86d2da1159995e7729c397d5485032))
* **auth:** route provider login through SSO AAL continue page ([7c63315](https://github.com/KroderDev/kratos-nextjs-sso/commit/7c633159744d033811b4c74f7ea7fc869f6b5df3))
* **auth:** use public metadata for avatars ([e76ce17](https://github.com/KroderDev/kratos-nextjs-sso/commit/e76ce1717c2130ae34c3c360db8f51121695023e))
* **auth:** use public metadata for avatars ([6c11569](https://github.com/KroderDev/kratos-nextjs-sso/commit/6c11569cb611c37752e31d18c7dbaf7cd9ba9678))
* **build:** include Playwright config in Docker context ([ecbaf25](https://github.com/KroderDev/kratos-nextjs-sso/commit/ecbaf254963345029eeac5142e608a3c894ab23a))
* **dashboard:** render Ory QR codes ([9586911](https://github.com/KroderDev/kratos-nextjs-sso/commit/9586911de9d02acace461d891d004d733704483c))
* **login:** hide divider and password recovery link when social-only providers are configured ([c312eb2](https://github.com/KroderDev/kratos-nextjs-sso/commit/c312eb23619ac0cca1fcdad5649702d6d31facd4))
* **login:** hide divider and password recovery link when social-only providers are configured ([5444dc0](https://github.com/KroderDev/kratos-nextjs-sso/commit/5444dc0fe616ade2f0758d72bc68751abfdc406f)), closes [#52](https://github.com/KroderDev/kratos-nextjs-sso/issues/52)
* **ory:** avoid uncontrolled OTP inputs ([c8cf128](https://github.com/KroderDev/kratos-nextjs-sso/commit/c8cf12861fed69cee9d77c3afc9f4d4ae9b9f6d8))
* **settings:** address review feedback ([809cbdb](https://github.com/KroderDev/kratos-nextjs-sso/commit/809cbdbdca2bd3859c31cae08d06932c39c6c324))
* **settings:** isolate section form validation ([c027371](https://github.com/KroderDev/kratos-nextjs-sso/commit/c027371b6899a3b21232445538a42b726fd90ffd))
* **settings:** keep provider actions inline ([2cb3936](https://github.com/KroderDev/kratos-nextjs-sso/commit/2cb393602f76f1f3c7acc43c6b3c757e38789687))
* **settings:** prevent loading overlay on section switches ([cf71add](https://github.com/KroderDev/kratos-nextjs-sso/commit/cf71add5f64df532c4d0840091654df2f37f2379))
* **settings:** prevent loading overlay on section switches ([392f504](https://github.com/KroderDev/kratos-nextjs-sso/commit/392f50441580f4057f00dc46f38ec5c3f3d05aac))
* **settings:** show provider link state ([e91ef84](https://github.com/KroderDev/kratos-nextjs-sso/commit/e91ef84dbff81308a31c0090cd5bcecc60445b4d))
* **ui:** align loading skeleton with settings layout ([a4727ee](https://github.com/KroderDev/kratos-nextjs-sso/commit/a4727eec3437d9aa5c5e7b06ab445c0cb6eb2f90))


### Dependencies

* **deps-dev:** bump eslint-config-next in the dev-dependencies group ([b6e2ffb](https://github.com/KroderDev/kratos-nextjs-sso/commit/b6e2ffb66a08f32225d4ae73be795d04f8d509f6))
* **deps-dev:** bump jsdom from 29.1.1 to 30.0.1 ([741b65c](https://github.com/KroderDev/kratos-nextjs-sso/commit/741b65cf9b975d7a25f527d463b0a348f3956854))
* **deps-dev:** bump the dev-dependencies group with 3 updates ([3cbdbe6](https://github.com/KroderDev/kratos-nextjs-sso/commit/3cbdbe6b35d3b699572706dd4fe4a2fca2bc9577))
* **deps:** bump codecov/codecov-action from 5 to 7 ([c4af8af](https://github.com/KroderDev/kratos-nextjs-sso/commit/c4af8af748593049e95e011102d3126422630b8f))
* **deps:** bump lucide-react in the production-dependencies group ([995c10c](https://github.com/KroderDev/kratos-nextjs-sso/commit/995c10c0bb7639cde97d2a7d30f0c0e9fa44ea6e))
* **deps:** bump pnpm/action-setup from 6 to 6.0.9 ([b8899da](https://github.com/KroderDev/kratos-nextjs-sso/commit/b8899daa0b626f8802bd9c2fa3fc632f85f0d22b))
* **deps:** bump pnpm/action-setup from 6.0.9 to 6.0.10 ([0b7910f](https://github.com/KroderDev/kratos-nextjs-sso/commit/0b7910fe851e9482564159a83404e212a673c529))
* **deps:** bump the production-dependencies group across 1 directory with 4 updates ([a4977f0](https://github.com/KroderDev/kratos-nextjs-sso/commit/a4977f03536a0a79bdbbe1e3fd5909225a8ee588))
* override fast-uri, brace-expansion, and hono to resolve audit vulnerabilities ([f1902a9](https://github.com/KroderDev/kratos-nextjs-sso/commit/f1902a93a0cb76cc1932d397f16af90952830c66))


### Documentation

* add UX heuristics skill and documentation index ([3c1c785](https://github.com/KroderDev/kratos-nextjs-sso/commit/3c1c785a6b485bc8affea6694816d71200f035d6))


### Tests

* add coverage for login continue page and provider-handoff fallback ([a5b06ef](https://github.com/KroderDev/kratos-nextjs-sso/commit/a5b06ef15ca37009ed0621d5c9b130b9be401eee))
* add mock-kratos social-only coverage for codecov patch threshold ([44ed140](https://github.com/KroderDev/kratos-nextjs-sso/commit/44ed140a58f632df67337ac55075d6ca6062a010))
* cover restoreOryProviderCallback error paths and proxy integration ([f7b10ac](https://github.com/KroderDev/kratos-nextjs-sso/commit/f7b10ac06e4b5dfc4bbf2debcecb26bc72a0cbaf))
* **coverage:** cover remaining Ory branches ([c0921a2](https://github.com/KroderDev/kratos-nextjs-sso/commit/c0921a29afff60fd9cfd20c591a083e1ac33e3db))
* **ory:** bring provider-handoff coverage to 100% ([b55d56b](https://github.com/KroderDev/kratos-nextjs-sso/commit/b55d56b2a920326b92e49aa55dada1cf9e8500fe))
* remove accidentally injected return_to test ([40a5f25](https://github.com/KroderDev/kratos-nextjs-sso/commit/40a5f25ffac960e7ac486755e1dcf95d96bf34a2))
* **ui:** cover settings loading feedback ([7633f7b](https://github.com/KroderDev/kratos-nextjs-sso/commit/7633f7b6f0899d5e654329a3c216b2cc867fd1ce))
* **ui:** cover toast notifications ([f61dacc](https://github.com/KroderDev/kratos-nextjs-sso/commit/f61daccf3afaa0959be3e883a22b61b120e8f4aa))


### Continuous Integration

* ignore pre-existing nanoid advisory ([f0f2137](https://github.com/KroderDev/kratos-nextjs-sso/commit/f0f2137e31b6afbd8d70ee44da393b9ef47a8093))

## [0.4.0](https://github.com/KroderDev/kratos-nextjs-sso/compare/v0.3.0...v0.4.0) (2026-08-02)


### Features

* **auth:** add branded identity providers ([54d8825](https://github.com/KroderDev/kratos-nextjs-sso/commit/54d8825513c35e9f04cc3d0738832122dcfa6949))
* **auth:** improve responsive social login ([1a17a41](https://github.com/KroderDev/kratos-nextjs-sso/commit/1a17a41c724ed8332f19d1d03a8cd0f1546bbc60))
* **auth:** redesign provider login layout ([fca1cd3](https://github.com/KroderDev/kratos-nextjs-sso/commit/fca1cd3ae80d928177dd82bb64cced45339fa1fe))


### Bug Fixes

* apply CodeRabbit auto-fixes ([a3a9945](https://github.com/KroderDev/kratos-nextjs-sso/commit/a3a9945cedd970499e1e982b836f738205e50d01))
* apply CodeRabbit auto-fixes ([c0901a1](https://github.com/KroderDev/kratos-nextjs-sso/commit/c0901a1e0909a5f19d5fc1d29ef17ecb7989f628))
* apply CodeRabbit auto-fixes ([0165314](https://github.com/KroderDev/kratos-nextjs-sso/commit/0165314b6f2b0e8fc58049e90192231f27443975))
* apply CodeRabbit auto-fixes ([fa785a0](https://github.com/KroderDev/kratos-nextjs-sso/commit/fa785a0c0313c73c861750fdaecd61e101035788))
* **auth:** add clean flow parameter helper ([1f6a2ae](https://github.com/KroderDev/kratos-nextjs-sso/commit/1f6a2aee7ddc577e779786babf1d1ced72785f45))
* **auth:** allow fresh flow initialization ([6f57f2d](https://github.com/KroderDev/kratos-nextjs-sso/commit/6f57f2d46328f5b816cf82209c6ef90600b6ef14))
* **auth:** allow oauth redirects and restart expired flows ([aa3edf9](https://github.com/KroderDev/kratos-nextjs-sso/commit/aa3edf96de1fc7e0628c6b3766ec6f4cf2fc9f3c))
* **auth:** allow OAuth redirects and restart expired flows ([7c1f391](https://github.com/KroderDev/kratos-nextjs-sso/commit/7c1f391cef4f64cd2f8b21994cb2d3b390fc57d9))
* **auth:** forward browser cookies in login flows ([9202d68](https://github.com/KroderDev/kratos-nextjs-sso/commit/9202d68cb9c3ae382318d2b5c0edc8c3d71a584c))
* **auth:** forward browser cookies when loading login flows ([7d236cc](https://github.com/KroderDev/kratos-nextjs-sso/commit/7d236cc776cce2df50c1a3288e43a8cabcd80662))
* **auth:** handle disabled registration errors ([1a2ef94](https://github.com/KroderDev/kratos-nextjs-sso/commit/1a2ef948c38b58a381f97978e4530ce43b49f70a))
* **auth:** stop invalid flow redirect loops ([08a9799](https://github.com/KroderDev/kratos-nextjs-sso/commit/08a979909f4a5a900ae80021fa2500dfd90052fd))
* **branding:** fall back to light logo when dark logo is explicitly empty ([f055cb0](https://github.com/KroderDev/kratos-nextjs-sso/commit/f055cb0c2a9e83d98a5ecc451a835289bd89322d))
* **branding:** switch favicon on app theme toggle instead of OS-only media query ([d028ddd](https://github.com/KroderDev/kratos-nextjs-sso/commit/d028ddd634aa65fa303d79e407720e14c3cf81c6))
* **build:** add missing branding build args to Dockerfile ([7083b56](https://github.com/KroderDev/kratos-nextjs-sso/commit/7083b5662406d3de505d06cc5307e61ca955e9c1))
* **ci:** authenticate Codecov uploads ([6df38dd](https://github.com/KroderDev/kratos-nextjs-sso/commit/6df38dd9b80783d751b2bf063e63402ced10e8e9))
* **ci:** raise security audit sensitivity and Trivy scan severity ([9373bce](https://github.com/KroderDev/kratos-nextjs-sso/commit/9373bce8c8795e2db257a717e77f1c11403dabb8))
* **ci:** scope pnpm audit to production dependencies ([0825c8a](https://github.com/KroderDev/kratos-nextjs-sso/commit/0825c8a5def4ceb085aa166e594633b574f8f56b))
* create the function with vi.hoisted before the mock factory. ([2b5115f](https://github.com/KroderDev/kratos-nextjs-sso/commit/2b5115fe39f97f9d11366bc50fbe8983c1f8a640))
* **ory:** secure URL validation in isSafeProviderUrl mock ([84742aa](https://github.com/KroderDev/kratos-nextjs-sso/commit/84742aa62990311faac539b8563b0f324322da9b))
* **proxy:** honor forwarded public origin ([2b140db](https://github.com/KroderDev/kratos-nextjs-sso/commit/2b140db680b6bf8c68f0a74bb82832aa99339bca))
* **proxy:** honor forwarded public origin ([2e84d17](https://github.com/KroderDev/kratos-nextjs-sso/commit/2e84d17476fdf54f5b279595c8f65fde8d2fcb43))
* **proxy:** honor forwarded public origin ([81f2ca5](https://github.com/KroderDev/kratos-nextjs-sso/commit/81f2ca582f206ff3cc064bb6386def02e8417226))
* **security:** add rel="noopener noreferrer" to logout anchor ([59e5b75](https://github.com/KroderDev/kratos-nextjs-sso/commit/59e5b751daeeae504aad031a1ccbd3c0713e3e88))
* **security:** allow unsafe-inline in CSP style-src for Next.js dynamic styles ([d77d846](https://github.com/KroderDev/kratos-nextjs-sso/commit/d77d8464c92ab562ac819b6b80be7abf4b7ad650))
* **security:** allow unsafe-inline in CSP style-src for Next.js dynamic styles ([b4bef14](https://github.com/KroderDev/kratos-nextjs-sso/commit/b4bef1445e01c38190496b8663945ef6b67a1520))
* **security:** extend Permissions-Policy to disable additional sensitive browser APIs ([b8dc47c](https://github.com/KroderDev/kratos-nextjs-sso/commit/b8dc47c7cc3a7c8526890493abacd265ce0127e2))
* **security:** fail release build when NEXT_PUBLIC_APP_URL is unset or malformed ([416b365](https://github.com/KroderDev/kratos-nextjs-sso/commit/416b3653b92ada00eba8219ed6b9511f8c1f80f5))
* **security:** harden proxy origin validation, outage audit gaps, and add aggressive security tests ([fc60f8b](https://github.com/KroderDev/kratos-nextjs-sso/commit/fc60f8b76a90ddcdee69a8c111707a8898ff35f5))
* **security:** pass required build args in release workflow to enable proxy origin validation ([ae04b67](https://github.com/KroderDev/kratos-nextjs-sso/commit/ae04b678302cbde32fd1e31104712d95d8026e04))
* **seo:** block all search-engine indexing via robots.ts ([55cc4b1](https://github.com/KroderDev/kratos-nextjs-sso/commit/55cc4b1dc91a7051638f1782d4ba192fb8b28801))
* **seo:** block all search-engine indexing via robots.ts ([b245d99](https://github.com/KroderDev/kratos-nextjs-sso/commit/b245d99842b901e7ab3d25515a2aa2a451fd4e48))
* **test:** correct Ory client mock specifier ([f2ce629](https://github.com/KroderDev/kratos-nextjs-sso/commit/f2ce629dd8cfca71f070759d19d36b1899da7e12))
* **tests:** require at least one CI auth web server. ([ec661ae](https://github.com/KroderDev/kratos-nextjs-sso/commit/ec661aea9dee270e30492844097436771d0e0c53))


### Performance

* align components with Vercel React Best Practices ([592e3a4](https://github.com/KroderDev/kratos-nextjs-sso/commit/592e3a4dcac46bd0b5db8cb356068e13bd85fdc3))
* **auth:** optimize provider and navigation rendering ([9a90649](https://github.com/KroderDev/kratos-nextjs-sso/commit/9a90649301292fb30628aae47c1753eec863b053))


### Refactoring

* use canonical tracking-tighter class over arbitrary value ([12bb58b](https://github.com/KroderDev/kratos-nextjs-sso/commit/12bb58b41fbaf6ee154da9346b6042742830c902))
* use Next.js unstable_rethrow in auth page catch blocks ([60f948d](https://github.com/KroderDev/kratos-nextjs-sso/commit/60f948d682ac081838a31f6ea3655af7dde290cb))


### Documentation

* add production README and coverage reporting ([b2aeb4d](https://github.com/KroderDev/kratos-nextjs-sso/commit/b2aeb4d52ac3320392984dbcac74660766bfbd5a))
* add production README and coverage reporting ([e5f9a45](https://github.com/KroderDev/kratos-nextjs-sso/commit/e5f9a45085c3d8809a3c3f05dc72615b2b6b7791))
* document search-engine indexing policy and customization ([68919a0](https://github.com/KroderDev/kratos-nextjs-sso/commit/68919a029abcb10c3894092a201fea5cdb28b10d))


### Tests

* **auth:** cover disabled registration responses ([e5b9cf8](https://github.com/KroderDev/kratos-nextjs-sso/commit/e5b9cf84328aa57dfb9049dd5a53b24725bc9962))
* **auth:** cover provider rendering and normalization ([52bc01c](https://github.com/KroderDev/kratos-nextjs-sso/commit/52bc01c75fd05730d8e67f6c9a7a6252c92d83c5))
* **auth:** fix generated provider assertions ([e5f91d5](https://github.com/KroderDev/kratos-nextjs-sso/commit/e5f91d5a20839a4fa4425f69f91f66eb00e004bc))
* **config:** exercise runtime environment branches ([c0e5464](https://github.com/KroderDev/kratos-nextjs-sso/commit/c0e5464a44ca4675606153afb170d26b73b0775c))
* cover Playwright config CI branches ([eca745c](https://github.com/KroderDev/kratos-nextjs-sso/commit/eca745cae411c0ab3cc3749279ebb79b70f9949b))
* **dashboard:** add component behavior tests ([9adc258](https://github.com/KroderDev/kratos-nextjs-sso/commit/9adc25867e6eec15277f16c8b2fa6da76b65e808))
* **e2e:** cover configured login flow ([3a0c62f](https://github.com/KroderDev/kratos-nextjs-sso/commit/3a0c62f3d46baea17767f4bc7154ce7336099168))
* **e2e:** cover configured login flow ([18b7ba5](https://github.com/KroderDev/kratos-nextjs-sso/commit/18b7ba5a1bb6a8050e96d055903d4103fe718e58))
* **e2e:** stabilize layout selectors ([65f6a56](https://github.com/KroderDev/kratos-nextjs-sso/commit/65f6a566ddb199f23854c0d9bde7efe6e5895aa8))
* **e2e:** unify Playwright auth configuration ([3910489](https://github.com/KroderDev/kratos-nextjs-sso/commit/391048977489d39abc631a19225b26c2ba0cf7c7))
* **i18n:** organize locale and translation tests ([dc39179](https://github.com/KroderDev/kratos-nextjs-sso/commit/dc39179b17e154d503d5fd1d324d94d6f7df2972))
* improve unit test coverage to 95% and remove docs tests ([062af10](https://github.com/KroderDev/kratos-nextjs-sso/commit/062af10baa1ec978fe930e45be704c064a4f5892))
* improve unit test coverage to 95% and remove docs tests ([c259243](https://github.com/KroderDev/kratos-nextjs-sso/commit/c25924323d3e39f926486320e4b87f9fe9e6bbce))
* **layout:** add component behavior tests ([a785635](https://github.com/KroderDev/kratos-nextjs-sso/commit/a7856356adc9d20302bbaa80c80d4e0343433372))
* **layout:** exercise client effects and conditional branches in layout tests ([6c5b862](https://github.com/KroderDev/kratos-nextjs-sso/commit/6c5b86232384559fa3b45c39677c04bad43ae206))
* **ory:** expand coverage for node rendering, trigger runtime, and form branches ([729f02e](https://github.com/KroderDev/kratos-nextjs-sso/commit/729f02e0e1b97c6ba097e3da6ee2d969d27279f6))
* **ory:** organize component tests ([946b9bc](https://github.com/KroderDev/kratos-nextjs-sso/commit/946b9bce226015ce3e74cacbf30d1ac49317f240))
* **security:** add E2E tests for cache-control, CSP form-action, proxy paths, and permissions-policy ([509d1ef](https://github.com/KroderDev/kratos-nextjs-sso/commit/509d1ef72c47509ba4f9ec9a766a1a97df663759))
* **security:** add URL bypass edge-case tests for isSafeProviderUrl ([38308de](https://github.com/KroderDev/kratos-nextjs-sso/commit/38308deb7f5c0046b5a11470c713bbb98b7f40b5))
* **security:** harden E2E assertions with maxRedirects, strict form-action source check ([804f5b9](https://github.com/KroderDev/kratos-nextjs-sso/commit/804f5b937d2ffed4cc26ee487ee683616069fa82))
* **theme:** add provider and toggle tests ([30844d4](https://github.com/KroderDev/kratos-nextjs-sso/commit/30844d4aa188c078d3bafefdf4f275cc8857f4ef))
* **ui:** add unit tests for avatar, card, checkbox, dropdown-menu, and field ([e2b6dd8](https://github.com/KroderDev/kratos-nextjs-sso/commit/e2b6dd8fff59d342c2144f5a764a72a91815d5c2))


### Continuous Integration

* **auth:** run real Kratos authentication tests ([7d10d35](https://github.com/KroderDev/kratos-nextjs-sso/commit/7d10d35594744db92579f8469ee584823f6f14a0))
* **auth:** run real Kratos authentication tests ([d451e9c](https://github.com/KroderDev/kratos-nextjs-sso/commit/d451e9ccfd956448095023e906e82f3fbaa38888))

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

* add branding customization section and remove development instructions ([744c232](https://github.com/KroderDev/kratos-nextjs-sso/commit/744c23292504306794a1c95539ca6bf7c7fc605f))
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
