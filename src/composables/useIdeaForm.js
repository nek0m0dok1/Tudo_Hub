import { ref } from "vue";
import { supabase } from "../supabase";

export function useIdeaForm(teamId, onPosted) {
  const title = ref("");
  const url = ref("");
  const isLoading = ref(false);

  const handleSubmit = async () => {
    if (!title.value.trim() || !teamId) return;
    const normalizedUrl = url.value.trim();
    try {
      if (
        normalizedUrl &&
        !["http:", "https:"].includes(new URL(normalizedUrl).protocol)
      )
        throw new Error("invalid");
    } catch {
      alert("URLはhttp://またはhttps://から始まる形式で入力してください。");
      return;
    }
    isLoading.value = true;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      isLoading.value = false;
      alert("投稿にはログインが必要です。");
      return;
    }
    const displayName =
      user.user_metadata?.custom_claims?.global_name ||
      user.user_metadata?.global_name ||
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      "名無し";
    const { error } = await supabase.from("ideas").insert([
      {
        title: title.value.trim(),
        url: normalizedUrl || null,
        user_id: user.id,
        display_name: displayName,
        team_id: teamId,
      },
    ]);
    isLoading.value = false;
    if (error) {
      alert("投稿に失敗しました: " + error.message);
      console.error(error);
      return;
    }
    title.value = "";
    url.value = "";
    onPosted();
  };

  return { title, url, isLoading, handleSubmit };
}
