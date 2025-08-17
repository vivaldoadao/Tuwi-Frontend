import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// 🧪 Endpoint para ver todos os braiders e seus status
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Buscar todos os braiders (approved e pending)
    const { data: allBraiders, error } = await supabase
      .from('braiders')
      .select('id, user_name, status, district, concelho, freguesia, location')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const approved = allBraiders?.filter(b => b.status === 'approved') || [];
    const pending = allBraiders?.filter(b => b.status === 'pending') || [];
    
    const approvedWithDistrict = approved.filter(b => b.district);
    const pendingWithDistrict = pending.filter(b => b.district);

    return NextResponse.json({
      status: 'success',
      data: {
        total: allBraiders?.length || 0,
        approved: approved.length,
        pending: pending.length,
        approvedWithDistrict: approvedWithDistrict.length,
        pendingWithDistrict: pendingWithDistrict.length,
        approvedSample: approved.slice(0, 3).map(b => ({
          name: b.user_name || `ID: ${b.id.slice(0, 8)}`,
          status: b.status,
          district: b.district,
          concelho: b.concelho,
          location: b.location
        })),
        allDistrictsFound: Array.from(new Set(
          allBraiders?.filter(b => b.district).map(b => b.district) || []
        )).sort()
      }
    });

  } catch (error) {
    console.error('❌ Erro:', error);
    return NextResponse.json(
      { error: 'Erro interno' },
      { status: 500 }
    );
  }
}