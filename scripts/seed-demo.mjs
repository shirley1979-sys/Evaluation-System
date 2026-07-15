// 데모 계정 4개 시딩 (Supabase Auth + profiles)
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const env = fs.readFileSync('.env.local', 'utf8')
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL="(.+)"/)[1]
const serviceKey = env.match(/SUPABASE_SECRET_KEY="(.+)"/)[1]

const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })

const DEMO_PASSWORD = 'Everex2026!'

const demoUsers = [
  { email: 'seoyeon@everex.co.kr', name: '이서연', nickname: '서연', role: 'MEMBER', jobTitle: '주임' },
  { email: 'minjun@everex.co.kr',  name: '김민준', nickname: '민준', role: 'MANAGER', jobTitle: '팀장' },
  { email: 'shirley@everex.co.kr', name: 'Shirley', nickname: 'Shirley', role: 'HR_ADMIN', jobTitle: 'HR팀장' },
  { email: 'admin@everex.co.kr',   name: '관리자',  nickname: 'Admin', role: 'SUPER_ADMIN', jobTitle: '관리자' },
]

async function main() {
  const { data: team, error: teamErr } = await admin
    .from('teams')
    .upsert({ name: 'Maker 1 Motion Insight', division: null }, { onConflict: 'name' })
    .select()
    .single()
  if (teamErr) throw teamErr
  console.log('team:', team.id)

  for (const u of demoUsers) {
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

    const { error: profileErr } = await admin.from('profiles').upsert({
      id: userId,
      name: u.name,
      nickname: u.nickname,
      email: u.email,
      role: u.role,
      team_id: u.role === 'MEMBER' || u.role === 'MANAGER' ? team.id : null,
      job_title: u.jobTitle,
      is_active: true,
    })
    if (profileErr) throw profileErr
    console.log('profile upserted:', u.email)
  }

  await admin.from('teams').update({ manager_id: (await admin.from('profiles').select('id').eq('email', 'minjun@everex.co.kr').single()).data.id }).eq('id', team.id)

  console.log('DONE. Demo password for all accounts:', DEMO_PASSWORD)
}

main().catch((e) => { console.error('SEED ERROR:', e); process.exit(1) })
