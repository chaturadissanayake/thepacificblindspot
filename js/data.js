const AppData = {
    // 45 simulated radar/surface stations for the hero animation
    // Only ~9% are active, reflecting the actual Pacific SIDS compliance gap
    radarStations: Array.from({ length: 45 }, (_, i) => ({
        id: `station-${i}`,
        isActive: Math.random() < 0.09, 
        threshold: Math.random(),
        lat: Math.random() * 2 - 1, 
        lon: Math.random() * 2 - 1
    })),
    
    // Chapter 01: Official WMO GBON Compliance Baseline Data
    compliance: [
        { category: 'Global Average', value: 68, target: 100, label: '68%', group: 'global' },
        { category: 'LDCs Average', value: 14, target: 100, label: '14%', group: 'ldc' },
        { category: 'SIDS Upper-Air', value: 13, target: 100, label: '13%', group: 'sids' },
        { category: 'SIDS Surface', value: 9, target: 100, label: '9%', group: 'sids' },
        { category: 'Pacific SIDS', value: 6, target: 100, label: '6%', group: 'pacific' }
    ],
    
    // Chapter 02: Historical EM-DAT Pacific Disaster Data & Official Affected Persons (2018-2023)
    exposure: {
        "Fiji": [
            { year: 2018, frequency: 3, damage: 45, affected: 155726 },
            { year: 2019, frequency: 2, damage: 18, affected: 78045 },
            { year: 2020, frequency: 4, damage: 250, affected: 235921 },
            { year: 2021, frequency: 3, damage: 110, affected: 78030 },
            { year: 2022, frequency: 2, damage: 30, affected: 1787 },
            { year: 2023, frequency: 2, damage: 20, affected: 0 }
        ],
        "New Caledonia": [
            { year: 2018, frequency: 0, damage: 1, affected: 0 },
            { year: 2019, frequency: 3, damage: 0, affected: 1 },
            { year: 2020, frequency: 2, damage: 0, affected: 2 },
            { year: 2021, frequency: 0, damage: 1, affected: 0 },
            { year: 2022, frequency: 0, damage: 1, affected: 0 },
            { year: 2023, frequency: 1, damage: 3, affected: 0 }
        ],
        "Papua New Guinea": [
            { year: 2018, frequency: 0, damage: 0, affected: 0 },
            { year: 2019, frequency: 3, damage: 17, affected: 2100 },
            { year: 2020, frequency: 3, damage: 20, affected: 3297 },
            { year: 2021, frequency: 1, damage: 4, affected: 0 },
            { year: 2022, frequency: 0, damage: 4, affected: 0 },
            { year: 2023, frequency: 0, damage: 0, affected: 0 }
        ],
        "Solomon Islands": [
            { year: 2018, frequency: 1, damage: 395, affected: 194155 },
            { year: 2019, frequency: 3, damage: 4, affected: 1834 },
            { year: 2020, frequency: 0, damage: 16, affected: 2339 },
            { year: 2021, frequency: 2, damage: 9, affected: 240 },
            { year: 2022, frequency: 2, damage: 55, affected: 20080 },
            { year: 2023, frequency: 0, damage: 0, affected: 0 }
        ],
        "Vanuatu": [
            { year: 2018, frequency: 2, damage: 15, affected: 23286 },
            { year: 2019, frequency: 1, damage: 8, affected: 18 },
            { year: 2020, frequency: 3, damage: 600, affected: 246802 },
            { year: 2021, frequency: 2, damage: 25, affected: 1400 },
            { year: 2022, frequency: 1, damage: 12, affected: 0 },
            { year: 2023, frequency: 4, damage: 145, affected: 0 }
        ],
        "Kiribati": [
            { year: 2018, frequency: 1, damage: 5, affected: 0 },
            { year: 2019, frequency: 1, damage: 2, affected: 3 },
            { year: 2020, frequency: 2, damage: 12, affected: 15 },
            { year: 2021, frequency: 1, damage: 18, affected: 333 },
            { year: 2022, frequency: 1, damage: 25, affected: 0 },
            { year: 2023, frequency: 1, damage: 8, affected: 0 }
        ],
        "Marshall Islands": [
            { year: 2018, frequency: 1, damage: 0, affected: 0 },
            { year: 2019, frequency: 3, damage: 78, affected: 35844 },
            { year: 2020, frequency: 1, damage: 131, affected: 56718 },
            { year: 2021, frequency: 0, damage: 0, affected: 0 },
            { year: 2022, frequency: 1, damage: 120, affected: 52914 },
            { year: 2023, frequency: 0, damage: 3, affected: 0 }
        ],
        "Naoero": [
            { year: 2018, frequency: 1, damage: 1, affected: 0 },
            { year: 2019, frequency: 1, damage: 4, affected: 63 },
            { year: 2020, frequency: 1, damage: 2, affected: 1133 },
            { year: 2021, frequency: 0, damage: 3, affected: 4 },
            { year: 2022, frequency: 2, damage: 22, affected: 5393 },
            { year: 2023, frequency: 0, damage: 2, affected: 0 }
        ],
        "Palau": [
            { year: 2018, frequency: 0, damage: 5, affected: 0 },
            { year: 2019, frequency: 0, damage: 2, affected: 0 },
            { year: 2020, frequency: 0, damage: 0, affected: 0 },
            { year: 2021, frequency: 2, damage: 58, affected: 24220 },
            { year: 2022, frequency: 0, damage: 16, affected: 780 },
            { year: 2023, frequency: 1, damage: 4, affected: 0 }
        ],
        "American Samoa": [
            { year: 2018, frequency: 3, damage: 17, affected: 3800 },
            { year: 2019, frequency: 0, damage: 2, affected: 12 },
            { year: 2020, frequency: 2, damage: 14, affected: 232 },
            { year: 2021, frequency: 1, damage: 0, affected: 0 },
            { year: 2022, frequency: 0, damage: 3, affected: 0 },
            { year: 2023, frequency: 0, damage: 2, affected: 0 }
        ],
        "Samoa": [
            { year: 2018, frequency: 2, damage: 40, affected: 383 },
            { year: 2019, frequency: 1, damage: 10, affected: 5700 },
            { year: 2020, frequency: 2, damage: 65, affected: 195 },
            { year: 2021, frequency: 1, damage: 15, affected: 15 },
            { year: 2022, frequency: 1, damage: 8, affected: 16607 },
            { year: 2023, frequency: 2, damage: 45, affected: 138 }
        ],
        "Tonga": [
            { year: 2018, frequency: 1, damage: 120, affected: 84311 },
            { year: 2019, frequency: 1, damage: 5, affected: 640 },
            { year: 2020, frequency: 2, damage: 20, affected: 68 },
            { year: 2021, frequency: 1, damage: 0, affected: 0 },
            { year: 2022, frequency: 2, damage: 900, affected: 0 },
            { year: 2023, frequency: 1, damage: 15, affected: 0 }
        ],
        "Tuvalu": [
            { year: 2018, frequency: 0, damage: 3, affected: 0 },
            { year: 2019, frequency: 1, damage: 5, affected: 0 },
            { year: 2020, frequency: 3, damage: 14, affected: 2266 },
            { year: 2021, frequency: 0, damage: 2, affected: 6 },
            { year: 2022, frequency: 1, damage: 30, affected: 7748 },
            { year: 2023, frequency: 0, damage: 3, affected: 0 }
        ]
    },
    
    // Chapter 04: Projected Sea Level Rise (CCKP Scenarios for Fiji)
    projections: {
        lower: [
            { year: 2020, val: 2.15 },
            { year: 2050, val: 12.50 },
            { year: 2100, val: 45.20 }
        ],
        typical: [
            { year: 2020, val: 5.08 },
            { year: 2050, val: 23.28 },
            { year: 2100, val: 74.47 }
        ],
        higher: [
            { year: 2020, val: 8.19 },
            { year: 2050, val: 32.91 },
            { year: 2100, val: 104.60 }
        ]
    },

    // Chapter 05: UN SOFF Financial Pipeline (Simulated allocations for Pacific)
    funding: [
        { country: 'Fiji', x: 45, y: 60, status: 'Approved', amount: 12.5, radius: 24 },
        { country: 'Vanuatu', x: 30, y: 55, status: 'Provisional', amount: 8.2, radius: 18 },
        { country: 'Solomon Islands', x: 20, y: 45, status: 'Provisional', amount: 9.1, radius: 20 },
        { country: 'Kiribati', x: 65, y: 35, status: 'Gap', amount: 0, radius: 8 },
        { country: 'Samoa', x: 75, y: 50, status: 'Approved', amount: 6.4, radius: 15 },
        { country: 'Tonga', x: 60, y: 70, status: 'Pending', amount: 4.5, radius: 12 },
        { country: 'Tuvalu', x: 55, y: 40, status: 'Gap', amount: 0, radius: 8 },
        { country: 'Nauru', x: 40, y: 30, status: 'Pending', amount: 2.1, radius: 10 }
    ],
    
    legendFunding: [
        { label: 'Approved Facility', color: '#7eb2a8' },
        { label: 'Provisional / Pending', color: '#d4af37' },
        { label: 'Critical Gap (Unfunded)', color: '#b26075' }
    ]
};