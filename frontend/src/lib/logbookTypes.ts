export const LOGBOOK_SORT_OPTIONS = ["newest", "oldest", "hardest", "easiest"] as const
export const LOGBOOK_VIEW_OPTIONS = ["list", "calendar"] as const

export type LogbookSort = (typeof LOGBOOK_SORT_OPTIONS)[number]
export type LogbookView = (typeof LOGBOOK_VIEW_OPTIONS)[number]
