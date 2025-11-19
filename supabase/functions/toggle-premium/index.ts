import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { corsHeaders } from '../_shared/cors.ts';

const togglePremiumSchema = z.object({
  placeId: z.string().uuid('Invalid place ID'),
  isPremium: z.boolean(),
});

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

    const requestData = await req.json();
    const { placeId, isPremium } = togglePremiumSchema.parse(requestData);

    // Get place and verify ownership
    const { data: place } = await supabaseClient
      .from('places')
      .select('owner_id, is_premium')
      .eq('id', placeId)
      .single();

    if (!place || place.owner_id !== user.id) {
      throw new Error('Place not found or you do not own this place');
    }

    // Get user profile
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('credits')
      .eq('id', user.id)
      .single();

    if (!profile) {
      throw new Error('Profile not found');
    }

    // Check if enabling premium
    if (isPremium && !place.is_premium) {
      if (profile.credits < 8) {
        throw new Error('Insufficient credits. You need 8 credits to make place premium.');
      }

      // Deduct credits
      await supabaseClient
        .from('profiles')
        .update({ credits: profile.credits - 8 })
        .eq('id', user.id);

      // Log transaction
      await supabaseClient.from('credit_transactions').insert({
        user_id: user.id,
        amount: -8,
        type: 'premium_enabled',
        description: `Enabled premium for place`,
      });
    } else if (!isPremium && place.is_premium) {
      // Return credits when disabling premium
      await supabaseClient
        .from('profiles')
        .update({ credits: profile.credits + 8 })
        .eq('id', user.id);

      // Log transaction
      await supabaseClient.from('credit_transactions').insert({
        user_id: user.id,
        amount: 8,
        type: 'premium_disabled',
        description: `Disabled premium for place`,
      });
    }

    // Update place
    const { data: updatedPlace, error: updateError } = await supabaseClient
      .from('places')
      .update({ is_premium: isPremium })
      .eq('id', placeId)
      .select()
      .single();

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({ place: updatedPlace }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid input', 
          details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});