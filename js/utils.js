const Utils = {
    select: (s, ctx = document) => ctx.querySelector(s),
    selectAll: (s, ctx = document) => Array.from(ctx.querySelectorAll(s)),
    clamp: (value, min, max) => Math.max(min, Math.min(max, value)),
    lerp: (start, end, t) => start + (end - start) * t,
    getScrollFraction(el) {
        const rect = el.getBoundingClientRect();
        const progress = -rect.top / (rect.height - window.innerHeight);
        return this.clamp(progress, 0, 1);
    },
    prefersReducedMotion() {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    },
    onRaf(callback) {
        let ticking = false;
        return (...args) => {
            if (ticking) return;
            ticking = true;
            window.requestAnimationFrame(() => {
                callback(...args);
                ticking = false;
            });
        };
    },
    formatNumber(value, decimals = 1) {
        return Number(value).toFixed(decimals);
    },
    // Triggers a browser download of `data` as a pretty-printed .json file.
    // Used for every "Get data" button on the site so downloads are always
    // JSON, never CSV or Excel.
    downloadJSON(filename, data) {
        try {
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('JSON download failed:', err);
        }
    },
    tooltip: {
        el: null,
        visible: false,
        raf: null,
        init() {
            this.el = document.querySelector('#global-tooltip');
        },
        show(event, title, ...bodyLines) {
            if (!this.el) this.init();
            if (!this.el) return;
            this.el.innerHTML = '';
            const strong = document.createElement('strong');
            strong.textContent = title;
            this.el.appendChild(strong);
            bodyLines.forEach(line => {
                this.el.appendChild(document.createElement('br'));
                this.el.appendChild(document.createTextNode(line));
            });
            this.el.style.opacity = '1';
            this.visible = true;
            this.move(event);
        },
        move(event) {
            if (!this.el || !this.visible) return;
            if (this.raf) window.cancelAnimationFrame(this.raf);
            this.raf = window.requestAnimationFrame(() => {
                const offset = 16;
                const rect = this.el.getBoundingClientRect();
                let left = event.pageX + offset;
                let top = event.pageY + offset;
                if (left + rect.width > window.scrollX + window.innerWidth - 12) {
                    left = event.pageX - rect.width - offset;
                }
                if (top + rect.height > window.scrollY + window.innerHeight - 12) {
                    top = event.pageY - rect.height - offset;
                }
                this.el.style.left = `${left}px`;
                this.el.style.top = `${top}px`;
            });
        },
        hide() {
            if (!this.el) return;
            this.el.style.opacity = '0';
            this.visible = false;
        }
    }
};
window.addEventListener('DOMContentLoaded', () => {
    Utils.tooltip.init();
});