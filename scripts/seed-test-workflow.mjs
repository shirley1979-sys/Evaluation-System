// 워크플로우 테스트용 계정 시딩 (직원TEST / 팀장TEST)
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const env = fs.readFileSync('.env.local', 'utf8')
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL="(.+)"/)[1]
const serviceKey = env.match(/SUPABASE_SECRET_KEY="(.+)"/)[1]

const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
const DEMO_PASSWORD = 'Everex2026!'

const users = [
  { email: 'leadtest@everex.co.kr',   name: '팀장TEST', nickname: '팀장TEST', role: 'MANAGER', jobTitle: '팀장' },
  { email: 'membertest@everex.co.kr', name: '직원TEST', nickname: '직원TEST', role: 'MEMBER',  jobTitle: '사원' },
]

async function main() {
  const { data: team, error: teamErr } = await admin
    .from('teams')
    .upsert({ name: 'TEST팀', division: 'QA 테스트' }, { onConflict: 'name' })
    .select()
    .single()
  if (teamErr) throw teamErr
  console.log('team:', team.id)

  const ids = {}
  for (const u of users) {
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: u.email,
      password: DEMO_PASSWORD,
      email_confirm: true,
    })
    let userId
    if (createErr) {
      if (createErr.message.includes('already been registered') || createErr.code === 'email_exists') {
        const { data: list } = await admin.auth.admin.listUsers()
        userId = list.users.find((x) => x.email === u.email)?.id
        console.log('exists, reusing:', u.email, userId)
      } else {
        throw createErr
      }
    } else {
      userId = created.user.id
      console.log('created auth user:', u.email, userId)
    }
    ids[u.email] = userId

    const { error: profileErr } = await admin.from('profiles').upsert({
      id: userId,
      name: u.name,
      nickname: u.nickname,
      email: u.email,
      role: u.role,
      team_id: team.id,
      job_title: u.jobTitle,
      is_active: true,
    })
    if (profileErr) throw profileErr
    console.log('profile upserted:', u.email)
  }

  await admin.from('teams').update({ manager_id: ids['leadtest@everex.co.kr'] }).eq('id', team.id)
  console.log('DONE. Test account password:', DEMO_PASSWORD)
}

main().catch((e) => { console.error('SEED ERROR:', e); process.exit(1) })
