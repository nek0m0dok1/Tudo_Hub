import { ref } from "vue";
import { supabase } from "../supabase";

export function useIdeas(selectedTeamId) {
  const ideas = ref([]);

  const fetchIdeas = async () => {
    if (!selectedTeamId.value) {
      ideas.value = [];
      return;
    }
    const { data, error } = await supabase
      .from("ideas")
      .select("id, title, user_id, team_id, url, likes")
      .eq("team_id", selectedTeamId.value)
      .order("id", { ascending: false });
    if (error) {
      console.error("Error fetching ideas:", error.message);
      return;
    }
    const userIds = [...new Set((data ?? []).map((idea) => idea.user_id))];
    const { data: profiles, error: profileError } = userIds.length
      ? await supabase
          .from("profiles")
          .select("user_id, display_name")
          .in("user_id", userIds)
      : { data: [], error: null };
    if (profileError)
      console.error("Error fetching profiles:", profileError.message);
    const displayNames = new Map(
      (profiles ?? []).map((profile) => [
        profile.user_id,
        profile.display_name,
      ]),
    );
    ideas.value = (data ?? []).map((idea) => ({
      ...idea,
      display_name: displayNames.get(idea.user_id),
    }));
  };

  return { ideas, fetchIdeas };
}
