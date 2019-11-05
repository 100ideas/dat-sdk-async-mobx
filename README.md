# dat-sdk-async-mobx
- this repo: https://github.com/100ideas/dat-sdk-async-mobx
- license: MIT
- try/edit demo on codesandbox: https://codesandbox.io/s/github/100ideas/dat-sdk-async-mobx/tree/codesandbox-v1

looking forward to the unified (dat, beaker), isomorphic (client, browser), async-centric `dat api` under development as `dat-sdk`: https://github.com/datproject/sdk

was wondering how straightforward it is to use in its alpha state - hence this repo. Integrated it with mobx + react + async pattern (maybe overkill).

Looking for feedback on how to use dat-sdk "better". I am sure I am doing it wrong :p.

for a smaller codebase with similar functionality, check out https://github.com/100ideas/corestore

#### notes
- was originally trying to demonstrate `dat-sdk` working purely clientside by developing the app in a browser idea (stackblitz / codesandbox / runkit). For now (5 nov 2019) there `hyperdiscovery` + `discovery-swarm-web` are depending on different versions of one another, in particular hyperdiscovery is dependanct on an older version of discovery-swarm-web that itself is dependant on an older version of `@geut/discovery-swarm-webrtc` that is included via `package.json` github direct link. This breaks some of the online IDEs / bundlers. So I experimented with various ways of overriding the packages (`./src/overrides/`) with locally-patched versions. Not pretty & prone to break.
- see https://github.com/RangerMauve/discovery-swarm-web/issues/7#issuecomment-549669161