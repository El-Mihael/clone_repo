import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabaseClient.auth.getUser(token);

    if (!user) {
      throw new Error('Not authenticated');
    }

    const { tourId } = await req.json();

    // Get user profile
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('credits')
      .eq('id', user.id)
      .single();

    if (!profile || profile.credits < 10) {
      throw new Error('Insufficient credits. You need 10 credits to purchase a tour.');
    }

    // Check if already purchased
    const { data: existing } = await supabaseClient
      .from('purchased_tours')
      .select('id')
      .eq('user_id', user.id)
      .eq('tour_id', tourId)
      .single();

    if (existing) {
      throw new Error('You have already purchased this tour');
    }

    // Create purchase
    const { data: purchase, error: purchaseError } = await supabaseClient
      .from('purchased_tours')
      .insert({
        user_id: user.id,
        tour_id: tourId,
      })
      .select()
      .single();

    if (purchaseError) throw purchaseError;

    // Deduct credits
    const { error: updateError } = await supabaseClient
      .from('profiles')
      .update({ credits: profile.credits - 10 })
      .eq('id', user.id);

    if (updateError) throw updateError;

    // Get tour name for transaction
    const { data: tour } = await supabaseClient
      .from('tours')
      .select('name')
      .eq('id', tourId)
      .single();

    // Log transaction
    await supabaseClient.from('credit_transactions').insert({
      user_id: user.id,
      amount: -10,
      type: 'tour_purchased',
      description: `Purchased tour: ${tour?.name || 'Unknown'}`,
    });

    return new Response(
      JSON.stringify({ purchase }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});