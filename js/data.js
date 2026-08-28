// ---------------------------------------------------------
// CHAPTER 01: GLOBAL GAP (WMO GBON COMPLIANCE BASELINE)
// SOURCE: UN SOFF INF 6.2 WMO GBON Baseline 2023 Report
// LINK: https://www.un-soff.org/document/inf-6-2-wmo-gbon-baseline-2023/
// VERIFIED 2026-08-28: source document reports 9%/13% as a combined
// "LDCs and SIDS" figure, not SIDS alone. Category labels updated to
// reflect that; values (39/13/9/6) are unchanged and match the source.
// Declared before AppData (rather than inline) so the hero animation
// below can derive its density from this real figure instead of an
// unrelated magic number.
// ---------------------------------------------------------
const GBON_COMPLIANCE = [
    { category: 'UMICs Average', value: 39, target: 100, label: '39%', group: 'global' },
    { category: 'LDCs & SIDS Upper-Air', value: 13, target: 100, label: '13%', group: 'sids' },
    { category: 'LDCs & SIDS Surface', value: 9, target: 100, label: '9%', group: 'sids' },
    { category: 'LMICs Average', value: 6, target: 100, label: '6%', group: 'ldc' }
];
// The single figure the hero sequence counts up to (see
// #radar-readout-value in animations.js). Pulled from the same verified
// GBON_COMPLIANCE array rather than duplicated as a literal, so a future
// correction to the source data can't silently drift out of sync with
// the headline number the reader sees first.
const GBON_SIDS_SURFACE_PCT = GBON_COMPLIANCE.find(d => d.category === 'LDCs & SIDS Surface').value;

