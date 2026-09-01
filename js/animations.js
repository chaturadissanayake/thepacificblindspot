const Charts = {
    state: {},
    ink: '#111111',
    inkSoft: '#4B5563',
    inkFaint: '#9CA3AF',
    gridLine: '#E5E7EB',

    cssVar(name, fallback) {
        const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
        return v || fallback || '#111111';
    },
    get teal() { return this.cssVar('--accent-ocean', '#0A6C90'); },
    get gold() { return this.cssVar('--accent-warning', '#E9C46A'); },
    get coral() { return this.cssVar('--accent-danger', '#C1443B'); },
    get coralDark() { return this.cssVar('--accent-coral-dark', '#A32915'); },
    get success() { return this.cssVar('--accent-success', '#1E8A5C'); },
    dur(ms) { return Utils.prefersReducedMotion() ? 0 : ms; },

    countText(el, from, to, opts = {}) {
        if (!el) return;
        const decimals = opts.decimals ?? 1;
        const prefix = opts.prefix || '';
        const suffix = opts.suffix || '';
        const duration = this.dur(opts.duration ?? 1200);
        const format = (v) => `${prefix}${v.toFixed(decimals)}${suffix}`;
        if (duration === 0) {
            el.textContent = format(to);
            return;
        }
        d3.select(el).interrupt('count').transition('count')
            .duration(duration).ease(d3.easeCubicOut)
            .tween('text', function () {
                const i = d3.interpolateNumber(from, to);
                return function (t) {
                    this.textContent = format(i(t));
                };
            });
    },

    initRadarGrid(selector) {
        const host = Utils.select(selector);
        if (!host) return;
        host.innerHTML = '';
        const w = 1440, h = 900;
        for (let i = 1; i <= 6; i++) {
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', w/2); circle.setAttribute('cy', h/2); circle.setAttribute('r', i * 120);
            host.appendChild(circle);
        }
        for (let i = 0; i < 8; i++) {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            const angle = (i * Math.PI) / 4;
            line.setAttribute('x1', w/2); line.setAttribute('y1', h/2);
            line.setAttribute('x2', w/2 + Math.cos(angle) * 800); line.setAttribute('y2', h/2 + Math.sin(angle) * 800);
            host.appendChild(line);
        }
    },

    initRadarNodes(selector) {
        const host = Utils.select(selector);
        if (!host) return;
        host.innerHTML = '';
        AppData.radarStations.forEach((station) => {
            const node = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            const r = Math.abs(station.lat) * 600 + 50;
            const angle = station.lon * Math.PI;

            node.setAttribute('cx', 720 + Math.cos(angle) * r);
            node.setAttribute('cy', 450 + Math.sin(angle) * r);
            node.setAttribute('r', 3);
            node.setAttribute('class', 'inactive');
            node.setAttribute('data-threshold', station.threshold);
            node.setAttribute('data-active', station.isActive);

            node.style.cursor = 'pointer';
            node.addEventListener('mouseenter', (e) => {
                const status = station.isActive ? 'Active Station' : 'Silent Gap (Unfunded)';
                const desc = station.isActive ? 'Transmitting baseline data' : 'Critical blind spot in network';
                Utils.tooltip.show(e, status, desc);
            });
            node.addEventListener('mousemove', (e) => Utils.tooltip.move(e));
            node.addEventListener('mouseleave', () => Utils.tooltip.hide());

            host.appendChild(node);
        });
    },

    initMeteo() {
        const container = Utils.select('#meteo-canvas');
        if (!container) return;
        container.innerHTML = '';

        const countries = AppData.meteoCountryOrder;
        const [yearStart, yearEnd] = AppData.meteoYearRange;
        const years = d3.range(yearStart, yearEnd + 1);

        const cellW = 6, cellH = 30, rowGap = 4;
        const margin = { top: 40, right: 200, bottom: 40, left: 200 };
        const width = margin.left + years.length * cellW + margin.right;
        const height = margin.top + countries.length * (cellH + rowGap) + margin.bottom;

        const svg = d3.select(container).append('svg')
            .attr('viewBox', `0 0 ${width} ${height}`)
            .attr('preserveAspectRatio', 'xMidYMid meet');

        const color = d3.scaleLinear()
            .domain([0, 1, AppData.meteoMaxStations])
            .range([this.cssVar('--bg-paper-soft', '#F0F0EB'), 'rgba(0, 92, 138, 0.35)', this.teal])
            .interpolate(d3.interpolateRgb);

        const rowLabels = svg.append('g').attr('class', 'd3-axis meteo-row-labels');
        countries.forEach((c, i) => {
            const label = (AppData.meteoCountryLabels && AppData.meteoCountryLabels[c]) || c;
            rowLabels.append('text')
                .attr('x', margin.left - 16)
                .attr('y', margin.top + i * (cellH + rowGap) + cellH / 2)
                .attr('dy', '0.35em')
                .attr('text-anchor', 'end')
                .style('font-family', 'var(--font-sans)')
                .style('font-size', '15px')
                .style('font-weight', '500')
                .attr('fill', this.inkSoft)
                .text(label);
        });

        const grid = svg.append('g').attr('class', 'meteo-grid').attr('transform', `translate(${margin.left}, ${margin.top})`);
        const cells = [];
        countries.forEach((country, rowIndex) => {
            const steps = (AppData.meteoStations[country] || []).slice().sort((a, b) => a.year - b.year);
            let stepIndex = -1;
            years.forEach((year, colIndex) => {
                while (stepIndex + 1 < steps.length && steps[stepIndex + 1].year <= year) stepIndex++;
                const stations = stepIndex >= 0 ? steps[stepIndex].stations : 0;
                cells.push({ country, rowIndex, year, colIndex, stations });
            });
        });

        const cellSel = grid.selectAll('rect.meteo-cell')
            .data(cells)
            .enter()
            .append('rect')
            .attr('class', 'meteo-cell')
            .attr('x', d => d.colIndex * cellW)
            .attr('y', d => d.rowIndex * (cellH + rowGap))
            .attr('width', cellW - 1)
            .attr('height', cellH)
            .attr('fill', d => color(d.stations))
            .attr('opacity', 0)
            .on('mousemove', (event, d) => {
                const label = (AppData.meteoCountryLabels && AppData.meteoCountryLabels[d.country]) || d.country;
                const stationWord = d.stations === 1 ? 'station' : 'stations';
                Utils.tooltip.show(event, `${label}, ${d.year}`, `${d.stations} active ${stationWord}`);
            })
            .on('mouseleave', () => Utils.tooltip.hide());

        cellSel.transition().duration(600).delay((d, i) => Math.min(i * 0.4, 500)).attr('opacity', 1);

        const xAxisGroup = svg.append('g')
            .attr('class', 'd3-axis')
            .attr('transform', `translate(${margin.left}, ${margin.top + countries.length * (cellH + rowGap) + 6})`);
        const decadeTicks = years.filter(y => y % 20 === 0);
        xAxisGroup.selectAll('text')
            .data(decadeTicks)
            .enter()
            .append('text')
            .attr('x', y => (y - yearStart) * cellW)
            .attr('y', 18)
            .attr('text-anchor', 'middle')
            .style('font-family', 'var(--font-mono)')
            .style('font-size', '14px')
            .attr('fill', this.inkSoft)
            .text(y => y);

        const legendSteps = [0, 2, 4, 6, AppData.meteoMaxStations];
        const legendItemW = 75;
        const legendWidth = legendSteps.length * legendItemW;
        const legend = svg.append('g').attr('transform', `translate(${width - margin.right - legendWidth + 20}, 16)`);
        legendSteps.forEach((v, i) => {
            legend.append('rect').attr('x', i * legendItemW).attr('y', -12).attr('width', 16).attr('height', 16).attr('fill', color(v));
            legend.append('text').attr('x', i * legendItemW + 24).attr('y', 2)
                .style('font-family', 'var(--font-sans)')
                .style('font-size', '14px')
                .attr('fill', this.inkSoft)
                .text(v === 0 ? 'None' : v);
        });

        this.state.meteo = { svg, initialized: true };
    },

    updateMeteo() {
    },

    initCompliance() {
        const container = Utils.select('#compliance-canvas');
        if (!container) return;
        container.innerHTML = '';
        const width = 960, height = 280;
        const margin = { top: 75, right: 200, bottom: 20, left: 200 };
        const svg = d3.select(container).append('svg')
            .attr('viewBox', `0 0 ${width} ${height}`)
            .attr('preserveAspectRatio', 'xMidYMid meet');

        const x = d3.scaleLinear().domain([0, 100]).range([margin.left, width - margin.right]);
        const y = d3.scaleBand().domain(AppData.compliance.map(d => d.category)).range([margin.top, height - margin.bottom]).padding(0.12);

        const xAxis = svg.append('g').attr('class', 'd3-axis')
            .attr('transform', `translate(0,${margin.top - 15})`)
            .call(d3.axisTop(x).tickSize(- (height - margin.top - margin.bottom)).ticks(5).tickFormat(d => d + '%'));

        xAxis.select('.domain').remove();
        xAxis.selectAll('text').style('fill', '#ffffff').style('font-family', 'var(--font-sans)').style('font-size', '12px');
        xAxis.selectAll('line').attr('stroke', 'rgba(255, 255, 255, 0.15)');

        const yAxis = svg.append('g').attr('class', 'd3-axis')
            .attr('transform', `translate(${margin.left},0)`)
            .call(d3.axisLeft(y).tickSize(0));

        yAxis.select('.domain').remove();
        yAxis.selectAll('text')
            .style('fill', '#ffffff')
            .style('font-size', '14px')
            .style('font-weight', '600')
            .attr('dx', '-1.5em')
            .style('cursor', d => (d.includes('SIDS') || d.includes('LDCs') || d.includes('UMICs') || d.includes('LMICs')) ? 'help' : 'default')
            .each(function(d) {
                if (d.includes('SIDS') || d.includes('LDCs') || d.includes('UMICs') || d.includes('LMICs')) {
                    d3.select(this).append('tspan')
                      .text(' *')
                      .style('fill', 'var(--accent-coral)')
                      .style('font-size', '16px')
                      .style('baseline-shift', 'super');
                }
            })
            .on('mouseenter', (event, d) => {
                if (d.includes('SIDS')) Utils.tooltip.show(event, 'Small Island Developing States', 'A distinct group of developing countries facing specific social, economic, and environmental vulnerabilities.');
                if (d.includes('LDCs')) Utils.tooltip.show(event, 'Least Developed Countries', 'Low-income countries confronting severe structural impediments to sustainable development.');
                if (d.includes('UMICs')) Utils.tooltip.show(event, 'Upper-Middle Income Countries', 'Nations with higher GNIs, demonstrating a stark contrast in monitoring capabilities.');
                if (d.includes('LMICs')) Utils.tooltip.show(event, 'Lower-Middle Income Countries', 'Nations lacking the financial capacity to maintain advanced meteorological hardware.');
            })
            .on('mousemove', event => Utils.tooltip.move(event))
            .on('mouseleave', () => Utils.tooltip.hide());

        const row = svg.selectAll('.row')
            .data(AppData.compliance).enter().append('g').attr('class', 'row')
            .style('cursor', 'pointer')
            .on('mouseenter', (event, d) => Utils.tooltip.show(event, d.category, `Active: ${d.value}%`, `Critical Gap: ${100 - d.value}%`))
            .on('mousemove', event => Utils.tooltip.move(event))
            .on('mouseleave', () => Utils.tooltip.hide());

            row.append('rect')
            .attr('class', 'deficit-bar')
            .attr('x', x(0))
            .attr('y', d => y(d.category))
            .attr('height', y.bandwidth())
            .attr('width', x(100) - x(0))
            .attr('fill', this.cssVar('--bg-deep-soft', '#161B22'))
            .attr('stroke', 'rgba(255, 255, 255, 0.12)')
            .attr('stroke-width', 1);

        row.append('rect')
            .attr('class', 'active-bar')
            .attr('x', x(0))
            .attr('y', d => y(d.category))
            .attr('height', y.bandwidth())
            .attr('width', 0)
            .attr('fill', this.gold);

        row.append('text')
            .attr('class', 'value-text')
            .attr('y', d => y(d.category) + y.bandwidth() / 2)
            .attr('dy', '0.35em')
            .text(d => d.label)
            .style('font-size', '12px').style('font-weight', '700').style('font-family', 'var(--font-mono)')
            .attr('opacity', 0);

        const legend = svg.append('g').attr('transform', `translate(${margin.left}, 10)`);
        legend.append('rect').attr('x', 0).attr('y', -5).attr('width', 10).attr('height', 10).attr('fill', this.gold);
        legend.append('text').attr('x', 18).attr('y', 4).text('Active Infrastructure').style('font-size', '11px').attr('fill', 'rgba(255,255,255,0.7)');
        legend.append('rect').attr('x', 160).attr('y', -5).attr('width', 10).attr('height', 10).attr('fill', this.cssVar('--bg-deep-soft', '#161B22')).attr('stroke', 'rgba(255, 255, 255, 0.12)').attr('stroke-width', 1);
        legend.append('text').attr('x', 178).attr('y', 4).text('Missing Data Gap').style('font-size', '11px').attr('fill', 'rgba(255,255,255,0.7)');

        this.state.compliance = { row, x };
    },

    updateCompliance(filterType = null) {
        if (!this.state.compliance) return;
        const { row, x } = this.state.compliance;

        if (filterType) {
            if (filterType === 'sids') {
                row.transition().duration(this.dur(400)).ease(d3.easeCubicOut)
                    .style('opacity', d => (d.group === 'sids' || d.group === 'pacific') ? 1 : 0.25);
            } else {
                row.transition().duration(this.dur(400)).ease(d3.easeCubicOut).style('opacity', 1);
            }
        } else if (!this.state.compliance.animated) {
            this.state.compliance.animated = true;

            row.select('.active-bar').transition().duration(this.dur(1200)).ease(d3.easeCubicOut)
                .attr('width', d => x(d.value) - x(0));

            row.select('.value-text').transition().delay(this.dur(1000)).duration(this.dur(500))
                .attr('x', d => x(d.value) + 10)
                .attr('text-anchor', 'start')
                .attr('fill', this.gold)
                .attr('opacity', 1);
        }
    },

    initExposure() {
        const container = Utils.select('#exposure-canvas');
        if (!container) return;
        this.state.exposure = {
            currentCountry: "Vanuatu",
            currentMetric: "affected",
            mode: null
        };
        this.renderExposureAffected(container, "Vanuatu", false);
    },

    renderExposureAffected(container, country, animate = true) {
        container.innerHTML = '';
        const width = 960, height = 500;
        const margin = { top: 70, right: 60, bottom: 40, left: 80 };
        const svg = d3.select(container).append('svg')
            .attr('viewBox', `0 0 ${width} ${height}`)
            .attr('preserveAspectRatio', 'xMidYMid meet');

        const data = AppData.exposure[country] || [];

        const x = d3.scaleBand().domain(data.map(d => d.year)).range([margin.left, width - margin.right]).padding(0.2);
        const y = d3.scaleLinear().domain([0, (d3.max(data, d => d.affected) || 0) * 1.15]).range([height - margin.bottom, margin.top]);

        const yAxisGroup = svg.append('g').attr('class', 'd3-grid y-grid')
            .attr('transform', `translate(${margin.left},0)`);
        yAxisGroup.call(d3.axisLeft(y).tickSize(-(width - margin.left - margin.right)).ticks(5).tickFormat(d3.format('~s')))
            .call(g => g.select('.domain').remove())
            .selectAll('text').attr('fill', this.inkSoft).attr('x', -8).attr('dy', -4).style('font-family', 'var(--font-mono)').style('font-size', '11px');

        svg.append('text').text('Total People Affected')
            .attr('x', width / 2).attr('y', 24)
            .attr('text-anchor', 'middle')
            .attr('fill', this.ink).style('font-family', 'var(--font-sans)').style('font-size', '14px').style('font-weight', '600');

        svg.append('g').attr('class', 'd3-axis x-axis')
            .attr('transform', `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(x).tickSize(0))
            .call(g => g.select('.domain').remove())
            .selectAll('text').attr('fill', this.inkSoft).style('font-family', 'var(--font-mono)').style('font-size', '12px').attr('dy', '1em');

        const bars = svg.selectAll('.bar').data(data).enter().append('rect')
            .attr('class', 'bar')
            .attr('x', d => x(d.year))
            .attr('width', x.bandwidth())
            .attr('y', height - margin.bottom)
            .attr('height', 0)
            .attr('fill', this.coral)
            .style('cursor', 'pointer')
            .on('mouseenter', (event, d) => Utils.tooltip.show(
                event,
                `Year: ${d.year}`,
                d.affected !== null && d.affected !== undefined ? `Affected: ${Utils.formatNumber(d.affected, 0)}` : 'Affected: Data Unavailable'
            ))
            .on('mousemove', event => Utils.tooltip.move(event))
            .on('mouseleave', () => Utils.tooltip.hide());

        if (animate) {
            bars.transition('grow').duration(this.dur(800)).ease(d3.easeCubicOut).delay((d,i) => i * 50)
                .attr('y', d => y(d.affected || 0))
                .attr('height', d => Math.max(0, height - margin.bottom - y(d.affected || 0)));
        } else {
            bars.attr('y', d => y(d.affected || 0))
                .attr('height', d => Math.max(0, height - margin.bottom - y(d.affected || 0)));
        }

        const labels = svg.selectAll('.affected-label').data(data).enter().append('text')
            .attr('class', 'affected-label')
            .attr('x', d => x(d.year) + x.bandwidth() / 2)
            .attr('y', height - margin.bottom)
            .attr('text-anchor', 'middle')
            .attr('fill', this.ink)
            .style('font-family', 'var(--font-mono)')
            .style('font-size', '11px')
            .style('font-weight', '600')
            .style('opacity', 0)
            .style('pointer-events', 'none')
            .text(d => d.affected !== null && d.affected !== undefined ? Utils.formatNumber(d.affected, 0) : '');

        if (animate) {
            labels.transition('fade').duration(this.dur(800)).ease(d3.easeCubicOut).delay((d, i) => i * 50)
                .attr('y', d => y(d.affected || 0) - 8)
                .style('opacity', 1);
        } else {
            labels.attr('y', d => y(d.affected || 0) - 8).style('opacity', 1);
        }

        const stakesSection = document.getElementById('stakes');
        if (stakesSection) {
            stakesSection.style.setProperty('--exposure-color', this.coral);
            stakesSection.style.setProperty('--exposure-text', '#ffffff');
        }

        this.state.exposure.mode = 'affected';
        this.state.exposure.width = width;
        this.state.exposure.height = height;
        this.state.exposure.margin = margin;
        this.state.exposure.x = x;
        this.state.exposure.y = y;
        this.state.exposure.bars = bars;
        this.state.exposure.yAxisGroup = yAxisGroup;
    },

    renderExposureAvgAnnualLoss(container) {
        container.innerHTML = '';
        const width = 960, height = 500;
        const margin = { top: 70, right: 90, bottom: 50, left: 190 };
        const svg = d3.select(container).append('svg')
            .attr('viewBox', `0 0 ${width} ${height}`)
            .attr('preserveAspectRatio', 'xMidYMid meet');

        const countryMap = {};
        AppData.exposureAvgAnnualLoss.forEach(d => {
            if (!countryMap[d.country]) countryMap[d.country] = { country: d.country, usd: 0 };
            countryMap[d.country].usd += (d.usd || 0);
        });
        const data = Object.values(countryMap).filter(d => d.usd > 0).sort((a, b) => b.usd - a.usd);

        const x = d3.scaleLinear().domain([0, d3.max(data, d => d.usd) * 1.08]).range([margin.left, width - margin.right]);

        const y = d3.scaleBand().domain(data.map(d => d.country)).range([margin.top, height - margin.bottom]).padding(0.15);

        const colorScale = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.usd)])
            .range([this.cssVar('--accent-coral-light', '#E8705F'), this.coralDark]);

        const xAxisGroup = svg.append('g').attr('class', 'd3-grid')
            .attr('transform', `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(x).tickSize(-(height - margin.top - margin.bottom)).ticks(5).tickFormat(d => `$${d3.format('.2s')(d)}`));
        xAxisGroup.select('.domain').remove();
        xAxisGroup.selectAll('text').attr('fill', this.inkSoft).attr('dy', '1em').style('font-family', 'var(--font-mono)').style('font-size', '11px');

        svg.append('text').text('Average Annual Economic Loss (USD)')
            .attr('x', width / 2).attr('y', 24)
            .attr('text-anchor', 'middle')
            .attr('fill', this.ink).style('font-family', 'var(--font-sans)').style('font-size', '14px').style('font-weight', '600');

        const yAxisGroup = svg.append('g').attr('class', 'd3-axis')
            .attr('transform', `translate(${margin.left},0)`)
            .call(d3.axisLeft(y).tickSize(0));
        yAxisGroup.select('.domain').remove();
        yAxisGroup.selectAll('text').attr('fill', this.ink).style('font-family', 'var(--font-sans)').style('font-size', '12px').style('font-weight', '500');

        const bars = svg.selectAll('.avgloss-bar').data(data, d => d.country).enter().append('rect')
            .attr('class', 'avgloss-bar')
            .attr('x', margin.left)
            .attr('y', d => y(d.country))
            .attr('height', y.bandwidth())
            .attr('width', 0)
            .attr('fill', d => colorScale(d.usd))
            .style('cursor', 'pointer')
            .on('mouseenter', (event, d) => Utils.tooltip.show(
                event,
                d.country,
                `Total loss: $${Utils.formatNumber(d.usd, 0)}`
            ))
            .on('mousemove', event => Utils.tooltip.move(event))
            .on('mouseleave', () => Utils.tooltip.hide());

        bars.transition('grow').duration(this.dur(1000)).ease(d3.easeCubicOut).delay((d, i) => i * 40)
            .attr('width', d => Math.max(0, x(d.usd) - margin.left));

        const stakesSection = document.getElementById('stakes');
        if (stakesSection) {
            stakesSection.style.setProperty('--exposure-color', this.coral);
            stakesSection.style.setProperty('--exposure-text', '#ffffff');
        }

        this.state.exposure.mode = 'avgAnnualLoss';
        this.state.exposure.avgBars = bars;
    },

    highlightExposureAvgAnnualLoss(country) {
        const { avgBars } = this.state.exposure || {};
        if (!avgBars) return;

        const countryMap = {};
        AppData.exposureAvgAnnualLoss.forEach(d => {
            if (!countryMap[d.country]) countryMap[d.country] = { country: d.country, usd: 0 };
            countryMap[d.country].usd += (d.usd || 0);
        });
        const data = Object.values(countryMap).filter(d => d.usd > 0).sort((a, b) => b.usd - a.usd);
        const colorScale = d3.scaleLinear().domain([0, d3.max(data, d => d.usd)]).range([this.cssVar('--accent-coral-light', '#E8705F'), this.coralDark]);

        avgBars.transition('highlight').duration(300)
            .attr('fill', d => colorScale(d.usd))
            .attr('opacity', d => (d.country.trim().toLowerCase() === country.trim().toLowerCase()) ? 1 : 0.25);
    },

    updateExposure(country, metric) {
        if (!this.state.exposure) return;
        const state = this.state.exposure;
        const container = Utils.select('#exposure-canvas');
        if (!container) return;

        if (country) state.currentCountry = country;
        if (metric) state.currentMetric = metric;

        container.style.minHeight = '500px';

        if (state.currentMetric === 'avgAnnualLoss') {
            if (state.mode !== 'avgAnnualLoss') {
                this.renderExposureAvgAnnualLoss(container);
                d3.select(container).select('svg').style('opacity', 0).transition('appear').duration(300).style('opacity', 1);
                this.highlightExposureAvgAnnualLoss(state.currentCountry);
                return;
            }
            this.highlightExposureAvgAnnualLoss(state.currentCountry);
            return;
        }

        if (state.mode !== 'affected' || !state.bars) {
            this.renderExposureAffected(container, state.currentCountry);
            d3.select(container).select('svg').style('opacity', 0).transition('appear').duration(300).style('opacity', 1);
            return;
        }

        const data = AppData.exposure[state.currentCountry] || [];
        const stakesSection = document.getElementById('stakes');
        if (stakesSection) {
            stakesSection.style.setProperty('--exposure-color', this.coral);
            stakesSection.style.setProperty('--exposure-text', '#ffffff');
        }

        const maxY = d3.max(data, d => d.affected || 0);
        state.y.domain([0, Math.max((maxY || 0) * 1.15, 1)]);

        state.yAxisGroup.transition('axis').duration(this.dur(800)).ease(d3.easeCubicOut)
            .call(d3.axisLeft(state.y).tickSize(-(state.width - state.margin.left - state.margin.right)).ticks(5).tickFormat(d3.format('~s')))
            .call(g => g.select('.domain').remove());

        state.yAxisGroup.selectAll('text')
            .attr('fill', this.inkSoft)
            .attr('x', -8)
            .attr('dy', -4)
            .style('font-family', 'var(--font-mono)')
            .style('font-size', '11px');

        const barsJoin = d3.select(container).select('svg').selectAll('.bar').data(data);

        barsJoin.transition('grow').duration(this.dur(800)).ease(d3.easeCubicOut)
            .attr('y', d => state.y(d.affected || 0))
            .attr('height', d => Math.max(0, state.height - state.margin.bottom - state.y(d.affected || 0)))
            .attr('fill', this.coral);

        barsJoin.on('mouseenter', (event, d) => Utils.tooltip.show(
            event,
            `Year: ${d.year}`,
            d.affected !== null && d.affected !== undefined ? `Affected: ${Utils.formatNumber(d.affected, 0)}` : 'Affected: Data Unavailable'
        ));

        const labelsJoin = d3.select(container).select('svg').selectAll('.affected-label').data(data);
        labelsJoin.transition('grow').duration(this.dur(800)).ease(d3.easeCubicOut)
            .attr('y', d => state.y(d.affected || 0) - 8)
            .text(d => d.affected !== null && d.affected !== undefined ? Utils.formatNumber(d.affected, 0) : '');
    },

    initFlooding() {
        const container = Utils.select('#flooding-canvas');
        if (!container) return;
        container.innerHTML = '';
        const width = 960, height = 260;
        const margin = { top: 30, right: 40, bottom: 45, left: 100 };
        const svg = d3.select(container).append('svg')
            .attr('viewBox', `0 0 ${width} ${height}`)
            .attr('preserveAspectRatio', 'xMidYMid meet');

        const data = AppData.historicalFlooding;
        const lastDataYear = data[data.length - 1].year;
        const todayYear = new Date().getFullYear();
        const domainYears = d3.range(data[0].year, Math.max(todayYear, lastDataYear) + 1);

        const x = d3.scaleBand().domain(domainYears).range([margin.left, width - margin.right]).padding(0.25);
        const y = d3.scaleLinear().domain([0, d3.max(data, d => d.days) || 10]).range([height - margin.bottom, margin.top]);

        const xAxisGroup = svg.append('g').attr('class', 'd3-axis')
            .attr('transform', `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(x).tickValues([1980, 1990, 2000, 2010, lastDataYear, todayYear]).tickSize(0));
        xAxisGroup.select('.domain').remove();
        xAxisGroup.selectAll('text').attr('fill', this.ink).style('font-family', 'var(--font-sans)').style('font-size', '12px').style('font-weight', '500').attr('dy', '1.2em');

        const yAxisGroup = svg.append('g').attr('class', 'd3-grid')
            .attr('transform', `translate(${margin.left},0)`)
            .call(d3.axisLeft(y).tickValues([0, 5, 10]).tickSize(-(width - margin.left - margin.right)));
        yAxisGroup.select('.domain').remove();
        yAxisGroup.selectAll('line').attr('stroke', '#e2e8f0');
        yAxisGroup.selectAll('text').attr('fill', this.ink).style('font-family', 'var(--font-sans)').style('font-size', '12px').attr('x', -15);

        svg.append('text').attr('x', margin.left - 15).attr('y', margin.top - 15).text('High Tide Floods (Days per Yr)').attr('fill', this.inkSoft).style('font-family', 'var(--font-sans)').style('font-size', '12px');

        const gapStartX = (x(lastDataYear) ?? 0) + x.bandwidth() + (x.step() * 0.25);
        const gapEndX = width - margin.right;

        const bars = svg.selectAll('.flood-bar').data(data).enter().append('rect')
            .attr('class', 'flood-bar')
            .attr('x', d => x(d.year))
            .attr('y', height - margin.bottom)
            .attr('width', x.bandwidth())
            .attr('height', 0)
            .attr('fill', d => d.year >= 2005 ? this.coral : this.teal)
            .style('cursor', 'pointer')
            .on('mouseenter', (event, d) => Utils.tooltip.show(event, `Year: ${d.year}`, `Floods: ${d.days} days`))
            .on('mousemove', event => Utils.tooltip.move(event))
            .on('mouseleave', () => Utils.tooltip.hide());

        this.state.flooding = { svg, bars, x, y, height, margin };
    },

    updateFlooding() {
        if (!this.state.flooding) return;
        const { bars, y, height, margin } = this.state.flooding;
        bars.transition().duration(this.dur(1000)).ease(d3.easeCubicOut).delay((d,i) => i * 15)
            .attr('y', d => y(d.days))
            .attr('height', d => height - margin.bottom - y(d.days));
    },

    initProjection() {
        const container = Utils.select('#projection-canvas');
        if (!container) return;
        container.innerHTML = '';
        const width = 960, height = 480;
        const margin = { top: 50, bottom: 44 };
        const plotTop = margin.top, plotBottom = height - margin.bottom;

        const panelA = { x0: 76, x1: 528 };
        const gap = { x0: 528, x1: 596 };
        const panelB = { x0: 596, x1: 900 };

        const svg = d3.select(container).append('svg')
            .attr('viewBox', `0 0 ${width} ${height}`)
            .attr('preserveAspectRatio', 'xMidYMid meet');

        const histData = AppData.historicalSeaLevel;
        const lastObserved = histData[histData.length - 1];
        const scenarioKeys = ['lower', 'typical', 'higher'];

        const scenarioMeta = {
            lower: { label: 'Lower', code: 'RCP2.6', color: this.success },
            typical: { label: 'Typical', code: 'RCP4.5', color: this.teal },
            higher: { label: 'High', code: 'RCP8.5', color: this.coral }
        };

        const xA = d3.scaleLinear().domain([1993, lastObserved.year]).range([panelA.x0, panelA.x1]);
        const yA = d3.scaleLinear().domain([0, 100]).range([plotBottom, plotTop]);

        const gridA = svg.append('g').attr('class', 'd3-grid')
            .attr('transform', `translate(${panelA.x0},0)`)
            .call(d3.axisLeft(yA).tickValues([0, 20, 40, 60, 80, 100]).tickSize(-(panelA.x1 - panelA.x0)));

        svg.append('text').attr('x', panelA.x0).attr('y', plotTop - 20).text('Observed sea level (cm since 1993)')
            .attr('fill', this.ink).style('font-family', 'var(--font-sans)').style('font-size', '12px').style('font-weight', 600);

        const xAxisA = svg.append('g').attr('class', 'd3-axis').attr('transform', `translate(0,${plotBottom})`)
            .call(d3.axisBottom(xA).tickValues([1993, 2000, 2010, 2020, lastObserved.year]).tickFormat(d3.format('d')).tickSize(0));
        xAxisA.select('.domain').remove();
        xAxisA.selectAll('text').attr('fill', this.ink).style('font-family', 'var(--font-sans)').style('font-size', '11.5px').style('font-weight', 600).attr('dy', '1.4em');

        const areaGen = d3.area().x(d => xA(d.year)).y0(yA(0)).y1(d => yA(d.val)).curve(d3.curveMonotoneX);
        const lineGen = d3.line().x(d => xA(d.year)).y(d => yA(d.val)).curve(d3.curveMonotoneX);

        svg.append('path').datum(histData).attr('fill', 'rgba(10, 108, 144, 0.16)').attr('d', areaGen);
        svg.append('path').datum(histData).attr('fill', 'none').attr('stroke', this.teal).attr('stroke-width', 2.25).attr('d', lineGen);

        const lastDot = svg.append('circle').attr('cx', xA(lastObserved.year)).attr('cy', yA(lastObserved.val)).attr('r', 5)
            .attr('fill', 'var(--bg-paper)').attr('stroke', this.teal).attr('stroke-width', 2.5);
        const lastText = svg.append('text').attr('x', xA(lastObserved.year)).attr('y', yA(lastObserved.val) - 14).attr('text-anchor', 'end')
            .style('font-family', 'var(--font-mono)').style('font-size', '12px').style('font-weight', 700)
            .attr('fill', this.teal).text(`+${lastObserved.val.toFixed(1)}cm`);

        const bisectYear = d3.bisector(d => d.year).left;
        const hoverGuide = svg.append('line').attr('y1', plotTop).attr('y2', plotBottom)
            .attr('stroke', this.inkFaint).attr('stroke-width', 1).attr('stroke-dasharray', '2 3').attr('opacity', 0).style('pointer-events', 'none');
        const hoverDot = svg.append('circle').attr('r', 4.5).attr('fill', this.teal).attr('opacity', 0).style('pointer-events', 'none');

        svg.append('rect')
            .attr('x', panelA.x0).attr('y', plotTop).attr('width', panelA.x1 - panelA.x0).attr('height', plotBottom - plotTop)
            .attr('fill', 'transparent').style('cursor', 'crosshair')
            .on('mousemove', (event) => {
                const x0 = xA.invert(d3.pointer(event)[0]);
                const i = bisectYear(histData, x0, 1);
                const d0 = histData[i - 1], d1 = histData[i];
                if (!d0 || !d1) return;
                const d = x0 - d0.year > d1.year - x0 ? d1 : d0;

                hoverGuide.attr('x1', xA(d.year)).attr('x2', xA(d.year)).attr('opacity', 0.5);
                hoverDot.attr('cx', xA(d.year)).attr('cy', yA(d.val)).attr('opacity', 1);

                if (d.year === lastObserved.year) {
                    lastDot.attr('opacity', 0); lastText.attr('opacity', 0);
                } else {
                    lastDot.attr('opacity', 1); lastText.attr('opacity', 1);
                }

                Utils.tooltip.show(event, `Year: ${d.year}`, `Observed: +${d.val.toFixed(1)} cm`);
            })
            .on('mouseleave', () => {
                hoverGuide.attr('opacity', 0);
                hoverDot.attr('opacity', 0);
                lastDot.attr('opacity', 1); lastText.attr('opacity', 1);
                Utils.tooltip.hide();
            });

        const breakX = (gap.x0 + gap.x1) / 2;
        svg.append('line').attr('x1', breakX).attr('x2', breakX).attr('y1', plotTop).attr('y2', plotBottom)
            .attr('stroke', 'var(--line)').attr('stroke-width', 1.5);

        svg.append('text').attr('x', breakX).attr('y', plotTop - 20).attr('text-anchor', 'middle')
            .style('font-family', 'var(--font-mono)').style('font-size', '10px').style('font-weight', '600')
            .style('letter-spacing', '0.05em')
            .attr('fill', this.inkFaint).text('PROJECTION');

        const yB = d3.scaleLinear().domain([40, 100]).range([plotTop + 200, plotTop]);
        const xB = d3.scalePoint().domain(scenarioKeys).range([panelB.x0 + 20, panelB.x1 - 20]).padding(0.6);

        const gridB = svg.append('g').attr('class', 'd3-grid')
            .attr('transform', `translate(${panelB.x1},0)`)
            .call(d3.axisRight(yB).tickValues([40, 60, 80, 100]).tickSize(-(panelB.x1 - panelB.x0)));
        gridB.select('.domain').remove();
        gridB.selectAll('line')
            .attr('stroke', 'var(--line)')
            .attr('opacity', 0.6);
        gridB.selectAll('text').attr('fill', this.ink).style('font-family', 'var(--font-sans)').style('font-size', '12px').attr('x', 10);

        svg.append('text').attr('x', panelB.x1).attr('y', plotTop - 20).attr('text-anchor', 'end')
            .text('Year 2100 projection, by pathway (cm)').attr('fill', this.ink)
            .style('font-family', 'var(--font-sans)').style('font-size', '12px').style('font-weight', 600);

        const waterLevel = svg.append('rect')
            .attr('x', panelB.x0)
            .attr('width', panelB.x1 - panelB.x0)
            .attr('y', plotBottom)
            .attr('height', 0)
            .attr('fill', 'rgba(10, 108, 144, 0.12)')
            .attr('opacity', 1);

        const scenarioNodes = {};
        scenarioKeys.forEach((key) => {
            const meta = scenarioMeta[key];
            const val = AppData.projections[key][0].val;
            const cx = xB(key), cy = yB(val);
            const g = svg.append('g').attr('class', `scenario-node scenario-${key}`).style('cursor', 'pointer')
                .on('mouseenter', (event) => Utils.tooltip.show(event, `${meta.label} emissions (${meta.code})`, `+${val.toFixed(1)} cm by the year 2100`))
                .on('mousemove', event => Utils.tooltip.move(event))
                .on('mouseleave', () => Utils.tooltip.hide())
                .on('click', () => {
                    const btn = document.querySelector(`.ruler-step[data-filter="${key}"]`);
                    if (btn) btn.click();
                });

        const nameLabel = g.append('text').attr('x', cx).attr('y', cy + 24).attr('text-anchor', 'middle')
                .style('font-family', 'var(--font-sans)').style('font-size', '10.5px').style('font-weight', 600)
                .attr('fill', this.inkSoft).text(meta.label).attr('opacity', 0.65);
            g.append('circle').attr('cx', cx).attr('cy', cy).attr('r', 20).attr('fill', 'transparent');

            scenarioNodes[key] = { g, nameLabel, val, cx, cy };
        });

        const initTarget = scenarioNodes['typical'];
        const initMeta = scenarioMeta['typical'];

        const activeGroup = svg.append('g').attr('class', 'active-projection-group');

        const dragBehavior = d3.drag()
            .on('drag', (event) => {
                let closest = scenarioKeys[0];
                let minDiff = Infinity;
                scenarioKeys.forEach(key => {
                    const diff = Math.abs(event.x - xB(key));
                    if (diff < minDiff) {
                        minDiff = diff;
                        closest = key;
                    }
                });

                if (this.state && this.state.projection && this.state.projection.activeScenario !== closest) {
                    const btn = document.querySelector(`.ruler-step[data-filter="${closest}"]`);
                    if (btn) btn.click();
                }
            });

        activeGroup.call(dragBehavior);

        const activeDot = activeGroup.append('circle').attr('r', 8).attr('fill', 'var(--bg-paper)').attr('stroke-width', 3)
            .attr('cx', initTarget.cx).attr('cy', plotBottom).attr('stroke', initMeta.color);

        const activeValueLabel = activeGroup.append('text').attr('text-anchor', 'middle')
            .style('font-family', 'var(--font-mono)').style('font-weight', 700).style('font-size', '15px')
            .attr('x', initTarget.cx).attr('y', plotBottom - 16)
            .attr('fill', initMeta.color)
            .text('+0.0');

        waterLevel.attr('y', plotBottom).attr('height', 0);

        this.state.projection = {
            svg, xA, yA, xB, yB, panelA, panelB, gap, lastObserved, breakX,
            scenarioNodes, scenarioMeta, waterLevel, plotBottom, activeDot, activeValueLabel, activeScenario: 'typical'
        };
    },

    updateProjection(scenarioKey) {
        if (!this.state.projection) return;
        const state = this.state.projection;
        const target = state.scenarioNodes[scenarioKey];
        const meta = state.scenarioMeta[scenarioKey];
        if (!target) return;

        const dur = this.dur(1000);

        state.activeDot.transition().duration(dur).ease(d3.easeCubicOut)
            .attr('cx', target.cx)
            .attr('cy', target.cy)
            .attr('stroke', meta.color);

        state.activeValueLabel.transition().duration(dur).ease(d3.easeCubicOut)
            .attr('x', target.cx)
            .attr('y', target.cy - 16)
            .attr('fill', meta.color)
            .tween('text', function() {
                const i = d3.interpolateNumber(
                    parseFloat(this.textContent.replace(/[^0-9.]/g, '')) || 0,
                    target.val
                );
                return function(t) {
                    this.textContent = `+${i(t).toFixed(1)}`;
                };
            });

        const colorScale = d3.color(meta.color);
        colorScale.opacity = 0.12;

        state.waterLevel.transition().duration(dur).ease(d3.easeCubicOut)
            .attr('y', target.cy)
            .attr('height', Math.max(0, state.plotBottom - target.cy))
            .attr('fill', colorScale);

        state.activeScenario = scenarioKey;
    },

    initFunding() {
        const readinessContainer = Utils.select('#funding-readiness-canvas');
        const totalContainer = Utils.select('#funding-total-canvas');
        if (!readinessContainer || !totalContainer) return;

        const srTable = readinessContainer.querySelector('.sr-only');
        readinessContainer.innerHTML = '';
        if (srTable) readinessContainer.appendChild(srTable);
        totalContainer.innerHTML = '';

        const data = [...AppData.funding].sort((a, b) => b.total - a.total);

        const buildPanel = (container, valueKey, color) => {
            const width = 480, height = data.length * 34 + 40;
            const margin = { top: 6, right: 92, bottom: 26, left: 118 };
            const maxVal = d3.max(data, d => d[valueKey]) * 1.12;

            const svg = d3.select(container).append('svg')
                .attr('viewBox', `0 0 ${width} ${height}`)
                .attr('preserveAspectRatio', 'xMidYMid meet');

            const x = d3.scaleLinear().domain([0, maxVal]).range([margin.left, width - margin.right]);
            const y = d3.scaleBand().domain(data.map(d => d.country)).range([margin.top, height - margin.bottom]).padding(0.32);

            const xAxisGroup = svg.append('g').attr('class', 'd3-grid')
                .attr('transform', `translate(0, ${height - margin.bottom})`)
                .call(d3.axisBottom(x).ticks(4).tickSize(-(height - margin.top - margin.bottom)).tickFormat(d => `$${d3.format('.2s')(d)}`));
            xAxisGroup.select('.domain').remove();
            xAxisGroup.selectAll('line').attr('stroke', '#e2e8f0');
            xAxisGroup.selectAll('text').attr('fill', this.inkSoft).style('font-family', 'var(--font-mono)').style('font-size', '9px').attr('dy', '0.8em');

            const yAxisGroup = svg.append('g').attr('class', 'd3-axis')
                .attr('transform', `translate(${margin.left}, 0)`)
                .call(d3.axisLeft(y).tickSize(0));
            yAxisGroup.select('.domain').remove();
            yAxisGroup.selectAll('text').attr('fill', this.ink).style('font-family', 'var(--font-sans)').style('font-size', '10px').style('font-weight', '600').attr('dx', '-6px');

            const rows = svg.selectAll('.funding-bar-row')
                .data(data, d => d.country).enter().append('g')
                .attr('class', 'funding-bar-row')
                .style('cursor', 'pointer')
                .on('mouseenter', (event, d) => {
                    Utils.tooltip.show(event, d.country, `Entity: ${d.entity}`, `Partner: ${d.partner}`, `Status: ${d.status || 'Active'}`);
                })
                .on('mousemove', event => Utils.tooltip.move(event))
                .on('mouseleave', () => Utils.tooltip.hide())
                .on('click', (event, d) => Charts.highlightFundingCountry(d.country));

            rows.append('rect')
                .attr('class', 'funding-hit-area')
                .attr('x', margin.left)
                .attr('y', d => y(d.country))
                .attr('width', width - margin.left - margin.right)
                .attr('height', y.bandwidth())
                .attr('fill', 'transparent');

            rows.append('rect')
                .attr('class', 'funding-bar')
                .attr('x', margin.left)
                .attr('y', d => y(d.country))
                .attr('height', y.bandwidth())
                .attr('width', 0)
                .attr('fill', color);

            rows.append('text')
                .attr('class', 'funding-bar-label')
                .attr('x', margin.left + 6)
                .attr('y', d => y(d.country) + y.bandwidth() / 2)
                .attr('dy', '0.35em')
                .text(d => `$${d3.format(',')(d[valueKey])}`)
                .style('font-family', 'var(--font-mono)')
                .style('font-size', '10px')
                .attr('fill', this.inkSoft)
                .style('opacity', 0);

            return { svg, rows, x, y, margin, width, height };
        };

        const readinessPanel = buildPanel(readinessContainer, 'readiness', this.gold);
        const totalPanel = buildPanel(totalContainer, 'total', this.teal);

        this.state.funding = { readinessPanel, totalPanel, data, filter: 'all' };
    },

    updateFunding() {
        if (!this.state.funding || this.state.funding.animated) return;
        this.state.funding.animated = true;
        const { readinessPanel, totalPanel } = this.state.funding;
        const dur = this.dur(900);

        [[readinessPanel, 'readiness'], [totalPanel, 'total']].forEach(([panel, key]) => {
            panel.rows.select('.funding-bar')
                .transition().duration(dur).ease(d3.easeCubicOut)
                .attr('width', d => Math.max(0, panel.x(d[key]) - panel.margin.left));

            panel.rows.select('.funding-bar-label')
                .transition().delay(dur - 150).duration(350)
                .style('opacity', 1)
                .attr('x', d => panel.x(d[key]) + 8);
        });
    },

    applyFundingFilter(filterKey) {
        if (!this.state.funding) return;
        this.state.funding.filter = filterKey;
        const matches = d => {
            if (filterKey === 'approved') return d.phase === 'Investment';
            if (filterKey === 'pending') return d.phase !== 'Investment';
            return true;
        };
        [this.state.funding.readinessPanel, this.state.funding.totalPanel].forEach(panel => {
            panel.rows.transition().duration(350)
                .style('opacity', d => matches(d) ? 1 : 0.1)
                .style('pointer-events', d => matches(d) ? 'auto' : 'none');
        });
    },

    highlightFundingCountry(country) {
        if (!this.state.funding) return;
        const { readinessPanel, totalPanel, data } = this.state.funding;
        const d = data.find(row => row.country === country);
        if (!d) return;

        [readinessPanel, totalPanel].forEach((panel, i) => {
            const key = i === 0 ? 'readiness' : 'total';
            panel.rows.transition().duration(250).style('opacity', row => row.country === country ? 1 : 0.25);

            const target = panel.rows.filter(row => row.country === country);
            if (target.empty()) return;
            target.raise();

            const cy = parseFloat(target.select('.funding-bar').attr('y')) + panel.y.bandwidth() / 2;
            const cx = panel.x(d[key]);

            panel.svg.selectAll('.funding-pulse').remove();
            panel.svg.append('circle')
                .attr('class', 'funding-pulse')
                .attr('cx', cx).attr('cy', cy).attr('r', 4)
                .attr('fill', 'none').attr('stroke', this.ink).attr('stroke-width', 2)
                .attr('opacity', 0.85)
                .transition().duration(900).ease(d3.easeCubicOut)
                .attr('r', 22).attr('opacity', 0)
                .remove();
        });

        const spotlight = Utils.select('#funding-spotlight');
        if (spotlight) {
            spotlight.classList.add('is-visible');
            spotlight.innerHTML = '';
            spotlight.appendChild(document.createTextNode(`${d.country} Readiness `));
            const readinessSpan = document.createElement('span');
            spotlight.appendChild(readinessSpan);
            spotlight.appendChild(document.createTextNode(' · Total '));
            const totalSpan = document.createElement('span');
            spotlight.appendChild(totalSpan);

            const dur = this.dur(900);
            const fmt = d3.format('$,.0f');
            [[readinessSpan, d.readiness], [totalSpan, d.total]].forEach(([el, target]) => {
                if (dur === 0) { el.textContent = fmt(target); return; }
                d3.select(el).transition().duration(dur).ease(d3.easeCubicOut)
                    .tween('text', function () {
                        const i = d3.interpolateNumber(0, target);
                        return function (t) { this.textContent = fmt(i(t)); };
                    });
            });
        }
    }
};

const heroMotion = { current: 0, target: 0, raf: null };
let radarNodes = [];

function syncDynamicStats() {
    const countEl = Utils.select('#dynamic-soff-text');
    const namesEl = Utils.select('#dynamic-soff-names');
    if (!AppData.funding) return;
    const approved = AppData.funding.filter(d => d.phase === 'Investment');
    if (countEl) countEl.textContent = `${approved.length} approved`;
    if (namesEl) {
        namesEl.innerHTML = '';
        approved.forEach((d, i) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'funding-name-link';
            btn.dataset.country = d.country;
            btn.textContent = d.country;
            namesEl.appendChild(btn);
            if (i < approved.length - 1) namesEl.appendChild(document.createTextNode(', '));
        });
    }
}

function renderAccessibleTables() {
    const addRow = (tbody, cells) => {
        if (!tbody) return;
        const tr = document.createElement('tr');
        cells.forEach(text => {
            const td = document.createElement('td');
            td.textContent = text;
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    };

    const complianceBody = Utils.select('#sr-table-compliance');
    if (complianceBody && AppData.compliance) {
        AppData.compliance.forEach(d => {
            addRow(complianceBody, [d.category, `${d.value}%`, `${d.target}%`]);
        });
    }

    const floodingBody = Utils.select('#sr-table-flooding');
    if (floodingBody && AppData.historicalFlooding) {
        AppData.historicalFlooding.forEach(d => {
            addRow(floodingBody, [d.year, d.days]);
        });
    }

    const projectionBody = Utils.select('#sr-table-projection');
    if (projectionBody && AppData.historicalSeaLevel && AppData.projections) {
        const series = AppData.historicalSeaLevel;
        const first = series[0];
        const last = series[series.length - 1];
        const fmtCm = (v) => `${v >= 0 ? '+' : ''}${v.toFixed(1)} cm`;
        if (first) addRow(projectionBody, [`Observed, ${first.year}`, fmtCm(first.val)]);
        if (last) addRow(projectionBody, [`Observed, ${last.year} (latest)`, fmtCm(last.val)]);
        const pathwayLabels = { lower: 'RCP2.6 (Lower)', typical: 'RCP4.5 (Typical)', higher: 'RCP8.5 (High Emissions)' };
        ['lower', 'typical', 'higher'].forEach(key => {
            const entry = AppData.projections[key] && AppData.projections[key][0];
            if (entry) addRow(projectionBody, [`Year ${entry.year}, ${pathwayLabels[key]}`, fmtCm(entry.val)]);
        });
    }

    const exposureBody = Utils.select('#sr-table-exposure');
    const exposureLoss = Utils.select('#sr-table-exposure-loss');
    if (exposureBody && AppData.exposure) {
        const country = 'Vanuatu';
        const rows = AppData.exposure[country] || [];
        rows.forEach(d => {
            const val = (d.affected === null || d.affected === undefined) ? 'Data unavailable' : Utils.formatNumber(d.affected, 0);
            addRow(exposureBody, [d.year, val]);
        });
        if (exposureLoss && AppData.exposureAvgAnnualLoss) {
            const lossEntry = AppData.exposureAvgAnnualLoss.find(d => d.country === country);
            if (lossEntry) {
                exposureLoss.textContent = `${country}'s average annual economic loss to disasters: US$${Utils.formatNumber(lossEntry.usd, 0)} (${lossEntry.year} reference year, Pacific Data Hub SDG 11.5.2).`;
            }
        }
    }

    const fundingBody = Utils.select('#sr-table-funding');
    if (fundingBody && AppData.funding) {
        AppData.funding.forEach(d => {
            addRow(fundingBody, [
                d.country,
                d.phase,
                d.entity,
                d.partner,
                d.status || 'Pending',
                `$${Utils.formatNumber(d.readiness, 0)}`,
                `$${Utils.formatNumber(d.investment, 0)}`,
                `$${Utils.formatNumber(d.total, 0)}`
            ]);
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    calculateNavTrigger();
    Utils.wireImageFallbacks();
    syncDynamicStats();
    renderAccessibleTables();
    const chartInits = [
        () => Charts.initCompliance(),
        () => Charts.initMeteo(),
        () => Charts.initExposure(),
        () => Charts.initFlooding(),
        () => Charts.initProjection(),
        () => Charts.initFunding(),
        () => Charts.initRadarGrid('#radar-grid-lines'),
        () => Charts.initRadarNodes('#hero-radar-nodes')
    ];
    const renderCharts = () => {
        chartInits.forEach((init) => {
            try {
                init();
            } catch (err) {
                console.error('Chart init failed:', err);
            }
        });
        radarNodes = Utils.selectAll('#hero-radar-nodes circle');
        Utils.selectAll('.chart-canvas').forEach(c => {
            if (c.dataset.hasAnimated === 'true') {
                try {
                    triggerChartUpdate(c);
                } catch (err) {
                    console.error('Chart update failed:', err);
                }
            }
        });
    };
    renderCharts();
    let resizeTimer;
    window.addEventListener('resize', () => {
        calculateNavTrigger();
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(renderCharts, 250);
    });
    initScrollytellingObserver();
    initNavObserver();
    initRevealObserver();
    initToastObserver();
    initUIElements();

    document.addEventListener('touchstart', (e) => {
        if (Utils.tooltip.visible && !e.target.closest('svg')) {
            Utils.tooltip.hide();
        }
    }, { passive: true });
    window.addEventListener('scroll', Utils.onRaf(() => {
        if (Utils.tooltip.visible) Utils.tooltip.hide();
    }), { passive: true });
    window.addEventListener('scroll', Utils.onRaf(() => {
        updateProgressBar();
        updateHeroTarget();
        updateNavVisibility();
    }));
    updateProgressBar();
    updateHeroTarget();
    updateNavVisibility();
    startHeroLoop();
});

function updateProgressBar() {
    const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = height > 0 ? (winScroll / height) * 100 : 0;
    const progressBar = Utils.select('#reading-progress');
    if (progressBar) {
        progressBar.style.width = `${scrolled}%`;
        progressBar.parentElement.setAttribute('aria-valuenow', Math.round(scrolled));
    }
}

function updateHeroTarget() {
    const heroSection = Utils.select('#kinetic-hero');
    if (!heroSection) return;
    heroMotion.target = Utils.getScrollFraction(heroSection);
}

function startHeroLoop() {
    if (!Utils.select('#kinetic-hero')) return;
    const reduced = Utils.prefersReducedMotion();
    const tick = () => {
        heroMotion.current = reduced ? heroMotion.target : Utils.lerp(heroMotion.current, heroMotion.target, 0.12);
        renderHero(heroMotion.current);
        updateRadar(heroMotion.current);
        heroMotion.raf = window.requestAnimationFrame(tick);
    };
    tick();
}

function renderHero(progress) {
    const f1 = Utils.select('#hero-frame-1'), f2 = Utils.select('#hero-frame-2'), f3 = Utils.select('#hero-frame-3'), f4 = Utils.select('#hero-frame-4');
    if (!f1 || !f2 || !f3 || !f4) return;
    const reduced = Utils.prefersReducedMotion();

    if (progress < 0.25) {
        const localP = progress / 0.25;
        f1.style.opacity = 1 - localP; f1.style.transform = reduced ? 'none' : `scale(${1 + localP * 0.1})`;
        f2.style.opacity = 0; f3.style.opacity = 0; f4.style.opacity = 0;
    } else if (progress < 0.50) {
        const localP = (progress - 0.25) / 0.25;
        f1.style.opacity = 0; f2.style.opacity = Math.sin(localP * Math.PI);
        f2.style.transform = reduced ? 'none' : `translateY(${(1 - localP) * 20}px)`;
        f3.style.opacity = 0; f4.style.opacity = 0;
    } else if (progress < 0.75) {
        const localP = (progress - 0.50) / 0.25;
        f1.style.opacity = 0; f2.style.opacity = 0;
        f3.style.opacity = Math.sin(localP * Math.PI);
        f3.style.transform = reduced ? 'none' : `translateY(${(1 - localP) * 20}px)`;
        f4.style.opacity = 0;
    } else {
        const localP = (progress - 0.75) / 0.25;
        f1.style.opacity = 0; f2.style.opacity = 0; f3.style.opacity = 0;
        f4.style.opacity = Math.min(1, localP * 2);
        f4.style.transform = reduced ? 'none' : `translateY(${(1 - localP) * 20}px)`;
    }
    updateHeroImages(progress);
}

function updateHeroImages(progress) {
    const i1 = Utils.select('#hero-image-1'), i2 = Utils.select('#hero-image-2'), i3 = Utils.select('#hero-image-3');
    if (!i1 || !i2 || !i3) return;
    if (progress < 0.50) {
        i1.style.opacity = 1; i2.style.opacity = 0; i3.style.opacity = 0;
    } else if (progress < 0.75) {
        i1.style.opacity = 0; i2.style.opacity = 1; i3.style.opacity = 0;
    } else {
        i1.style.opacity = 0; i2.style.opacity = 0; i3.style.opacity = 1;
    }
}

function updateRadar(progress) {
    const readout = Utils.select('#radar-readout-value');
    if (readout) readout.textContent = `${Utils.padPercent(Utils.lerp(0, AppData.heroCoveragePct, progress), 1, 2)}%`;
    radarNodes.forEach(node => {
        const threshold = parseFloat(node.getAttribute('data-threshold'));
        const isActive = node.getAttribute('data-active') === 'true';

        if (progress > threshold && progress < threshold + 0.3) {
            node.setAttribute('class', 'active');
            node.style.fill = isActive ? 'var(--accent-ocean-soft)' : 'var(--accent-ocean-dark)';
        } else {
            node.setAttribute('class', 'inactive');
            node.style.fill = '';
        }
    });
}

function initScrollytellingObserver() {
    const canvases = Utils.selectAll('.chart-canvas');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const canvas = entry.target;
            if (canvas.dataset.hasAnimated) return;
            canvas.dataset.hasAnimated = 'true';
            triggerChartUpdate(canvas);
        });
    }, { root: null, rootMargin: '0px 0px -20% 0px', threshold: 0 });
    canvases.forEach((canvas) => observer.observe(canvas));
}

