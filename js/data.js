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
        {"year": 1983, "days": 0}, {"year": 1984, "days": 0}, {"year": 1985, "days": 0}, {"year": 1986, "days": 0},
        {"year": 1987, "days": 0}, {"year": 1988, "days": 0}, {"year": 1989, "days": 0}, {"year": 1990, "days": 0},
        {"year": 1991, "days": 0}, {"year": 1992, "days": 0}, {"year": 1993, "days": 0}, {"year": 1994, "days": 0},
        {"year": 1995, "days": 0}, {"year": 1996, "days": 0}, {"year": 1997, "days": 0}, {"year": 1998, "days": 0},
        {"year": 1999, "days": 0}, {"year": 2000, "days": 0}, {"year": 2001, "days": 0}, {"year": 2002, "days": 0},
        {"year": 2003, "days": 0}, {"year": 2004, "days": 0}, {"year": 2005, "days": 0}, {"year": 2006, "days": 0},
        {"year": 2007, "days": 0}, {"year": 2008, "days": 0}, {"year": 2009, "days": 0}, {"year": 2010, "days": 0},
        {"year": 2011, "days": 1}, {"year": 2012, "days": 0}, {"year": 2013, "days": 0}, {"year": 2014, "days": 0},
        {"year": 2016, "days": 3}, {"year": 2017, "days": 2}, {"year": 2018, "days": 3}, {"year": 2019, "days": 14},
        {"year": 2020, "days": 0}, {"year": 2021, "days": 1}, {"year": 2022, "days": 9}, {"year": 2023, "days": 4},
        {"year": 2024, "days": 0}, {"year": 2025, "days": 6}, {"year": 2026, "days": 9},
    ],

historicalSeaLevel: [
    {"year": 1993, "val": 1.36}, {"year": 1994, "val": 0.95}, {"year": 1995, "val": 3.92}, {"year": 1996, "val": 3.30},
    {"year": 1997, "val": -1.44}, {"year": 1998, "val": -4.88}, {"year": 1999, "val": 5.16}, {"year": 2000, "val": 8.28},
    {"year": 2001, "val": 3.41}, {"year": 2002, "val": 4.87}, {"year": 2003, "val": 4.70}, {"year": 2004, "val": 5.75},
    {"year": 2005, "val": 11.47}, {"year": 2006, "val": 3.23}, {"year": 2007, "val": 5.76}, {"year": 2008, "val": 8.67},
    {"year": 2009, "val": 1.41}, {"year": 2010, "val": 12.73}, {"year": 2011, "val": 9.17}, {"year": 2012, "val": 2.24},
    {"year": 2013, "val": 3.48}, {"year": 2014, "val": 6.88}, {"year": 2015, "val": 5.73}, {"year": 2016, "val": 13.38},
    {"year": 2017, "val": 11.43}, {"year": 2018, "val": 13.95}, {"year": 2019, "val": 10.77}, {"year": 2020, "val": 15.64},
    {"year": 2021, "val": 14.78}, {"year": 2022, "val": 12.83}, {"year": 2023, "val": 4.82}, {"year": 2024, "val": 9.73}
],

projections: {
    lower: [
        { year: 2100, val: 44.00 }
    ],
    typical: [
        { year: 2100, val: 55.00 }
    ],
    higher: [
        { year: 2100, val: 77.00 }
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