# Proxy Port provider for Crawlee  
`crawlee-proxyport` package provides easy way to use rotating proxy with Crawlee. Using <a href="https://proxy-port.com/en/scraping-proxy" target="_blank">Proxy Port</a> API as source of proxy.
## Prerequisites
To use this package you will need a free API key. Get your AIP key <a href="https://account.proxy-port.com/scraping" target="_blank">here</a>.
Detailed instructions <a href="https://proxy-port.com/en/scraping-proxy/getting-started" target="_blank">here</a>.
## Installation
Install via <a href="https://www.npmjs.com" target="_blank">npm</a>:
```shell
$ npm i crawlee-proxyport
```
## Getting Started
Before you get your first proxy, you need to assign an <a href="https://account.proxy-port.com/scraping" target="_blank">API key</a>.
```typescript
import { CheerioCrawler, ProxyConfiguration } from 'crawlee';
import { ProxyProvider } from 'crawlee-proxyport';

const startUrls = ['https://example.com'];

const crawler: CheerioCrawler = new CheerioCrawler({
    useSessionPool: true,
    persistCookiesPerSession: true,
    proxyConfiguration: new ProxyConfiguration({
        newUrlFunction: (sId) => proxyProvider.newUrlFunction(sId)
    }),
    maxRequestRetries: 20,
    sessionPoolOptions:{
        sessionOptions: {
            // you may want to play with this number, we recomend to use value between 10 and 50
            maxUsageCount: 20,
        },
    },
    async requestHandler({ request, $, log }) {
        const title = $('title').text();
        log.info(`Title of ${request.loadedUrl} is '${title}'`);
    },
});

const proxyProvider = new ProxyProvider(<API_KEY>, crawler);

await crawler.run(startUrls);

```
