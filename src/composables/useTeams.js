import { ref } from "vue";
import { supabase } from "../supabase";

export function useTeams() {
  const teams = ref([]);
  const selectedTeamId = ref("");
  const joiningTeam = ref(false);
  const joinTeamError = ref("");

  const fetchTeams = async (userId) => {
    const { data: memberships, error: membershipError } = await supabase
      .from("team_members")
      .select("team_id")
      .eq("user_id", userId);
    if (membershipError) {
      console.error(
        "Error fetching team memberships:",
        membershipError.message,
      );
      teams.value = [];
      selectedTeamId.value = "";
      return;
    }
    const teamIds = memberships.map((membership) => membership.team_id);
    if (!teamIds.length) {
      teams.value = [];
      selectedTeamId.value = "";
      return;
    }
    const { data, error } = await supabase
      .from("teams")
      .select("id, name, invite_code")
      .in("id", teamIds)
      .order("name");
    if (error) {
      console.error("Error fetching teams:", error.message);
      return;
    }
    teams.value = data ?? [];
    if (!teams.value.some((team) => team.id === selectedTeamId.value)) {
      selectedTeamId.value = teams.value[0]?.id ?? "";
    }
  };

  const joinTeam = async (code, userId) => {
    const normalizedCode = code.trim().toUpperCase();
    if (!normalizedCode || !userId) {
      joinTeamError.value = "招待コードを入力してください。";
      return null;
    }
    joiningTeam.value = true;
    joinTeamError.value = "";
    const { data: teamId, error } = await supabase.rpc(
      "join_team_by_invite_code",
      {
        invite_code_input: normalizedCode,
      },
    );
    if (error) {
      joinTeamError.value = error.message.includes("Invalid invite code")
        ? "招待コードが正しくありません。"
        : "チームへの参加に失敗しました。";
      console.error("Error joining team:", error.message);
      joiningTeam.value = false;
      return null;
    }
    await fetchTeams(userId);
    selectedTeamId.value = teamId;
    joiningTeam.value = false;
    return teamId;
  };

  const createTeam = async (name, inviteCode, userId) => {
    const { data: team, error } = await supabase
      .from("teams")
      .insert({ name, invite_code: inviteCode })
      .select("id, name")
      .single();
    if (error) return { error };
    const { error: memberError } = await supabase.from("team_members").insert({
      team_id: team.id,
      user_id: userId,
    });
    return { team, error: memberError };
  };

  return {
    teams,
    selectedTeamId,
    joiningTeam,
    joinTeamError,
    fetchTeams,
    joinTeam,
    createTeam,
  };
}
