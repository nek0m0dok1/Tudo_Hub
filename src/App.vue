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

<style scoped src="./styles/App.css"></style>
