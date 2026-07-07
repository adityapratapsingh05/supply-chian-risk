import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SUPPLIERS = [
  {
    id: 'sup_001',
    name: 'Rare Earth Mining Co.',
    tier: 3,
    lat: 40.6517,
    lng: 109.8414,
    country: 'China',
    region: 'Baotou, Inner Mongolia',
    categoryExposure: JSON.stringify(['geo-political', 'natural disaster', 'regulatory', 'environmental']),
    upstreamIds: JSON.stringify([]),
    downstreamIds: JSON.stringify(['sup_002', 'sup_003']),
    currentRiskScore: 0.72,
    currentImpactScore: 8.1,
    description: 'Primary supplier of rare earth elements (neodymium, dysprosium) critical for smartphone magnets and motors.',
  },
  {
    id: 'sup_002',
    name: 'Advanced PCB Ltd.',
    tier: 2,
    lat: 25.0330,
    lng: 121.5654,
    country: 'Taiwan',
    region: 'Taipei, Taiwan',
    categoryExposure: JSON.stringify(['geo-political', 'trade policy', 'cyber', 'financial']),
    upstreamIds: JSON.stringify(['sup_001']),
    downstreamIds: JSON.stringify(['sup_004']),
    currentRiskScore: 0.65,
    currentImpactScore: 7.4,
    description: 'Manufactures advanced printed circuit boards and semiconductor substrates for the main logic board.',
  },
  {
    id: 'sup_003',
    name: 'OLED Display Systems',
    tier: 2,
    lat: 37.5665,
    lng: 126.9780,
    country: 'South Korea',
    region: 'Seoul, South Korea',
    categoryExposure: JSON.stringify(['geo-political', 'financial', 'labor', 'trade policy']),
    upstreamIds: JSON.stringify(['sup_001']),
    downstreamIds: JSON.stringify(['sup_004']),
    currentRiskScore: 0.41,
    currentImpactScore: 6.2,
    description: 'World-leading OLED display panel manufacturer. Supplies high-resolution screens for premium smartphones.',
  },
  {
    id: 'sup_004',
    name: 'Precision Assembly Corp.',
    tier: 1,
    lat: 22.5431,
    lng: 114.0579,
    country: 'China',
    region: 'Shenzhen, Guangdong',
    categoryExposure: JSON.stringify(['labor', 'logistics', 'pandemic/health', 'regulatory']),
    upstreamIds: JSON.stringify(['sup_002', 'sup_003']),
    downstreamIds: JSON.stringify(['sup_005']),
    currentRiskScore: 0.55,
    currentImpactScore: 9.0,
    description: 'Final assembly manufacturer performing device integration, quality control, and packaging at massive scale.',
  },
  {
    id: 'sup_005',
    name: 'Global Logistics Hub',
    tier: 1,
    lat: 1.3521,
    lng: 103.8198,
    country: 'Singapore',
    region: 'Singapore',
    categoryExposure: JSON.stringify(['logistics', 'climate', 'trade policy', 'cyber']),
    upstreamIds: JSON.stringify(['sup_004']),
    downstreamIds: JSON.stringify([]),
    currentRiskScore: 0.30,
    currentImpactScore: 7.8,
    description: 'Regional distribution and logistics hub managing final delivery to global markets. Port and airfreight operations.',
  },
];

