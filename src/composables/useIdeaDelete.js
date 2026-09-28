import { computed, onMounted, ref } from "vue";
import { supabase } from "../supabase";

export function useIdeaDelete(idea, onDeleted) {
  const currentUser = ref(null);
  const isLoading = ref(false);
  const errorMessage = ref("");

  const canDelete = computed(() =>
    Boolean(currentUser.value?.id && currentUser.value.id === idea.user_id),
  );

  onMounted(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    currentUser.value = user;
  });

  const handleDelete = async () => {
    if (!canDelete.value || isLoading.value) return;
    if (!window.confirm("この投稿を削除しますか？")) return;

    isLoading.value = true;
    errorMessage.value = "";
    const { error } = await supabase
      .from("ideas")
      .delete()
      .eq("id", idea.id)
      .eq("user_id", currentUser.value.id);
    isLoading.value = false;

    if (error) {
      errorMessage.value = `削除に失敗しました: ${error.message}`;
      console.error("Error deleting idea:", error.message);
      return;
    }
    onDeleted();
  };

  return { canDelete, isLoading, errorMessage, handleDelete };
}
