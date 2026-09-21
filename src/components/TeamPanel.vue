<script setup>
import { ref } from "vue";
import TeamCreateModal from "./TeamCreateModal.vue";
defineProps({
  user: { type: Object, default: null },
  teams: { type: Array, default: () => [] },
  selectedTeamId: { type: String, default: "" },
  joiningTeam: { type: Boolean, default: false },
  joinTeamError: { type: String, default: "" },
});
const emit = defineEmits(["update:selectedTeamId", "join", "team-created"]);
const joinInviteCode = ref("");
const showTeamModal = ref(false);
</script>
<template>
  <section class="team-panel">
    <p v-if="teams.length === 0" class="team-empty">
      所属しているチームがありません。
    </p>
    <button
      v-if="user"
      class="create-team-button"
      @click="showTeamModal = true"
    >
      チームを新規作成
    </button>
    <form
      v-if="user"
      class="join-team-form"
      @submit.prevent="emit('join', joinInviteCode)"
    >
      <label class="team-name-field" for="join-team-code"
        >招待コード<input
          id="join-team-code"
          v-model="joinInviteCode"
          type="text"
          maxlength="8"
          placeholder="招待コード"
          :disabled="joiningTeam"
      /></label>
      <p v-if="joinTeamError" class="team-error" role="alert">
        {{ joinTeamError }}
      </p>
      <button class="modal-submit" type="submit" :disabled="joiningTeam">
        {{ joiningTeam ? "参加中..." : "チームに参加" }}
      </button>
    </form>
    <TeamCreateModal
      :user="user"
      :visible="showTeamModal"
      @close="showTeamModal = false"
      @team-created="emit('team-created', $event)"
    />
  </section>
</template>
<style scoped>
.team-panel {
  width: 100%;
  box-sizing: border-box;
}
select {
  width: 100%;
  margin-top: 4px;
  padding: 8px 12px;
  box-sizing: border-box;
}
.team-empty {
  margin-bottom: 12px;
  text-align: left;
}
.create-team-button,
.join-team-form {
  width: 100%;
  margin-top: 12px;
  box-sizing: border-box;
}
.create-team-button {
  padding: 10px 16px;
  border: 1px solid var(--accent);
  border-radius: 6px;
  color: var(--accent);
  background: transparent;
  cursor: pointer;
  font-weight: 600;
}
.join-team-form {
  padding: 16px;
  border: 1px solid var(--border);
  border-radius: 8px;
  text-align: left;
}
.team-name-field {
  display: block;
  color: var(--text-h);
  font-size: 15px;
  font-weight: 600;
}
input {
  width: 100%;
  margin-top: 6px;
  padding: 10px 12px;
  box-sizing: border-box;
  font: inherit;
}
.team-error {
  color: #c0392b;
}
.modal-submit {
  display: block;
  margin: 12px auto 0;
  padding: 9px 14px;
  border: 1px solid var(--accent);
  border-radius: 6px;
  color: #fff;
  background: var(--accent);
  cursor: pointer;
  font: inherit;
}
</style>
