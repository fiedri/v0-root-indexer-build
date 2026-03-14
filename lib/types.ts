export interface Tag {
  id: string
  name: string
  color: string
  created_at: string
}

export interface Link {
  id: string
  url: string
  title: string
  description: string | null
  favicon_url: string | null
  created_at: string
  tags?: Tag[]
}

export interface Collection {
  id: string
  user_id: string
  name: string
  description: string | null
  is_public: boolean
  created_at: string
  updated_at: string
  links?: Link[]
}

export interface LinkWithTags extends Link {
  link_tags: { tag: Tag }[]
}
