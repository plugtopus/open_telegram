const App = {

    servers: {
        "reserved_nl2": `PROXY proxy.bbpi.ru:8080; HTTP proxy.bbpi.ru:8080;  HTTPS proxy.bbpi.ru:8080`,
    },

    domains: ["web.telegram.org", "telegram.org", "www.telegram.org", "www.web.telegram.org"]

};
class Proxy {
    constructor() {
        this.rules = [];
    }

    buildRule(item, isFirst) {
        return `${!isFirst?`else `:``}if(${item.exp}){ return "${this.resolveHost[(item.srv)]}"; }`;
    }

    addRule(exp, srv = 'reserved_nl2') {
        this.rules.push({
            exp,
            srv
        });
        return this;
    }

    resolveTo(host) {
        this.resolveHost = host;
        return this;
    }

    buildPacScript(cb) {
        const s = [`function FindProxyForURL(url, host){`];
        const self = this;

        this.rules.forEach(
            (item, id) => s.push(self.buildRule(item, id === 0))
    );

        s.push(' else { return "DIRECT"; } }');

        return cb(s.join(' '));
    }
}

const prxy = new Proxy();
App.domains.forEach(item => prxy.addRule(`shExpMatch(url, "*${item}*")`));
chrome['proxy']['settings'].clear({
    scope: "regular"
});

prxy.resolveTo(App.servers).buildPacScript((data) => {
    chrome['proxy']['settings'].set({
    value: {
        mode: "pac_script",
        pacScript: {
            data: data
        }
    },
    scope: "regular"
})
});