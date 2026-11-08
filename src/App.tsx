import { useState } from 'react'
import Library from './pages/Library'
import Reader from './pages/Reader'

export default function App() {
  const [bookId, setBookId] = useState<string | null>(null)

  if (bookId !== null) {
    return <Reader key={bookId} bookId={bookId} onBack={() => setBookId(null)} />
  }

  return <Library onOpen={setBookId} />
}