function initNavObserver() {
    const navLinks = Utils.selectAll('.nav-links > a[href^="#"]:not([href="#"])');
    const targets = navLinks.map((link) => document.querySelector(link.getAttribute('href'))).filter(Boolean);
    if (!targets.length) return;
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            const id = `#${entry.target.id}`;
            const link = navLinks.find((a) => a.getAttribute('href') === id);
            if (!link) return;
            if (entry.isIntersecting) {
                navLinks.forEach((a) => {
                    a.removeAttribute('aria-current'); a.classList.remove('nav-link-primary'); a.classList.add('nav-link-secondary');
                });
                link.setAttribute('aria-current', 'true'); link.classList.remove('nav-link-secondary'); link.classList.add('nav-link-primary');
            }
        });
    }, { root: null, rootMargin: '-10% 0px -80% 0px', threshold: 0 });
    targets.forEach((target) => observer.observe(target));
}

function initRevealObserver() {
    const targets = Utils.selectAll('.reveal');
    if (!targets.length) return;
    if (Utils.prefersReducedMotion()) {
        targets.forEach((target) => target.classList.add('is-visible'));
        return;
    }
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
        });
    }, { root: null, rootMargin: '0px 0px -10% 0px', threshold: 0.15 });
    targets.forEach((target) => observer.observe(target));
}

