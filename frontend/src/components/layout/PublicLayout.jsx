import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'

export default function PublicLayout() {
  return (
    <div className="flex min-h-screen w-full flex-col overflow-x-hidden">
      <Navbar />
      <main className="w-full min-w-0 flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
