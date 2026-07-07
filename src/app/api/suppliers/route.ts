import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { MOCK_SUPPLIERS } from '@/lib/mock-data';
import type { Supplier } from '@/types';

function parseSupplier(s: {
  id: string;
  name: string;
  tier: number;
  lat: number;
  lng: number;
  country: string;
  region: string;
  categoryExposure: string;
  upstreamIds: string;
  downstreamIds: string;
  currentRiskScore: number;
  currentImpactScore: number;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}): Supplier {
  return {
    ...s,
    categoryExposure: JSON.parse(s.categoryExposure),
    upstreamIds: JSON.parse(s.upstreamIds),
    downstreamIds: JSON.parse(s.downstreamIds),
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  };
}

export async function GET() {
  try {
    const suppliers = await prisma.supplier.findMany({ orderBy: { tier: 'asc' } });
    return NextResponse.json({ success: true, data: suppliers.map(parseSupplier) });
  } catch {
    // DB not initialized — fall back to mock data
    return NextResponse.json({
      success: true,
      data: MOCK_SUPPLIERS,
      usedMockData: true,
    });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const supplier = await prisma.supplier.create({
      data: {
        name: body.name,
        tier: body.tier,
        lat: body.lat,
        lng: body.lng,
        country: body.country,
        region: body.region,
        categoryExposure: JSON.stringify(body.categoryExposure ?? []),
        upstreamIds: JSON.stringify(body.upstreamIds ?? []),
        downstreamIds: JSON.stringify(body.downstreamIds ?? []),
        description: body.description ?? '',
      },
    });
    return NextResponse.json({ success: true, data: parseSupplier(supplier) });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
