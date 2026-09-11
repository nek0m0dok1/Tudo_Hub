// src/composables/useTeam.js
import { ref } from 'vue'
import { supabase } from '../supabase'

export function useTeam() {
  const teams = ref([])
  const selectedTeamId = ref('')
  const loading = ref(false)
  const error = ref('')
  const joiningTeam = ref(false)
  const joinTeamError = ref('')

  // チーム一覧を取得する処理
  const fetchTeams = async (userId) => {
    loading.value = true
    error.value = ''

    const { data: memberships, error: membershipError } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', userId)

    if (membershipError) {
      error.value = membershipError.message
      teams.value = []
      selectedTeamId.value = ''
      loading.value = false
      return
    }

    const teamIds = memberships.map((membership) => membership.team_id)
    if (!teamIds.length) {
      teams.value = []
      selectedTeamId.value = ''
      loading.value = false
      return
    }

    const { data, error: teamError } = await supabase
      .from('teams')
      .select('id, name, invite_code')
      .in('id', teamIds)
      .order('name')

    if (teamError) {
      error.value = teamError.message
      loading.value = false
      return
    }

    teams.value = data ?? []
    if (!teams.value.some((team) => team.id === selectedTeamId.value)) {
      selectedTeamId.value = teams.value[0]?.id ?? ''
    }
    loading.value = false
  }

  // チームに参加する処理
  const joinTeam = async (code, userId) => {
    const normalizedCode = code.trim().toUpperCase()
    if (!normalizedCode || !userId) {
      joinTeamError.value = '招待コードを入力してください。'
      return
    }

    joiningTeam.value = true
    joinTeamError.value = ''

    const { data: teamId, error: memberError } = await supabase.rpc(
      'join_team_by_invite_code',
      { invite_code_input: normalizedCode },
    )

    if (memberError) {
      if (memberError.message.includes('Invalid invite code')) {
        joinTeamError.value = '招待コードが正しくありません。'
      } else {
        joinTeamError.value = 'チームへの参加に失敗しました。'
      }
      console.error('Error joining team:', memberError.message)
      joiningTeam.value = false
      return
    }

    await fetchTeams(userId)
    selectedTeamId.value = teamId
    joiningTeam.value = false
  }

  // 外部から使いたい変数と関数を公開
  return {
    teams,
    selectedTeamId,
    loading,
    error,
    joiningTeam,
    joinTeamError,
    fetchTeams,
    joinTeam
  }
}