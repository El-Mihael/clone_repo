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
      .select('owner_id, is_premium, premium_expires_at')
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

    // Get place subscription to check billing period
    const { data: subscription } = await supabaseClient
      .from('user_subscriptions')
      .select('next_billing_date, plan_id, subscription_plans(billing_period)')
      .eq('place_id', placeId)
      .eq('is_active', true)
      .single();

    if (!subscription) {
      throw new Error('No active subscription found for this place');
    }

      // Check if enabling premium
    if (isPremium && !place.is_premium) {
      // Check if premium was cancelled but period hasn't expired yet
      const now = new Date();
      if (place.premium_expires_at && new Date(place.premium_expires_at) > now) {
        // Premium is still active in current period, just re-enable it
        await supabaseClient
          .from('places')
          .update({ 
            is_premium: true,
            premium_expires_at: place.premium_expires_at // Keep existing expiration
          })
          .eq('id', placeId);

        // Re-enable premium in subscription (remove cancellation)
        await supabaseClient
          .from('user_subscriptions')
          .update({ cancel_at_period_end: false })
          .eq('place_id', placeId)
          .eq('is_active', true);

        return new Response(
          JSON.stringify({ 
            place: { ...place, is_premium: true },
            message: 'Premium re-enabled for current period'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // New premium activation - deduct credits
      if (profile.credits < 8) {
        throw new Error('Insufficient credits. You need 8 credits to make place premium.');
      }

      // Calculate premium expiration based on subscription billing period
      const nextBilling = new Date(subscription.next_billing_date);

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
        description: `Enabled premium for place until ${nextBilling.toISOString()}`,
      });

      // Update place with premium and expiration
      const { data: updatedPlace, error: updateError } = await supabaseClient
        .from('places')
        .update({ 
          is_premium: true,
          premium_expires_at: nextBilling.toISOString()
        })
        .eq('id', placeId)
        .select()
        .single();

      if (updateError) throw updateError;

      return new Response(
        JSON.stringify({ place: updatedPlace }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (!isPremium && place.is_premium) {
      // Disabling premium - set cancellation flag, don't return credits
      // Premium will stay active until current period ends
      
      // Mark subscription for cancellation at period end
      await supabaseClient
        .from('user_subscriptions')
        .update({ cancel_at_period_end: true })
        .eq('place_id', placeId)
        .eq('is_active', true);
      
      const { data: updatedPlace, error: updateError } = await supabaseClient
        .from('places')
        .update({ 
          is_premium: true, // Keep premium active
          premium_expires_at: place.premium_expires_at || subscription.next_billing_date
        })
        .eq('id', placeId)
        .select()
        .single();

      if (updateError) throw updateError;

      return new Response(
        JSON.stringify({ 
          place: updatedPlace,
          message: 'Premium will be cancelled at period end',
          expires_at: place.premium_expires_at || subscription.next_billing_date
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If we get here, no changes were needed
    return new Response(
      JSON.stringify({ place }),
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