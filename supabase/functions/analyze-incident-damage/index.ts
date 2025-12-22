import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AnalyzeRequest {
  incident_id: string;
}

interface LDDraftContent {
  incident_overview: {
    report_id: string;
    driver_email: string;
    ops_area: string;
    van_id: string;
    date_time: string;
    location: string;
  };
  incident_summary: string;
  reported_damage: string;
  ai_damage_review: {
    damaged_components: string[];
    severity: string;
    repair_complexity: string;
    cost_bucket: string;
    cost_range: string;
    notes: string;
  };
  consequence_guidance: {
    cost_tier: string;
    incident_number: string;
    suggested_consequences: string;
    performance_points_impact: string;
    additional_measures: string;
  };
  incident_history_flag: string;
  attachments: string[];
  open_items: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { incident_id }: AnalyzeRequest = await req.json();
    console.log("Analyzing incident:", incident_id);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch incident details
    const { data: incident, error: incidentError } = await supabase
      .from("van_incidents")
      .select("*, profiles:created_by_user_id(email, full_name)")
      .eq("id", incident_id)
      .single();

    if (incidentError || !incident) {
      console.error("Error fetching incident:", incidentError);
      throw new Error("Incident not found");
    }

    console.log("Fetched incident:", incident.id);

    // Fetch incident files (photos)
    const { data: files } = await supabase
      .from("van_incident_files")
      .select("*")
      .eq("incident_id", incident_id);

    const photoFiles = files?.filter(f => f.file_type.startsWith("image/")) || [];
    console.log("Found", photoFiles.length, "photos");

    // Count previous incidents this season for the same reporter
    const currentYear = new Date().getFullYear();
    const seasonStart = `${currentYear}-01-01`;
    
    const { count: previousIncidentCount } = await supabase
      .from("van_incidents")
      .select("*", { count: "exact", head: true })
      .eq("created_by_user_id", incident.created_by_user_id)
      .gte("incident_date", seasonStart)
      .lt("created_at", incident.created_at);

    const incidentCountThisSeason = (previousIncidentCount || 0) + 1;
    console.log("Incident count this season:", incidentCountThisSeason);

    // Get public URLs for photos
    const photoUrls: string[] = [];
    for (const file of photoFiles) {
      const { data: urlData } = supabase.storage
        .from("incident-files")
        .getPublicUrl(file.file_path);
      if (urlData?.publicUrl) {
        photoUrls.push(urlData.publicUrl);
      }
    }

    // Prepare AI analysis prompt
    const analysisPrompt = `You are an expert vehicle damage assessor for a European fleet management company. Analyze the provided incident report and photos to generate a damage assessment.

INCIDENT DETAILS:
- Van ID: ${incident.van_id}
- License Plate: ${incident.license_plate}
- Date/Time: ${incident.incident_date} at ${incident.incident_time}
- Location: ${incident.location_text}
- Weather: ${incident.weather}
- Description: ${incident.description}
- Vehicle Drivable: ${incident.vehicle_drivable ?? "Not specified"}
- Was Towed: ${incident.was_towed ?? "Not specified"}

${photoUrls.length > 0 ? `Photos have been provided for analysis.` : "No photos were provided."}

Based on the information and any visible damage in photos, provide your assessment in the following JSON format:
{
  "damaged_components": ["list of likely damaged components e.g. bumper, door panel, mirror, lights"],
  "severity": "cosmetic | structural | unclear",
  "repair_complexity": "low | medium | high",
  "cost_bucket": "under_1500 | 1500_to_3500 | over_3500",
  "cost_range_text": "Likely < €1,500 | Likely €1,500 – €3,500 | Likely > €3,500",
  "confidence": "high | medium | low",
  "notes": "Brief explanation of assessment, any limitations or uncertainties"
}

IMPORTANT:
- Use European repair cost assumptions
- Provide a range, never a single number
- If photos are insufficient or ambiguous, mark confidence as "low" and note limitations
- Be conservative in estimates - when uncertain, lean toward higher cost bucket`;

    // Build messages array with photos if available
    const messages: any[] = [
      { role: "system", content: "You are a vehicle damage assessment AI. Always respond with valid JSON only." }
    ];

    if (photoUrls.length > 0) {
      const userContent: any[] = [{ type: "text", text: analysisPrompt }];
      for (const url of photoUrls.slice(0, 5)) { // Limit to 5 photos
        userContent.push({
          type: "image_url",
          image_url: { url }
        });
      }
      messages.push({ role: "user", content: userContent });
    } else {
      messages.push({ role: "user", content: analysisPrompt });
    }