function initToastObserver() {
    const toast = Utils.select('#mobile-toast');
    const firstChart = document.getElementById('compliance-canvas');
    if (!toast || !firstChart) return;
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            if (toast.dataset.dismissed !== 'true') {
                toast.classList.add('is-visible');
            }
            observer.disconnect();
        });
    }, { root: null, rootMargin: '0px', threshold: 0.3 });
    observer.observe(firstChart);
}

function triggerChartUpdate(canvas) {
    const scene = canvas.getAttribute('data-scene');
    if (scene === 'compliance') Charts.updateCompliance();
    if (scene === 'meteo') Charts.updateMeteo();
    if (scene === 'exposure') Charts.updateExposure();
    if (scene === 'flooding') Charts.updateFlooding();
    if (scene === 'projection') Charts.updateProjection('typical');
    if (scene === 'funding') Charts.updateFunding();
}

let navTriggerPoint = 0;
function calculateNavTrigger() {
    navTriggerPoint = window.innerHeight * 0.75;
}

function updateNavVisibility() {
    const nav = Utils.select('.editorial-nav');
    const langSwitch = Utils.select('.global-lang-switch');
    if (!nav) return;
    const scrollY = window.scrollY || document.documentElement.scrollTop;
    if (scrollY > navTriggerPoint) {
        nav.classList.add('is-visible');
        if (langSwitch) langSwitch.classList.add('in-nav-mode');
    } else {
        nav.classList.remove('is-visible');
        if (langSwitch) langSwitch.classList.remove('in-nav-mode');
    }
}

