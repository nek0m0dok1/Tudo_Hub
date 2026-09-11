<script setup>
import { onMounted, onUnmounted } from "vue";

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    required: true,
  },
  titleId: {
    type: String,
    default: "base-modal-title",
  },
  closeDisabled: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["close"]);

const close = () => {
  if (!props.closeDisabled) emit("close");
};

const handleBackdropClick = () => {
  close();
};

const handleKeydown = (event) => {
  if (props.visible && event.key === "Escape") close();
};

onMounted(() => window.addEventListener("keydown", handleKeydown));
onUnmounted(() => window.removeEventListener("keydown", handleKeydown));
</script>

<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="modal-backdrop"
      role="presentation"
      @click.self="handleBackdropClick"
    >
      <section
        class="base-modal"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
      >
        <header class="modal-header">
          <h2 :id="titleId">
            {{ title }}
          </h2>
          <button
            class="modal-close"
            type="button"
            aria-label="モーダルを閉じる"
            :disabled="closeDisabled"
            @click="close"
          />
        </header>
        <div class="modal-body">
          <slot />
        </div>
        <footer
          v-if="$slots.footer"
          class="modal-actions"
        >
          <slot name="footer" />
        </footer>
      </section>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 10;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgb(0 0 0 / 45%);
}

.base-modal {
  width: min(100%, 420px);
  padding: 24px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--bg);
  box-shadow: var(--shadow);
  box-sizing: border-box;
  text-align: left;
}

.modal-header,
.modal-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-header {
  margin-bottom: 20px;
}

.modal-header h2 {
  margin: 0;
}

.modal-close {
  padding: 0 6px;
  border: 0;
  color: var(--text);
  background: transparent;
  cursor: pointer;
  font-size: 28px;
  line-height: 1;
}

.modal-actions {
  justify-content: flex-end;
  gap: 8px;
  margin-top: 24px;
}

.modal-close:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}
</style>