    // Call Lovable AI for damage analysis
    console.log("Calling AI for damage analysis...");
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      throw new Error(`AI analysis failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content || "";
    console.log("AI response received");

    // Parse AI response
    let aiAnalysis: any;
    try {
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = aiContent.match(/```json\s*([\s\S]*?)\s*```/) || 
                        aiContent.match(/```\s*([\s\S]*?)\s*```/) ||
                        [null, aiContent];
      aiAnalysis = JSON.parse(jsonMatch[1] || aiContent);
    } catch (e) {
      console.error("Failed to parse AI response:", aiContent);
      aiAnalysis = {
        damaged_components: [],
        severity: "unclear",
        repair_complexity: "medium",
        cost_bucket: "1500_to_3500",
        cost_range_text: "Unable to estimate reliably",
        confidence: "low",
        notes: "AI analysis could not be parsed. Manual review required."
      };
    }

    // Determine consequence guidance based on policy
    const getConsequenceGuidance = (costBucket: string, incidentNumber: number) => {
      let performancePoints = "";
      let additionalMeasures = "";

      if (incidentNumber === 1) {
        switch (costBucket) {
          case "under_1500":
            performancePoints = "Minor impact (per policy)";
            additionalMeasures = "Verbal warning recommended";
            break;
          case "1500_to_3500":
            performancePoints = "Moderate impact (per policy)";
            additionalMeasures = "Written warning may apply";
            break;
          case "over_3500":
            performancePoints = "Significant impact (per policy)";
            additionalMeasures = "Formal review required";
            break;
        }
      } else if (incidentNumber === 2) {
        performancePoints = "Additional 6 performance points for second incident";
        additionalMeasures = "Enhanced monitoring period required";
      } else {
        performancePoints = "Escalated review - multiple incidents";
        additionalMeasures = "High Risk – Escalated Review recommended";
      }

      return { performancePoints, additionalMeasures };
    };

    const consequence = getConsequenceGuidance(aiAnalysis.cost_bucket, incidentCountThisSeason);

    // Build LD Draft content
    const ldDraftContent: LDDraftContent = {
      incident_overview: {
        report_id: incident.id,
        driver_email: incident.profiles?.email || "Unknown",
        ops_area: incident.ops_area,
        van_id: incident.van_id,
        date_time: `${incident.incident_date} at ${incident.incident_time}`,
        location: incident.location_text,
      },
      incident_summary: incident.description,
      reported_damage: `Weather conditions: ${incident.weather}. ${incident.vehicle_drivable === false ? "Vehicle was NOT drivable." : ""} ${incident.was_towed ? "Vehicle was towed." : ""}`.trim(),
      ai_damage_review: {
        damaged_components: aiAnalysis.damaged_components || [],
        severity: aiAnalysis.severity || "unclear",
        repair_complexity: aiAnalysis.repair_complexity || "medium",
        cost_bucket: aiAnalysis.cost_bucket || "1500_to_3500",
        cost_range: aiAnalysis.cost_range_text || "Unable to estimate",
        notes: aiAnalysis.notes || "",
      },
      consequence_guidance: {
        cost_tier: aiAnalysis.cost_bucket || "1500_to_3500",
        incident_number: incidentCountThisSeason === 1 ? "First incident this season" : 
                        incidentCountThisSeason === 2 ? "Second incident this season" : 
                        `${incidentCountThisSeason}th incident this season`,
        suggested_consequences: `Based on ${aiAnalysis.cost_range_text} cost estimate and incident #${incidentCountThisSeason}`,
        performance_points_impact: consequence.performancePoints,
        additional_measures: consequence.additionalMeasures,
      },
      incident_history_flag: incidentCountThisSeason === 1 ? "First incident this season" :
                            incidentCountThisSeason === 2 ? "Second incident this season → additional penalties may apply" :
                            "Third or subsequent incident → escalated review recommended",
      attachments: photoFiles.map(f => f.file_name),
      open_items: [
        ...(photoUrls.length === 0 ? ["No photos provided - manual inspection required"] : []),
        ...(aiAnalysis.confidence === "low" ? ["AI confidence is low - manual review recommended"] : []),
        "Final repair costs to be confirmed with invoice",
        "Driver statement to be verified",
      ],
    };

    // Update incident with analysis results
    const { error: updateError } = await supabase
      .from("van_incidents")
      .update({
        ai_cost_bucket: aiAnalysis.cost_bucket,
        ai_severity: aiAnalysis.severity,
        ai_confidence: aiAnalysis.confidence,
        ai_damaged_components: aiAnalysis.damaged_components,
        ai_analysis_notes: aiAnalysis.notes,
        ld_draft_status: "generated",
        ld_draft_content: ldDraftContent,
        ld_draft_generated_at: new Date().toISOString(),
        driver_incident_count_this_season: incidentCountThisSeason,
      })
      .eq("id", incident_id);

    if (updateError) {
      console.error("Error updating incident:", updateError);
      throw new Error("Failed to save analysis results");
    }

    console.log("Analysis complete and saved");

    return new Response(
      JSON.stringify({
        success: true,
        incident_id,
        ai_cost_bucket: aiAnalysis.cost_bucket,
        incident_count_this_season: incidentCountThisSeason,
        ld_draft_status: "generated",
        confidence_level: aiAnalysis.confidence,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in analyze-incident-damage:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
