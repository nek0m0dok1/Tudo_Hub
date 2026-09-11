<script setup>
import { ref, watch } from "vue";
import { supabase } from "../supabase";
import BaseModal from "./BaseModal.vue";

const props = defineProps({
  user: {
    type: Object,
    default: null,
  },
  visible: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["close", "team-created"]);

const teamName = ref("");
const teamInviteCode = ref("");
const creatingTeam = ref(false);
const teamError = ref("");

const generateInviteCode = () =>
  crypto.randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase();

const resetForm = () => {
  teamName.value = "";
  teamInviteCode.value = generateInviteCode();
  teamError.value = "";
};

watch(
  () => props.visible,
  (visible) => {
    if (visible) resetForm();
  },
);

const closeTeamModal = () => {
  if (creatingTeam.value) return;
  emit("close");
};

const createTeam = async () => {
  const name = teamName.value.trim();
  if (!name || !props.user) {
    teamError.value = "チーム名を入力してください。";
    return;
  }

  creatingTeam.value = true;
  teamError.value = "";

  const { data: team, error: teamErrorResponse } = await supabase
    .from("teams")
    .insert({ name, invite_code: teamInviteCode.value })
    .select("id, name")
    .single();

  if (teamErrorResponse) {
    teamError.value = "チームを作成できませんでした。";
    console.error("Error creating team:", teamErrorResponse.message);
    creatingTeam.value = false;
    return;
  }

  const { error: memberError } = await supabase.from("team_members").insert({
    team_id: team.id,
    user_id: props.user.id,
  });

  if (memberError) {
    teamError.value = `チームは作成されましたが、所属登録に失敗しました: ${memberError.message}`;
    console.error("Error adding team member:", memberError.message);
    creatingTeam.value = false;
    return;
  }

  emit("team-created", team.id);
  creatingTeam.value = false;
};
</script>
<template>
  <BaseModal
    :visible="visible"
    title="チームを新規作成"
    title-id="team-modal-title"
    :close-disabled="creatingTeam"
    @close="closeTeamModal"
  >
    <form
      id="create-team-form"
      @submit.prevent="createTeam"
    >
      <label
        class="team-name-field"
        for="new-team-name"
      >
        チーム名
        <input
          id="new-team-name"
          v-model="teamName"
          type="text"
          maxlength="50"
          placeholder="例：開発チーム"
          :disabled="creatingTeam"
          autofocus
        >
      </label>
      <label
        class="team-name-field"
        for="new-team-invite-code"
      >
        招待コード
        <input
          id="new-team-invite-code"
          :value="teamInviteCode"
          type="text"
          readonly
        >
      </label>
      <p
        v-if="teamError"
        class="team-error"
        role="alert"
      >
        {{ teamError }}
      </p>
    </form>
    <template #footer>
      <button
        type="button"
        class="modal-cancel"
        :disabled="creatingTeam"
        @click="closeTeamModal"
      >
        キャンセル
      </button>
      <button
        type="submit"
        form="create-team-form"
        class="modal-submit"
        :disabled="creatingTeam"
      >
        {{ creatingTeam ? "作成中..." : "作成する" }}
      </button>
    </template>
  </BaseModal>
</template>

<style scoped>
.team-name-field {
  display: block;
  color: var(--text-h);
  font-size: 15px;
  font-weight: 600;
}

.team-name-field input {
  width: 100%;
  margin-top: 6px;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--bg);
  color: var(--text-h);
  box-sizing: border-box;
  font: inherit;
  font-size: 16px;
}

.team-name-field input:focus {
  outline: 2px solid var(--accent);
  outline-offset: 1px;
}

.team-error {
  margin-top: 8px;
  color: #c0392b;
  font-size: 14px;
}

.modal-cancel,
.modal-submit {
  padding: 9px 14px;
  border-radius: 6px;
  cursor: pointer;
  font: inherit;
  font-size: 15px;
}

.modal-cancel {
  border: 1px solid var(--border);
  color: var(--text);
  background: transparent;
}

.modal-submit {
  border: 1px solid var(--accent);
  color: #fff;
  background: var(--accent);
}

.modal-cancel:disabled,
.modal-submit:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}
</style>