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

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supplier = await prisma.supplier.findUniqueOrThrow({ where: { id: params.id } });
    return NextResponse.json({ success: true, data: parseSupplier(supplier) });
  } catch {
    const mock = MOCK_SUPPLIERS.find((s) => s.id === params.id);
    if (mock) return NextResponse.json({ success: true, data: mock, usedMockData: true });
    return NextResponse.json({ success: false, error: 'Supplier not found' }, { status: 404 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const updateData: Record<string, unknown> = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.tier !== undefined) updateData.tier = body.tier;
    if (body.lat !== undefined) updateData.lat = body.lat;
    if (body.lng !== undefined) updateData.lng = body.lng;
    if (body.country !== undefined) updateData.country = body.country;
    if (body.region !== undefined) updateData.region = body.region;
    if (body.categoryExposure !== undefined) updateData.categoryExposure = JSON.stringify(body.categoryExposure);
    if (body.upstreamIds !== undefined) updateData.upstreamIds = JSON.stringify(body.upstreamIds);
    if (body.downstreamIds !== undefined) updateData.downstreamIds = JSON.stringify(body.downstreamIds);
    if (body.currentRiskScore !== undefined) updateData.currentRiskScore = body.currentRiskScore;
    if (body.currentImpactScore !== undefined) updateData.currentImpactScore = body.currentImpactScore;
    if (body.description !== undefined) updateData.description = body.description;

    const supplier = await prisma.supplier.update({
      where: { id: params.id },
      data: updateData,
    });
    return NextResponse.json({ success: true, data: parseSupplier(supplier) });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.supplier.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
