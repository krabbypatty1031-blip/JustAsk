export const getAvatarUrl = (username) => {
  if (!username) return ''
  // Use 'fun-emoji' style for cute, elderly-friendly avatars
  // Encode username to handle Chinese characters safely
  return `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${encodeURIComponent(username)}`
}