function initUIElements() {
    document.addEventListener('click', (e) => {
        const link = e.target.closest('.funding-name-link');
        if (link) Charts.highlightFundingCountry(link.dataset.country);
    });

    const toast = Utils.select('#mobile-toast');
    const toastClose = Utils.select('#toast-close');
    if (toast && toastClose) {
        toastClose.addEventListener('click', () => {
            toast.classList.remove('is-visible');
            toast.dataset.dismissed = 'true';
        });
    }

    const menuToggle = Utils.select('.mobile-menu-toggle');
    const navLinks = Utils.select('.nav-links');
    const closeMobileMenu = ({ restoreFocus = false } = {}) => {
        navLinks.classList.remove('nav-open');
        document.body.style.overflow = '';
        if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
        if (restoreFocus && menuToggle) menuToggle.focus();
    };
    if (menuToggle && navLinks) {
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.addEventListener('click', () => {
            const isOpen = navLinks.classList.toggle('nav-open');
            document.body.style.overflow = isOpen ? 'hidden' : '';
            menuToggle.setAttribute('aria-expanded', String(isOpen));
            if (isOpen) {
                const firstLink = navLinks.querySelector('a');
                if (firstLink) firstLink.focus();
            }
        });
        navLinks.querySelectorAll('a').forEach((link) => {
            link.addEventListener('click', () => closeMobileMenu());
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && navLinks.classList.contains('nav-open')) {
                closeMobileMenu({ restoreFocus: true });
            }
        });
    }

    const downloadableDatasets = {
        compliance: AppData.compliance,
        meteo: AppData.meteoStations,
        exposure: { affected: AppData.exposure, avgAnnualLoss: AppData.exposureAvgAnnualLoss },
        funding: AppData.funding,
        projections: AppData.projections
    };
    Utils.selectAll('[data-download]').forEach(btn => {
        btn.addEventListener('click', () => {
            const key = btn.getAttribute('data-download');
            const data = downloadableDatasets[key];
            if (data) Utils.downloadJSON(`${key}_data.json`, data);
        });
    });

    Utils.selectAll('.chart-filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetBtn = e.target.closest('.chart-filter-btn');
            if (!targetBtn) return;
            Utils.selectAll('.chart-filter-btn').forEach(b => b.classList.remove('active'));
            targetBtn.classList.add('active');
            Charts.updateExposure(targetBtn.getAttribute('data-country'), null);
        });
    });

    Utils.selectAll('.funding-filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetBtn = e.target.closest('.funding-filter-btn');
            if (!targetBtn) return;
            Utils.selectAll('.funding-filter-btn').forEach(b => b.classList.remove('active'));
            targetBtn.classList.add('active');
            Charts.applyFundingFilter(targetBtn.getAttribute('data-funding-filter'));
        });
    });

    Utils.selectAll('.metric-toggle-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetBtn = e.target.closest('.metric-toggle-btn');
            if (!targetBtn) return;
            const targetChart = targetBtn.getAttribute('data-target');
            const parent = targetBtn.closest('.metric-toggles');
            if (parent) {
                parent.querySelectorAll('.metric-toggle-btn').forEach(b => b.classList.remove('active'));
                targetBtn.classList.add('active');
            }
            if (targetChart === 'compliance') {
                Charts.updateCompliance(targetBtn.getAttribute('data-filter'));
            } else {
                Charts.updateExposure(null, targetBtn.getAttribute('data-metric'));
            }
        });
    });

    const dynamicText = Utils.select('#dynamic-slr-text');
    Utils.selectAll('.ruler-step').forEach((btn) => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const targetBtn = e.target.closest('.ruler-step');
            if (!targetBtn) return;
            Utils.selectAll('.ruler-step').forEach(b => b.classList.remove('active'));
            targetBtn.classList.add('active');

            const scenario = targetBtn.getAttribute('data-filter');
            Charts.updateProjection(scenario);

            if(dynamicText) {
                const targetVal = AppData.projections[scenario][0].val;
                const currentVal = parseFloat(dynamicText.textContent.replace(/[^0-9.]/g, '')) || 0;

                const textColors = { lower: 'var(--accent-success)', typical: 'var(--accent-ocean)', higher: 'var(--accent-danger)' };
                dynamicText.style.color = textColors[scenario] || 'var(--accent-ocean)';

                Charts.countText(dynamicText, currentVal, targetVal, {
                    prefix: '+',
                    suffix: ' cm',
                    decimals: 1,
                    duration: 1000
                });
            }
        });
    });

    const meteoSelect = Utils.select('#meteo-country-select');
    const meteoCount = Utils.select('#meteo-dynamic-count');
    if (meteoSelect && meteoCount && AppData.meteoStations) {
        meteoSelect.addEventListener('change', (e) => {
            const country = e.target.value;
            const stationsArray = AppData.meteoStations[country];
            let currentCount = 0;

            if (stationsArray && stationsArray.length > 0) {
                currentCount = stationsArray[stationsArray.length - 1].stations;
            }

            const previousCount = parseInt(meteoCount.textContent) || 0;

            Charts.countText(meteoCount, previousCount, currentCount, {
                decimals: 0,
                duration: 600
            });
        });
    }

    const rulerContainer = Utils.select('.projection-ruler');
    if (rulerContainer) {
        let isDragging = false;
        rulerContainer.style.touchAction = 'none';

        const scrubRuler = (e) => {
            if (!isDragging) return;
            e.preventDefault();
            const rect = rulerContainer.getBoundingClientRect();
            const clientX = e.clientX ?? (e.touches && e.touches[0] ? e.touches[0].clientX : null);
            if (clientX === null) return;

            const ratio = (clientX - rect.left) / rect.width;

            let targetScenario = 'typical';
            if (ratio < 0.33) targetScenario = 'lower';
            else if (ratio > 0.67) targetScenario = 'higher';

            const targetBtn = rulerContainer.querySelector(`.ruler-step[data-filter="${targetScenario}"]`);
            if (targetBtn && !targetBtn.classList.contains('active')) {
                targetBtn.click();
            }
        };

        rulerContainer.addEventListener('pointerdown', (e) => {
            isDragging = true;
            rulerContainer.setPointerCapture(e.pointerId);
            scrubRuler(e);
        });
        rulerContainer.addEventListener('pointermove', scrubRuler);
        rulerContainer.addEventListener('pointerup', (e) => {
            isDragging = false;
            rulerContainer.releasePointerCapture(e.pointerId);
        });
        rulerContainer.addEventListener('pointercancel', () => {
            isDragging = false;
        });
    }

    Utils.selectAll('.flip-card').forEach(card => {
        const feedback = card.querySelector('.quiz-feedback');
        const quizButtons = Utils.selectAll('.quiz-btn', card);
        let answered = false;

        const triggerChartUpdate = () => {
            const titleEl = card.querySelector('.card-title');
            if (!titleEl) return;

            const countryTitle = titleEl.textContent.trim().toUpperCase();

            const filterBtns = Array.from(document.querySelectorAll('.chart-filter-btn'));
            const matchingBtn = filterBtns.find(b => {
                const btnCountry = (b.getAttribute('data-country') || '').toUpperCase();
                return btnCountry === countryTitle || btnCountry.includes(countryTitle.replace('.', ''));
            });

            if (matchingBtn) {
                filterBtns.forEach(b => b.classList.remove('active'));
                matchingBtn.classList.add('active');
                Charts.updateExposure(matchingBtn.getAttribute('data-country'), null);
            }
        };

        const executeFlip = (isFlipped) => {
            card.classList.toggle('flipped', isFlipped);
            card.setAttribute('aria-pressed', isFlipped);
            if (isFlipped) triggerChartUpdate();
        };

        const showResult = (state, label) => {
            card.classList.remove('result-correct', 'result-wrong', 'result-skipped');
            card.classList.add(state);
            if (feedback) feedback.textContent = label;
        };

        const answerWith = (btn) => {
            if (answered) return;
            answered = true;

            const isCorrect = (btn.getAttribute('data-correct') || '').toLowerCase() === 'true';

            if (isCorrect) {
                showResult('result-correct', 'Correct');
                executeFlip(true);
            } else {
                showResult('result-wrong', 'Incorrect');
                card.classList.add('shake');
                setTimeout(() => {
                    card.classList.remove('shake');
                    executeFlip(true);
                }, 400);
            }
        };

        quizButtons.forEach(btn => {
            btn.addEventListener('pointerdown', (e) => {
                e.stopPropagation();
            });
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                answerWith(btn);
            });
        });

        card.addEventListener('click', (e) => {
            if (card.classList.contains('shake')) return;

            const targetNode = e.target.nodeType === Node.TEXT_NODE ? e.target.parentNode : e.target;
            if (targetNode.closest('.quiz-options') || targetNode.closest('.quiz-btn')) return;

            if (card.classList.contains('flipped')) {
                answered = false;
                card.classList.remove('result-correct', 'result-wrong', 'result-skipped');
                executeFlip(false);
                return;
            }

            if (answered) return;

            answered = true;
            showResult('result-skipped', 'Skipped');
            executeFlip(true);
        });

        card.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (e.target.classList.contains('quiz-btn')) {
                    e.target.click();
                } else {
                    card.click();
                }
            }
        });
    });

    const tabs = Utils.selectAll('.citation-tab');
    const citeText = Utils.select('#cite-text');
    const citations = {
        'APA': 'Dissanayake, C. (2026). The Pacific Blind Spot: Measuring the climate monitoring gap [Data Story]. Updated August 30, 2026. Retrieved from https://chaturadissanayake.com',
        'Journalistic': 'Chatura Dissanayake. (2026). The Pacific Blind Spot: Measuring the climate monitoring gap. Retrieved from https://chaturadissanayake.com',
        'BibTeX': '@article{dissanayake-pacific-blind-spot-2026,\n  title  = {The Pacific Blind Spot: Measuring the climate monitoring gap},\n  author = {Dissanayake, Chatura},\n  year   = {2026},\n  journal = {Data Story},\n  url    = {https://chaturadissanayake.com}\n}'
    };

    if (citeText) citeText.textContent = citations['APA'];

    tabs.forEach(tab => {
        const selectTab = () => {
            tabs.forEach(t => {
                t.classList.remove('active');
                t.setAttribute('aria-selected', 'false');
                t.setAttribute('tabindex', '-1');
            });
            tab.classList.add('active');
            tab.setAttribute('aria-selected', 'true');
            tab.setAttribute('tabindex', '0');

            const key = tab.getAttribute('data-cite');
            if (citeText && citations[key]) {
                citeText.style.opacity = 0;
                setTimeout(() => {
                    citeText.textContent = citations[key];
                    citeText.style.opacity = 1;
                }, 150);
            }
        };
        tab.addEventListener('click', selectTab);
        tab.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectTab(); } });
    });

    const copyCiteBtn = Utils.select('.copy-cite-btn');
    if (copyCiteBtn && citeText) {
        copyCiteBtn.addEventListener('click', () => {
            const originalText = copyCiteBtn.textContent;
            const showResult = (label) => {
                copyCiteBtn.textContent = label;
                copyCiteBtn.disabled = true;
                setTimeout(() => {
                    copyCiteBtn.textContent = originalText;
                    copyCiteBtn.disabled = false;
                }, 2000);
            };
            const fallbackCopy = () => {
                const textarea = document.createElement('textarea');
                textarea.value = citeText.textContent;
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                document.body.appendChild(textarea);
                textarea.select();
                let ok = false;
                try {
                    ok = document.execCommand('copy');
                } catch (err) {
                    ok = false;
                }
                document.body.removeChild(textarea);
                showResult(ok ? 'COPIED!' : 'COPY FAILED');
            };
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(citeText.textContent)
                    .then(() => showResult('COPIED!'))
                    .catch(fallbackCopy);
            } else {
                fallbackCopy();
            }
        });
    }
}