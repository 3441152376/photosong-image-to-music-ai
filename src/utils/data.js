import AV from 'leancloud-storage'

export async function fetchData(type, id) {
  switch (type) {
    case 'profile':
      return fetchProfileData(id)
    case 'work':
      return fetchWorkData(id)
    default:
      return null
  }
}

async function fetchProfileData(id) {
  const query = new AV.Query('_User')
  const user = await query.get(id)
  return {
    type: 'profile',
    ...user.toJSON()
  }
}

async function fetchWorkData(id) {
  const query = new AV.Query('Work')
  const work = await query.get(id)
  return {
    type: 'work',
    ...work.toJSON()
  }
} 