import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/admin/versions
 * List all versions
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20');

    const versions = await prisma.questionnaireVersion.findMany({
      orderBy: { version: 'desc' },
      take: limit,
      select: {
        id: true,
        version: true,
        isActive: true,
        createdAt: true,
        createdBy: true,
        description: true,
      },
    });

    return NextResponse.json({
      success: true,
      versions,
      total: versions.length,
    });
  } catch (error) {
    console.error('Error fetching versions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch versions' },
      { status: 500 }
    );
  }
}
