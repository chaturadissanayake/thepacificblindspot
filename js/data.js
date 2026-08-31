const safeMeteo = typeof rawMeteoData !== 'undefined' ? rawMeteoData : (typeof meteorological_monitoring_network !== 'undefined' ? meteorological_monitoring_network : []);
const safeAffected = typeof rawAffectedPersonsData !== 'undefined' ? rawAffectedPersonsData : (typeof directlyAffectedPersons !== 'undefined' ? directlyAffectedPersons : []);
const safeLoss = typeof rawEconomicLossData !== 'undefined' ? rawEconomicLossData : (typeof directDisasterEconomicLoss !== 'undefined' ? directDisasterEconomicLoss : []);

const groupedMeteo = {};
safeMeteo.forEach(row => {
    const c = (row.Country || row.country || '').trim();
    if (!c) return;
    if (!groupedMeteo[c]) groupedMeteo[c] = [];
    groupedMeteo[c].push({ year: Number(row.Year || row.year), stations: Number(row.Stations || row.stations || 0) });
});

const groupedExposure = {};
safeAffected.forEach(row => {
    const c = (row.Country || row.country || '').trim();
    if (!c) return;
    if (!groupedExposure[c]) groupedExposure[c] = [];
    let val = row.personsAffected !== undefined ? row.personsAffected : row.affected;
    groupedExposure[c].push({ year: Number(row.Year || row.year), affected: val === null || val === "" ? null : Number(val) });
});

const mappedLoss = safeLoss.map(row => {
    return {
        country: (row.Country || row.country || '').trim(),
        year: Number(row.Year || row.year),
        usd: Number(row.usd || row.USD || row.economicLoss || row.directDisasterEconomicLoss || row.loss || row.value || row.Value || 0)
    };
});

const GBON_COMPLIANCE = [
    { category: 'UMICs Average', value: 39, target: 100, label: '39%', group: 'global' },
    { category: 'LDCs & SIDS Upper-Air', value: 13, target: 100, label: '13%', group: 'sids' },
    { category: 'LDCs & SIDS Surface', value: 9, target: 100, label: '9%', group: 'sids' },
    { category: 'LMICs Average', value: 6, target: 100, label: '6%', group: 'ldc' }
];

const GBON_SIDS_SURFACE_PCT = GBON_COMPLIANCE.find(d => d.category === 'LDCs & SIDS Surface').value;

