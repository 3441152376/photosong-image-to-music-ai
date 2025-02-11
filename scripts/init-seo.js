import fs from 'fs'
import path from 'path'

const dirs = [
  'server/static/zh',
  'server/static/en', 
  'server/static/ru',
  'server/dynamic/zh/profile',
  'server/dynamic/zh/work',
  'server/dynamic/en/profile',
  'server/dynamic/en/work',
  'server/dynamic/ru/profile', 
  'server/dynamic/ru/work'
]

dirs.forEach(dir => {
  fs.mkdirSync(path.join(process.cwd(), dir), { recursive: true })
}) 