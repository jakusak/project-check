import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { filePath } = await req.json();
    
    if (!filePath) {
      return new Response(
        JSON.stringify({ success: false, error: 'File path is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Create Supabase client to get the file URL
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get public URL for the file
    const { data: urlData } = supabase.storage
      .from('fleet-notices')
      .getPublicUrl(filePath);

    const fileUrl = urlData.publicUrl;
    console.log('Processing file:', fileUrl);

    const systemPrompt = `You are an expert document analyzer specializing in traffic violations, parking tickets, speeding fines, and toll notices. 
    
Your task is to extract key information from violation/fine documents. Analyze the image carefully and extract all available fields.

IMPORTANT: 
- For dates, use ISO format (YYYY-MM-DD)
- For amounts, extract just the numeric value
- For notice_type, classify as one of: speeding, parking, restricted_zone, toll_fine, unknown
- Be accurate and only extract what you can clearly identify
- If a field is not visible or unclear, set it to null`;

    const userPrompt = `Analyze this violation/fine document image and extract the following information in JSON format:

{
  "notice_type": "speeding | parking | restricted_zone | toll_fine | unknown",
  "fine_amount": number or null,
  "currency": "EUR | USD | GBP | CHF" or null,
  "violation_date": "YYYY-MM-DD" or null,
  "violation_time": "HH:MM" or null,
  "deadline_date": "YYYY-MM-DD" or null,
  "license_plate": "string" or null,
  "violation_location": "string" or null,
  "reference_number": "string" or null,
  "issuing_authority": "string" or null,
  "country": "string (2-letter country code)" or null,
  "raw_text_summary": "brief summary of the document content"
}

Only return the JSON object, no additional text.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { 
            role: "user", 
            content: [
              { type: "text", text: userPrompt },
              { type: "image_url", image_url: { url: fileUrl } }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: 'AI credits exhausted. Please add funds.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;
    
    console.log('AI response content:', content);

    // Parse the JSON from the response
    let extractedData;
    try {
      // Try to extract JSON from the response (it might be wrapped in markdown code blocks)
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      const jsonString = jsonMatch[1]?.trim() || content.trim();
      extractedData = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to parse document. Please try again or enter details manually.',
          raw_response: content 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Extracted data:', extractedData);

    return new Response(
      JSON.stringify({ success: true, data: extractedData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in extract-fleet-notice:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