const AppData = {
    radarStations: Array.from({ length: 45 }, (_, i) => ({
        id: `station-${i}`,
        isActive: Math.random() < (GBON_SIDS_SURFACE_PCT / 100),
        threshold: Math.random(),
        lat: Math.random() * 2 - 1, 
        lon: Math.random() * 2 - 1
    })),

    compliance: GBON_COMPLIANCE,
    heroCoveragePct: GBON_SIDS_SURFACE_PCT,

    meteoYearRange: [1889, 2026],
    meteoMaxStations: 8,
    meteoCountryOrder: [
        "Fiji", "French Polynesia", "Papua New Guinea", "Vanuatu", "Kiribati", "New Caledonia", "Tonga", "Micronesia, Federated State of", "Solomon Islands",
        "Tuvalu", "Cook Islands", "Marshall Islands", "Samoa", "Palau", "Tokelau", "Naoero", "Niue", "Pitcairn"
    ],
    meteoCountryLabels: {
        "Naoero": "Nauru",
        "Micronesia, Federated State of": "Micronesia"
    },
    
    meteoStations: groupedMeteo,

    exposure: groupedExposure,

    exposureAvgAnnualLoss: mappedLoss,

    historicalFlooding: [
        {"year": 1979, "days": 0}, {"year": 1980, "days": 0}, {"year": 1981, "days": 0}, {"year": 1982, "days": 0}, 
        {"year": 1983, "days": 1}, {"year": 1984, "days": 0}, {"year": 1985, "days": 0}, {"year": 1986, "days": 0}, 
        {"year": 1987, "days": 1}, {"year": 1988, "days": 0}, {"year": 1989, "days": 0}, {"year": 1990, "days": 0}, 
        {"year": 1991, "days": 0}, {"year": 1992, "days": 0}, {"year": 1993, "days": 0}, {"year": 1994, "days": 0}, 
        {"year": 1995, "days": 0}, {"year": 1996, "days": 0}, {"year": 1997, "days": 3}, {"year": 1998, "days": 0}, 
        {"year": 1999, "days": 0}, {"year": 2000, "days": 2}, {"year": 2001, "days": 3}, {"year": 2002, "days": 1}, 
        {"year": 2003, "days": 0}, {"year": 2004, "days": 1}, {"year": 2005, "days": 2}, {"year": 2006, "days": 2}, 
        {"year": 2007, "days": 2}, {"year": 2008, "days": 5}, {"year": 2009, "days": 10}, {"year": 2010, "days": 2}, 
        {"year": 2011, "days": 4}, {"year": 2012, "days": 4}, {"year": 2013, "days": 4}, {"year": 2014, "days": 7}, 
        {"year": 2015, "days": 2}
    ],

    historicalSeaLevel: [
        {"year": 1993, "val": 0.00}, {"year": 1994, "val": 0.77}, {"year": 1995, "val": 1.33}, {"year": 1996, "val": 1.64}, 
        {"year": 1997, "val": 1.42}, {"year": 1998, "val": 1.84}, {"year": 1999, "val": 1.67}, {"year": 2000, "val": 2.39}, 
        {"year": 2001, "val": 2.95}, {"year": 2002, "val": 3.12}, {"year": 2003, "val": 2.96}, {"year": 2004, "val": 3.32}, 
        {"year": 2005, "val": 3.63}, {"year": 2006, "val": 3.96}, {"year": 2007, "val": 3.94}, {"year": 2008, "val": 4.05}, 
        {"year": 2009, "val": 4.39}, {"year": 2010, "val": 5.09}, {"year": 2011, "val": 4.94}, {"year": 2012, "val": 5.53}, 
        {"year": 2013, "val": 6.29}, {"year": 2014, "val": 6.27}, {"year": 2015, "val": 6.72}, {"year": 2016, "val": 7.27}, 
        {"year": 2017, "val": 7.34}, {"year": 2018, "val": 7.62}, {"year": 2019, "val": 7.94}, {"year": 2020, "val": 8.45}, 
        {"year": 2021, "val": 9.00}, {"year": 2022, "val": 9.35}, {"year": 2023, "val": 9.69}, {"year": 2024, "val": 10.18}, 
        {"year": 2025, "val": 10.49}
    ],

    projections: {
        lower: [
            { year: 2100, val: 44.00 }
        ],
        typical: [
            { year: 2100, val: 53.00 }
        ],
        higher: [
            { year: 2100, val: 74.00 }
        ]
    },

    funding: [
        { country: 'Kiribati', partner: 'Australia', entity: 'UNEP', phase: 'Investment', status: 'Approved', readiness: 105255, investment: 535000, total: 640255 },
        { country: 'Solomon Islands', partner: 'Australia', entity: 'UNDP', phase: 'Investment', status: 'Approved', readiness: 96905, investment: 535000, total: 631905 },
        { country: 'Samoa', partner: 'Australia', entity: 'World Bank', phase: 'Investment', status: 'Approved', readiness: 96905, investment: 332500, total: 429405 },
        { country: 'Nauru', partner: 'Australia', entity: 'UNEP', phase: 'Investment', status: 'Approved', readiness: 86255, investment: 262500, total: 348755 },
        { country: 'Papua New Guinea', partner: 'Australia', entity: 'UNDP', phase: 'Readiness', status: 'Under Review', readiness: 138601, investment: 0, total: 138601 },
        { country: 'Fiji', partner: 'Australia', entity: 'World Bank', phase: 'Readiness', status: '', readiness: 96905, investment: 0, total: 96905 },
        { country: 'Marshall Islands', partner: 'New Zealand', entity: 'UNEP', phase: 'Readiness', status: '', readiness: 154309, investment: 0, total: 154309 },
        { country: 'Micronesia (Federated States of)', partner: 'New Zealand', entity: 'UNEP', phase: 'Readiness', status: '', readiness: 154309, investment: 0, total: 154309 },
        { country: 'Palau', partner: 'New Zealand', entity: 'UNEP', phase: 'Readiness', status: '', readiness: 154309, investment: 0, total: 154309 },
        { country: 'Vanuatu', partner: 'New Zealand', entity: 'World Bank', phase: 'Readiness', status: '', readiness: 103965, investment: 0, total: 103965 },
        { country: 'Tonga', partner: 'New Zealand', entity: 'World Bank', phase: 'Readiness', status: '', readiness: 99200, investment: 0, total: 99200 },
        { country: 'Cook Islands', partner: 'New Zealand', entity: 'UNEP', phase: 'Readiness', status: '', readiness: 75415, investment: 0, total: 75415 },
        { country: 'Niue', partner: 'New Zealand', entity: 'UNEP', phase: 'Readiness', status: '', readiness: 60645, investment: 0, total: 60645 },
        { country: 'Tuvalu', partner: 'New Zealand', entity: 'UNEP', phase: 'Readiness', status: '', readiness: 39800, investment: 0, total: 39800 }
    ],

    soffProgress: {
        countriesReadinessProgrammed: 66,
        countriesReadinessCompleted: 48,
        countriesInvestmentApproved: 18,
        asOf: "10 February 2026"
    }
};