const NEWS_ARTICLES = [
  {
    id: 'news_001',
    title: 'China Tightens Rare Earth Export Controls Amid Geopolitical Tensions',
    url: 'https://example.com/news/1',
    publishedAt: new Date('2024-01-15T08:00:00Z'),
    source: 'Reuters',
    rawContent: 'Beijing has announced new restrictions on rare earth mineral exports, citing national security concerns. The move affects neodymium, dysprosium, and terbium — critical materials for electronics manufacturing. Industry analysts warn of potential supply disruptions for smartphone and EV manufacturers globally.',
    classifiedCategory: 'geo-political',
    affectedGeography: 'China',
    affectedCompany: 'Rare Earth Mining Co.',
    severity: 8,
    processed: true,
  },
  {
    id: 'news_002',
    title: 'Taiwan Strait Military Exercises Disrupt Shipping Lanes',
    url: 'https://example.com/news/2',
    publishedAt: new Date('2024-01-14T12:00:00Z'),
    source: 'Bloomberg',
    rawContent: 'Military exercises in the Taiwan Strait have led to temporary rerouting of commercial vessels, causing delays of up to 72 hours for electronics components. PCB manufacturers in Taiwan face potential input material shortages as vessels await clearance.',
    classifiedCategory: 'geo-political',
    affectedGeography: 'Taiwan',
    affectedCompany: 'Advanced PCB Ltd.',
    severity: 7,
    processed: true,
  },
  {
    id: 'news_003',
    title: 'Major Cyber Attack Targets Semiconductor Supply Chain Networks',
    url: 'https://example.com/news/3',
    publishedAt: new Date('2024-01-13T06:00:00Z'),
    source: 'The Guardian',
    rawContent: 'A sophisticated ransomware attack has compromised supply chain management systems across multiple semiconductor firms in East Asia. Production scheduling and inventory management systems are offline, with recovery estimates ranging from 3-7 days.',
    classifiedCategory: 'cyber',
    affectedGeography: 'Taiwan, South Korea',
    affectedCompany: 'Advanced PCB Ltd., OLED Display Systems',
    severity: 9,
    processed: true,
  },
  {
    id: 'news_004',
    title: 'Singapore Port Authority Reports Record Congestion Amid Global Trade Surge',
    url: 'https://example.com/news/4',
    publishedAt: new Date('2024-01-12T14:00:00Z'),
    source: 'Financial Times',
    rawContent: 'The Port of Singapore is experiencing unprecedented congestion, with vessel waiting times exceeding 5 days. Electronics exporters face delays in final product delivery to European and American markets. Global logistics providers are implementing emergency rerouting via alternative ports.',
    classifiedCategory: 'logistics',
    affectedGeography: 'Singapore',
    affectedCompany: 'Global Logistics Hub',
    severity: 6,
    processed: true,
  },
  {
    id: 'news_005',
    title: 'Labor Unrest Grows at Major Electronics Assembly Facilities in Shenzhen',
    url: 'https://example.com/news/5',
    publishedAt: new Date('2024-01-11T09:00:00Z'),
    source: 'South China Morning Post',
    rawContent: 'Workers at several electronics assembly plants in Shenzhen have staged work stoppages demanding higher wages and improved conditions. Production at affected facilities has dropped by an estimated 30-40%. Management is in negotiations with worker representatives.',
    classifiedCategory: 'labor',
    affectedGeography: 'China',
    affectedCompany: 'Precision Assembly Corp.',
    severity: 7,
    processed: true,
  },
];

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  await prisma.mitigationStrategy.deleteMany();
  await prisma.riskEvent.deleteMany();
  await prisma.newsArticle.deleteMany();
  await prisma.simulationRun.deleteMany();
  await prisma.supplier.deleteMany();

  // Seed suppliers
  for (const supplier of SUPPLIERS) {
    await prisma.supplier.create({ data: supplier });
  }
  console.log(`✅ Created ${SUPPLIERS.length} suppliers`);

  // Seed news articles
  for (const article of NEWS_ARTICLES) {
    await prisma.newsArticle.create({ data: article });
  }
  console.log(`✅ Created ${NEWS_ARTICLES.length} news articles`);

  // Seed risk events
  const riskEvents = [
    { id: 're_001', supplierId: 'sup_001', newsArticleId: 'news_001', disruptionProbability: 0.72, impactScore: 8.1, reasoning: 'Export controls directly threaten rare earth supply continuity. High geopolitical risk probability based on regulatory actions.' },
    { id: 're_002', supplierId: 'sup_002', newsArticleId: 'news_002', disruptionProbability: 0.65, impactScore: 7.4, reasoning: 'Taiwan Strait tensions create significant shipping disruption risk for PCB component delivery.' },
    { id: 're_003', supplierId: 'sup_002', newsArticleId: 'news_003', disruptionProbability: 0.58, impactScore: 6.8, reasoning: 'Cyber attack on supply chain networks poses operational risk to PCB production scheduling.' },
    { id: 're_004', supplierId: 'sup_003', newsArticleId: 'news_003', disruptionProbability: 0.41, impactScore: 6.2, reasoning: 'OLED systems partially affected by regional cyber attack. Recovery expected within a week.' },
    { id: 're_005', supplierId: 'sup_004', newsArticleId: 'news_005', disruptionProbability: 0.55, impactScore: 9.0, reasoning: 'Labor unrest at assembly facility directly impacts production capacity. Highest impact given final assembly role.' },
    { id: 're_006', supplierId: 'sup_005', newsArticleId: 'news_004', disruptionProbability: 0.30, impactScore: 7.8, reasoning: 'Port congestion causes delivery delays but is manageable through alternative routing.' },
  ];

  for (const event of riskEvents) {
    await prisma.riskEvent.create({ data: event });
  }
  console.log(`✅ Created ${riskEvents.length} risk events`);

  console.log('🎉 Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
