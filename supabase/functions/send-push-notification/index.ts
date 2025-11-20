import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushSubscription {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify admin authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Not authenticated' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      console.error('Authentication error:', userError);
      return new Response(
        JSON.stringify({ error: 'Not authenticated' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Check admin role
    const { data: roleData } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!roleData) {
      console.error('User is not admin:', user.id);
      return new Response(
        JSON.stringify({ error: 'Unauthorized - admin access required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    const { title, body, data, isTest = false, testUserId = null } = await req.json();

    if (!title || !body) {
      return new Response(
        JSON.stringify({ error: 'Title and body are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Get push subscriptions - either all or just test user's
    let query = supabaseClient.from('push_subscriptions').select('*');
    
    if (isTest && testUserId) {
      query = query.eq('user_id', testUserId);
    }
    
    const { data: subscriptions, error: fetchError } = await query;

    if (fetchError) {
      console.error('Error fetching subscriptions:', fetchError);
      throw fetchError;
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No subscriptions found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');

    if (!vapidPrivateKey || !vapidPublicKey) {
      throw new Error('VAPID keys not configured');
    }

    const payload = JSON.stringify({
      title,
      body,
      data: data || {},
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
    });

    // Send notifications to all subscriptions
    const results = await Promise.allSettled(
      subscriptions.map(async (subscription: PushSubscription) => {
        try {
          // Use web-push library via import
          const webpush = await import('https://esm.sh/web-push@3.6.6');
          
          webpush.setVapidDetails(
            'mailto:support@example.com',
            vapidPublicKey,
            vapidPrivateKey
          );

          await webpush.sendNotification(
            {
              endpoint: subscription.endpoint,
              keys: {
                p256dh: subscription.p256dh,
                auth: subscription.auth,
              },
            },
            payload
          );

          console.log(`Notification sent to subscription ${subscription.id}`);
          return { success: true, subscriptionId: subscription.id };
        } catch (error) {
          const err = error as any;
          console.error(`Failed to send to subscription ${subscription.id}:`, err);
          
          // If subscription is no longer valid, delete it
          if (err.statusCode === 410 || err.statusCode === 404) {
            await supabaseClient
              .from('push_subscriptions')
              .delete()
              .eq('id', subscription.id);
            console.log(`Deleted invalid subscription ${subscription.id}`);
          }
          
          return { success: false, subscriptionId: subscription.id, error: err.message || 'Unknown error' };
        }
      })
    );

    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.length - successful;

    // Save statistics
    await supabaseClient
      .from('notification_statistics')
      .insert({
        title,
        body,
        successful_count: successful,
        failed_count: failed,
        total_recipients: results.length,
        sent_by: user.id,
        is_test: isTest,
      });

    return new Response(
      JSON.stringify({
        message: 'Notifications sent',
        successful,
        failed,
        total: results.length,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    const err = error as Error;
    console.error('Error in send-push-notification function:', err);
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
