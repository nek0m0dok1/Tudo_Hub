<script setup>
import { onMounted, onUnmounted, watch } from "vue";
import AuthPanel from "./components/AuthPanel.vue";
import IdeaBoard from "./components/IdeaBoard.vue";
import TeamPanel from "./components/TeamPanel.vue";
import { useAuth } from "./composables/useAuth";
import { useIdeas } from "./composables/useIdeas";
import { useTeams } from "./composables/useTeams";

const auth = useAuth();
const teams = useTeams();
const { ideas, fetchIdeas } = useIdeas(teams.selectedTeamId);
let authSubscription;
const refreshIdeas = () => void fetchIdeas();
const joinTeam = (code) => teams.joinTeam(code, auth.user.value.id);
const handleTeamCreated = async (teamId) => {
  await teams.fetchTeams(auth.user.value.id);
  teams.selectedTeamId.value = teamId;
};

watch(teams.selectedTeamId, refreshIdeas);
watch(auth.user, (user) => {
  if (!user) {
    teams.teams.value = [];
    teams.selectedTeamId.value = "";
    ideas.value = [];
  }
});
onMounted(async () => {
  authSubscription = await auth.initialize(teams.fetchTeams);
  await fetchIdeas();
});
onUnmounted(() => authSubscription?.unsubscribe());
</script>

<template>
  <h1 class="page-title">Tudo Hub</h1>
  <div class="app-layout">
    <IdeaBoard
      v-if="auth.session.value"
      :teams="teams.teams.value"
      :selected-team-id="teams.selectedTeamId.value"
      :ideas="ideas"
      @update:selected-team-id="teams.selectedTeamId.value = $event"
      @posted="refreshIdeas"
      @updated="refreshIdeas"
    />
    <aside class="side-column">
      <AuthPanel
        :user="auth.user.value"
        :profile="auth.profile.value"
        :display-name="auth.displayName.value"
        :loading="auth.loading.value"
        :auth-error="auth.authError.value"
        @sign-in="auth.signInWithDiscord"
        @sign-out="auth.signOut"
      />
      <TeamPanel
        v-if="auth.user.value"
        :user="auth.user.value"
        :teams="teams.teams.value"
        :selected-team-id="teams.selectedTeamId.value"
        :joining-team="teams.joiningTeam.value"
        :join-team-error="teams.joinTeamError.value"
        @update:selected-team-id="teams.selectedTeamId.value = $event"
        @join="joinTeam"
        @team-created="handleTeamCreated"
      />
    </aside>
  </div>
</template>

<style scoped>
.page-title {
  width: 100%;
  margin: 24px 0 0;
  text-align: center;
}
.app-layout {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  box-sizing: border-box;
  display: flex;
  gap: 24px;
  align-items: flex-start;
  justify-content: center;
}
.side-column {
  flex: 0 1 360px;
  width: 100%;
  max-width: 360px;
}
@media (max-width: 760px) {
  .app-layout {
    flex-direction: column;
    align-items: center;
    gap: 0;
  }
  .side-column {
    max-width: 600px;
  }
}
</style>
