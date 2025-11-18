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

    // Check if user is business owner
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('user_type, credits')
      .eq('id', user.id)
      .single();

    if (profile?.user_type !== 'business') {
      throw new Error('Only business owners can add places');
    }

    if (profile.credits < 15) {
      throw new Error('Insufficient credits. You need 15 credits to add a place.');
    }

    const placeData = await req.json();

    // Create place
    const { data: place, error: placeError } = await supabaseClient
      .from('places')
      .insert({
        ...placeData,
        owner_id: user.id,
      })
      .select()
      .single();

    if (placeError) throw placeError;

    // Deduct credits
    const { error: updateError } = await supabaseClient
      .from('profiles')
      .update({ credits: profile.credits - 15 })
      .eq('id', user.id);

    if (updateError) throw updateError;

    // Log transaction
    await supabaseClient.from('credit_transactions').insert({
      user_id: user.id,
      amount: -15,
      type: 'place_added',
      description: `Added place: ${placeData.name}`,
    });

    return new Response(
      JSON.stringify({ place }),
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