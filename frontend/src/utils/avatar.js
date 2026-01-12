export const getAvatarUrl = (username) => {
  if (!username) return ''
  // Use 'adventurer-neutral' style for friendly human-like avatars
  // Encode username to handle Chinese characters safely
  return `https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=${encodeURIComponent(username)}`
}
