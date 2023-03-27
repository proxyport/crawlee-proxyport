import { BasicCrawler, CheerioCrawler, PuppeteerCrawler, PlaywrightCrawler } from 'crawlee';
import { ProxyPort } from '@proxyport/proxyport';

interface ProxyData {
    proxy: string,
    usageCount: number,
    errorScore: number
}

export class ProxyProvider {
    crawler: BasicCrawler | CheerioCrawler | PuppeteerCrawler | PlaywrightCrawler;
    proxyPort: ProxyPort;

    knownProxies: Map<string, Boolean> = new Map();
    sessionToProxyMap: Map<string | number, string> = new Map();

    constructor(apiKey: string, crawler: BasicCrawler | CheerioCrawler | PuppeteerCrawler | PlaywrightCrawler) {
        this.proxyPort = new ProxyPort(apiKey);
        this.crawler = crawler;
    }

    private getProxyArray() {
        let proxyDataMap: Map<string, ProxyData> = new Map();
        let sessions = this.crawler?.sessionPool?.getState()?.sessions;
        if (sessions) {
            for (let s of sessions) {
                let proxy = this.sessionToProxyMap.get(s.id);
                if (!proxy) {
                    continue;
                }
                let knownData = proxyDataMap.get(proxy);
                if (knownData) {
                    knownData.usageCount += s.usageCount;
                    knownData.errorScore += s.errorScore;
                } else {
                    knownData = {
                        proxy: proxy,
                        usageCount: s.usageCount,
                        errorScore: s.errorScore
                    };
                }
                proxyDataMap.set(proxy, knownData);
            };
        }
        return Array.from(proxyDataMap.values());
    }

    private getNoErrorProxy(proxyArray: Array<ProxyData>) {
        let maxUsageCount = this.crawler?.sessionPool?.getState()?.sessions[0]?.maxUsageCount;
        if (maxUsageCount === undefined) {
            return "";
        }
        let noErrorsProxies: Array<any> = [];
        for (let proxyData of proxyArray) {
            if (proxyData.errorScore === 0 && proxyData.usageCount > 0 && proxyData.usageCount < maxUsageCount) {
                noErrorsProxies.push(proxyData);
            }
        }
        noErrorsProxies.sort((a, b) => b.usageCount - a.usageCount);
        if (noErrorsProxies.length) {
            return noErrorsProxies[0].proxy;
        }
        return "";
    }

    private getLeasBadProxy(proxyArray: Array<ProxyData>) {
        let leastBadProxy: any;
        for (let proxyData of proxyArray) {
            if (leastBadProxy && 
                (proxyData.errorScore > leastBadProxy.errorScore || 
                    proxyData.usageCount > leastBadProxy.usageCount)) {
                continue
            }
            leastBadProxy = proxyData;
        }
        return leastBadProxy?.proxy;
    }

    async newUrlFunction(sessionId: string | number): Promise<string> {
        let proxyArray = this.getProxyArray();
        let proxy = this.getNoErrorProxy(proxyArray);
        if (!proxy) {
            proxy = await this.proxyPort.getProxy();
            if (!proxy || this.knownProxies.get(proxy)) {
                proxy = this.getLeasBadProxy(proxyArray);
            }
        }
        if (!proxy) {
            console.log("No proxy found.")
            return "";
        }
        this.knownProxies.set(proxy, true);
        this.sessionToProxyMap.set(sessionId, proxy);
        return `http://${proxy}`;
    }
}
