import { supabase } from "@/integrations/supabase/client";

interface TaskNotificationPayload {
  taskTitle: string;
  taskType: "facility" | "ops_task" | "supply";
  priority: string;
  requestedBy?: string;
  description?: string;
  category?: string;
}

export async function sendTaskNotification(payload: TaskNotificationPayload) {
  try {
    const { error } = await supabase.functions.invoke("send-task-notification", {
      body: payload,
    });
    if (error) console.error("Task notification error:", error);
  } catch (err) {
    console.error("Failed to send task notification:", err);
  }
}
