const BASE_URL = "https://meme-api.com/gimme"

interface MemeResponse {
  postLink: string
  subreddit: string
  title: string
  url: string
  nsfw: boolean
  spoiler: boolean
  author: string
  ups: number
  preview: string[]
}

export async function fetchRandomMeme(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const url = `${BASE_URL}?t=${Date.now()}&r=${Math.random()}`
      const res = await fetch(url)
      if (!res.ok) continue
      const data: MemeResponse = await res.json()
      if (!data.nsfw && !data.spoiler && data.url) {
        return data.url
      }
    } catch {
      continue
    }
  }
  return `https://api.dicebear.com/9.x/thumbs/svg?seed=${Math.random()}&t=${Date.now()}`
}