const AppData = {
    // ---------------------------------------------------------
    // CHAPTER 00: HERO ANIMATION
    // Decorative only (aria-hidden in the markup) — these are illustrative
    // node positions, not literal station coordinates (no lat/lon dataset
    // exists for individual GBON stations in the source material). The
    // *density* of "active" nodes is tied to GBON_SIDS_SURFACE_PCT so the
    // visual isn't an arbitrary random ratio disconnected from the data.
    // ---------------------------------------------------------
    radarStations: Array.from({ length: 45 }, (_, i) => ({
        id: `station-${i}`,
        isActive: Math.random() < (GBON_SIDS_SURFACE_PCT / 100),
        threshold: Math.random(),
        lat: Math.random() * 2 - 1, 
        lon: Math.random() * 2 - 1
    })),

    compliance: GBON_COMPLIANCE,
    // Exposed so animations.js can read the exact same verified number the
    // hero counts up to, without re-deriving or re-typing it.
    heroCoveragePct: GBON_SIDS_SURFACE_PCT,

    // ---------------------------------------------------------
    // CHAPTER 02: PACIFIC DISASTER EXPOSURE
    // SOURCE (affected): Pacific Data Hub SDG 11.5.1 "Number of directly
    //   affected persons attributed to disasters"
    //   (SPC_DF_SDG_11_3_0_filtered_2026-08-26_20-13-27.xlsx)
    // SOURCE (avgAnnualLoss): Pacific Data Hub SDG 11.5.2 "Direct disaster
    //   economic loss, average annual loss" — ONE figure per country, at
    //   the single reference year the source reports (not a yearly series).
    //   (SPC_DF_SDG_3_0_filtered_2026-08-26_20-12-55.xlsx)
    // VERIFIED 2026-08-28: previous "affected" values were real but shifted
    //   one year early across every country (a parsing bug) — corrected below,
    //   re-pulled directly from source columns C(2005)..V(2023).
    // REMOVED: "frequency" and "damage" per-year fields. No source file
    //   supports year-by-year event counts or year-by-year dollar damage;
    //   only the single avgAnnualLoss figure below is verified. Rather than
    //   leave fabricated per-year numbers in place, those two fields are
    //   set to null for every year until a real yearly source is found.
    // Note: missing data left as null to accurately reflect source gaps.
    // ---------------------------------------------------------
    exposure: {
        "Fiji": [
            { "year": 2018, "frequency": null, "damage": null, "affected": 0 },
            { "year": 2019, "frequency": null, "damage": null, "affected": 155726 },
            { "year": 2020, "frequency": null, "damage": null, "affected": 78045 },
            { "year": 2021, "frequency": null, "damage": null, "affected": 235921 },
            { "year": 2022, "frequency": null, "damage": null, "affected": 78030 },
            { "year": 2023, "frequency": null, "damage": null, "affected": 1787 }
        ],
        "New Caledonia": [
            { "year": 2018, "frequency": null, "damage": null, "affected": 4 },
            { "year": 2019, "frequency": null, "damage": null, "affected": 0 },
            { "year": 2020, "frequency": null, "damage": null, "affected": 1 },
            { "year": 2021, "frequency": null, "damage": null, "affected": 2 },
            { "year": 2022, "frequency": null, "damage": null, "affected": null },
            { "year": 2023, "frequency": null, "damage": null, "affected": null }
        ],
        "Papua New Guinea": [
            { "year": 2018, "frequency": null, "damage": null, "affected": null },
            { "year": 2019, "frequency": null, "damage": null, "affected": null },
            { "year": 2020, "frequency": null, "damage": null, "affected": 2100 },
            { "year": 2021, "frequency": null, "damage": null, "affected": 3297 },
            { "year": 2022, "frequency": null, "damage": null, "affected": null },
            { "year": 2023, "frequency": null, "damage": null, "affected": null }
        ],
        "Solomon Islands": [
            { "year": 2018, "frequency": null, "damage": null, "affected": 51465 },
            { "year": 2019, "frequency": null, "damage": null, "affected": 194155 },
            { "year": 2020, "frequency": null, "damage": null, "affected": 1834 },
            { "year": 2021, "frequency": null, "damage": null, "affected": 2339 },
            { "year": 2022, "frequency": null, "damage": null, "affected": 240 },
            { "year": 2023, "frequency": null, "damage": null, "affected": 20080 }
        ],
        "Vanuatu": [
            { "year": 2018, "frequency": null, "damage": null, "affected": 920 },
            { "year": 2019, "frequency": null, "damage": null, "affected": 23286 },
            { "year": 2020, "frequency": null, "damage": null, "affected": 18 },
            { "year": 2021, "frequency": null, "damage": null, "affected": 246802 },
            { "year": 2022, "frequency": null, "damage": null, "affected": 1400 },
            { "year": 2023, "frequency": null, "damage": null, "affected": null }
        ],
        "Kiribati": [
            { "year": 2018, "frequency": null, "damage": null, "affected": null },
            { "year": 2019, "frequency": null, "damage": null, "affected": 0 },
            { "year": 2020, "frequency": null, "damage": null, "affected": 3 },
            { "year": 2021, "frequency": null, "damage": null, "affected": 15 },
            { "year": 2022, "frequency": null, "damage": null, "affected": 333 },
            { "year": 2023, "frequency": null, "damage": null, "affected": null }
        ],
        "Marshall Islands": [
            { "year": 2018, "frequency": null, "damage": null, "affected": 7029 },
            { "year": 2019, "frequency": null, "damage": null, "affected": 0 },
            { "year": 2020, "frequency": null, "damage": null, "affected": 35844 },
            { "year": 2021, "frequency": null, "damage": null, "affected": 56718 },
            { "year": 2022, "frequency": null, "damage": null, "affected": 0 },
            { "year": 2023, "frequency": null, "damage": null, "affected": 52914 }
        ],
        "Nauru": [
            { "year": 2018, "frequency": null, "damage": null, "affected": null },
            { "year": 2019, "frequency": null, "damage": null, "affected": null },
            { "year": 2020, "frequency": null, "damage": null, "affected": 63 },
            { "year": 2021, "frequency": null, "damage": null, "affected": 1133 },
            { "year": 2022, "frequency": null, "damage": null, "affected": 4 },
            { "year": 2023, "frequency": null, "damage": null, "affected": 5393 }
        ],
        "Palau": [
            { "year": 2018, "frequency": null, "damage": null, "affected": null },
            { "year": 2019, "frequency": null, "damage": null, "affected": null },
            { "year": 2020, "frequency": null, "damage": null, "affected": null },
            { "year": 2021, "frequency": null, "damage": null, "affected": null },
            { "year": 2022, "frequency": null, "damage": null, "affected": 24220 },
            { "year": 2023, "frequency": null, "damage": null, "affected": 780 }
        ],
        "American Samoa": [
            { "year": 2018, "frequency": null, "damage": null, "affected": null },
            { "year": 2019, "frequency": null, "damage": null, "affected": 3800 },
            { "year": 2020, "frequency": null, "damage": null, "affected": 12 },
            { "year": 2021, "frequency": null, "damage": null, "affected": 232 },
            { "year": 2022, "frequency": null, "damage": null, "affected": null },
            { "year": 2023, "frequency": null, "damage": null, "affected": null }
        ],
        "Samoa": [
            { "year": 2018, "frequency": null, "damage": null, "affected": null },
            { "year": 2019, "frequency": null, "damage": null, "affected": 383 },
            { "year": 2020, "frequency": null, "damage": null, "affected": 5700 },
            { "year": 2021, "frequency": null, "damage": null, "affected": 195 },
            { "year": 2022, "frequency": null, "damage": null, "affected": 15 },
            { "year": 2023, "frequency": null, "damage": null, "affected": 16607 }
        ],
        "Tonga": [
            { "year": 2018, "frequency": null, "damage": null, "affected": 0 },
            { "year": 2019, "frequency": null, "damage": null, "affected": 84311 },
            { "year": 2020, "frequency": null, "damage": null, "affected": 640 },
            { "year": 2021, "frequency": null, "damage": null, "affected": 68 },
            { "year": 2022, "frequency": null, "damage": null, "affected": null },
            { "year": 2023, "frequency": null, "damage": null, "affected": null }
        ],
        "Tuvalu": [
            { "year": 2018, "frequency": null, "damage": null, "affected": 0 },
            { "year": 2019, "frequency": null, "damage": null, "affected": 0 },
            { "year": 2020, "frequency": null, "damage": null, "affected": 0 },
            { "year": 2021, "frequency": null, "damage": null, "affected": 2266 },
            { "year": 2022, "frequency": null, "damage": null, "affected": 6 },
            { "year": 2023, "frequency": null, "damage": null, "affected": 7748 }
        ]
    },

    // Average annual economic loss to disasters, per country — ONE verified
    // figure each, at the reference year the source reports (not a series).
    // SOURCE: Pacific Data Hub, SDG 11.5.2 (SPC_DF_SDG_3_0 file). Countries
    // absent from the source file are omitted (no fabricated placeholder).
    exposureAvgAnnualLoss: [
        { country: "Fiji", year: 2020, usd: 24247724 },
        { country: "New Caledonia", year: 2016, usd: 20310000 },
        { country: "Papua New Guinea", year: 2020, usd: 1593750 },
        { country: "Vanuatu", year: 2018, usd: 64500000 },
        { country: "Kiribati", year: 2020, usd: 30750 },
        { country: "Marshall Islands", year: 2016, usd: 1781682 },
        { country: "Micronesia (Federated States of)", year: 2019, usd: 8270325 },
        { country: "Palau", year: 2016, usd: 6 },
        { country: "French Polynesia", year: 2016, usd: 30220000 },
        { country: "Samoa", year: 2016, usd: 22048411 },
        { country: "Tonga", year: 2019, usd: 8579025 }
    ],

    // ---------------------------------------------------------
    // CHAPTER 04: HISTORICAL FLOODING (PAGO PAGO STATION)
    // SOURCE: high-tide-flooding-days.csv (NOAA). VERIFIED 2026-08-28:
    // exact match, no changes.
    // ---------------------------------------------------------
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

    // ---------------------------------------------------------
    // CHAPTER 04: HISTORICAL SEA LEVEL (Pago Pago; mm converted to cm)
    // SOURCE: total-sea-level-change-b.csv, "Annual Data" column at
    // whole-number years. VERIFIED 2026-08-28: re-derived directly from
    // this column (previous values didn't match any column in the source
    // file exactly).
    // ---------------------------------------------------------
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

    // ---------------------------------------------------------
    // CHAPTER 04: PROJECTED SEA LEVEL RISE (GLOBAL MEAN, not local)
    // SOURCE: World Bank Climate Risk Country Profiles (2021), Table 3/5/6
    // "Estimates of global mean sea-level rise... compared to 1986-2005",
    // IPCC AR5 Ch.13 methodology — identical table cited across all 11
    // profiles checked (Fiji, Kiribati, Marshall Islands, Nauru, Palau,
    // Samoa, Solomon Islands, Tonga, Tuvalu, Vanuatu, PNG).
    // VERIFIED 2026-08-28: 2100 values (44/53/74) are an EXACT match to
    // the source table. 2020 and 2050 values are NOT in this source (the
    // table only reports totals at 2100, plus a rate in mm/yr) and could
    // not be verified against any uploaded dataset — removed rather than
    // left unsourced. Only the verified 2100 endpoint remains per scenario.
    // ---------------------------------------------------------
    projections: {
        lower: [
            { year: 2100, val: 44.00 } // RCP2.6 — verified, World Bank CCKP Table (IPCC AR5)
        ],
        typical: [
            { year: 2100, val: 53.00 } // RCP4.5 — verified, World Bank CCKP Table (IPCC AR5)
        ],
        higher: [
            { year: 2100, val: 74.00 } // RCP8.5 — verified, World Bank CCKP Table (IPCC AR5)
        ]
    },

    // ---------------------------------------------------------
    // CHAPTER 05: UN SOFF FINANCIAL PIPELINE
    // VERIFIED 2026-08-28: no uploaded source file backs this object, and
    // the per-country dollar amounts (esp. the four identical $0.4M
    // "Pending" entries) could not be confirmed against SOFF Steering
    // Committee records. Left structurally intact (so existing render code
    // doesn't break) but every unverified financial figure is null.
    // What IS verified and kept: Nauru and Samoa's Investment Phase status
    // (approved at SOFF's 12th Steering Committee, per INF 13.2, Feb 2026),
    // and Solomon Islands' Investment Phase status (UNDP Solomon Islands
    // SOFF Investment Phase project page). Tonga's "Gap" status and exact
    // amounts, and all "Pending" amounts, are unverified and set to null.
    // ---------------------------------------------------------
    funding: [
        { country: 'Solomon Islands', x: 20, y: 45, status: 'Approved', amount: null, radius: 24 },
        { country: 'Samoa', x: 75, y: 50, status: 'Approved', amount: null, radius: 24 },
        { country: 'Nauru', x: 40, y: 30, status: 'Approved', amount: null, radius: 24 },
        { country: 'Fiji', x: 45, y: 60, status: 'Pending', amount: null, radius: 14 },
        { country: 'Kiribati', x: 65, y: 35, status: 'Pending', amount: null, radius: 14 },
        { country: 'Tuvalu', x: 55, y: 40, status: 'Pending', amount: null, radius: 14 },
        { country: 'Vanuatu', x: 30, y: 55, status: 'Pending', amount: null, radius: 14 },
        { country: 'Tonga', x: 60, y: 70, status: 'Gap', amount: null, radius: 8 }
    ],

    // SOFF portfolio-wide progress, for the "closing the gap" counter.
    // SOURCE: SOFF Portfolio and Implementation Progress, INF 13.2
    // (as of 10 February 2026), un-soff.org.
    soffProgress: {
        countriesReadinessProgrammed: 66,
        countriesReadinessCompleted: 48,
        countriesInvestmentApproved: 18,
        asOf: "10 February 2026"
    },

    legendFunding: [
        { label: 'Investment Phase (Hardware Funded)', color: '#7eb2a8' },
        { label: 'Readiness Phase (Assessment Funded)', color: '#d4af37' },
        { label: 'Unfunded Gap', color: '#b26075' }
    ]
};