const Charts = {
    state: {},
    ink: '#0f172a',
    inkSoft: '#475569',
    gridLine: '#e2e8f0',
    coral: '#b26075',
    teal: '#7eb2a8',
    gold: '#d4af37',
    dur(ms) { return Utils.prefersReducedMotion() ? 0 : ms; },

    // Digit-by-digit counting helper (counts up or down depending on from/to).
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
    
    initCompliance() {
        const container = Utils.select('#compliance-canvas');
        if (!container) return;
        container.innerHTML = '';
        const width = 960, height = 280; 
        const margin = { top: 75, right: 60, bottom: 20, left: 200 }; 
        const svg = d3.select(container).append('svg')
            .attr('viewBox', `0 0 ${width} ${height}`)
            .attr('preserveAspectRatio', 'xMidYMid meet');
            
        const x = d3.scaleLinear().domain([0, 100]).range([margin.left, width - margin.right]);
        // UX FIX: Reduced padding from 0.2 to 0.12 to make bars thicker
        const y = d3.scaleBand().domain(AppData.compliance.map(d => d.category)).range([margin.top, height - margin.bottom]).padding(0.12); 
        
        const xAxis = svg.append('g').attr('class', 'd3-axis')
            .attr('transform', `translate(0,${margin.top - 15})`)
            .call(d3.axisTop(x).tickSize(- (height - margin.top - margin.bottom)).ticks(5).tickFormat(d => d + '%'));
            
        xAxis.select('.domain').remove();
        xAxis.selectAll('text').attr('fill', 'rgba(255,255,255,0.5)').style('font-family', 'var(--font-mono)');
        xAxis.selectAll('line').attr('stroke', 'rgba(255,255,255,0.1)');
            
        const yAxis = svg.append('g').attr('class', 'd3-axis')
            .attr('transform', `translate(${margin.left},0)`)
            .call(d3.axisLeft(y).tickSize(0));
            
        yAxis.select('.domain').remove();
        yAxis.selectAll('text').attr('fill', '#f0f4f4').style('font-size', '14px').style('font-weight', '600').attr('dx', '-1.5em'); 
            
        const row = svg.selectAll('.row')
            .data(AppData.compliance).enter().append('g').attr('class', 'row')
            .style('cursor', 'pointer')
            .on('mouseenter', (event, d) => Utils.tooltip.show(event, d.category, `Active: ${d.value}%`, `Critical Gap: ${100 - d.value}%`))
            .on('mousemove', event => Utils.tooltip.move(event))
            .on('mouseleave', () => Utils.tooltip.hide());
            
        // UX FIX: Use dynamic bandwidth for thick, proportional bars
        row.append('rect')
            .attr('class', 'deficit-bar')
            .attr('x', x(0))
            .attr('y', d => y(d.category))
            .attr('height', y.bandwidth())
            .attr('width', x(100) - x(0))
            .attr('fill', 'rgba(255,255,255,0.06)')
            .attr('rx', 2);
            
        row.append('rect')
            .attr('class', 'active-bar')
            .attr('x', x(0))
            .attr('y', d => y(d.category))
            .attr('height', y.bandwidth())
            .attr('width', 0)
            .attr('rx', 2)
            .attr('fill', this.coral);
            
        row.append('text')
            .attr('class', 'value-text')
            .attr('y', d => y(d.category) + y.bandwidth() / 2)
            .attr('dy', '0.35em')
            .text(d => d.label)
            .style('font-size', '12px').style('font-weight', '700').style('font-family', 'var(--font-mono)')
            .attr('opacity', 0);
            
        // Positioned higher to avoid axis overlap
        const legend = svg.append('g').attr('transform', `translate(${margin.left}, 10)`);
        legend.append('rect').attr('x', 0).attr('y', -5).attr('width', 10).attr('height', 10).attr('rx', 2).attr('fill', this.coral);
        legend.append('text').attr('x', 18).attr('y', 4).text('Active Infrastructure').style('font-size', '11px').attr('fill', 'rgba(255,255,255,0.7)');
        legend.append('rect').attr('x', 160).attr('y', -5).attr('width', 10).attr('height', 10).attr('rx', 2).attr('fill', 'rgba(255,255,255,0.06)');
        legend.append('text').attr('x', 178).attr('y', 4).text('Missing Data Gap').style('font-size', '11px').attr('fill', 'rgba(255,255,255,0.7)');
            
        this.state.compliance = { row, x };
    },
    
    updateCompliance(filterType = null) {
        if (!this.state.compliance) return;
        const { row, x } = this.state.compliance;
        
        row.select('.active-bar').transition().duration(this.dur(1200)).ease(d3.easeCubicOut)
            .attr('width', d => x(d.value) - x(0));
            
        row.select('.value-text').transition().delay(this.dur(1000)).duration(this.dur(500))
            .attr('x', d => {
                const barWidth = x(d.value) - x(0);
                return barWidth > 35 ? x(d.value) - 8 : x(d.value) + 8;
            })
            .attr('text-anchor', d => (x(d.value) - x(0)) > 35 ? 'end' : 'start')
            .attr('fill', '#ffffff') 
            .attr('opacity', 1);

        if (filterType === 'sids') {
            row.transition().duration(this.dur(400)).ease(d3.easeCubicOut)
                .style('opacity', d => (d.group === 'sids' || d.group === 'pacific') ? 1 : 0.15); 
        } else {
            row.transition().duration(this.dur(400)).ease(d3.easeCubicOut).style('opacity', 1);
        }
    },
    
    initExposure() {
        const container = Utils.select('#exposure-canvas');
        if (!container) return;
        container.innerHTML = '';
        const width = 960, height = 400;
        const margin = { top: 40, right: 40, bottom: 40, left: 70 }; 
        const svg = d3.select(container).append('svg')
            .attr('viewBox', `0 0 ${width} ${height}`)
            .attr('preserveAspectRatio', 'xMidYMid meet');
            
        const data = AppData.exposure["Vanuatu"];
        this.state.exposure = { 
            svg, width, height, margin, 
            currentCountry: "Vanuatu", 
            currentMetric: "damage" 
        };
        
        // Restore standard padding for axis spacing
        const x = d3.scaleBand().domain(data.map(d => d.year)).range([margin.left, width - margin.right]).padding(0.4);
        const y = d3.scaleLinear().domain([0, d3.max(data, d => d.damage) * 1.15]).range([height - margin.bottom, margin.top]);
        
        const yAxisGroup = svg.append('g').attr('class', 'd3-grid y-grid')
            .attr('transform', `translate(${margin.left},0)`);
            
        yAxisGroup.call(d3.axisLeft(y).tickSize(-(width - margin.left - margin.right)).ticks(5))
            .call(g => g.select('.domain').remove()) 
            .selectAll('text')
            .attr('fill', this.inkSoft)
            .attr('x', -8)
            .attr('dy', -4) 
            .style('font-family', 'var(--font-mono)')
            .style('font-size', '11px');
            
        svg.append('g').attr('class', 'd3-axis x-axis')
            .attr('transform', `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(x).tickSize(0))
            .call(g => g.select('.domain').remove())
            .selectAll('text').attr('fill', this.inkSoft)
            .style('font-family', 'var(--font-mono)')
            .style('font-size', '12px')
            .attr('dy', '1em');
            
        // UX FIX: Hardcode exact 38px width to match horizontal bar thickness across the dashboard
        const bars = svg.selectAll('.bar').data(data).enter().append('rect')
            .attr('class', 'bar')
            .attr('x', d => x(d.year) + x.bandwidth() / 2 - 19)
            .attr('width', 38)
            .attr('y', height - margin.bottom)
            .attr('height', 0)
            .attr('rx', 2)
            .attr('fill', this.coral)
            .style('cursor', 'pointer')
            .on('mouseenter', (event, d) => Utils.tooltip.show(
                event, 
                `Year: ${d.year}`, 
                `Damage: $${d.damage}M`, 
                `Events: ${d.frequency}`,
                d.affected !== undefined ? `Affected Population: ${Utils.formatNumber(d.affected, 0)}` : ''
            ))
            .on('mousemove', event => Utils.tooltip.move(event))
            .on('mouseleave', () => Utils.tooltip.hide());
            
        this.state.exposure.x = x;
        this.state.exposure.y = y;
        this.state.exposure.bars = bars;
        this.state.exposure.yAxisGroup = yAxisGroup;
    },
    
    updateExposure(country, metric) {
        if (!this.state.exposure) return;
        const state = this.state.exposure;
        
        if (country) state.currentCountry = country;
        if (metric) state.currentMetric = metric;
        
        const data = AppData.exposure[state.currentCountry];
        const isDamage = state.currentMetric === "damage";
        const isAffected = state.currentMetric === "affected";
        
        const getValue = (d) => {
            if (isDamage) return d.damage;
            if (isAffected) return d.affected || 0;
            return d.frequency;
        };

        const maxY = d3.max(data, d => getValue(d));
        state.y.domain([0, Math.max(maxY * 1.15, 1)]); 
        
        state.yAxisGroup.transition().duration(this.dur(800)).ease(d3.easeCubicOut)
            .call(d3.axisLeft(state.y).tickSize(-(state.width - state.margin.left - state.margin.right)).ticks(5))
            .call(g => g.select('.domain').remove());
            
        state.yAxisGroup.selectAll('text')
            .attr('fill', this.inkSoft)
            .attr('x', -8)
            .attr('dy', -4)
            .style('font-family', 'var(--font-mono)')
            .style('font-size', '11px');
            
        state.bars.data(data).transition().duration(this.dur(800)).ease(d3.easeCubicOut)
            .attr('y', d => state.y(getValue(d)))
            .attr('height', d => state.height - state.margin.bottom - state.y(getValue(d)))
            .attr('fill', isDamage ? this.coral : (isAffected ? this.gold : this.teal)); 
            
        state.bars.on('mouseenter', (event, d) => Utils.tooltip.show(
            event, 
            `Year: ${d.year}`, 
            `Damage: $${d.damage}M`, 
            `Events: ${d.frequency}`,
            d.affected ? `Affected Population: ${Utils.formatNumber(d.affected, 0)}` : ''
        ));
    },
    
    initFunding() {
        const container = Utils.select('#funding-canvas');
        if (!container) return;
        container.innerHTML = '';
        const width = 960, height = 450;
        const margin = { top: 55, right: 60, bottom: 40, left: 180 };
        const svg = d3.select(container).append('svg')
            .attr('viewBox', `0 0 ${width} ${height}`)
            .attr('preserveAspectRatio', 'xMidYMid meet');
            
        const data = [...AppData.funding].sort((a,b) => b.amount - a.amount);
        
        const x = d3.scaleLinear().domain([0, 15]).range([margin.left, width - margin.right]);
        // UX FIX: Reduced padding from 0.2 to 0.12 to make bars thicker
        const y = d3.scaleBand().domain(data.map(d => d.country)).range([margin.top, height - margin.bottom]).padding(0.12);
        
        const xAxisGroup = svg.append('g').attr('class', 'd3-grid')
            .attr('transform', `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(x).tickSize(-(height - margin.top - margin.bottom)).ticks(5).tickFormat(d => `$${d}M`));
            
        xAxisGroup.select('.domain').remove();
        xAxisGroup.selectAll('text').attr('fill', this.inkSoft).attr('dy', '1em').style('font-family', 'var(--font-mono)').style('font-size', '11px');
        
        const yAxisGroup = svg.append('g').attr('class', 'd3-axis')
            .attr('transform', `translate(${margin.left},0)`)
            .call(d3.axisLeft(y).tickSize(0));
        yAxisGroup.select('.domain').remove();
        yAxisGroup.selectAll('text').attr('fill', this.ink).style('font-family', 'var(--font-sans)').style('font-size', '13px').style('font-weight', '500');
        
        const getFill = (status) => {
            if (status === 'Approved') return this.teal;
            if (status === 'Gap') return this.coral;
            return this.gold; 
        };
        
        const bars = svg.selectAll('.fund-bar').data(data).enter().append('g').attr('class', 'fund-bar');
        
        // UX FIX: Use dynamic bandwidth for thick, proportional bars
        bars.append('rect')
            .attr('x', margin.left)
            .attr('y', d => y(d.country))
            .attr('height', y.bandwidth())
            .attr('width', 0)
            .attr('rx', 2)
            .attr('fill', d => getFill(d.status))
            .style('cursor', 'pointer')
            .on('mouseenter', (event, d) => Utils.tooltip.show(event, d.country, `Status: ${d.status}`, d.amount > 0 ? `Pipeline: $${d.amount}M` : 'No funding secured'))
            .on('mousemove', event => Utils.tooltip.move(event))
            .on('mouseleave', () => Utils.tooltip.hide());

        // Zero-value marker centered identically
        bars.append('line')
            .attr('class', 'zero-tick')
            .attr('x1', margin.left).attr('x2', margin.left)
            .attr('y1', d => y(d.country))
            .attr('y2', d => y(d.country) + y.bandwidth())
            .attr('stroke', this.coral)
            .attr('stroke-width', 4)
            .attr('stroke-linecap', 'round')
            .attr('opacity', 0)
            .style('pointer-events', 'none');

        const legend = svg.append('g').attr('class', 'chart-legend')
            .attr('transform', `translate(${margin.left}, 18)`);
        let lx = 0;
        AppData.legendFunding.forEach((item) => {
            const g = legend.append('g').attr('transform', `translate(${lx},0)`);
            g.append('rect').attr('x', 0).attr('y', -5).attr('width', 10).attr('height', 10).attr('rx', 2).attr('fill', item.color);
            const label = g.append('text').attr('x', 18).attr('y', 4).text(item.label)
                .style('font-size', '11px').style('font-family', 'var(--font-sans)').attr('fill', this.inkSoft);
            const bboxWidth = label.node().getBBox().width;
            lx += 18 + bboxWidth + 28;
        });
            
        this.state.funding = { svg, bars, x, y, width, margin };
    },
    
    updateFunding(filterType = null) {
        if (!this.state.funding) return;
        const { bars, x, margin } = this.state.funding;
        
        bars.selectAll('rect').transition().duration(this.dur(1000)).ease(d3.easeCubicOut).delay((d,i) => i*50)
            .attr('width', d => Math.max(0, x(d.amount) - margin.left));

        bars.selectAll('.zero-tick').transition().duration(this.dur(500)).delay(this.dur(900))
            .attr('opacity', d => d.amount === 0 ? 1 : 0);

        if (filterType && filterType !== 'all') {
            bars.transition().duration(this.dur(400)).ease(d3.easeCubicOut)
                .style('opacity', d => {
                    const status = d.status.toLowerCase();
                    if (filterType === 'approved' && status === 'approved') return 1;
                    if (filterType === 'gap' && status === 'gap') return 1;
                    if (filterType === 'pending' && (status === 'pending' || status === 'provisional')) return 1;
                    return 0.15;
                });
        } else {
            bars.transition().duration(this.dur(400)).ease(d3.easeCubicOut).style('opacity', 1);        
        }
    },

    initProjection() {
        const container = Utils.select('#projection-canvas');
        if (!container) return;
        container.innerHTML = '';
        const width = 960, height = 450; 
        const margin = { top: 40, right: 100, bottom: 40, left: 100 }; 
        const svg = d3.select(container).append('svg')
            .attr('viewBox', `0 0 ${width} ${height}`)
            .attr('preserveAspectRatio', 'xMidYMid meet');
            
        const data = AppData.projections.typical;
        
        // Use a continuous linear scale for true proportional time gaps (30 years vs 50 years)
        const x = d3.scaleLinear().domain([2020, 2100]).range([margin.left, width - margin.right]);
        const y = d3.scaleLinear().domain([0, 120]).range([height - margin.bottom, margin.top]);
        
        const yAxisGroup = svg.append('g').attr('class', 'd3-grid').attr('transform', `translate(${margin.left},0)`);
        yAxisGroup.call(d3.axisLeft(y).tickValues([0, 30, 60, 90, 120]).tickSize(-(width - margin.left - margin.right)));
        yAxisGroup.select('.domain').remove();
        yAxisGroup.selectAll('line').attr('stroke', '#e2e8f0'); 
        yAxisGroup.selectAll('text').attr('fill', '#475569').style('font-family', 'var(--font-sans)').attr('x', -15).attr('dy', '-0.3em');
        
        svg.append('text').attr('x', margin.left - 15).attr('y', y(120) - 15).text('cm').attr('fill', '#475569').style('font-family', 'var(--font-sans)').style('font-size', '12px');

        const xAxis = svg.append('g').attr('class', 'd3-axis').attr('transform', `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(x).tickValues([2020, 2050, 2100]).tickFormat(d3.format("d")).tickSize(0));
        xAxis.select('.domain').remove();
        xAxis.selectAll('text').attr('fill', '#0f172a').style('font-family', 'var(--font-sans)').style('font-size', '14px').style('font-weight', '600').attr('dy', '1.5em');

        // Draw the filled area
        const area = d3.area()
            .x(d => x(d.year))
            .y0(y(0))
            .y1(d => y(d.val))
            .curve(d3.curveMonotoneX);

        const areaPath = svg.append('path')
            .datum(data)
            .attr('class', 'projection-area')
            .attr('fill', 'rgba(126, 178, 168, 0.2)') // Teal soft
            .attr('d', area);

        // Draw the line
        const line = d3.line()
            .x(d => x(d.year))
            .y(d => y(d.val))
            .curve(d3.curveMonotoneX);

        const linePath = svg.append('path')
            .datum(data)
            .attr('class', 'projection-line')
            .attr('fill', 'none')
            .attr('stroke', '#0f172a')
            .attr('stroke-width', 3)
            .attr('d', line);

        // Draw the data points
        const points = svg.selectAll('.projection-point').data(data).enter().append('circle')
            .attr('class', 'projection-point')
            .attr('cx', d => x(d.year))
            .attr('cy', d => y(d.val))
            .attr('r', 6)
            .attr('fill', '#ffffff')
            .attr('stroke', '#0f172a')
            .attr('stroke-width', 2);

        // Draw the value labels
        const labels = svg.selectAll('.projection-label').data(data).enter().append('text')
            .attr('class', 'projection-label')
            .attr('x', d => x(d.year))
            .attr('y', d => y(d.val) - 20)
            .attr('text-anchor', 'middle')
            .attr('fill', '#0f172a')
            .style('font-family', 'var(--font-mono)')
            .style('font-weight', '600')
            .style('font-size', '13px')
            .text(d => `+${d.val.toFixed(1)}`);

        this.state.projection = { svg, areaPath, linePath, points, labels, x, y, area, line };
    },
    
    updateProjection(scenario) {
        if (!this.state.projection) return;
        const { areaPath, linePath, points, labels, x, y, area, line } = this.state.projection;
        const data = AppData.projections[scenario];
        
        let strokeColor = '#0f172a'; // Default to Ink (Typical)
        let areaColor = 'rgba(15, 23, 42, 0.08)'; // Default to Ink soft
        
        if (scenario === 'lower') {
            strokeColor = '#7eb2a8'; // Teal
            areaColor = 'rgba(126, 178, 168, 0.2)';
        } else if (scenario === 'higher') {
            strokeColor = '#b26075'; // Coral
            areaColor = 'rgba(178, 96, 117, 0.15)';
        }
        
        areaPath.datum(data).transition().duration(this.dur(1000)).ease(d3.easeCubicOut)
            .attr('fill', areaColor)
            .attr('d', area);

        linePath.datum(data).transition().duration(this.dur(1000)).ease(d3.easeCubicOut)
            .attr('stroke', strokeColor)
            .attr('d', line);

        points.data(data).transition().duration(this.dur(1000)).ease(d3.easeCubicOut)
            .attr('cx', d => x(d.year))
            .attr('cy', d => y(d.val))
            .attr('stroke', strokeColor);

        labels.data(data).transition().duration(this.dur(1000)).ease(d3.easeCubicOut)
            .attr('x', d => x(d.year))
            .attr('y', d => y(d.val) - 20)
            .attr('fill', strokeColor)
            .tween('text', function(d) {
                const rawText = this.textContent || "0";
                const cleanText = rawText.replace(/[^0-9.]/g, ''); 
                const currentVal = parseFloat(cleanText) || 0;
                const i = d3.interpolate(currentVal, d.val);
                return function(t) {
                    this.textContent = `+${i(t).toFixed(1)}`;
                };
            });
    }
};

const heroMotion = { current: 0, target: 0, raf: null };
let radarNodes = [];

document.addEventListener('DOMContentLoaded', () => {
    calculateNavTrigger();
    const renderCharts = () => {
        Charts.initCompliance();
        Charts.initExposure();
        Charts.initProjection();
        Charts.initFunding();
        Charts.initRadarGrid('#radar-grid-lines');
        Charts.initRadarNodes('#hero-radar-nodes');
        radarNodes = Utils.selectAll('#hero-radar-nodes circle');
        Utils.selectAll('.chart-canvas').forEach(c => {
            if (c.dataset.hasAnimated === 'true') triggerChartUpdate(c);
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
    initUIElements();
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
}

function updateRadar(progress) {
    const readout = Utils.select('#radar-readout-value');
    if (readout) readout.textContent = `0${Utils.lerp(1.2, 9.0, progress).toFixed(1)}%`;
    radarNodes.forEach(node => {
        const threshold = parseFloat(node.getAttribute('data-threshold'));
        const isActive = node.getAttribute('data-active') === 'true';
        
        if (progress > threshold && progress < threshold + 0.3) {
            node.setAttribute('class', 'active');
            node.style.fill = isActive ? 'var(--accent-gold)' : 'var(--accent-coral)'; 
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
    const navLinks = Utils.selectAll('.nav-links a[href^="#"]:not([href="#"])');
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

function triggerChartUpdate(canvas) {
    const scene = canvas.getAttribute('data-scene');
    if (scene === 'compliance') Charts.updateCompliance();
    if (scene === 'exposure') Charts.updateExposure();
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
    Utils.selectAll('.chart-filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            Utils.selectAll('.chart-filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            Charts.updateExposure(e.target.getAttribute('data-country'), null);
        });
    });

    Utils.selectAll('.metric-toggle-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetChart = e.target.getAttribute('data-target');
            
            const parent = e.target.closest('.metric-toggles');
            if (parent) {
                parent.querySelectorAll('.metric-toggle-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            }
            
            if (targetChart === 'compliance') {
                Charts.updateCompliance(e.target.getAttribute('data-filter'));
            } else if (targetChart === 'funding') {
                Charts.updateFunding(e.target.getAttribute('data-filter'));
            } else {
                Charts.updateExposure(null, e.target.getAttribute('data-metric'));
            }
        });
    });

    const dynamicText = Utils.select('#dynamic-slr-text');
    Utils.selectAll('.ruler-step').forEach((btn) => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            Utils.selectAll('.ruler-step').forEach(b => b.classList.remove('active'));
            const targetBtn = e.target.closest('.ruler-step');
            targetBtn.classList.add('active');
            
            const scenario = targetBtn.getAttribute('data-filter');
            Charts.updateProjection(scenario);
            
            if(dynamicText) {
                const finalVals = { 'lower': 45.2, 'typical': 74.47, 'higher': 104.6 };
                const targetVal = finalVals[scenario];
                // UX FIX: Get current numeric value directly from text to smoothly animate up or down
                const currentVal = parseFloat(dynamicText.textContent.replace(/[^0-9.]/g, '')) || 0;
                
                let textColor = 'var(--ink)';
                if (scenario === 'lower') textColor = 'var(--accent-teal)';
                if (scenario === 'higher') textColor = 'var(--accent-coral)';
                dynamicText.style.color = textColor;
                
                Charts.countText(dynamicText, currentVal, targetVal, {
                    prefix: '+',
                    suffix: ' cm',
                    decimals: 1,
                    duration: 1000
                });
            }
        });
    });

    Utils.selectAll('.flip-card').forEach(card => {
        const toggleCard = () => {
            const isFlipped = card.classList.toggle('flipped');
            card.setAttribute('aria-pressed', isFlipped);
            
            if (isFlipped) {
                const countryTitle = card.querySelector('.card-title').innerText.trim();
                const filterBtns = Array.from(document.querySelectorAll('.chart-filter-btn'));
                const matchingBtn = filterBtns.find(b => b.getAttribute('data-country').toUpperCase() === countryTitle.toUpperCase() || b.getAttribute('data-country').includes(countryTitle.replace('.', '')));
                
                if (matchingBtn) {
                    filterBtns.forEach(b => b.classList.remove('active'));
                    matchingBtn.classList.add('active');
                    Charts.updateExposure(matchingBtn.getAttribute('data-country'), null);
                }
            }
        };
        card.addEventListener('click', toggleCard);
        card.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleCard(); }
        });
    });
    
    const tabs = Utils.selectAll('.citation-tab');
    const citeText = Utils.select('.citation-content p');
    const citations = {
        'APA': 'Dissanayake, C. (2026). The Pacific Blind Spot: Measuring the climate monitoring gap [Data story]. Pacific Dataviz Challenge 2026. Retrieved from https://yourdomain.com',
        'Journalistic': 'Chatura Dissanayake, "The Pacific Blind Spot," Pacific Dataviz Challenge 2026, July 3, 2026, https://yourdomain.com.',
        'BibTeX': '@misc{dissanayake2026blindspot,\n  author = {Dissanayake, Chatura},\n  title = {The Pacific Blind Spot},\n  year = {2026},\n  url = {https://yourdomain.com}\n}'
    };
    
    tabs.forEach(tab => {
        const selectTab = () => {
            tabs.forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); t.setAttribute('tabindex', '-1'); });
            tab.classList.add('active'); tab.setAttribute('aria-selected', 'true'); tab.setAttribute('tabindex', '0');
            if (citeText && citations[tab.innerText]) citeText.innerText = citations[tab.innerText];
        };
        tab.addEventListener('click', selectTab);
        tab.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectTab(); } });
    });
    
    const copyCiteBtn = Utils.select('.copy-cite-btn');
    if (copyCiteBtn) {
        copyCiteBtn.addEventListener('click', () => {
            if (citeText && navigator.clipboard) {
                navigator.clipboard.writeText(citeText.innerText).then(() => {
                    const originalText = copyCiteBtn.innerText;
                    copyCiteBtn.innerText = 'Copied!';
                    setTimeout(() => copyCiteBtn.innerText = originalText, 2000);
                });
            }
        });
    }
}