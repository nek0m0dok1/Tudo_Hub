<script setup>
import { computed } from "vue";
import PostCard from "./PostCard.vue";
import PostForm from "./PostForm.vue";
const props = defineProps({
  teams: { type: Array, default: () => [] },
  selectedTeamId: { type: String, default: "" },
  ideas: { type: Array, default: () => [] },
});
const emit = defineEmits(["update:selectedTeamId", "posted", "updated"]);
const selectedTeam = computed(() =>
  props.teams.find((team) => team.id === props.selectedTeamId),
);
</script>
<template>
  <main class="idea-board">
    <label class="team-selector" for="team-select">チーム</label
    ><select
      id="team-select"
      :value="selectedTeamId"
      @change="emit('update:selectedTeamId', $event.target.value)"
    >
      <option v-for="team in teams" :key="team.id" :value="team.id">
        {{ team.name }}
      </option>
    </select>
    <p v-if="selectedTeam" class="team-invite-code">
      招待コード: <strong>{{ selectedTeam.invite_code }}</strong>
    </p>
    <p v-if="!teams.length" class="team-empty">
      所属しているチームがありません。
    </p>
    <PostForm
      v-if="selectedTeamId"
      :team-id="selectedTeamId"
      @posted="emit('posted')"
    />
    <div class="post-list">
      <PostCard
        v-for="idea in ideas"
        :key="idea.id"
        :idea="idea"
        @updated="emit('updated')"
      />
    </div>
  </main>
</template>
<style scoped>
.idea-board {
  flex: 0 1 600px;
  min-width: 0;
  max-width: 600px;
  margin: 40px 0;
}
select {
  width: 100%;
  margin-top: 4px;
  padding: 8px 12px;
  box-sizing: border-box;
}
.team-invite-code {
  margin: 12px 0 16px;
  font-size: 14px;
}
.team-invite-code strong {
  color: var(--text-h);
  letter-spacing: 1px;
}
.team-empty {
  text-align: left;
}
.post-list {
  width: 100%;
}
@media (max-width: 760px) {
  .idea-board {
    width: 100%;
    max-width: 600px;
    margin-bottom: 24px;
  }
}
</style>
